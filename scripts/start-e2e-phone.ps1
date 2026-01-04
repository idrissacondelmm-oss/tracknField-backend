param(
  [Parameter(Mandatory = $false)]
  [string]$HostIp = "",

  [Parameter(Mandatory = $false)]
  [int]$Port = 5000,

  [Parameter(Mandatory = $false)]
  [switch]$UseAdbReverse,

  # When multiple devices/emulators are connected, specify which one to target.
  # Example: -AdbSerial RFCR10XCQCR
  [Parameter(Mandatory = $false)]
  [string]$AdbSerial = "",

  # Allows passing extra/positional args (e.g. `npm run start:e2e:phone -- 192.168.1.50`)
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArgs
)

$ErrorActionPreference = "Stop"

# Fallback: if npm/PowerShell forwarded the switch as a raw arg (e.g. --UseAdbReverse), honor it.
if (-not $UseAdbReverse -and $RemainingArgs) {
  foreach ($arg in $RemainingArgs) {
    if ($arg -eq '-UseAdbReverse' -or $arg -eq '--UseAdbReverse') {
      $UseAdbReverse = $true
    }
  }
}

function Get-ConnectedAdbDevices {
  $lines = & adb devices 2>$null
  if (-not $lines) { return @() }

  $devices = @()
  foreach ($line in $lines) {
    # Expected format: SERIAL<TAB>device
    if ($line -match '^(?<serial>\S+)\s+device\s*$') {
      $serial = $Matches['serial']
      if ($serial -and $serial -ne 'List') {
        $devices += $serial
      }
    }
  }

  return $devices
}

# If using adb reverse, the phone can reach the host backend via 127.0.0.1 on-device.
if ($UseAdbReverse) {
  $targetSerial = $AdbSerial
  if ([string]::IsNullOrWhiteSpace($targetSerial) -and -not [string]::IsNullOrWhiteSpace($env:ANDROID_SERIAL)) {
    $targetSerial = $env:ANDROID_SERIAL
  }

  if ([string]::IsNullOrWhiteSpace($targetSerial)) {
    $connected = Get-ConnectedAdbDevices
    if ($connected.Count -eq 1) {
      $targetSerial = $connected[0]
    } elseif ($connected.Count -gt 1) {
      Write-Host "More than one Android device/emulator detected." -ForegroundColor Red
      Write-Host "Please specify which one to use:" -ForegroundColor Yellow
      foreach ($d in $connected) { Write-Host "  - $d" -ForegroundColor Yellow }
      Write-Host "Example: .\\scripts\\start-e2e-phone.ps1 -UseAdbReverse -AdbSerial $($connected[0])" -ForegroundColor Yellow
      exit 1
    } else {
      Write-Host "No Android devices detected by adb." -ForegroundColor Red
      Write-Host "Check USB debugging and run: adb devices" -ForegroundColor Yellow
      exit 1
    }
  }

  Write-Host "Configuring adb reverse tcp:$Port -> tcp:$Port for device $targetSerial" -ForegroundColor Cyan
  & adb -s $targetSerial reverse tcp:$Port tcp:$Port | Out-Null
  $apiUrl = "http://127.0.0.1:$Port/api"
} else {
  if ([string]::IsNullOrWhiteSpace($HostIp) -and $RemainingArgs -and $RemainingArgs.Count -gt 0) {
    # If the user passed a single positional IP, accept it.
    $candidate = ($RemainingArgs[0] -replace '^[\-]+', '')
    $isIp = $candidate -match '^\d{1,3}(?:\.\d{1,3}){3}$'
    if ($isIp) {
      $octetsOk = $true
      foreach ($octet in $candidate.Split('.')) {
        if ([int]$octet -lt 0 -or [int]$octet -gt 255) { $octetsOk = $false; break }
      }
      if ($octetsOk) {
        $HostIp = $candidate
      }
    }
  }

  if ([string]::IsNullOrWhiteSpace($HostIp)) {
    Write-Host "HostIp is required unless -UseAdbReverse is set." -ForegroundColor Red
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  - npm run start:e2e:phone -- -UseAdbReverse" -ForegroundColor Yellow
    Write-Host "  - npm run start:e2e:phone -- -UseAdbReverse -AdbSerial RFCR10XCQCR" -ForegroundColor Yellow
    Write-Host "  - npm run start:e2e:phone -- -HostIp 192.168.1.50" -ForegroundColor Yellow
    Write-Host "  - npm run start:e2e:phone -- 192.168.1.50" -ForegroundColor Yellow
    Write-Host "  - .\\scripts\\start-e2e-phone.ps1 -HostIp 192.168.1.50" -ForegroundColor Yellow
    exit 1
  }
  $apiUrl = "http://${HostIp}:$Port/api"
}

Write-Host "Using EXPO_PUBLIC_API_URL=$apiUrl" -ForegroundColor Green

$env:EXPO_PUBLIC_API_URL = $apiUrl
$env:EXPO_PUBLIC_USE_PROFILE_MOCK = "false"

# Dev client is recommended for E2E.
# If you use Expo Go, ensure your app supports it (dev-client features may differ).

npx expo start --dev-client
