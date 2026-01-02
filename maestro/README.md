# Maestro E2E (TracknField Mobile)

## Pré-requis

- Une app **installée** sur un émulateur Android ou un device.
- L’**appId** Android (package) : `com.kirikoutrackandfield.tracknfieldmobile`.
- Le CLI Maestro.

> Note Windows: selon ta config, Maestro peut nécessiter WSL2. Si tu as un blocage d’installation, on peut le lancer via WSL2 ou en CI Linux.

## Installation du CLI

- Installer le CLI (global) :
  - `npm i -g @mobile-dev-inc/maestro`

## Lancer les tests

Depuis `tracknfield-mobile`:

- `npm run e2e:maestro`

Ou directement:

- `maestro test maestro/flows`

## E2E connecté au backend (Android émulateur)

### Backend (terminal 1)

Depuis `tracknfield-mobile-back`:

- Copier `.env.e2e.example` -> `.env.e2e`
- `npm run e2e:prepare`
- `npm run e2e:start`

Par défaut, le backend écoute sur `http://localhost:4001`.

### Mobile (terminal 2)

Depuis `tracknfield-mobile`:

- `npm run start:e2e:android`

`EXPO_PUBLIC_API_URL` est forcé à `http://10.0.2.2:4001/api` (Android emulator -> machine hôte).

## E2E connecté au backend (téléphone physique)

### Option A (recommandée Android): `adb reverse` (USB)

Avantages: pas besoin de connaître l’IP, pas de souci de firewall Wi‑Fi.

- Activer le **USB debugging** sur le téléphone
- Brancher en USB
- Vérifier: `adb devices`
- Backend: `npm run e2e:prepare` puis `npm run e2e:start` (dans `tracknfield-mobile-back`)
- Mobile: `npm run start:e2e:phone -- -UseAdbReverse`
  - Si plusieurs devices/émulateurs sont connectés: `npm run start:e2e:phone -- -UseAdbReverse -AdbSerial <DEVICE_ID>`
  - Variante si npm passe `--UseAdbReverse` au lieu de `-UseAdbReverse` : `npm run start:e2e:phone -- --UseAdbReverse`

Dans ce mode, l’app utilise `http://127.0.0.1:4001/api` depuis le téléphone, mappé vers le PC via `adb reverse`.

### Option B: même Wi‑Fi (Android/iOS)

- Backend: `npm run e2e:prepare` puis `npm run e2e:start`
- Trouver l’IP du PC (Windows): `ipconfig` → IPv4 (ex: `192.168.1.50`)
- Mobile: `npm run start:e2e:phone -- -HostIp 192.168.1.50`
  - Variante (IP en argument direct): `npm run start:e2e:phone -- 192.168.1.50`

Important:
- Le téléphone et le PC doivent être sur le **même réseau**.
- Autoriser le port `4001` dans le firewall Windows si nécessaire.

### Maestro

Maestro pilote:
- Android: device via ADB (téléphone ou émulateur)
- iOS: généralement via simulateur (un iPhone physique peut être plus contraignant)

#### Windows

Le binaire `maestro` n’est généralement pas disponible en natif Windows.
Le chemin le plus simple est **WSL2 (Ubuntu)**:

- Installer WSL2 + Ubuntu
- Dans Ubuntu:
  - `curl -Ls "https://get.maestro.mobile.dev" | bash`
  - Ajouter au PATH (si nécessaire): `export PATH="$PATH:$HOME/.maestro/bin"`
- Depuis Ubuntu, aller dans le projet monté (ex: `/mnt/c/Users/idris/Documents/02TracknField/tracknfield-mobile`)
- Lancer: `maestro test maestro/flows`

Note ADB:
- Le téléphone doit être visible via `adb devices`.
- Dans WSL, `adb` (Linux) peut ne pas voir les devices USB. Le plus fiable est d'utiliser `adb.exe` (Android SDK Windows) via un wrapper:
  - `mkdir -p ~/bin`
  - `cat > ~/bin/adb <<'SH'\n#!/usr/bin/env bash\nset -o pipefail\n# adb.exe outputs CRLF (\\r\\n); strip \\r so tools parsing `adb devices` work reliably\n/mnt/c/Users/idris/AppData/Local/Android/sdk/platform-tools/adb.exe "$@" | tr -d '\\r'\nSH`
  - `chmod +x ~/bin/adb`
  - `export PATH="$HOME/bin:$PATH"`
  - `hash -r && adb devices`

### Maestro (terminal 3)

- `npm run e2e:maestro`

Le flow principal connecté backend est:
- `maestro/flows/e2e-login-backend.yaml`

## Flows

Les flows dans `maestro/flows` sont volontairement "offline" (validation UI) pour éviter les flakiness liées au backend.

- `auth-login-validation.yaml`
- `auth-signup-invalid-email.yaml`

## TestIDs

Les éléments clés sont ciblés via les `testID` RN ajoutés dans `src/components/AuthForm.tsx`:

- `auth-email`
- `auth-password`
- `auth-confirm`
- `auth-submit`
