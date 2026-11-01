# Cubed Launcher privacy changes

Modified on 2026-11-01. Cubed Launcher is a fork of Millida Launcher under GPL-3.0-only.

The telemetry implementation has been removed: no event queue, installation UUID,
usage events, hardware inventory or launcher heartbeat is collected by that module.
The remaining exported functions are compatibility adapters that discard events.
Error reporting and compatibility reports that use telemetryEnabled() are permanently disabled.
The native uninstaller report does not send anything. Native game telemetry is always
off and automatic installation of the Millida companion mod is disabled.
The partner-server watcher is disabled and does not insert advertisements into servers.dat.
Previously added servers are not deleted from existing Minecraft installations.

This is not yet a claim that every Millida integration has been removed. Account,
social, catalog proxy and updater integration code still needs a separate audit.
