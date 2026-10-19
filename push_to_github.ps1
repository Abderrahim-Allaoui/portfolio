# ============================================================================
#  push_to_github.ps1  —  1-click publish l portfolio dyalek l GitHub
#
#  Usage:   cd C:\Users\abder\freelance-pack\portfolio-demos
#           .\push_to_github.ps1 -GithubUser allaouiabder
#
#  9bal had script: 1) sjjel f GitHub (github.com)  2) create empty repo
#     "portfolio" (bla README, bla .gitignore, bla license)
# ============================================================================

param(
    [Parameter(Mandatory = $false)]
    [string]$GithubUser = "Abderrahim-Allaoui",

    [Parameter(Mandatory = $false)]
    [string]$RepoName = "portfolio",

    [Parameter(Mandatory = $false)]
    [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\abder\freelance-pack\portfolio-demos"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  PUBLISH PORTFOLIO -> GITHUB" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $repoPath)) {
    Write-Host "Mochkil: l-path ma mawjoudch -> $repoPath" -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------- 1. checks
Write-Host "[1/4] Verification..." -ForegroundColor Yellow
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  git mawjoudch. Teleport: https://git-scm.com/downloads" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "  gh CLI mawjoudch (m3lli kayn — gheleh l-account)" -ForegroundColor DarkGray
}
Set-Location $repoPath
$branch = git branch --show-current
$commitCount = (git rev-list --count HEAD)
Write-Host "  git OK | branch: $branch | commits: $commitCount"

# ---------------------------------------------------------------- 2. remote
$remoteName = "origin"
$remoteUrl = "https://github.com/$GithubUser/$RepoName.git"

$existing = git remote 2>$null
if ($existing -contains $remoteName) {
    Write-Host "  remote '$remoteName' kayn déjà: $(git remote get-url $remoteName)"
} else {
    git remote add $remoteName $remoteUrl
    Write-Host "  remote '$remoteName' tzid: $remoteUrl" -ForegroundColor Green
}

# ---------------------------------------------------------------- 3. commit
Write-Host ""
Write-Host "[2/4] Commit..." -ForegroundColor Yellow
git add -A
if ((git status --porcelain).Length -eq 0) {
    Write-Host "  kolchi déjà commit — 7oт westa"
} else {
    git -c user.name="Abderrahim Allaoui" -c user.email="$GithubUser@users.noreply.github.com" `
        commit -m "Update portfolio: $(git status --porcelain | Measure-Object | Select-Object -ExpandProperty Count) file(s) changed"
    Write-Host "  commit 3awd" -ForegroundColor Green
}

# ---------------------------------------------------------------- 4. push
Write-Host ""
Write-Host "[3/4] Push l GitHub..." -ForegroundColor Yellow
Write-Host "  ghadi yse2l lik 3la l-username w l-password f l-browser."
Write-Host "  Username: $GithubUser"
Write-Host "  Password: **PERSONAL ACCESS TOKEN** (mch l-password!)"
Write-Host "  - https://github.com/settings/tokens -> Generate new token (classic)"
Write-Host "  - Scope: 'repo' + 'public_repo'  -> Generate -> copy token"
Write-Host ""
Write-Host "  (ila bghiti 7id l-hader, ctrl+C w 9bel push)"
Write-Host ""

git push -u $remoteName $branch
$pushOk = ($LASTEXITCODE -eq 0)

# ---------------------------------------------------------------- 5. verify
if ($pushOk -and -not $SkipVerify) {
    Write-Host ""
    Write-Host "[4/4] Verification..." -ForegroundColor Yellow
    $url = "https://github.com/$GithubUser/$RepoName"
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
        if ($r.StatusCode -eq 200) {
            Write-Host "  ONLINE: $url" -ForegroundColor Green
        } else {
            Write-Host "  HTTP $($r.StatusCode) — houwa public?" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  Ma t9derch nverifi — houwa repo public?" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
if ($pushOk) {
    Write-Host "  DONE — portfolio dyalek online:" -ForegroundColor Green
    Write-Host "  https://github.com/$GithubUser/$RepoName" -ForegroundColor Green
    Write-Host ""
    Write-Host "  DABA f Fiverr:" -ForegroundColor Cyan
    Write-Host "  1. Link Account -> GitHub -> connect"
    Write-Host "  2. Portfolio/website field -> had l-lien"
    Write-Host "  3. F Upwork profile -> Contact info -> add GitHub"
} else {
    Write-Host "  Push ma t7ellch. 3ndek 2 options:" -ForegroundColor Yellow
    Write-Host "  A) Ctrl+C w re-run, 9bel push 7awed 3la lien" 
    Write-Host "  B) Khdem b SSH: ssh-keygen -t ed25519 -C `"$GithubUser@github.com`""
}
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
