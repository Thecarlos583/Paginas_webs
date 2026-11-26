# Lo comparten instalar.ps1, demo.ps1 y pasar-a-real.ps1: dónde está la configuración del cliente y su base D1.
$modulo = Split-Path -Parent $PSScriptRoot
$cfg = Join-Path $modulo "clientes\$cliente\wrangler.jsonc"
if (-not (Test-Path $cfg)) { $cfg = Join-Path (Split-Path -Parent $modulo) "novedades\clientes\$cliente\wrangler.jsonc" }
if (-not (Test-Path $cfg)) { Write-Error "No encuentro el wrangler.jsonc de $cliente (ni en documentos\clientes ni en novedades\clientes)."; exit 1 }
$base = "documentos-$cliente"
# Pruebas locales: la base va fuera de OneDrive (SQLite falla dentro de una carpeta sincronizada).
# wrangler dev tiene que usar la misma carpeta:  wrangler dev -c <wrangler.jsonc> --persist-to $env:LOCALAPPDATA\wrangler-local\<cliente>
$persistir = Join-Path $env:LOCALAPPDATA "wrangler-local\$cliente"
# (asignado dentro de cada rama: con "$x = if ..." PowerShell convierte la lista de un elemento en texto)
if ($Local) { $donde = @("--local", "--persist-to", $persistir) } else { $donde = @("--remote") }
$secretos = Join-Path $env:USERPROFILE "secretos"
if (-not (Test-Path $secretos)) { New-Item -ItemType Directory -Path $secretos | Out-Null }

# wrangler en Windows a veces se cae al cerrar ("UV_HANDLE_CLOSING"). Todos los SQL del módulo se pueden
# repetir sin daño (empiezan borrando o usan IF NOT EXISTS), así que se reintenta una vez.
function Invoke-SqlArchivo([string]$archivo) {
  for ($i = 1; $i -le 2; $i++) {
    wrangler d1 execute $base @donde --yes --file=$archivo -c $cfg
    if ($LASTEXITCODE -eq 0) { return }
    Write-Host "Reintentando..."
  }
  Write-Error "Falló el SQL en $base."; exit 1
}
# Node escribe el SQL en un archivo temporal (así las tildes no pasan por PowerShell) y se ejecuta.
function Invoke-SqlNode([string[]]$argumentos) {
  $tmp = Join-Path $env:TEMP ("doc-" + [guid]::NewGuid().ToString("N") + ".sql")
  try {
    node (Join-Path $PSScriptRoot "d1.mjs") $argumentos[0] $tmp $argumentos[1..($argumentos.Length - 1)]
    if ($LASTEXITCODE -ne 0) { Write-Error "No se pudo preparar el SQL."; exit 1 }
    Invoke-SqlArchivo $tmp
  } finally { Remove-Item $tmp -ErrorAction SilentlyContinue }
}
