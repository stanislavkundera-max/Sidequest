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

/**
 * Photo step: the photo is the promoted path, never a gate.
 *
 * It used to be required — "Finish this step" stayed disabled until a photo
 * existed, which stranded anyone without a camera moment mid-quest. The app
 * pushes people to do things; it doesn't block them (round 2, R2-03). The
 * reason to take one lives in the button itself rather than in a paragraph
 * under it, as Standa asked: "hint ideálně v CTA".
 */
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

  if (photoUri) {
    return (
      <View style={styles.block}>
        {prompt ? <Text style={styles.prompt}>{prompt}</Text> : null}
        <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
        <View style={styles.photoActionsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPhotoUri(null)}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
            <Text style={styles.secondaryBtnText}>Retake</Text>
          </Pressable>
        </View>
        <Text style={styles.helper}>This photo goes into your memory of the quest.</Text>
        <PrimaryButton
          label="Finish this step"
          loading={busy}
          onPress={() => onComplete({ kind: 'photo', photoUri })}
        />
      </View>
    );
  }

  return (
    <View style={styles.block}>
      {prompt ? <Text style={styles.prompt}>{prompt}</Text> : null}
      <PrimaryButton
        label={cameraAvailable ? 'Take a photo for the memory' : 'Add a photo for the memory'}
        loading={busy}
        onPress={() => void (cameraAvailable ? takePhoto() : pickPhoto())}
      />
      {cameraAvailable ? (
        <View style={styles.photoActionsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void pickPhoto()}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
            <Text style={styles.secondaryBtnText}>Choose from gallery</Text>
          </Pressable>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Finish this step without a photo"
        disabled={busy}
        onPress={() => onComplete({ kind: 'self_attest' })}
        style={({ pressed }) => [
          styles.quietLink,
          busy && styles.disabled,
          pressed && !busy && styles.pressed,
        ]}>
        <Text style={styles.quietLinkText}>Finish without a photo</Text>
      </Pressable>
    </View>
  );
}
