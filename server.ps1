param(
    [int]$Port = 5205,
    [switch]$DemoData,
    [string]$StateFile
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDirectory = Join-Path $root 'data'
$runtimeDirectory = Join-Path $dataDirectory 'runtime'
$statePath = if ([string]::IsNullOrWhiteSpace($StateFile)) {
    Join-Path $runtimeDirectory 'maintenance-state.json'
} else {
    [System.IO.Path]::GetFullPath($StateFile)
}
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null
New-Item -ItemType Directory -Force -Path ([System.IO.Path]::GetDirectoryName($statePath)) | Out-Null
. (Join-Path $root 'data\migrations\001-initial.ps1')

$script:Sessions = @{}
$script:LoginFailures = @()
$script:State = $null
$script:DemoPassword = 'Maintenance-Demo-2026!'

function New-Id {
    [Guid]::NewGuid().ToString('N')
}

function New-PasswordRecord([string]$Password) {
    $salt = New-Object byte[] 16
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($salt)
    $derive = New-Object System.Security.Cryptography.Rfc2898DeriveBytes(
        $Password,
        $salt,
        210000,
        [System.Security.Cryptography.HashAlgorithmName]::SHA256
    )
    try {
        return @{
            salt = [Convert]::ToBase64String($salt)
            hash = [Convert]::ToBase64String($derive.GetBytes(32))
        }
    } finally {
        $derive.Dispose()
    }
}

function Test-Password([string]$Password, $Record) {
    if (-not $Record -or [string]::IsNullOrWhiteSpace($Password)) { return $false }
    $salt = [Convert]::FromBase64String([string]$Record.salt)
    $derive = New-Object System.Security.Cryptography.Rfc2898DeriveBytes(
        $Password,
        $salt,
        210000,
        [System.Security.Cryptography.HashAlgorithmName]::SHA256
    )
    try {
        $actual = $derive.GetBytes(32)
        $expected = [Convert]::FromBase64String([string]$Record.hash)
        $difference = 0
        for ($i = 0; $i -lt $expected.Length; $i++) {
            $difference = $difference -bor ($actual[$i] -bxor $expected[$i])
        }
        return ($difference -eq 0)
    } finally {
        $derive.Dispose()
    }
}

function Save-State {
    $temporaryPath = "$statePath.tmp"
    $json = ConvertTo-Json -InputObject $script:State -Depth 30
    [System.IO.File]::WriteAllText($temporaryPath, $json, (New-Object System.Text.UTF8Encoding($false)))
    if (Test-Path -LiteralPath $statePath) {
        $backupPath = "$statePath.replace-backup"
        if (Test-Path -LiteralPath $backupPath) { [System.IO.File]::Delete($backupPath) }
        [System.IO.File]::Replace($temporaryPath, $statePath, $backupPath)
        [System.IO.File]::Delete($backupPath)
    } else {
        [System.IO.File]::Move($temporaryPath, $statePath)
    }
}

function Add-Audit([string]$ActorId, [string]$Action, [string]$EntityType, [string]$EntityId, $Details = $null) {
    $entry = [PSCustomObject]@{
        id = New-Id
        actorId = $ActorId
        action = $Action
        entityType = $EntityType
        entityId = $EntityId
        details = $Details
        createdAt = [DateTime]::UtcNow.ToString('o')
    }
    $script:State.audit = @($script:State.audit) + @($entry)
}

function Add-Notification([string]$UserId, [string]$Title, [string]$Message, [string]$EntityType, [string]$EntityId) {
    if ([string]::IsNullOrWhiteSpace($UserId)) { return }
    $notice = [PSCustomObject]@{
        id = New-Id
        userId = $UserId
        title = $Title
        message = $Message
        entityType = $EntityType
        entityId = $EntityId
        createdAt = [DateTime]::UtcNow.ToString('o')
        readAt = $null
    }
    $script:State.notifications = @($script:State.notifications) + @($notice)
}

function Find-User([string]$UserId) {
    return @($script:State.users | Where-Object { $_.id -eq $UserId } | Select-Object -First 1)[0]
}

function Find-Asset([string]$AssetId) {
    return @($script:State.assets | Where-Object { $_.id -eq $AssetId -and -not $_.archived } | Select-Object -First 1)[0]
}

function Find-WorkOrder([string]$WorkOrderId) {
    return @($script:State.workOrders | Where-Object { $_.id -eq $WorkOrderId } | Select-Object -First 1)[0]
}

function Get-SafeUser($User) {
    if (-not $User) { return $null }
    return [PSCustomObject]@{
        id = $User.id
        username = $User.username
        displayName = $User.displayName
        role = $User.role
        locationId = $User.locationId
        active = $User.active
    }
}

function Get-SessionUser($Context) {
    $cookie = $Context.Request.Cookies['maintenance_session']
    if (-not $cookie) { return $null }
    $session = $script:Sessions[$cookie.Value]
    if (-not $session -or $session.expires -lt [DateTime]::UtcNow) {
        if ($cookie) { $script:Sessions.Remove($cookie.Value) }
        return $null
    }
    return Find-User ([string]$session.userId)
}

function Send-Json($Context, [int]$Status, $Value) {
    $Context.Response.StatusCode = $Status
    $Context.Response.ContentType = 'application/json; charset=utf-8'
    $Context.Response.Headers['Cache-Control'] = 'no-store'
    $Context.Response.Headers['X-Content-Type-Options'] = 'nosniff'
    $Context.Response.Headers['X-Frame-Options'] = 'DENY'
    $Context.Response.Headers['Referrer-Policy'] = 'no-referrer'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $Value -Depth 30 -Compress))
    $Context.Response.ContentLength64 = $bytes.Length
    $Context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Send-Error($Context, [int]$Status, [string]$Code, [string]$Message) {
    Send-Json $Context $Status ([PSCustomObject]@{ error = $Code; message = $Message })
}

function Read-Body($Context) {
    if ($Context.Request.ContentLength64 -gt 1048576) { throw 'Request body is too large.' }
    $reader = New-Object System.IO.StreamReader($Context.Request.InputStream, $Context.Request.ContentEncoding)
    try {
        $text = $reader.ReadToEnd()
        if ([string]::IsNullOrWhiteSpace($text)) { return [PSCustomObject]@{} }
        return ConvertFrom-Json -InputObject $text
    } finally {
        $reader.Dispose()
    }
}

function Test-LocationAccess($User, [string]$LocationId) {
    return ($User.role -eq 'Admin' -or $User.locationId -eq $LocationId)
}

function Require-Role($Context, [string[]]$Roles) {
    $user = Get-SessionUser $Context
    if (-not $user) {
        Send-Error $Context 401 'unauthenticated' 'Sign in to continue.'
        return $null
    }
    if ($Roles -notcontains $user.role) {
        Send-Error $Context 403 'forbidden' 'You do not have permission to perform this action.'
        return $null
    }
    return $user
}

function Test-IdempotencyKey([string]$Key) {
    return ($Key -match '^[A-Za-z0-9._:-]{8,100}$')
}

function Get-IdempotentResult([string]$Key, [string]$EntityType, [string]$ActorId) {
    if (-not (Test-IdempotencyKey $Key)) { return $null }
    return @($script:State.idempotency | Where-Object { $_.key -eq $Key -and $_.entityType -eq $EntityType -and $_.actorId -eq $ActorId } | Select-Object -First 1)[0]
}

function Add-IdempotencyRecord([string]$Key, [string]$EntityType, [string]$EntityId, [string]$ActorId) {
    if (Test-IdempotencyKey $Key) {
        $script:State.idempotency = @($script:State.idempotency) + @([PSCustomObject]@{
            key = $Key
            entityType = $EntityType
            entityId = $EntityId
            actorId = $ActorId
        })
    }
}

function New-Reference([string]$Prefix, $Records) {
    $now = [DateTime]::UtcNow.ToString('yyyyMMdd')
    $count = @($Records | Where-Object { $_.reference -like "$Prefix-$now-*" }).Count + 1
    return ('{0}-{1}-{2:D4}' -f $Prefix, $now, $count)
}

function New-DemoState {
    $seededAt = '2026-01-15T08:00:00.0000000Z'
    $users = @()
    $accounts = @(
        @{ username = 'admin'; displayName = 'Alex Morgan'; role = 'Admin'; locationId = 'north'; id = 'user-admin' },
        @{ username = 'manager'; displayName = 'Samira Hassan'; role = 'Manager'; locationId = 'north'; id = 'user-manager' },
        @{ username = 'supervisor'; displayName = 'Jordan Lee'; role = 'Supervisor'; locationId = 'north'; id = 'user-supervisor' },
        @{ username = 'technician'; displayName = 'Taylor Chen'; role = 'Technician'; locationId = 'north'; id = 'user-technician' },
        @{ username = 'storekeeper'; displayName = 'Robin Patel'; role = 'Storekeeper'; locationId = 'north'; id = 'user-storekeeper' },
        @{ username = 'requester'; displayName = 'Casey Rivera'; role = 'Requester'; locationId = 'north'; id = 'user-requester' },
        @{ username = 'requester-south'; displayName = 'Morgan Blake'; role = 'Requester'; locationId = 'south'; id = 'user-requester-south' }
    )
    foreach ($account in $accounts) {
        $users += [PSCustomObject]@{
            id = $account.id
            username = $account.username
            displayName = $account.displayName
            role = $account.role
            locationId = $account.locationId
            active = $true
            password = New-PasswordRecord $script:DemoPassword
        }
    }

    $asset = [PSCustomObject]@{
        id = 'asset-hvac-01'; code = 'BLD-N-001'; name = 'North building HVAC'; category = 'HVAC'
        locationId = 'north'; locationName = 'North campus'; status = 'Operational'; criticality = 'High'
        description = 'Main air handling unit'; createdAt = $seededAt; archived = $false
    }
    $southAsset = [PSCustomObject]@{
        id = 'asset-south-01'; code = 'BLD-S-001'; name = 'South building pump'; category = 'Pumps'
        locationId = 'south'; locationName = 'South campus'; status = 'Operational'; criticality = 'Normal'
        description = 'Demo asset for location-scope checks.'; createdAt = $seededAt; archived = $false
    }
    $part = [PSCustomObject]@{
        id = 'part-filter-01'; sku = 'FLT-450'; name = 'Air filter 450 mm'; locationId = 'north'
        onHand = 12; reorderLevel = 5; unit = 'each'; updatedAt = [DateTime]::UtcNow.ToString('o')
    }
    $request = [PSCustomObject]@{
        id = 'request-demo-01'; reference = 'REQ-DEMO-001'; requesterId = 'user-requester'; requesterName = 'Casey Rivera'
        assetId = $asset.id; assetCode = $asset.code; locationId = 'north'; title = 'Unusual vibration'
        description = 'The unit vibrates more than usual during startup.'; priority = 'High'; status = 'Submitted'
        createdAt = '2026-01-16T08:00:00.0000000Z'; idempotencyKey = 'demo-request-01'
        workOrderId = $null; rejectionReason = $null
    }
    $southRequest = [PSCustomObject]@{
        id = 'request-south-01'; reference = 'REQ-SOUTH-001'; requesterId = 'user-requester-south'
        requesterName = 'Morgan Blake'; assetId = $southAsset.id; assetCode = $southAsset.code; locationId = 'south'
        title = 'Pump inspection requested'; description = 'Please inspect the south building pump vibration.'
        priority = 'Normal'; status = 'Submitted'; createdAt = '2026-01-17T08:00:00.0000000Z'
        idempotencyKey = 'demo-south-request'; workOrderId = $null; rejectionReason = $null
    }
    $workOrder = [PSCustomObject]@{
        id = 'workorder-demo-01'; reference = 'WO-DEMO-001'; requestId = $null; assetId = $asset.id
        assetCode = $asset.code; locationId = 'north'; title = 'Inspect HVAC vibration'; description = 'Check mounts and fan balance.'
        priority = 'Normal'; status = 'InProgress'; assignedToId = 'user-technician'; assignedToName = 'Taylor Chen'
        createdAt = '2026-01-16T09:00:00.0000000Z'; startedAt = '2026-01-16T10:00:00.0000000Z'
        completedAt = $null; completionNotes = $null
        checklist = @(
            [PSCustomObject]@{ id = 'check-safety'; label = 'Isolate equipment before inspection'; done = $false; required = $true },
            [PSCustomObject]@{ id = 'check-mounts'; label = 'Inspect mounting points'; done = $false; required = $true },
            [PSCustomObject]@{ id = 'check-findings'; label = 'Record inspection findings'; done = $false; required = $true }
        )
    }
    $workOrder.requestId = $null
    $state = [PSCustomObject]@{
        schemaVersion = 1; users = $users; assets = @($asset, $southAsset); requests = @($request, $southRequest); workOrders = @($workOrder)
        inventory = @($part); reservations = @()
        movements = @(
            [PSCustomObject]@{ id = 'movement-demo-opening'; partId = $part.id; sku = $part.sku; locationId = $part.locationId
                direction = 'receive'; quantity = 12; reason = 'Demo opening balance'; workOrderId = $null
                actorId = 'system'; idempotencyKey = $null; createdAt = $seededAt }
        )
        notifications = @(); audit = @(
            [PSCustomObject]@{ id = 'audit-demo-seeded'; actorId = 'system'; action = 'demo_seeded'
                entityType = 'system'; entityId = 'demo-data'; details = @{ demoOnly = $true }; createdAt = $seededAt }
            [PSCustomObject]@{ id = 'audit-demo-opening'; actorId = 'system'; action = 'inventory_opening_balance'
                entityType = 'inventoryMovement'; entityId = 'movement-demo-opening'
                details = @{ partId = $part.id; quantity = 12 }; createdAt = $seededAt }
        )
        idempotency = @(); createdAt = $seededAt
    }
    return $state
}

function Initialize-State {
    if (Test-Path -LiteralPath $statePath) {
        $script:State = ConvertFrom-Json -InputObject ([System.IO.File]::ReadAllText($statePath))
        Invoke-AppMigrations $script:State
        Save-State
    } elseif ($DemoData) {
        $script:State = New-DemoState
        Add-Audit 'system' 'demo_seeded' 'system' 'demo-data' @{ demoOnly = $true }
        Save-State
        Write-Host 'Demo-only accounts enabled. Sign in with any listed username and password Maintenance-Demo-2026!'
    } else {
        $script:State = New-EmptyState
        Save-State
    }
}

function Get-Dashboard($User) {
    $assets = @($script:State.assets | Where-Object { -not $_.archived -and (Test-LocationAccess $User $_.locationId) })
    $requests = @($script:State.requests | Where-Object { Test-LocationAccess $User $_.locationId })
    if ($User.role -eq 'Requester') { $requests = @($requests | Where-Object { $_.requesterId -eq $User.id }) }
    $orders = @($script:State.workOrders | Where-Object { Test-LocationAccess $User $_.locationId })
    if ($User.role -eq 'Technician') { $orders = @($orders | Where-Object { $_.assignedToId -eq $User.id }) }
    $openOrders = @($orders | Where-Object { $_.status -notin @('Completed', 'Verified', 'Closed', 'Cancelled') })
    $lowStock = @($script:State.inventory | Where-Object {
        (Test-LocationAccess $User $_.locationId) -and ([decimal]$_.onHand -le [decimal]$_.reorderLevel)
    })
    return [PSCustomObject]@{
        assetCount = $assets.Count
        submittedRequests = @($requests | Where-Object { $_.status -eq 'Submitted' }).Count
        openWorkOrders = $openOrders.Count
        lowStockItems = $lowStock.Count
        technicianAssignments = @($orders | Where-Object { $_.assignedToId -eq $User.id -and $_.status -notin @('Completed', 'Verified', 'Closed', 'Cancelled') }).Count
        inventoryCount = @($script:State.inventory | Where-Object { Test-LocationAccess $User $_.locationId }).Count
    }
}

function Handle-Api($Context) {
    $method = $Context.Request.HttpMethod.ToUpperInvariant()
    $path = [Uri]::UnescapeDataString($Context.Request.Url.AbsolutePath)
    $segments = @($path.Trim('/').Split('/') | Where-Object { $_ })
    $user = $null

    if ($method -eq 'GET' -and $path -eq '/api/health') {
        Send-Json $Context 200 @{ status = 'ok'; mode = 'development'; schemaVersion = $script:State.schemaVersion }; return
    }
    if ($method -eq 'GET' -and $path -eq '/api/session') {
        $user = Get-SessionUser $Context
        Send-Json $Context 200 @{ user = (Get-SafeUser $user); needsBootstrap = (@($script:State.users).Count -eq 0) }; return
    }
    if ($method -eq 'POST' -and $path -eq '/api/bootstrap') {
        if (@($script:State.users).Count -gt 0) { Send-Error $Context 409 'already_initialized' 'An administrator already exists.'; return }
        $body = Read-Body $Context
        if ([string]$body.password -ne [string]$body.passwordConfirmation -or ([string]$body.password).Length -lt 12) {
            Send-Error $Context 400 'invalid_password' 'Use a matching password of at least 12 characters.'; return
        }
        if ([string]$body.username -notmatch '^[A-Za-z0-9._-]{3,40}$') {
            Send-Error $Context 400 'invalid_username' 'Use 3–40 letters, numbers, dots, underscores, or hyphens.'; return
        }
        if (([string]$body.displayName).Trim().Length -gt 80) { Send-Error $Context 400 'invalid_display_name' 'Display name must be 80 characters or fewer.'; return }
        $newUser = [PSCustomObject]@{
            id = New-Id; username = ([string]$body.username).ToLowerInvariant()
            displayName = ([string]$body.displayName).Trim(); role = 'Admin'
            locationId = 'north'; active = $true; password = New-PasswordRecord ([string]$body.password)
        }
        if ([string]::IsNullOrWhiteSpace($newUser.displayName)) { $newUser.displayName = $newUser.username }
        $script:State.users = @($script:State.users) + @($newUser)
        Add-Audit $newUser.id 'admin_bootstrapped' 'user' $newUser.id @{ username = $newUser.username }
        Save-State
        Send-Json $Context 201 @{ user = Get-SafeUser $newUser }; return
    }
    if ($method -eq 'POST' -and $path -eq '/api/login') {
        $body = Read-Body $Context
        $username = ([string]$body.username).ToLowerInvariant()
        $cutoff = [DateTime]::UtcNow.AddMinutes(-1)
        $script:LoginFailures = @($script:LoginFailures | Where-Object { $_.createdAt -gt $cutoff })
        if ($script:LoginFailures.Count -ge 10) { Send-Error $Context 429 'login_throttled' 'Too many sign-in attempts. Wait one minute and try again.'; return }
        $account = @($script:State.users | Where-Object { $_.username -eq $username -and $_.active } | Select-Object -First 1)[0]
        if (-not (Test-Password ([string]$body.password) $account.password)) {
            $script:LoginFailures += @{ username = $username; createdAt = [DateTime]::UtcNow }
            Start-Sleep -Milliseconds 250
            Send-Error $Context 401 'invalid_credentials' 'Username or password is incorrect.'; return
        }
        $script:LoginFailures = @($script:LoginFailures | Where-Object { $_.username -ne $username })
        $token = New-Id
        $script:Sessions[$token] = @{ userId = $account.id; expires = [DateTime]::UtcNow.AddHours(8) }
        $Context.Response.Headers.Add('Set-Cookie', "maintenance_session=$token; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800")
        Add-Audit $account.id 'signed_in' 'user' $account.id $null
        Save-State
        Send-Json $Context 200 @{ user = Get-SafeUser $account }; return
    }
    if ($method -eq 'POST' -and $path -eq '/api/logout') {
        $cookie = $Context.Request.Cookies['maintenance_session']
        if ($cookie) { $script:Sessions.Remove($cookie.Value) }
        $Context.Response.Headers.Add('Set-Cookie', 'maintenance_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
        Send-Json $Context 200 @{ ok = $true }; return
    }

    if ($segments.Count -lt 2 -or $segments[0] -ne 'api') { Send-Error $Context 404 'not_found' 'Route not found.'; return }
    $resource = $segments[1]

    if ($resource -eq 'dashboard' -and $method -eq 'GET') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Technician','Requester','Storekeeper')
        if (-not $user) { return }
        Send-Json $Context 200 (Get-Dashboard $user); return
    }
    if ($resource -eq 'assets' -and $method -eq 'GET') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Technician','Requester','Storekeeper')
        if (-not $user) { return }
        $items = @($script:State.assets | Where-Object { -not $_.archived -and (Test-LocationAccess $user $_.locationId) })
        Send-Json $Context 200 $items; return
    }
    if ($resource -eq 'assets' -and $method -eq 'POST') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor')
        if (-not $user) { return }
        $body = Read-Body $Context
        $code = ([string]$body.code).Trim().ToUpperInvariant()
        $name = ([string]$body.name).Trim()
        if ($code.Length -lt 2 -or $code.Length -gt 40 -or $name.Length -lt 2 -or $name.Length -gt 120) {
            Send-Error $Context 400 'validation_error' 'Asset code and name are required.'; return
        }
        if (@($script:State.assets | Where-Object { $_.code -eq $code }).Count) {
            Send-Error $Context 409 'duplicate_asset' 'That asset code is already in use.'; return
        }
        $locationId = if ($user.role -eq 'Admin' -or $user.role -eq 'Manager') { [string]$body.locationId } else { $user.locationId }
        if ([string]::IsNullOrWhiteSpace($locationId)) { $locationId = $user.locationId }
        $asset = [PSCustomObject]@{
            id = New-Id; code = $code; name = $name; category = ([string]$body.category).Trim()
            locationId = $locationId; locationName = if ($locationId -eq 'north') { 'North campus' } else { $locationId }
            status = 'Operational'; criticality = if ($body.criticality) { [string]$body.criticality } else { 'Normal' }
            description = ([string]$body.description).Trim(); createdAt = [DateTime]::UtcNow.ToString('o'); archived = $false
        }
        $script:State.assets = @($script:State.assets) + @($asset)
        Add-Audit $user.id 'asset_created' 'asset' $asset.id @{ code = $asset.code }
        Save-State
        Send-Json $Context 201 $asset; return
    }
    if ($resource -eq 'assets' -and $segments.Count -eq 3 -and $method -eq 'PATCH') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor')
        if (-not $user) { return }
        $asset = Find-Asset $segments[2]
        if (-not $asset -or -not (Test-LocationAccess $user $asset.locationId)) { Send-Error $Context 404 'not_found' 'Asset not found.'; return }
        $body = Read-Body $Context
        $previous = @{ name = $asset.name; status = $asset.status; criticality = $asset.criticality; archived = $asset.archived }
        if ($body.name) { $newName = ([string]$body.name).Trim(); if ($newName.Length -lt 2 -or $newName.Length -gt 120) { Send-Error $Context 400 'validation_error' 'Asset name must be 2–120 characters.'; return }; $asset.name = $newName }
        if ($body.category) { $asset.category = ([string]$body.category).Trim() }
        if ($body.description) { $asset.description = ([string]$body.description).Trim() }
        if ($body.criticality) {
            if (@('Normal','High','Critical') -notcontains [string]$body.criticality) { Send-Error $Context 400 'validation_error' 'Choose a supported criticality.'; return }
            $asset.criticality = [string]$body.criticality
        }
        if ($body.status) {
            if (@('Operational','NeedsAttention','OutOfService') -notcontains [string]$body.status) { Send-Error $Context 400 'validation_error' 'Choose a supported asset status.'; return }
            $asset.status = [string]$body.status
        }
        if ($null -ne $body.archived) {
            if (@($script:State.workOrders | Where-Object { $_.assetId -eq $asset.id }).Count -gt 0 -and [bool]$body.archived) {
                Send-Error $Context 409 'asset_has_history' 'Assets with work-order history cannot be archived.'; return
            }
            $asset.archived = [bool]$body.archived
        }
        Add-Audit $user.id 'asset_updated' 'asset' $asset.id @{ before = $previous; after = @{ name = $asset.name; status = $asset.status; criticality = $asset.criticality; archived = $asset.archived } }
        Save-State
        Send-Json $Context 200 $asset; return
    }
    if ($resource -eq 'requests' -and $method -eq 'GET') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Technician','Requester','Storekeeper')
        if (-not $user) { return }
        $items = @($script:State.requests | Where-Object { (Test-LocationAccess $user $_.locationId) -and ($user.role -ne 'Requester' -or $_.requesterId -eq $user.id) })
        Send-Json $Context 200 $items; return
    }
    if ($resource -eq 'requests' -and $segments.Count -eq 2 -and $method -eq 'POST') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Technician','Requester')
        if (-not $user) { return }
        $body = Read-Body $Context
        $key = [string]$Context.Request.Headers['Idempotency-Key']
        if (-not (Test-IdempotencyKey $key)) { Send-Error $Context 400 'idempotency_key_required' 'Provide a valid Idempotency-Key header for request submission.'; return }
        $prior = Get-IdempotentResult $key 'request' $user.id
        if ($prior) {
            $existing = @($script:State.requests | Where-Object { $_.id -eq $prior.entityId } | Select-Object -First 1)[0]
            Send-Json $Context 200 $existing; return
        }
        $title = ([string]$body.title).Trim()
        $description = ([string]$body.description).Trim()
        if ($title.Length -lt 4 -or $title.Length -gt 120 -or $description.Length -lt 10 -or $description.Length -gt 2000) {
            Send-Error $Context 400 'validation_error' 'Enter a title (4–120 characters) and description (10–2,000 characters).'; return
        }
        $asset = $null
        if (-not [string]::IsNullOrWhiteSpace([string]$body.assetId)) {
            $asset = Find-Asset ([string]$body.assetId)
            if (-not $asset -or -not (Test-LocationAccess $user $asset.locationId)) {
                Send-Error $Context 404 'asset_not_found' 'The selected asset is unavailable.'; return
            }
        }
        $priority = if (@('Low','Normal','High','Urgent') -contains [string]$body.priority) { [string]$body.priority } else { 'Normal' }
        $request = [PSCustomObject]@{
            id = New-Id; reference = New-Reference 'REQ' $script:State.requests; requesterId = $user.id
            requesterName = $user.displayName; assetId = if ($asset) { $asset.id } else { $null }
            assetCode = if ($asset) { $asset.code } else { $null }; locationId = if ($asset) { $asset.locationId } else { $user.locationId }
            title = $title; description = $description; priority = $priority; status = 'Submitted'
            createdAt = [DateTime]::UtcNow.ToString('o'); idempotencyKey = $key; workOrderId = $null; rejectionReason = $null
        }
        $script:State.requests = @($script:State.requests) + @($request)
        Add-Audit $user.id 'request_submitted' 'request' $request.id @{ status = 'Submitted' }
        Add-IdempotencyRecord $key 'request' $request.id $user.id
        foreach ($reviewer in @($script:State.users | Where-Object { $_.role -in @('Admin','Manager','Supervisor') })) {
            Add-Notification $reviewer.id 'New maintenance request' "$($request.reference): $($request.title)" 'request' $request.id
        }
        Save-State
        Send-Json $Context 201 $request; return
    }
    if ($resource -eq 'requests' -and $segments.Count -eq 4 -and $segments[3] -eq 'review' -and $method -eq 'POST') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor')
        if (-not $user) { return }
        $request = @($script:State.requests | Where-Object { $_.id -eq $segments[2] } | Select-Object -First 1)[0]
        if (-not $request -or -not (Test-LocationAccess $user $request.locationId)) { Send-Error $Context 404 'not_found' 'Request not found.'; return }
        if ($request.status -ne 'Submitted') { Send-Error $Context 409 'invalid_transition' 'Only submitted requests can be reviewed.'; return }
        $body = Read-Body $Context
        if (@('Approved','Rejected') -notcontains [string]$body.decision) { Send-Error $Context 400 'validation_error' 'Choose approve or reject.'; return }
        if ($body.decision -eq 'Rejected' -and ([string]$body.reason).Trim().Length -lt 4) {
            Send-Error $Context 400 'reason_required' 'Provide a reason for rejection.'; return
        }
        $request.status = [string]$body.decision
        $request.rejectionReason = if ($body.decision -eq 'Rejected') { ([string]$body.reason).Trim() } else { $null }
        Add-Audit $user.id "request_$($body.decision.ToString().ToLowerInvariant())" 'request' $request.id @{ reason = $request.rejectionReason }
        Add-Notification $request.requesterId 'Request reviewed' "$($request.reference) is $($request.status.ToLowerInvariant())." 'request' $request.id
        Save-State
        Send-Json $Context 200 $request; return
    }
    if ($resource -eq 'requests' -and $segments.Count -eq 4 -and $segments[3] -eq 'convert' -and $method -eq 'POST') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor')
        if (-not $user) { return }
        $request = @($script:State.requests | Where-Object { $_.id -eq $segments[2] } | Select-Object -First 1)[0]
        if (-not $request -or -not (Test-LocationAccess $user $request.locationId)) { Send-Error $Context 404 'not_found' 'Request not found.'; return }
        if ($request.workOrderId) { Send-Json $Context 200 (Find-WorkOrder $request.workOrderId); return }
        if ($request.status -ne 'Approved') { Send-Error $Context 409 'invalid_transition' 'Approve the request before converting it.'; return }
        $asset = if ($request.assetId) { Find-Asset $request.assetId } else { $null }
        $order = [PSCustomObject]@{
            id = New-Id; reference = New-Reference 'WO' $script:State.workOrders; requestId = $request.id
            assetId = $request.assetId; assetCode = $request.assetCode; locationId = $request.locationId
            title = $request.title; description = $request.description; priority = $request.priority
            status = 'Scheduled'; assignedToId = $null; assignedToName = $null
            createdAt = [DateTime]::UtcNow.ToString('o'); startedAt = $null; completedAt = $null; completionNotes = $null
            checklist = @(
                [PSCustomObject]@{ id = 'check-safety'; label = 'Complete required safety checks'; done = $false; required = $true },
                [PSCustomObject]@{ id = 'check-work'; label = 'Record work performed'; done = $false; required = $true },
                [PSCustomObject]@{ id = 'check-review'; label = 'Record completion findings'; done = $false; required = $true }
            )
        }
        $script:State.workOrders = @($script:State.workOrders) + @($order)
        $request.workOrderId = $order.id
        $request.status = 'Converted'
        Add-Audit $user.id 'request_converted' 'workOrder' $order.id @{ requestId = $request.id }
        Add-Notification $request.requesterId 'Work order created' "$($order.reference) was created for your request." 'workOrder' $order.id
        Save-State
        Send-Json $Context 201 $order; return
    }
    if ($resource -eq 'work-orders' -and $method -eq 'GET') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Technician','Requester','Storekeeper')
        if (-not $user) { return }
        $items = @($script:State.workOrders | Where-Object {
            $order = $_
            $requestForOrder = @($script:State.requests | Where-Object { $_.id -eq $order.requestId } | Select-Object -First 1)[0]
            (Test-LocationAccess $user $order.locationId) -and
            ($user.role -ne 'Technician' -or $order.assignedToId -eq $user.id) -and
            ($user.role -ne 'Requester' -or ($requestForOrder -and $requestForOrder.requesterId -eq $user.id))
        })
        Send-Json $Context 200 $items; return
    }
    if ($resource -eq 'work-orders' -and $segments.Count -eq 2 -and $method -eq 'POST') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor')
        if (-not $user) { return }
        $body = Read-Body $Context
        $title = ([string]$body.title).Trim()
        if ($title.Length -lt 4 -or $title.Length -gt 120) { Send-Error $Context 400 'validation_error' 'Enter a title between 4 and 120 characters.'; return }
        $asset = Find-Asset ([string]$body.assetId)
        if (-not $asset -or -not (Test-LocationAccess $user $asset.locationId)) { Send-Error $Context 404 'asset_not_found' 'The selected asset is unavailable.'; return }
        $order = [PSCustomObject]@{
            id = New-Id; reference = New-Reference 'WO' $script:State.workOrders; requestId = $null
            assetId = $asset.id; assetCode = $asset.code; locationId = $asset.locationId; title = $title
            description = ([string]$body.description).Trim(); priority = if ($body.priority) { [string]$body.priority } else { 'Normal' }
            status = 'Scheduled'; assignedToId = $null; assignedToName = $null; createdAt = [DateTime]::UtcNow.ToString('o')
            startedAt = $null; completedAt = $null; completionNotes = $null
            checklist = @([PSCustomObject]@{ id = 'check-safety'; label = 'Complete safety checks'; done = $false; required = $true },
                [PSCustomObject]@{ id = 'check-work'; label = 'Record work performed'; done = $false; required = $true })
        }
        $script:State.workOrders = @($script:State.workOrders) + @($order)
        Add-Audit $user.id 'work_order_created' 'workOrder' $order.id @{ reference = $order.reference }
        Save-State
        Send-Json $Context 201 $order; return
    }
    if ($resource -eq 'work-orders' -and $segments.Count -eq 4 -and $method -eq 'POST' -and $segments[3] -eq 'assign') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor')
        if (-not $user) { return }
        $order = Find-WorkOrder $segments[2]
        if (-not $order -or -not (Test-LocationAccess $user $order.locationId)) { Send-Error $Context 404 'not_found' 'Work order not found.'; return }
        $body = Read-Body $Context
        $assignee = Find-User ([string]$body.assigneeId)
        if (-not $assignee -or -not $assignee.active -or $assignee.role -ne 'Technician' -or -not (Test-LocationAccess $user $assignee.locationId) -or $assignee.locationId -ne $order.locationId) {
            Send-Error $Context 400 'invalid_assignee' 'Choose an active technician at the work order location.'; return
        }
        $previousId = $order.assignedToId
        $order.assignedToId = $assignee.id; $order.assignedToName = $assignee.displayName
        Add-Audit $user.id 'work_order_assigned' 'workOrder' $order.id @{ previousAssigneeId = $previousId; assigneeId = $assignee.id }
        Add-Notification $assignee.id 'Work order assigned' "$($order.reference): $($order.title)" 'workOrder' $order.id
        Save-State
        Send-Json $Context 200 $order; return
    }
    if ($resource -eq 'work-orders' -and $segments.Count -eq 4 -and $segments[3] -eq 'status' -and $method -eq 'POST') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Technician')
        if (-not $user) { return }
        $order = Find-WorkOrder $segments[2]
        if (-not $order -or -not (Test-LocationAccess $user $order.locationId)) { Send-Error $Context 404 'not_found' 'Work order not found.'; return }
        if ($user.role -eq 'Technician' -and $order.assignedToId -ne $user.id) { Send-Error $Context 404 'not_found' 'Work order not found.'; return }
        $body = Read-Body $Context
        $next = [string]$body.status
        $allowed = @{
            Scheduled = @('InProgress','OnHold','Cancelled')
            InProgress = @('OnHold','Completed')
            OnHold = @('InProgress','Cancelled')
            Completed = @('Verified')
            Verified = @('Closed')
        }
        if (-not $allowed.ContainsKey([string]$order.status) -or $allowed[[string]$order.status] -notcontains $next) {
            Send-Error $Context 409 'invalid_transition' 'That work-order transition is not permitted.'; return
        }
        if ($next -eq 'InProgress' -and -not $order.assignedToId) { Send-Error $Context 409 'assignment_required' 'Assign a technician before starting work.'; return }
        if ($next -eq 'Completed') {
            $notes = ([string]$body.completionNotes).Trim()
            if ($notes.Length -lt 8) { Send-Error $Context 400 'completion_required' 'Add at least 8 characters describing the work completed.'; return }
            $missing = @($order.checklist | Where-Object { $_.required -and -not $_.done })
            if ($missing.Count -gt 0) { Send-Error $Context 409 'checklist_incomplete' 'Complete all required checklist items before finishing.'; return }
            $order.completionNotes = $notes
            $order.completedAt = [DateTime]::UtcNow.ToString('o')
        }
        $previous = [string]$order.status
        $order.status = $next
        if ($next -eq 'InProgress' -and -not $order.startedAt) { $order.startedAt = [DateTime]::UtcNow.ToString('o') }
        Add-Audit $user.id 'work_order_status_changed' 'workOrder' $order.id @{ from = $previous; to = $next; reason = $body.reason }
        if ($next -in @('Completed','Verified','Closed')) {
            $request = @($script:State.requests | Where-Object { $_.id -eq $order.requestId } | Select-Object -First 1)[0]
            if ($request) { Add-Notification $request.requesterId 'Work order updated' "$($order.reference) is $($next.ToLowerInvariant())." 'workOrder' $order.id }
        }
        Save-State
        Send-Json $Context 200 $order; return
    }
    if ($resource -eq 'work-orders' -and $segments.Count -eq 5 -and $segments[3] -eq 'checklist' -and $method -eq 'PATCH') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Technician')
        if (-not $user) { return }
        $order = Find-WorkOrder $segments[2]
        if (-not $order -or -not (Test-LocationAccess $user $order.locationId) -or ($user.role -eq 'Technician' -and $order.assignedToId -ne $user.id)) {
            Send-Error $Context 404 'not_found' 'Work order not found.'; return
        }
        $item = @($order.checklist | Where-Object { $_.id -eq $segments[4] } | Select-Object -First 1)[0]
        if (-not $item) { Send-Error $Context 404 'checklist_item_not_found' 'Checklist item not found.'; return }
        $body = Read-Body $Context
        $item.done = [bool]$body.done
        Add-Audit $user.id 'checklist_item_updated' 'workOrder' $order.id @{ checklistItemId = $item.id; done = $item.done }
        Save-State
        Send-Json $Context 200 $order; return
    }
    if ($resource -eq 'technicians' -and $method -eq 'GET') {
        $user = Require-Role $Context $script:AllRoles
        if (-not $user) { return }
        $techs = @($script:State.users | Where-Object { $_.role -eq 'Technician' -and $_.active -and (Test-LocationAccess $user $_.locationId) } | ForEach-Object {
            $technician = $_
            [PSCustomObject]@{ id = $technician.id; displayName = $technician.displayName; locationId = $technician.locationId
                openAssignments = @($script:State.workOrders | Where-Object { $_.assignedToId -eq $technician.id -and $_.status -notin @('Completed','Verified','Closed','Cancelled') }).Count }
        })
        Send-Json $Context 200 $techs; return
    }
    if ($resource -eq 'inventory' -and $segments.Count -eq 2 -and $method -eq 'GET') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Technician','Storekeeper')
        if (-not $user) { return }
        $items = @($script:State.inventory | Where-Object { Test-LocationAccess $user $_.locationId } | ForEach-Object {
            $part = $_
            $reservedQty = [decimal](@($script:State.reservations | Where-Object { $_.partId -eq $part.id -and $_.status -eq 'Reserved' } | Measure-Object -Property quantity -Sum).Sum)
            $activeReservations = @($script:State.reservations | Where-Object { $_.partId -eq $part.id -and $_.status -eq 'Reserved' } | ForEach-Object {
                $reservation = $_
                $relatedOrder = Find-WorkOrder $reservation.workOrderId
                [PSCustomObject]@{ id = $reservation.id; quantity = $reservation.quantity
                    workOrderReference = if ($relatedOrder) { $relatedOrder.reference } else { $reservation.workOrderId } }
            })
            [PSCustomObject]@{ id = $part.id; sku = $part.sku; name = $part.name; locationId = $part.locationId; onHand = $part.onHand
                reserved = $reservedQty; available = ([decimal]$part.onHand - $reservedQty); reorderLevel = $part.reorderLevel; unit = $part.unit
                reservations = $activeReservations }
        })
        Send-Json $Context 200 $items; return
    }
    if ($resource -eq 'inventory' -and $segments.Count -eq 3 -and $segments[2] -eq 'movements' -and $method -eq 'POST') {
        $user = Require-Role $Context @('Admin','Manager','Storekeeper')
        if (-not $user) { return }
        $body = Read-Body $Context
        $key = [string]$Context.Request.Headers['Idempotency-Key']
        if (-not (Test-IdempotencyKey $key)) { Send-Error $Context 400 'idempotency_key_required' 'Provide a valid Idempotency-Key header for stock movements.'; return }
        $prior = Get-IdempotentResult $key 'movement' $user.id
        if ($prior) {
            $movement = @($script:State.movements | Where-Object { $_.id -eq $prior.entityId } | Select-Object -First 1)[0]
            Send-Json $Context 200 $movement; return
        }
        $part = @($script:State.inventory | Where-Object { $_.id -eq [string]$body.partId } | Select-Object -First 1)[0]
        [decimal]$quantity = 0
        if (-not [decimal]::TryParse([string]$body.quantity, [Globalization.NumberStyles]::Number, [Globalization.CultureInfo]::InvariantCulture, [ref]$quantity) -or $quantity -le 0 -or $quantity -gt 1000000) {
            Send-Error $Context 400 'invalid_quantity' 'Enter a quantity greater than zero.'; return
        }
        if (-not $part -or -not (Test-LocationAccess $user $part.locationId)) { Send-Error $Context 404 'part_not_found' 'Inventory item not found.'; return }
        $direction = [string]$body.direction
        if (@('receive','issue') -notcontains $direction) { Send-Error $Context 400 'invalid_movement' 'Choose receive or issue.'; return }
        $reason = ([string]$body.reason).Trim()
        if ($reason.Length -lt 3 -or $reason.Length -gt 120) { Send-Error $Context 400 'reason_required' 'Provide a reason of 3–120 characters.'; return }
        $workOrderId = [string]$body.workOrderId
        $workOrderReservation = $null
        if ($direction -eq 'issue') {
            if ($workOrderId) {
                $order = Find-WorkOrder $workOrderId
                if (-not $order -or $order.locationId -ne $part.locationId -or -not (Test-LocationAccess $user $order.locationId)) {
                    Send-Error $Context 404 'work_order_not_found' 'Work order not found at this inventory location.'; return
                }
            }
            [decimal]$reserved = @($script:State.reservations | Where-Object { $_.partId -eq $part.id -and $_.status -eq 'Reserved' } | Measure-Object -Property quantity -Sum)[0].Sum
            $workOrderReservation = @($script:State.reservations | Where-Object {
                $_.partId -eq $part.id -and $_.workOrderId -eq $workOrderId -and $_.status -eq 'Reserved'
            } | Select-Object -First 1)[0]
            if ($workOrderReservation) {
                if ([decimal]$workOrderReservation.quantity -lt $quantity) { Send-Error $Context 409 'reservation_exceeded' 'The issue exceeds the quantity reserved for that work order.'; return }
            } elseif (([decimal]$part.onHand - $reserved) -lt $quantity) {
                Send-Error $Context 409 'insufficient_stock' 'The requested quantity exceeds available, unreserved stock.'; return
            }
        }
        [decimal]$delta = if ($direction -eq 'receive') { $quantity } else { -$quantity }
        $part.onHand = [math]::Round(([decimal]$part.onHand + $delta), 3)
        $part.updatedAt = [DateTime]::UtcNow.ToString('o')
        if ($direction -eq 'issue' -and $workOrderReservation) {
            $workOrderReservation.quantity = [math]::Round(([decimal]$workOrderReservation.quantity - $quantity), 3)
            if ([decimal]$workOrderReservation.quantity -eq 0) { $workOrderReservation.status = 'Consumed' }
        }
        $movement = [PSCustomObject]@{ id = New-Id; partId = $part.id; sku = $part.sku; locationId = $part.locationId; direction = $direction
            quantity = $quantity; reason = $reason; workOrderId = $workOrderId
            actorId = $user.id; idempotencyKey = $key; createdAt = [DateTime]::UtcNow.ToString('o') }
        $script:State.movements = @($script:State.movements) + @($movement)
        Add-IdempotencyRecord $key 'movement' $movement.id $user.id
        Add-Audit $user.id "inventory_$direction" 'inventoryMovement' $movement.id @{ partId = $part.id; quantity = $quantity; reason = $movement.reason }
        Save-State
        Send-Json $Context 201 $movement; return
    }
    if ($resource -eq 'inventory' -and $segments.Count -eq 3 -and $segments[2] -eq 'items' -and $method -eq 'POST') {
        $user = Require-Role $Context @('Admin','Manager','Storekeeper')
        if (-not $user) { return }
        $body = Read-Body $Context
        $sku = ([string]$body.sku).Trim().ToUpperInvariant()
        $name = ([string]$body.name).Trim()
        if ($sku.Length -lt 2 -or $sku.Length -gt 40 -or $name.Length -lt 2 -or $name.Length -gt 120) {
            Send-Error $Context 400 'validation_error' 'Enter an SKU and part name.'; return
        }
        if (@($script:State.inventory | Where-Object { $_.sku -eq $sku -and $_.locationId -eq $user.locationId }).Count) {
            Send-Error $Context 409 'duplicate_part' 'That SKU already exists at this location.'; return
        }
        [decimal]$onHand = 0
        [decimal]$reorder = 0
        if (-not [decimal]::TryParse([string]$body.onHand, [Globalization.NumberStyles]::Number, [Globalization.CultureInfo]::InvariantCulture, [ref]$onHand) -or $onHand -lt 0 -or
            -not [decimal]::TryParse([string]$body.reorderLevel, [Globalization.NumberStyles]::Number, [Globalization.CultureInfo]::InvariantCulture, [ref]$reorder) -or $reorder -lt 0) {
            Send-Error $Context 400 'invalid_quantity' 'Stock and reorder level must be zero or greater.'; return
        }
        $part = [PSCustomObject]@{ id = New-Id; sku = $sku; name = $name; locationId = $user.locationId
            onHand = $onHand; reorderLevel = $reorder; unit = if ($body.unit) { ([string]$body.unit).Trim() } else { 'each' }
            updatedAt = [DateTime]::UtcNow.ToString('o') }
        $script:State.inventory = @($script:State.inventory) + @($part)
        if ($onHand -gt 0) {
            $movement = [PSCustomObject]@{ id = New-Id; partId = $part.id; sku = $part.sku; locationId = $part.locationId
                direction = 'receive'; quantity = $onHand; reason = 'Initial opening balance'; workOrderId = $null
                actorId = $user.id; idempotencyKey = $null; createdAt = [DateTime]::UtcNow.ToString('o') }
            $script:State.movements = @($script:State.movements) + @($movement)
            Add-Audit $user.id 'inventory_opening_balance' 'inventoryMovement' $movement.id @{ partId = $part.id; quantity = $onHand }
        }
        Add-Audit $user.id 'inventory_item_created' 'inventoryItem' $part.id @{ sku = $part.sku }
        Save-State
        Send-Json $Context 201 $part; return
    }
    if ($resource -eq 'inventory' -and $segments.Count -eq 3 -and $segments[2] -eq 'reservations' -and $method -eq 'POST') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Storekeeper')
        if (-not $user) { return }
        $body = Read-Body $Context
        $key = [string]$Context.Request.Headers['Idempotency-Key']
        if (-not (Test-IdempotencyKey $key)) { Send-Error $Context 400 'idempotency_key_required' 'Provide a valid Idempotency-Key header for stock reservations.'; return }
        $prior = Get-IdempotentResult $key 'reservation' $user.id
        if ($prior) {
            $reservation = @($script:State.reservations | Where-Object { $_.id -eq $prior.entityId } | Select-Object -First 1)[0]
            Send-Json $Context 200 $reservation; return
        }
        $part = @($script:State.inventory | Where-Object { $_.id -eq [string]$body.partId } | Select-Object -First 1)[0]
        $order = Find-WorkOrder ([string]$body.workOrderId)
        [decimal]$quantity = 0
        if (-not [decimal]::TryParse([string]$body.quantity, [Globalization.NumberStyles]::Number, [Globalization.CultureInfo]::InvariantCulture, [ref]$quantity) -or $quantity -le 0 -or $quantity -gt 1000000) {
            Send-Error $Context 400 'invalid_quantity' 'Enter a quantity greater than zero.'; return
        }
        if (-not $part -or -not $order -or $part.locationId -ne $order.locationId -or -not (Test-LocationAccess $user $order.locationId)) {
            Send-Error $Context 404 'record_not_found' 'The work order or part is unavailable.'; return
        }
        [decimal]$reserved = @($script:State.reservations | Where-Object { $_.partId -eq $part.id -and $_.status -eq 'Reserved' } | Measure-Object -Property quantity -Sum)[0].Sum
        if (([decimal]$part.onHand - $reserved) -lt $quantity) { Send-Error $Context 409 'insufficient_stock' 'The requested quantity exceeds available stock.'; return }
        $reservation = [PSCustomObject]@{ id = New-Id; partId = $part.id; workOrderId = $order.id; locationId = $part.locationId; quantity = $quantity
            status = 'Reserved'; actorId = $user.id; idempotencyKey = $key; createdAt = [DateTime]::UtcNow.ToString('o') }
        $script:State.reservations = @($script:State.reservations) + @($reservation)
        Add-IdempotencyRecord $key 'reservation' $reservation.id $user.id
        Add-Audit $user.id 'stock_reserved' 'reservation' $reservation.id @{ partId = $part.id; workOrderId = $order.id; quantity = $quantity }
        Save-State
        Send-Json $Context 201 $reservation; return
    }
    if ($resource -eq 'inventory' -and $segments.Count -eq 4 -and $segments[2] -eq 'reservations' -and $method -eq 'POST') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Storekeeper')
        if (-not $user) { return }
        $reservation = @($script:State.reservations | Where-Object { $_.id -eq $segments[3] } | Select-Object -First 1)[0]
        if (-not $reservation -or -not (Test-LocationAccess $user $reservation.locationId)) { Send-Error $Context 404 'not_found' 'Reservation not found.'; return }
        if ($reservation.status -ne 'Reserved') { Send-Error $Context 409 'invalid_transition' 'Only active reservations can be released.'; return }
        $reservation.status = 'Released'
        $releasedAt = [DateTime]::UtcNow.ToString('o')
        if ($reservation.PSObject.Properties['releasedAt']) { $reservation.releasedAt = $releasedAt }
        else { $reservation | Add-Member -NotePropertyName releasedAt -NotePropertyValue $releasedAt }
        Add-Audit $user.id 'stock_reservation_released' 'reservation' $reservation.id @{ quantity = $reservation.quantity }
        Save-State
        Send-Json $Context 200 $reservation; return
    }
    if ($resource -eq 'inventory' -and $segments.Count -eq 3 -and $segments[2] -eq 'movements' -and $method -eq 'GET') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor','Storekeeper')
        if (-not $user) { return }
        $items = @($script:State.movements | Where-Object { Test-LocationAccess $user $_.locationId })
        Send-Json $Context 200 $items; return
    }
    if ($resource -eq 'notifications' -and $method -eq 'GET') {
        $user = Require-Role $Context $script:AllRoles
        if (-not $user) { return }
        Send-Json $Context 200 @($script:State.notifications | Where-Object { $_.userId -eq $user.id } | Sort-Object createdAt -Descending); return
    }
    if ($resource -eq 'notifications' -and $segments.Count -eq 4 -and $segments[3] -eq 'read' -and $method -eq 'POST') {
        $user = Require-Role $Context $script:AllRoles
        if (-not $user) { return }
        $notice = @($script:State.notifications | Where-Object { $_.id -eq $segments[2] -and $_.userId -eq $user.id } | Select-Object -First 1)[0]
        if (-not $notice) { Send-Error $Context 404 'not_found' 'Notification not found.'; return }
        $notice.readAt = [DateTime]::UtcNow.ToString('o')
        Save-State
        Send-Json $Context 200 $notice; return
    }
    if ($resource -eq 'audit' -and $method -eq 'GET') {
        $user = Require-Role $Context @('Admin','Manager','Supervisor')
        if (-not $user) { return }
        $items = @($script:State.audit | Where-Object {
            $entry = $_
            $record = switch ($entry.entityType) {
                'asset' { @($script:State.assets | Where-Object { $_.id -eq $entry.entityId } | Select-Object -First 1)[0] }
                'request' { @($script:State.requests | Where-Object { $_.id -eq $entry.entityId } | Select-Object -First 1)[0] }
                'workOrder' { Find-WorkOrder $entry.entityId }
                'inventoryMovement' { @($script:State.movements | Where-Object { $_.id -eq $entry.entityId } | Select-Object -First 1)[0] }
                'reservation' { @($script:State.reservations | Where-Object { $_.id -eq $entry.entityId } | Select-Object -First 1)[0] }
                'inventoryItem' { @($script:State.inventory | Where-Object { $_.id -eq $entry.entityId } | Select-Object -First 1)[0] }
                default { $null }
            }
            if (-not $record -and $entry.entityType -eq 'user') {
                $actor = Find-User $entry.entityId
                return ($actor -and (Test-LocationAccess $user $actor.locationId))
            }
            return ($record -and (Test-LocationAccess $user $record.locationId))
        } | Sort-Object createdAt -Descending | Select-Object -First 200)
        Send-Json $Context 200 $items; return
    }
    Send-Error $Context 404 'not_found' 'Route not found.'
}

$script:AllRoles = @('Admin','Manager','Supervisor','Technician','Requester','Storekeeper')
Initialize-State

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
    $listener.Start()
} catch {
    throw "Unable to listen on 127.0.0.1:$Port. Choose another port or check local permissions. $($_.Exception.Message)"
}
Write-Host "Maintenance Management MVP running at http://127.0.0.1:$Port"
Write-Host 'Development-only server. Stop with Ctrl+C. State is stored under data\runtime.'
if (-not $DemoData -and @($script:State.users).Count -eq 0) {
    Write-Host 'First run: open the app and create the initial administrator; no default password is configured.'
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $requestPath = $context.Request.Url.AbsolutePath
            if ($requestPath.StartsWith('/api/')) {
                Handle-Api $context
            } elseif ($context.Request.HttpMethod -eq 'GET' -and $requestPath -match '^/(|index\.html|app\.js|styles\.css)$') {
                $fileName = if ($requestPath -eq '/app.js') { 'app.js' } elseif ($requestPath -eq '/styles.css') { 'styles.css' } else { 'index.html' }
                $filePath = Join-Path $root "public\$fileName"
                if (-not (Test-Path -LiteralPath $filePath)) { Send-Error $context 404 'not_found' 'File not found.' }
                else {
                    $bytes = [System.IO.File]::ReadAllBytes($filePath)
                    $context.Response.StatusCode = 200
                    $context.Response.ContentType = switch ([System.IO.Path]::GetExtension($filePath)) {
                        '.html' { 'text/html; charset=utf-8' }
                        '.js' { 'application/javascript; charset=utf-8' }
                        '.css' { 'text/css; charset=utf-8' }
                    }
                    $context.Response.Headers['Cache-Control'] = 'no-store'
                    $context.Response.Headers['X-Content-Type-Options'] = 'nosniff'
                    $context.Response.Headers['X-Frame-Options'] = 'DENY'
                    $context.Response.Headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
                    $context.Response.ContentLength64 = $bytes.Length
                    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                Send-Error $context 404 'not_found' 'Route not found.'
            }
        } catch {
            Write-Warning ("Request failed: " + $_.Exception.GetType().Name + " near server line " + $_.InvocationInfo.ScriptLineNumber)
            try { Send-Error $context 500 'internal_error' 'The request could not be completed.' } catch {}
        } finally {
            $context.Response.Close()
        }
    }
} finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
}
