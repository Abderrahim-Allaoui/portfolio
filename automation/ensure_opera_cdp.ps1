# ensure_opera_cdp.ps1 — guarantee Opera GX runs with a CDP port (9444)
#
# Opera GX and Edge both grabbed 9333 on this machine, so we use 9444 and
# evict anything already holding it.
#
# Usage: powershell -ExecutionPolicy Bypass -File tools/ensure_opera_cdp.ps1
$ErrorActionPreference = "SilentlyContinue"
$PORT = 9444
$exe = "C:\Users\abder\AppData\Local\Programs\Opera GX\opera.exe"
$prof = "C:\Users\abder\AppData\Roaming\Opera Software\Opera GX Stable"

function Test-Cdp {
    try {
        $v = Invoke-RestMethod "http://127.0.0.1:$PORT/json/version" -TimeoutSec 4
        if ($v.Browser -match "Opera|Chrome") { return $v.Browser }
        return $null
    } catch { return $null }
}

$up = Test-Cdp
if ($up) { Write-Host "CDP already up: $up" -ForegroundColor Green; exit 0 }

# evict whatever holds the port
$holders = Get-NetTCPConnection -State Listen -LocalPort $PORT -ErrorAction SilentlyContinue |
           Select-Object -ExpandProperty OwningProcess -Unique
foreach ($h in $holders) {
    $pr = Get-Process -Id $h -ErrorAction SilentlyContinue
    if ($pr -and $pr.ProcessName -ne "opera") {
        Write-Host "  evicting $($pr.ProcessName) ($h) from port $PORT" -ForegroundColor Yellow
        Stop-Process -Id $h -Force
    }
}

Write-Host "Restarting Opera with --remote-debugging-port=$PORT ..." -ForegroundColor Yellow
Get-Process opera | Stop-Process -Force
Start-Sleep -Seconds 4
Get-Process opera | Stop-Process -Force
Start-Sleep -Seconds 2
Start-Process $exe -ArgumentList "--remote-debugging-port=$PORT","--remote-allow-origins=*","--disable-gpu","--restore-last-session",$prof

for ($i = 0; $i -lt 25; $i++) {
    Start-Sleep -Seconds 2
    $up = Test-Cdp
    if ($up) {
        $t = Invoke-RestMethod "http://127.0.0.1:$PORT/json/list" -TimeoutSec 6
        $fiv = ($t | Where-Object { $_.url -like '*fiverr*' } | Measure-Object).Count
        Write-Host "CDP up: $up | fiverr tabs: $fiv" -ForegroundColor Green
        exit 0
    }
}
Write-Host "FAILED to bring CDP up on $PORT" -ForegroundColor Red
exit 1
