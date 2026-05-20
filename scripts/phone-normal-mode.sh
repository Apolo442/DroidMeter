#!/data/data/com.termux/files/usr/bin/bash
set -u

# Restores the Redmi to regular phone behavior and disables DroidMeter boot hooks.
# Run on the phone through Termux, or from the PC with scripts/redmi-mode.sh normal.

BOOT_DIR="$HOME/.termux/boot"
BOOT_SCRIPT="$BOOT_DIR/start-hub.sh"
LEGACY_DISABLED_BOOT_SCRIPT="$BOOT_DIR/start-hub.sh.disabled"
DISABLED_DIR="$HOME/.droidmeter-disabled"
DISABLED_BOOT_SCRIPT="$DISABLED_DIR/start-hub.sh"
AUTO_KIOSK_FLAG="$HOME/.droidmeter-auto-kiosk"

run_root() {
  su -c "$1" 2>/dev/null || true
}

disable_boot() {
  mkdir -p "$BOOT_DIR" "$DISABLED_DIR"
  if [ -f "$BOOT_SCRIPT" ]; then
    mv -f "$BOOT_SCRIPT" "$DISABLED_BOOT_SCRIPT"
  fi
  if [ -f "$LEGACY_DISABLED_BOOT_SCRIPT" ]; then
    mv -f "$LEGACY_DISABLED_BOOT_SCRIPT" "$DISABLED_BOOT_SCRIPT"
  fi
  rm -f "$AUTO_KIOSK_FLAG"
}

stop_processes() {
  for pid in $(pgrep -f '[h]ub-health.sh' 2>/dev/null); do
    kill "$pid" 2>/dev/null || true
  done

  for pid in $(pgrep -f '[s]creen-watch.sh' 2>/dev/null); do
    kill "$pid" 2>/dev/null || true
  done

  rm -f "$HOME/.hub-health.lock/pid" "$HOME/.screen-watch.lock/pid" 2>/dev/null || true
  rmdir "$HOME/.hub-health.lock" 2>/dev/null || true
  rmdir "$HOME/.screen-watch.lock" 2>/dev/null || true
}

restore_android_defaults() {
  # UI/navigation: return status/nav bars, gestures and rotation to normal Android behavior.
  run_root 'settings delete global policy_control'
  run_root 'settings put global policy_control null'
  run_root 'settings delete secure back_gesture_inset_scale_left'
  run_root 'settings delete secure back_gesture_inset_scale_right'
  run_root 'settings put system accelerometer_rotation 1'
  run_root 'settings put system user_rotation 0'

  # Charging: make sure the phone can charge normally without DroidMeter automation.
  run_root 'echo 0 > /sys/class/power_supply/battery/input_suspend'
  run_root 'echo 1 > /sys/class/power_supply/battery/charging_enabled'
  run_root 'echo 1 > /sys/class/power_supply/usb/apsd_rerun'
  run_root 'echo 1 > /sys/class/power_supply/battery/rerun_aicl'

  # Brightness: leave the phone usable for a regular user.
  run_root 'settings put system screen_brightness_mode 1'
  run_root 'settings put system screen_brightness 128'

  # Leave kiosk/fullscreen and return to launcher.
  run_root 'am force-stop de.ozerov.fully'
  run_root 'input keyevent KEYCODE_HOME'
}

disable_boot
stop_processes
restore_android_defaults

printf '%s\n' 'DroidMeter disabled. Reboot the phone to verify it starts as a normal phone.'
