# Run as Administrator: right-click → Run with PowerShell (as admin)
# Allows phone/tablet on the same Wi‑Fi to reach Next.js (3000) and API (5000).
#
# Uses profile=any because many home routers show up as "Public" in Windows,
# which blocks rules that only target the Private profile.

$ErrorActionPreference = "Stop"

function Ensure-Rule {
    param(
        [string]$Name,
        [int]$Port
    )

    $existing = netsh advfirewall firewall show rule name="$Name" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Removing old rule to recreate with profile=any: $Name"
        netsh advfirewall firewall delete rule name="$Name" | Out-Null
    }

    netsh advfirewall firewall add rule `
        name="$Name" `
        dir=in `
        action=allow `
        protocol=TCP `
        localport=$Port `
        profile=any

    Write-Host "Added firewall rule: $Name (port $Port, all profiles)"
}

Ensure-Rule -Name "Quanta Loop Dev Frontend" -Port 3000
Ensure-Rule -Name "Quanta Loop Dev Backend" -Port 5000

$profile = Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" } | Select-Object -First 1
$wifiIp = (
    Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.InterfaceAlias -like "*Wi-Fi*" -and
        $_.IPAddress -notlike "169.254.*"
    } |
    Select-Object -ExpandProperty IPAddress -First 1
)

Write-Host ""
if ($profile) {
    Write-Host "Wi-Fi network category: $($profile.NetworkCategory)"
    if ($profile.NetworkCategory -eq "Public") {
        Write-Host "(Public is OK now — rules apply to all profiles.)"
    }
}
Write-Host ""
Write-Host "On your phone (same Wi-Fi, mobile data OFF), open EXACTLY:"
if ($wifiIp) {
    Write-Host "  http://${wifiIp}:3000"
} else {
    Write-Host "  http://<your-pc-wifi-ip>:3000"
}
Write-Host ""
Write-Host "Tips:"
Write-Host "  - Type http:// at the start (not https)"
Write-Host "  - Tap Go — do not pick a search suggestion"
Write-Host "  - First load can take 15-30 seconds"
