function New-EmptyState {
    return [PSCustomObject]@{
        schemaVersion = 1
        users = @()
        assets = @()
        requests = @()
        workOrders = @()
        inventory = @()
        reservations = @()
        movements = @()
        notifications = @()
        audit = @()
        idempotency = @()
        createdAt = [DateTime]::UtcNow.ToString('o')
    }
}

function Invoke-AppMigrations($State) {
    $version = 0
    if ($State.schemaVersion) { $version = [int]$State.schemaVersion }
    if ($version -lt 1) {
        foreach ($name in @('users','assets','requests','workOrders','inventory','reservations','movements','notifications','audit','idempotency')) {
            if (-not $State.PSObject.Properties[$name]) {
                $State | Add-Member -NotePropertyName $name -NotePropertyValue @()
            }
        }
        $State.schemaVersion = 1
    }
    if ($version -gt 1) { throw "State schema version $version is newer than this application supports." }
    return $State
}
