import { Alert } from 'react-native';

const REBUILD_HINT =
  'Fotoğraf eklemek için dev client yeniden derlenmeli. Terminalde: npx expo run:android';

export async function pickNoteImage(): Promise<string | null> {
  try {
    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin gerekli', 'Fotoğraf eklemek için galeri iznini aç.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      return result.assets[0].uri;
    }
    return null;
  } catch {
    Alert.alert('Fotoğraf modülü yok', REBUILD_HINT);
    return null;
  }
}
