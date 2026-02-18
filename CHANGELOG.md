# Changelog

All notable changes to SpoolmanSync will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-02-17

### Added
- **"Remaining" weight badge** on dashboard tray slots showing filament remaining
- **Multi-color filament display** across all spool color swatches (dashboard, tray dialog, scan pages)
- **Expand/collapse toggle** for spool list in the QR label generator

### Fixed
- Remove printer button no longer deletes the printer from ha-bambulab — now only removes it from SpoolmanSync with the ability to re-add (#25)
- "Go to Settings" button on automations page navigated to a 404 in add-on mode (ingress path issue)
- Dashboard, automations discovery, and auto-configure now correctly filter out printers removed from SpoolmanSync
- HA restart after automation configuration in add-on mode now prompts user instead of restarting without warning
- Responsive UI improvements for logs filter buttons, tray "Remaining" badge, and label sheet print settings on small screens

## [1.2.0] - 2026-02-17

### Added
- **Multi-printer automation support** — Configure Automations now generates per-printer automations, helpers, and template sensors for all discovered printers instead of only the first (#20)
- **Spool sorting** — Sort by ID, Name, Material, or Vendor in the QR label generator, NFC writer, and tray assignment dialog
- **QR label sheet persistence** — Label sheet settings and printed-spool tracking are saved to localStorage across sessions
- **AMS Pro type-first entity naming** — Support for Danish and other locales where ha-bambulab produces entity IDs like `ams_pro_2_bakke_1` (#18)

### Fixed
- `utility_meter.calibrate` unknown action error — `cycle: none` is not a valid HA utility_meter value; omit the key entirely for no-cycle behavior (#19, #21)
- Responsive UI issues on logs page and tray assignment dialog on mobile

### Changed
- Helper entity names now include the printer prefix (e.g., `input_number.spoolmansync_{prefix}_last_tray`). **Existing users must click "Reconfigure Automations" once** after updating. Old singleton entities will become orphaned and can be manually deleted from the HA entity registry.

## [1.1.2] - 2026-02-16

### Added
- **Multi-spool label sheet printing** — Select multiple spools and print QR labels on standard label sheets (e.g., Avery 8160). Configurable paper size, grid layout, margins, spacing, borders, and label content

### Fixed
- Incorrect filament usage for long prints crossing Monday midnight — utility meter was configured with `cycle: weekly`, causing HA to reset accumulated weight automatically (#19)
- False RFID mismatch warnings on non-Bambu (third-party) spools without RFID tags (#15)

## [1.1.1] - 2026-02-14

### Added
- Configurable direct access port for the HA add-on — change in the add-on Configuration tab to avoid port 3000 conflicts with other add-ons (#14)

### Fixed
- QR code and NFC tag URLs now use the configured port instead of hardcoded 3000
- Removed confusing duplicate Network port section from add-on Configuration UI

## [1.1.0] - 2026-02-13

### Added
- **Home Assistant add-on** - Install directly from the HA add-on store with ingress sidebar integration; auto-discovers printers from ha-bambulab
- **QR code label generation** - Create and print QR code labels for spools; scan with phone camera to assign to AMS trays
- **NFC tag writing** - Write spool URLs to NFC sticker tags for tap-to-assign on Android devices
- **Dynamic spool assignment page** - QR scans and NFC taps redirect to a dedicated assignment page with tray selection
- **AMS 2 Pro and AMS HT support** - Entity pattern matching for newer AMS hardware variants
- **Auto-recovery for broken HA connections** - Embedded mode silently re-authenticates when tokens are invalidated; shows reconnect form if password was changed (#10)
- **Unraid Community Apps template** - XML template and icon for Unraid CA store

### Fixed
- External spool active tray detection for printers without AMS (#11)
- Crash when assigned spool has missing filament color or material data (#12)
- AMS discovery for entities with renamed or missing printer prefix

## [1.0.0] - 2026-02-09

### Added
- **Dashboard** - View all printers, AMS units, and tray assignments at a glance
- **Spool assignment** - Click any tray to assign a spool from Spoolman inventory
- **QR/barcode scanning** - Scan Spoolman QR codes to quickly look up and assign spools
- **Automatic filament usage tracking** - Deduct used filament weight after prints
- **Multi-AMS support** - Track multiple AMS units per printer
- **A1 AMS Lite support** - Works with Bambu A1/A1 Mini
- **External spool support** - Track filament loaded outside the AMS
- **Bundled Home Assistant** - Embedded mode includes pre-configured HA with HACS and ha-bambulab
- **Bambu Cloud login** - Add printers using Bambu Cloud credentials
- **17 language support** - Works with all ha-bambulab localizations
- **Multi-architecture Docker builds** - Supports amd64 and arm64
