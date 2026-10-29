# stop-all.ps1 - Gracefully stops all 5 FastAPI backends and frontend
$ErrorActionPreference = "SilentlyContinue"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidJsonPath = Join-Path $scriptDir ".pids.json"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   STOPPING RADIX TALENT MATCH SERVICES" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Stop recorded PIDs if file exists
if (Test-Path $pidJsonPath) {
    try {
        $pids = Get-Content $pidJsonPath -Raw | ConvertFrom-Json
        foreach ($prop in $pids.PSObject.Properties) {
            $name = $prop.Name
            $info = $prop.Value
            $procId = $info.Id
            if ($procId) {
                Write-Host "  Stopping $name (PID $procId)..." -NoNewline
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Host " [STOPPED]" -ForegroundColor Green
            }
        }
        Remove-Item $pidJsonPath -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Host "  Note: Failed parsing .pids.json" -ForegroundColor Yellow
    }
}

# 2. Check and stop any remaining processes listening on ports 8001-8005 and 5173
$targetPorts = @(8001, 8002, 8003, 8004, 8005, 5173, 3000)
foreach ($port in $targetPorts) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $pidToKill = $conn.OwningProcess
        if ($pidToKill -and $pidToKill -ne 0 -and $pidToKill -ne 4) {
            Write-Host "  Releasing port $port (Killing PID $pidToKill)..." -NoNewline
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            Write-Host " [RELEASED]" -ForegroundColor Green
        }
    }
}

Write-Host "`nAll RADIX Talent Match services have been stopped." -ForegroundColor Green
