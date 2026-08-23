import { Alert } from 'react-native';

export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>
): void {
  Alert.alert(title, message, [
    { text: 'Vazgeç', style: 'cancel' },
    {
      text: 'Sil',
      style: 'destructive',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmLabel = 'Devam'
): void {
  Alert.alert(title, message, [
    { text: 'Vazgeç', style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
