import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sidequestlife:adminPreviewAsUser';

/**
 * When on, the admin account hides its own admin tools so the signed-in
 * admin can see exactly what a regular user sees. Persisted locally only —
 * it is a UI preference, not account data.
 */
export async function getAdminPreviewAsUser(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setAdminPreviewAsUser(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, value ? '1' : '0');
}
