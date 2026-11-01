#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
# Optional local runtime prepared on this machine when system WebKit is absent.
if [[ -d work/sysroot/usr/lib ]]; then
  export LD_LIBRARY_PATH="$PWD/work/sysroot/usr/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi
for binary in src-tauri/target/release/cubed-launcher src-tauri/target/debug/cubed-launcher; do
  if [[ -x "$binary" ]]; then exec "$binary" "$@"; fi
done
printf '%s\n' 'Сначала собери Cubed Launcher: см. README.ru.md.' >&2
exit 1
