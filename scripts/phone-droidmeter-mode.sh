#!/data/data/com.termux/files/usr/bin/bash
set -u

# Enables DroidMeter behavior on the Redmi and reinstalls the Termux:Boot hook.
# Run on the phone through Termux, or from the PC with scripts/redmi-mode.sh droidmeter.

BOOT_DIR="$HOME/.termux/boot"
BOOT_SCRIPT="$BOOT_DIR/start-hub.sh"
SOURCE_BOOT_SCRIPT="$HOME/start-hub.sh"
DISABLED_DIR="$HOME/.droidmeter-disabled"
DISABLED_BOOT_SCRIPT="$DISABLED_DIR/start-hub.sh"
LEGACY_DISABLED_BOOT_SCRIPT="$BOOT_DIR/start-hub.sh.disabled"
AUTO_KIOSK_FLAG="$HOME/.droidmeter-auto-kiosk"

run_root() {
  su -c "$1" 2>/dev/null || true
}

install_boot_script() {
  mkdir -p "$BOOT_DIR"

  if [ -f "$SOURCE_BOOT_SCRIPT" ]; then
    cp -f "$SOURCE_BOOT_SCRIPT" "$BOOT_SCRIPT"
  elif [ -f "$DISABLED_BOOT_SCRIPT" ]; then
    mv -f "$DISABLED_BOOT_SCRIPT" "$BOOT_SCRIPT"
  elif [ -f "$LEGACY_DISABLED_BOOT_SCRIPT" ]; then
    mv -f "$LEGACY_DISABLED_BOOT_SCRIPT" "$BOOT_SCRIPT"
  else
    cat > "$BOOT_SCRIPT" <<'BOOT'
#!/data/data/com.termux/files/usr/bin/bash
su -c 'settings put global policy_control immersive.full=*' 2>/dev/null
su -c 'settings put secure back_gesture_inset_scale_left 0' 2>/dev/null
su -c 'settings put secure back_gesture_inset_scale_right 0' 2>/dev/null
su -c 'settings put secure double_tap_to_wake 1' 2>/dev/null
su -c 'settings put secure wake_gesture_enabled 1' 2>/dev/null
su -c 'settings put secure doze_pulse_on_double_tap 1' 2>/dev/null
su -c 'settings put secure doze_tap_gesture 1' 2>/dev/null
su -c 'settings put secure doze_enabled 1' 2>/dev/null
su -c 'settings put system accelerometer_rotation 0' 2>/dev/null
su -c 'settings put system user_rotation 1' 2>/dev/null
start_once() {
  NAME="$1"
  SCRIPT="$HOME/$NAME"
  LOCK_DIR="$HOME/.${NAME%.sh}.lock"

  case "$NAME" in
    hub-health.sh) PATTERN="^bash .*/hub-health\.sh$" ;;
    screen-watch.sh) PATTERN="^bash .*/screen-watch\.sh$" ;;
    *) return ;;
  esac

  if pgrep -f "$PATTERN" >/dev/null 2>&1; then
    return
  fi

  if [ -d "$LOCK_DIR" ]; then
    rmdir "$LOCK_DIR" 2>/dev/null || true
  fi

  nohup bash "$SCRIPT" >/dev/null 2>&1 &
}

sshd 2>/dev/null || true
start_once hub-health.sh
start_once screen-watch.sh
BOOT
  fi

  chmod +x "$BOOT_SCRIPT"
}

apply_droidmeter_settings() {
  run_root 'settings put global policy_control immersive.full=*'
  run_root 'settings put secure back_gesture_inset_scale_left 0'
  run_root 'settings put secure back_gesture_inset_scale_right 0'
  run_root 'settings put system accelerometer_rotation 0'
  run_root 'settings put system user_rotation 1'
  run_root 'settings put system screen_brightness_mode 0'
  run_root 'settings put system screen_brightness 32'
  run_root 'echo 0 > /sys/class/power_supply/battery/input_suspend'
  run_root 'echo 1 > /sys/class/power_supply/battery/charging_enabled'
}

start_services() {
  touch "$AUTO_KIOSK_FLAG"
  sshd 2>/dev/null || true

  start_once() {
    NAME="$1"
    SCRIPT="$HOME/$NAME"
    LOCK_DIR="$HOME/.${NAME%.sh}.lock"

    case "$NAME" in
      hub-health.sh) PATTERN="^bash .*/hub-health\.sh$" ;;
      screen-watch.sh) PATTERN="^bash .*/screen-watch\.sh$" ;;
      *) return ;;
    esac

    if pgrep -f "$PATTERN" >/dev/null 2>&1; then
      return
    fi

    if [ -d "$LOCK_DIR" ]; then
      rmdir "$LOCK_DIR" 2>/dev/null || true
    fi

    nohup bash "$SCRIPT" >/dev/null 2>&1 &
  }

  start_once hub-health.sh
  start_once screen-watch.sh

  if [ -f "$HOME/.hub-health.conf" ]; then
    # shellcheck disable=SC1091
    . "$HOME/.hub-health.conf"
  fi

  run_root 'wm dismiss-keyguard'
  run_root "am start -a android.intent.action.VIEW -d \"http://${PC_IP:-127.0.0.1}:3000\" -p de.ozerov.fully"
}

install_boot_script
apply_droidmeter_settings
start_services

printf '%s\n' 'DroidMeter enabled. Termux:Boot will restore this mode on next boot.'
