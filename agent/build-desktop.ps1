$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$codexNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (Test-Path $codexNode) {
  $nodePath = $codexNode
} elseif ($nodeCommand -and $nodeCommand.Source -notmatch "\\.bun\\") {
  $nodePath = $nodeCommand.Source
} else {
  throw "Node.js was not found. Install Node.js or run this from Codex with the bundled runtime available."
}

Push-Location $repoRoot
try {
  & $nodePath "agent\build-desktop-config.js"
  & $nodePath ".\node_modules\electron-builder\out\cli\cli.js" --win portable
} finally {
  Pop-Location
}
