# Publica la web de un cliente con su módulo de Novedades en Cloudflare.
# Uso:  .\publicar.ps1 youtravel
# Antes: regenerar la web si cambió (python ...\agencias\agencia.py youtravel) y hacer git push como siempre.
param([Parameter(Mandatory = $true)][string]$cliente)
$aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$cfg = Join-Path $aqui "clientes\$cliente\wrangler.jsonc"
if (-not (Test-Path $cfg)) { Write-Error "No existe $cfg"; exit 1 }
wrangler deploy -c $cfg
