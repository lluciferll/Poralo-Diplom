# Запуск через Docker Compose (PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ">> docker compose down -v  (если обновили схему БД)" -ForegroundColor DarkGray
Write-Host ">> docker compose up --build -d" -ForegroundColor Cyan
docker compose up --build -d

Write-Host ""
Write-Host "ArenaPulse:" -ForegroundColor Green
Write-Host "  http://localhost:8080"
Write-Host "  API: http://localhost:8080/api/docs"
Write-Host "  Demo: pro@arena.dev / demo123"
