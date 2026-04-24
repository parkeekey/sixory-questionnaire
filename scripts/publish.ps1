param(
  [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
  [string[]]$MessageParts,
  [switch]$BuildBeforePush
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$configPath = Join-Path $repoRoot "publish.config.json"
if (-not (Test-Path $configPath)) {
  throw "Missing publish config file at $configPath"
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
$remote = if ($config.remote) { [string]$config.remote } else { "origin" }
$branch = if ($config.branch) { [string]$config.branch } else { "main" }
$defaultCommitMessage = if ($config.defaultCommitMessage) { [string]$config.defaultCommitMessage } else { "chore: sync updates" }
$pullBeforePush = if ($null -ne $config.pullBeforePush) { [bool]$config.pullBeforePush } else { $true }

$doBuild = $false
if ($BuildBeforePush) {
  $doBuild = $true
} elseif ($null -ne $config.buildBeforePush) {
  $doBuild = [bool]$config.buildBeforePush
}

if ($doBuild) {
  Write-Host "Running build before publish..."
  npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "Build failed; publish aborted."
  }
}

$commitMessage = if ($MessageParts -and $MessageParts.Count -gt 0) {
  (($MessageParts -join " ").Trim())
} else {
  $defaultCommitMessage
}

$status = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($status)) {
  Write-Host "Staging changes..."
  git add -A

  Write-Host "Creating commit..."
  git commit -m "$commitMessage"
  if ($LASTEXITCODE -ne 0) {
    throw "Commit failed; publish aborted."
  }
} else {
  Write-Host "No working tree changes to commit."
}

if ($pullBeforePush) {
  Write-Host "Pulling latest changes with rebase from $remote/$branch..."
  git pull --rebase $remote $branch
  if ($LASTEXITCODE -ne 0) {
    throw "Pull --rebase failed. Resolve conflicts and retry publish."
  }
}

Write-Host "Pushing to $remote/$branch..."
git push $remote $branch
if ($LASTEXITCODE -ne 0) {
  throw "Push failed."
}

Write-Host "Publish completed successfully."
