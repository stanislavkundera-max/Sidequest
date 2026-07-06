import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Platform, Pressable, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { stepInteractionStyles as styles } from '@/components/quest-run/stepInteractionStyles';
import { logError } from '@/src/lib/monitoring/errorLogger';
import type { UserQuestStepEvidence } from '@/src/types/quest';

type Props = {
  prompt?: string;
  busy: boolean;
  onComplete: (evidence: UserQuestStepEvidence) => void;
};

/** Photo-proof step: capture (or pick) an image before the step can finish. */
export function PhotoStepAction({ prompt, busy, onComplete }: Props) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraAvailable = Platform.OS !== 'web';

  async function takePhoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission', 'Camera access is needed to capture this step.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
    } catch (e: unknown) {
      logError('questRun.photoStep.camera', e);
      Alert.alert('Camera', e instanceof Error ? e.message : 'Could not open the camera.');
    }
  }

  async function pickPhoto() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission', 'Photo access is needed to attach an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
    } catch (e: unknown) {
      logError('questRun.photoStep.pick', e);
      Alert.alert('Gallery', e instanceof Error ? e.message : 'Could not open the gallery.');
    }
  }

  return (
    <View style={styles.block}>
      {prompt ? <Text style={styles.prompt}>{prompt}</Text> : null}
      {photoUri ? (
        <>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
          <View style={styles.photoActionsRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPhotoUri(null)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
              <Text style={styles.secondaryBtnText}>Retake</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.photoActionsRow}>
          {cameraAvailable ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void takePhoto()}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
              <Text style={styles.secondaryBtnText}>Take photo</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => void pickPhoto()}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
            <Text style={styles.secondaryBtnText}>Choose photo</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.helper}>
        {photoUri
          ? 'This photo will also seed your memory of the quest.'
          : 'Snap what you made, found, or saw — it becomes part of the memory.'}
      </Text>
      <PrimaryButton
        label="Finish this step"
        disabled={!photoUri}
        loading={busy}
        onPress={() => photoUri && onComplete({ kind: 'photo', photoUri })}
      />
    </View>
  );
}
