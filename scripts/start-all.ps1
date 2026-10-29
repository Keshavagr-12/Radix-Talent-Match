# start-all.ps1 - Launches all 5 FastAPI backends + Master Frontend
param(
    [switch]$VisibleWindows
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   RADIX TALENT MATCH - UNIFIED APPLICATION STARTUP" -ForegroundColor Cyan
Write-Host "   Starting 5 FastAPI Backends + React Vite Frontend" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Define Services
$services = @(
    @{
        Name = "01. JD Analytics"
        Dir = Join-Path $rootDir "jd_analytics"
        Args = "-m uvicorn api:app --host 127.0.0.1 --port 8001"
        Port = 8001
        Health = "http://127.0.0.1:8001/health"
    },
    @{
        Name = "02. Resume Parsing"
        Dir = Join-Path $rootDir "resume-parsing-llm"
        Args = "-m uvicorn app.main:app --host 127.0.0.1 --port 8002"
        Port = 8002
        Health = "http://127.0.0.1:8002/health"
    },
    @{
        Name = "03. Profile Builder"
        Dir = Join-Path $rootDir "profile_builder\backend"
        Args = "-m uvicorn main:app --host 127.0.0.1 --port 8003"
        Port = 8003
        Health = "http://127.0.0.1:8003/health"
    },
    @{
        Name = "04. Talent Check"
        Dir = Join-Path $rootDir "Talent-match\backend"
        Args = "-m uvicorn main:app --host 127.0.0.1 --port 8004"
        Port = 8004
        Health = "http://127.0.0.1:8004/health"
    },
    @{
        Name = "05. Skill Matching"
        Dir = Join-Path $rootDir "skill_matching"
        Args = "-m uvicorn main:app --host 127.0.0.1 --port 8005"
        Port = 8005
        Health = "http://127.0.0.1:8005/health"
    }
)

# 2. Check for port conflicts
Write-Host "`n[1/4] Checking ports..." -ForegroundColor Yellow
$conflict = $false
foreach ($svc in $services) {
    $conn = Get-NetTCPConnection -LocalPort $svc.Port -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "  [!] Port $($svc.Port) is already in use by PID $($conn.OwningProcess) ($($svc.Name))" -ForegroundColor Red
        $conflict = $true
    }
}
if ($conflict) {
    Write-Host "Please stop conflicting processes or run .\scripts\stop-all.ps1 first." -ForegroundColor Red
    exit 1
}
Write-Host "  All service ports (8001-8005) are clear." -ForegroundColor Green

# 3. Launch Backend Services
Write-Host "`n[2/4] Starting FastAPI Microservices..." -ForegroundColor Yellow
$pids = @{}
$winStyle = if ($VisibleWindows) { "Normal" } else { "Hidden" }

foreach ($svc in $services) {
    Write-Host "  Launching $($svc.Name) on port $($svc.Port)..." -NoNewline
    $proc = Start-Process python -ArgumentList $svc.Args -WorkingDirectory $svc.Dir -WindowStyle $winStyle -PassThru
    if ($proc) {
        $pids[$svc.Name] = @{
            Id = $proc.Id
            Port = $svc.Port
            Health = $svc.Health
        }
        Write-Host " [PID $($proc.Id)]" -ForegroundColor Green
    } else {
        Write-Host " [FAILED]" -ForegroundColor Red
    }
}

# 4. Probe Health Endpoints
Write-Host "`n[3/4] Probing Service Health Endpoints..." -ForegroundColor Yellow
$timeoutSeconds = 25
$startTime = Get-Date

foreach ($svc in $services) {
    $healthy = $false
    Write-Host "  Checking $($svc.Name) ($($svc.Health))..." -NoNewline
    while (-not $healthy -and ((Get-Date) - $startTime).TotalSeconds -lt $timeoutSeconds) {
        try {
            $resp = Invoke-RestMethod -Uri $svc.Health -Method GET -TimeoutSec 2 -ErrorAction Stop
            if ($resp.status -eq "ok") {
                $healthy = $true
                break
            }
        } catch {
            Start-Sleep -Milliseconds 400
        }
    }
    if ($healthy) {
        Write-Host " [ONLINE]" -ForegroundColor Green
    } else {
        Write-Host " [TIMEOUT / RETRYING]" -ForegroundColor Yellow
    }
}

# 5. Launch React + Vite Frontend
Write-Host "`n[4/4] Launching Master Frontend..." -ForegroundColor Yellow
$frontendDir = Join-Path $rootDir "radix-talent-match_frontend"
$frontProc = Start-Process cmd.exe -ArgumentList "/c npm run dev" -WorkingDirectory $frontendDir -WindowStyle $winStyle -PassThru
if ($frontProc) {
    $pids["Frontend"] = @{
        Id = $frontProc.Id
        Port = 5173
        Health = "http://localhost:5173"
    }
    Write-Host "  Frontend started [PID $($frontProc.Id)] on http://localhost:5173" -ForegroundColor Green
}

# 6. Save PIDs
$pidJsonPath = Join-Path $scriptDir ".pids.json"
$pids | ConvertTo-Json -Depth 3 | Set-Content -Path $pidJsonPath -Encoding utf8

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "   RADIX TALENT MATCH IS RUNNING!" -ForegroundColor Green
Write-Host "   Frontend Application: http://localhost:5173" -ForegroundColor White
Write-Host "   Module 01 (JD Analytics):  http://127.0.0.1:8001/docs" -ForegroundColor Gray
Write-Host "   Module 02 (Resume Parsing): http://127.0.0.1:8002/docs" -ForegroundColor Gray
Write-Host "   Module 03 (Profile Builder): http://127.0.0.1:8003/docs" -ForegroundColor Gray
Write-Host "   Module 04 (Talent Check):  http://127.0.0.1:8004/docs" -ForegroundColor Gray
Write-Host "   Module 05 (Skill Matching): http://127.0.0.1:8005/docs" -ForegroundColor Gray
Write-Host "   To stop all services: .\scripts\stop-all.ps1" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
