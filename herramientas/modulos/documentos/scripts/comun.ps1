# Lo comparten instalar.ps1, demo.ps1 y pasar-a-real.ps1: dónde está la configuración del cliente y su base D1.
$modulo = Split-Path -Parent $PSScriptRoot
$cfg = Join-Path $modulo "clientes\$cliente\wrangler.jsonc"
if (-not (Test-Path $cfg)) { $cfg = Join-Path (Split-Path -Parent $modulo) "novedades\clientes\$cliente\wrangler.jsonc" }
if (-not (Test-Path $cfg)) { Write-Error "No encuentro el wrangler.jsonc de $cliente (ni en documentos\clientes ni en novedades\clientes)."; exit 1 }
$base = "documentos-$cliente"
# Pruebas locales: la base va fuera de OneDrive (SQLite falla dentro de una carpeta sincronizada).
# wrangler dev tiene que usar la misma carpeta:  wrangler dev -c <wrangler.jsonc> --persist-to $env:LOCALAPPDATA\wrangler-local\<cliente>
$persistir = Join-Path $env:LOCALAPPDATA "wrangler-local\$cliente"
$donde = if ($Local) { @("--local", "--persist-to", $persistir) } else { @("--remote") }
$secretos = Join-Path $env:USERPROFILE "secretos"
if (-not (Test-Path $secretos)) { New-Item -ItemType Directory -Path $secretos | Out-Null }

function Invoke-SqlArchivo([string]$archivo) {
  wrangler d1 execute $base @donde --yes --file=$archivo -c $cfg
  if ($LASTEXITCODE -ne 0) { Write-Error "Falló el SQL en $base."; exit 1 }
}
function Invoke-SqlTexto([string]$texto) {
  $tmp = Join-Path $env:TEMP ("doc-" + [guid]::NewGuid().ToString("N") + ".sql")
  [IO.File]::WriteAllText($tmp, $texto, (New-Object Text.UTF8Encoding $false))
  try { Invoke-SqlArchivo $tmp } finally { Remove-Item $tmp -ErrorAction SilentlyContinue }
}
