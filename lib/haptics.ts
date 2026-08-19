import { Platform, Vibration } from 'react-native';

/** Native haptic package would need a rebuild; Vibration works in the current dev client. */
export function hapticSelect(): void {
  Vibration.vibrate(Platform.OS === 'android' ? 12 : 10);
}

export function hapticSuccess(): void {
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 18, 40, 18]);
    return;
  }
  Vibration.vibrate(20);
}

export function hapticWarning(): void {
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 24, 50, 24]);
    return;
  }
  Vibration.vibrate(30);
}
