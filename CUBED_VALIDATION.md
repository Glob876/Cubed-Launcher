# Cubed Launcher validation — 2026-11-01

- TypeScript check and production Vite build passed, including the existing frontend gate.
- Rust `cargo check --lib` and Linux debug binary build passed with the `custom-protocol` feature (embedded frontend).
- Native GTK/WebKit window was launched under Xvfb with a separate XDG_DATA_HOME.
- Native Modrinth search returned live public modpacks. Installing Fabulously Optimized
  produced a profile for Minecraft 26.3 / Fabric 0.20.1 and downloaded its mods (about 43 MB
  including the test data). Real user launcher data was not used.
- Browser smoke test with mocked native IPC passed: Microsoft account entry and missing-ID
  error, upstream lobby with character and original play card, original settings and both layout modes, persisted wallpaper/accent selection, local library,
  Modrinth results and settings. It checks that removed navigation items are absent
  and that startup does not request Millida domains, including delayed startup work.
- Telemetry, crash opt-out and modpack-version selection tests passed in separate Bun
  processes, as required by their module mocks.

Microsoft account login and a licensed Minecraft game session have NOT been verified:
Cubed has no registered and authorised Microsoft application ID yet. The upstream
application ID is not reused. Windows/macOS binaries have not been built or run.

The original project still has unused integration code in shared modules; the main
shell and screen registry exclude commercial/social screens, and their entry commands
were removed or disabled. Removed Rust commands currently produce dead-code warnings.
The local WebKit runtime under work/ is a development convenience and is not shipped in Git.

Visual restoration: compared with screenshots/lobby-ru.png; the custom Cubed shell, home component and stylesheet were removed. Existing upstream lobby, character, navigation styles, settings controls and catalog layout are reused without commercial/social widgets.
