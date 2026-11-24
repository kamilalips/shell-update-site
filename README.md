# Keycard Shell Owner's Hub Website

Update and verify a Keycard Shell at [shell.keycard.tech](https://shell.keycard.tech).

## Update

Connect the Shell over USB and open [shell.keycard.tech/update/](https://shell.keycard.tech/update/) in a
browser that supports WebHID - Chrome, Edge or Opera. The page reports the versions the device is running and
lets you choose between the firmware and the token database. Firmware comes as a multicoin and a bitcoin-only
build.

The [air-gapped update](https://shell.keycard.tech/update/air-gapped) offers the same files with the
checksum of each, for updating in air-gapped mode, together with the newest release of the
[stand-alone updater app](https://github.com/keycard-tech/kshell-updater) built for the operating system you
pick. Earlier releases are listed under
[release notes](https://shell.keycard.tech/firmware/release-notes) and
[database version history](https://shell.keycard.tech/update/db-version-history).

## Verify

[Device verification](https://shell.keycard.tech/verify/) is the same process as before: the Shell scans a QR
on the screen, the page opens the camera and scans the QR the Shell answers with. The check itself has
changed. The page fetches the signed list of produced devices and authenticates it against a pinned provisioning key, then checks the signature your Shell made over a challenge.

The three answers are separate: the key is on the produced units list, the response is correctly signed but no
entry matches it, and the response could not be checked at all.

[Air-gapped verification](https://shell.keycard.tech/verify/air-gapped) hands the same
check to the stand-alone app on a machine that never connects: this page gives out the app and the newest
produced units list.

## Analytics and consent

Every page carries the Google tag `G-YLHJYKZLH6` in its `<head>` (`templates/base.html`). Consent Mode starts with
`ad_storage`, `ad_user_data`, `ad_personalization` and `analytics_storage` all denied.

The cookie banner is the Shopify privacy banner that docs.keycard.tech and the store use (`src/js/consent.ts`, configured with
`storefrontRootDomain: "keycard.tech"`), so a visitor answers once for every keycard.tech site: Shopify keeps the choice in the
`_tracking_consent` cookie on keycard.tech. The banner does not talk to Google, so `templates/base.html` listens for its
`visitorConsentCollected` and `consentTrackingApiLoaded` events and sends `gtag('consent', 'update', …)`. Cookie settings in the
footer reopens the banner. docs.keycard.tech does the same, in `src/app/layout.tsx` of keycard-tech/keycard-website.
