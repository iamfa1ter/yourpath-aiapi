$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "Building React frontend..."
npm.cmd run build

Write-Host "Installing Python desktop dependencies..."
python -m pip install -r python_app/requirements.txt

Write-Host "Building Windows executable..."
python -m PyInstaller `
  --noconfirm `
  --clean `
  --windowed `
  --name YourPathAI `
  --add-data "dist;dist" `
  --hidden-import "webview.platforms.edgechromium" `
  --hidden-import "webview.platforms.winforms" `
  --collect-submodules "uvicorn" `
  --collect-submodules "webview" `
  python_app/desktop.py

Write-Host ""
Write-Host "Done. EXE created at:"
Write-Host "dist\YourPathAI\YourPathAI.exe"
Write-Host ""
Write-Host "Put your .env file next to the EXE:"
Write-Host "dist\YourPathAI\.env"
