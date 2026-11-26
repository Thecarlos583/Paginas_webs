# Cuando la clienta paga: BORRA los datos de ejemplo y los usuarios de la demostración, reinicia la numeración
# (COT-0001...) y crea su usuario Administrador con una contraseña nueva.
# Uso:  .\pasar-a-real.ps1 youtravel -Usuario patricia -Nombre "Patricia ..."
# La contraseña queda en %USERPROFILE%\secretos\<cliente>-documentos.txt para pasársela.
param([Parameter(Mandatory = $true)][string]$cliente, [Parameter(Mandatory = $true)][string]$Usuario,
      [Parameter(Mandatory = $true)][string]$Nombre, [switch]$Local)
. (Join-Path $PSScriptRoot "scripts\comun.ps1")
$node = Join-Path $PSScriptRoot "scripts\d1.mjs"
$clave = node $node clave
$sql = (Get-Content (Join-Path $PSScriptRoot "scripts\borrar-todo.sql") -Raw -Encoding UTF8) + "`n"
$sql += (node $node usuario $Usuario.ToLower() $Nombre admin $clave) + "`n"
Invoke-SqlTexto $sql
$archivo = Join-Path $secretos "$cliente-documentos.txt"
Add-Content -Path $archivo -Value "$($Usuario.ToLower())=$clave" -Encoding UTF8
Write-Host "Listo: sin datos de ejemplo. Usuario $($Usuario.ToLower())   Contraseña: $clave   (guardada en $archivo)"
