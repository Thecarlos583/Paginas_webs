# Crea las tablas del panel de documentos en la base D1 del cliente (se puede correr de nuevo sin dañar nada).
# Uso:  .\instalar.ps1 youtravel          (en Cloudflare)
#       .\instalar.ps1 youtravel -Local   (en la base de pruebas de wrangler dev)
param([Parameter(Mandatory = $true)][string]$cliente, [switch]$Local)
. (Join-Path $PSScriptRoot "scripts\comun.ps1")
Invoke-SqlArchivo (Join-Path $PSScriptRoot "esquema.sql")
Write-Host "Tablas listas en $base."
