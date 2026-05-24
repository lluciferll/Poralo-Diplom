# Сборка production-образа ArenaPulse (PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ">> Building ArenaPulse Docker image..." -ForegroundColor Cyan
docker build -t arenapulse:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host ">> Done: arenapulse:latest" -ForegroundColor Green
    Write-Host "   Run: docker run -p 8080:8080 -e DATABASE_URL=sqlite:///./arena.db -v arenapulse-data:/data arenapulse:latest"
} else {
    Write-Host ">> Build failed" -ForegroundColor Red
    exit 1
}
