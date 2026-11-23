$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$serverScript = Join-Path $root 'server.ps1'
$port = Get-Random -Minimum 54000 -Maximum 56000
$testDirectory = Join-Path $env:TEMP ("fieldwork-smoke-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $testDirectory | Out-Null
$stateFile = Join-Path $testDirectory 'state.json'
$stdout = Join-Path $testDirectory 'server.out.log'
$stderr = Join-Path $testDirectory 'server.err.log'
$process = $null
$baseUrl = "http://127.0.0.1:$port"
$passed = 0

function Assert([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw "FAIL: $Message" }
    $script:passed++
    Write-Host "PASS: $Message"
}

function Invoke-Api($Session, [string]$Method, [string]$Path, $Body = $null, [string]$Key = '') {
    $parameters = @{
        Uri = "$script:baseUrl/api$Path"
        Method = $Method
        WebSession = $Session
        ErrorAction = 'Stop'
    }
    $parameters.Headers = @{ 'Idempotency-Key' = $Key }
    if ($null -ne $Body) { $parameters.ContentType = 'application/json'; $parameters.Body = ConvertTo-Json -InputObject $Body -Depth 20 -Compress }
    return Invoke-RestMethod @parameters
}

function Get-StatusCode($Exception) {
    if ($Exception.Response -and $Exception.Response.StatusCode) { return [int]$Exception.Response.StatusCode }
    return 0
}

function Assert-HttpError($Session, [string]$Method, [string]$Path, $Body, [int]$ExpectedStatus, [string]$Message, [string]$Key = '') {
    try {
        $unexpected = Invoke-Api $Session $Method $Path $Body $Key
        Write-Host "Unexpected successful response: $($unexpected | ConvertTo-Json -Compress -Depth 4)"
        Assert $false $Message
    } catch {
        $actual = Get-StatusCode $_.Exception
        if ($actual -ne $ExpectedStatus) { Write-Host "Expected HTTP $ExpectedStatus; received HTTP $actual." }
        Assert ($actual -eq $ExpectedStatus) $Message
    }
}

try {
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$serverScript`" -Port $port -DemoData -StateFile `"$stateFile`""
    $process = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    $ready = $false
    for ($attempt = 0; $attempt -lt 50; $attempt++) {
        if ($process.HasExited) { throw "Server exited during startup. See $stderr" }
        try {
            $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -TimeoutSec 2
            if ($health.status -eq 'ok') { $ready = $true; break }
        } catch { Start-Sleep -Milliseconds 200 }
    }
    Assert $ready 'HTTP listener starts with isolated state'
    Assert-HttpError $null 'GET' '/assets' $null 401 'unauthenticated asset access is denied'

    $requesterSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $requester = Invoke-Api $requesterSession 'POST' '/login' @{ username = 'requester'; password = 'Maintenance-Demo-2026!' }
    Assert ($requester.user.role -eq 'Requester') 'requester can authenticate'
    $requestBody = @{
        title = 'Pump makes a new noise'
        description = 'A new grinding sound starts during operation.'
        assetId = 'asset-hvac-01'
        priority = 'High'
    }
    Assert-HttpError $requesterSession 'POST' '/requests' $requestBody 400 'request creation requires an idempotency key'
    $firstRequest = Invoke-Api $requesterSession 'POST' '/requests' $requestBody 'test-request-key'
    $retriedRequest = Invoke-Api $requesterSession 'POST' '/requests' $requestBody 'test-request-key'
    Assert ($firstRequest.id -eq $retriedRequest.id) 'request submission retry is idempotent'
    Assert-HttpError $requesterSession 'POST' "/requests/$($firstRequest.id)/review" @{ decision = 'Approved' } 403 'requester cannot approve a request'

    $managerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    Invoke-Api $managerSession 'POST' '/login' @{ username = 'manager'; password = 'Maintenance-Demo-2026!' } | Out-Null
    $managerAssets = Invoke-Api $managerSession 'GET' '/assets'
    Assert (@($managerAssets | Where-Object { $_.locationId -eq 'south' }).Count -eq 0) 'manager cannot read assets outside assigned location'
    Assert-HttpError $managerSession 'POST' '/requests/request-south-01/review' @{ decision = 'Approved' } 404 'manager cannot mutate a request outside assigned location'
    $managedAsset = @($managerAssets | Select-Object -First 1)[0]
    $updatedAsset = Invoke-Api $managerSession 'PATCH' "/assets/$($managedAsset.id)" @{ name = 'North building HVAC unit'; status = 'NeedsAttention' }
    Assert ($updatedAsset.status -eq 'NeedsAttention') 'authorized asset status update is persisted'
    Assert-HttpError $managerSession 'PATCH' "/assets/$($managedAsset.id)" @{ archived = $true } 409 'asset with work-order history cannot be archived'
    $southRequesterSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    Invoke-Api $southRequesterSession 'POST' '/login' @{ username = 'requester-south'; password = 'Maintenance-Demo-2026!' } | Out-Null
    $southRequests = Invoke-Api $southRequesterSession 'GET' '/requests'
    Assert (@($southRequests | Where-Object { $_.id -eq 'request-south-01' }).Count -eq 1) 'requester sees own in-scope request'
    Assert (@($southRequests | Where-Object { $_.id -eq 'request-demo-01' }).Count -eq 0) 'requester cannot read another location request'
    $reviewed = Invoke-Api $managerSession 'POST' "/requests/$($firstRequest.id)/review" @{ decision = 'Approved' }
    Assert ($reviewed.status -eq 'Approved') 'authorized reviewer approves a submitted request'
    $order = Invoke-Api $managerSession 'POST' "/requests/$($firstRequest.id)/convert" @{}
    $duplicateOrder = Invoke-Api $managerSession 'POST' "/requests/$($firstRequest.id)/convert" @{}
    Assert ($order.id -eq $duplicateOrder.id) 'request conversion creates at most one work order'
    $technicians = Invoke-Api $managerSession 'GET' '/technicians'
    $technician = @($technicians | Where-Object { $_.id -eq 'user-technician' })[0]
    Assert ($null -ne $technician) 'in-scope technician is listed'
    Invoke-Api $managerSession 'POST' "/work-orders/$($order.id)/assign" @{ assigneeId = $technician.id } | Out-Null

    $technicianSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    Invoke-Api $technicianSession 'POST' '/login' @{ username = 'technician'; password = 'Maintenance-Demo-2026!' } | Out-Null
    Assert-HttpError $technicianSession 'POST' "/work-orders/$($order.id)/status" @{ status = 'Completed'; completionNotes = 'Completed after inspection.' } 409 'required checklist blocks completion'
    $work = Invoke-Api $technicianSession 'POST' "/work-orders/$($order.id)/status" @{ status = 'InProgress' }
    Assert ($work.status -eq 'InProgress') 'assigned technician starts work'
    foreach ($item in $work.checklist) {
        $work = Invoke-Api $technicianSession 'PATCH' "/work-orders/$($order.id)/checklist/$($item.id)" @{ done = $true }
    }
    $work = Invoke-Api $technicianSession 'POST' "/work-orders/$($order.id)/status" @{ status = 'Completed'; completionNotes = 'Inspected and corrected the reported issue.' }
    Assert ($work.status -eq 'Completed') 'assigned technician completes work after checklist'
    $verified = Invoke-Api $managerSession 'POST' "/work-orders/$($order.id)/status" @{ status = 'Verified' }
    $closed = Invoke-Api $managerSession 'POST' "/work-orders/$($order.id)/status" @{ status = 'Closed' }
    Assert (($verified.status -eq 'Verified') -and ($closed.status -eq 'Closed')) 'supervisor verifies and closes work'

    $part = @((Invoke-Api $managerSession 'GET' '/inventory') | Where-Object { $_.id -eq 'part-filter-01' })[0]
    $openingMovement = @((Invoke-Api $managerSession 'GET' '/inventory/movements') | Where-Object { $_.id -eq 'movement-demo-opening' })[0]
    Assert ($null -ne $openingMovement) 'seeded stock has a traceable opening movement'
    $reservation = Invoke-Api $managerSession 'POST' '/inventory/reservations' @{
        partId = $part.id; workOrderId = $order.id; quantity = 2
    } 'test-reservation-key'
    $reservationRetry = Invoke-Api $managerSession 'POST' '/inventory/reservations' @{
        partId = $part.id; workOrderId = $order.id; quantity = 2
    } 'test-reservation-key'
    Assert ($reservation.id -eq $reservationRetry.id) 'reservation retry is idempotent'
    Assert-HttpError $managerSession 'POST' '/inventory/movements' @{
        partId = $part.id; direction = 'issue'; quantity = 11; reason = 'test over-issue'
    } 409 'unreserved issue cannot consume reserved stock' 'test-over-issue'
    $movementBody = @{ partId = $part.id; direction = 'issue'; quantity = 2; reason = 'work-order usage'; workOrderId = $order.id }
    Assert-HttpError $managerSession 'POST' '/inventory/movements' $movementBody 400 'stock issue requires an idempotency key'
    $movement = Invoke-Api $managerSession 'POST' '/inventory/movements' $movementBody 'test-issue-key'
    $movementRetry = Invoke-Api $managerSession 'POST' '/inventory/movements' $movementBody 'test-issue-key'
    Assert ($movement.id -eq $movementRetry.id) 'stock issue retry is idempotent'
    $partAfter = @((Invoke-Api $managerSession 'GET' '/inventory') | Where-Object { $_.id -eq $part.id })[0]
    Assert ([double]$partAfter.onHand -eq 10 -and [double]$partAfter.reserved -eq 0) 'issue consumes its reservation exactly once'
    $newPart = Invoke-Api $managerSession 'POST' '/inventory/items' @{
        sku = 'BEARING-02'; name = 'Precision bearing'; onHand = '3.125'; reorderLevel = '1.500'; unit = 'each'
    }
    Assert ([decimal]$newPart.onHand -eq [decimal]3.125) 'new inventory item preserves decimal stock quantity'
    $newPartMovement = @((Invoke-Api $managerSession 'GET' '/inventory/movements') | Where-Object { $_.partId -eq $newPart.id })[0]
    Assert ($newPartMovement.reason -eq 'Initial opening balance') 'opening balance is represented by a stock movement'
    $releaseReservation = Invoke-Api $managerSession 'POST' '/inventory/reservations' @{
        partId = $newPart.id; workOrderId = 'workorder-demo-01'; quantity = '1.125'
    } 'test-release-reservation'
    $released = Invoke-Api $managerSession 'POST' "/inventory/reservations/$($releaseReservation.id)" @{}
    Assert ($released.status -eq 'Released') 'unused stock reservation can be released'

    $dashboard = Invoke-Api $managerSession 'GET' '/dashboard'
    Assert ([int]$dashboard.openWorkOrders -ge 1) 'dashboard counts live open work orders'
    $audit = Invoke-Api $managerSession 'GET' '/audit'
    Assert (@($audit | Where-Object { $_.action -eq 'stock_reserved' }).Count -ge 1) 'audit includes inventory reservation'
    $notifications = Invoke-Api $requesterSession 'GET' '/notifications'
    Assert (@($notifications | Where-Object { $_.entityId -eq $firstRequest.id }).Count -ge 1) 'requester receives an in-app status notification'

    Stop-Process -Id $process.Id -Force
    $process.WaitForExit()
    $process = $null
    $port = Get-Random -Minimum 56001 -Maximum 58000
    $baseUrl = "http://127.0.0.1:$port"
    $bootstrapState = Join-Path $testDirectory 'bootstrap-state.json'
    $bootstrapArguments = "-NoProfile -ExecutionPolicy Bypass -File `"$serverScript`" -Port $port -StateFile `"$bootstrapState`""
    $process = Start-Process -FilePath 'powershell.exe' -ArgumentList $bootstrapArguments -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    $bootstrapReady = $false
    for ($attempt = 0; $attempt -lt 50; $attempt++) {
        if ($process.HasExited) { throw "Bootstrap server exited during startup. See $stderr" }
        try {
            $emptySession = Invoke-RestMethod -Uri "$baseUrl/api/session" -TimeoutSec 2
            if ($emptySession.needsBootstrap) { $bootstrapReady = $true; break }
        } catch { Start-Sleep -Milliseconds 200 }
    }
    Assert $bootstrapReady 'fresh database requests an initial administrator'
    $bootstrapBody = @{
        username = 'first-admin'; displayName = 'First Administrator'
        password = 'Welcome-Admin-2026!'; passwordConfirmation = 'Welcome-Admin-2026!'
    }
    $createdAdmin = Invoke-Api $null 'POST' '/bootstrap' $bootstrapBody
    Assert ($createdAdmin.user.role -eq 'Admin') 'initial administrator is created with user-chosen credentials'
    Assert-HttpError $null 'POST' '/bootstrap' $bootstrapBody 409 'administrator bootstrap cannot be repeated'
    $adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $loggedInAdmin = Invoke-Api $adminSession 'POST' '/login' @{
        username = 'first-admin'; password = 'Welcome-Admin-2026!'
    }
    Assert ($loggedInAdmin.user.id -eq $createdAdmin.user.id) 'bootstrapped administrator can sign in'
    Write-Host "`n$passed integration assertions passed."
} catch {
    if (Test-Path -LiteralPath $stderr) {
        Write-Host 'Server diagnostic:'
        Get-Content -LiteralPath $stderr | ForEach-Object { Write-Host $_ }
    }
    if (Test-Path -LiteralPath $stdout) {
        Write-Host 'Server output:'
        Get-Content -LiteralPath $stdout | ForEach-Object { Write-Host $_ }
    }
    throw
} finally {
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
        $process.WaitForExit()
    }
    if (Test-Path -LiteralPath $testDirectory) {
        Remove-Item -LiteralPath $testDirectory -Recurse -Force
    }
}
