# Deja el panel en modo demostración: BORRA todo, crea los usuarios de ejemplo y lo llena con datos de ejemplo.
# Uso:  .\demo.ps1 youtravel -Url https://youtravelagenciadeviajes.com
#       .\demo.ps1 youtravel -Local -Url http://127.0.0.1:8787
# Las contraseñas quedan en %USERPROFILE%\secretos\<cliente>-documentos-demo.txt (se reutilizan si ya existen).
param([Parameter(Mandatory = $true)][string]$cliente, [Parameter(Mandatory = $true)][string]$Url, [switch]$Local)
. (Join-Path $PSScriptRoot "scripts\comun.ps1")
$node = Join-Path $PSScriptRoot "scripts\d1.mjs"
$archivo = Join-Path $secretos "$cliente-documentos-demo.txt"
if (-not (Test-Path $archivo)) {
  $c1 = node $node clave; $c2 = node $node clave
  [IO.File]::WriteAllText($archivo, "demo=$c1`r`nmaria.demo=$c2`r`n", (New-Object Text.UTF8Encoding $false))
}
$claves = @{}
Get-Content $archivo | ForEach-Object { if ($_ -match '^([^=]+)=(.+)$') { $claves[$Matches[1]] = $Matches[2] } }

Invoke-SqlNode @("sql-demo", $claves["demo"], $claves["maria.demo"])
node $node demo $Url demo $claves["demo"] maria.demo $claves["maria.demo"]
if ($LASTEXITCODE -ne 0) { Write-Error "No se pudieron cargar los documentos de ejemplo."; exit 1 }
Write-Host "Usuario de demostración: demo   Contraseña: $($claves['demo'])"
Write-Host "Asesora de ejemplo: maria.demo   Contraseña: $($claves['maria.demo'])"
