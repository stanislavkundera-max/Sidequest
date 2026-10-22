import { StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';

export type CategoryKey = 'nature' | 'adventure' | 'social' | 'relax';

const NAMES: Record<CategoryKey, string> = {
  nature: 'Nature',
  adventure: 'Adventure',
  social: 'Social',
  relax: 'Relax',
};

/** 'cat-nature' → 'nature'; null for an id outside the four. */
export function categoryKeyForId(categoryId: string): CategoryKey | null {
  const key = categoryId.replace(/^cat-/, '');
  return key in NAMES ? (key as CategoryKey) : null;
}

type Props = {
  category: CategoryKey;
  /** `md` for a screen header, `sm` inside cards and lists. */
  size?: 'sm' | 'md';
};

/**
 * A category label: the category's own colour as a fill, white text, a cream rim —
 * the same colours as the map markers (Standa, 2026-10-22). Never the category
 * colour as text: on the dark ground those fail contrast. White clears AA on every
 * fill (Theme.ts).
 */
export function CategoryTag({ category, size = 'sm' }: Props) {
  return (
    <View
      style={[styles.tag, size === 'md' && styles.tagMd, { backgroundColor: Theme[category] }]}
      accessibilityLabel={`Category: ${NAMES[category]}`}>
      <Text style={[styles.text, size === 'md' && styles.textMd]}>{NAMES[category]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    height: 21,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(246, 234, 214, 0.55)',
    justifyContent: 'center',
  },
  tagMd: { height: 24, paddingHorizontal: 11 },
  text: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  textMd: { fontSize: 13 },
});
