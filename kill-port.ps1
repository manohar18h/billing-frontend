$port = 3005
$processInfo = netstat -aon | findstr ":$port"

if ($processInfo) {
    $lines = $processInfo -split "`n"
    foreach ($line in $lines) {
        $targetPid = $line -split "\s+" | Select-Object -Last 1
        if ($targetPid -match '^\d+$') {
            Write-Host "Killing PID $targetPid using port $port..."
            taskkill /PID $targetPid /F | Out-Null
        }
    }
} else {
    Write-Host "Port $port is free."
}
