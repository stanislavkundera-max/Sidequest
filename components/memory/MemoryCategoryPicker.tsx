import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { categoryIoniconNameForCategoryId } from '@/lib/categoryIcons';
import { useQuestDomainStore } from '@/src/features/quests/questStore';

type Props = {
  value: string | null;
  onChange: (categoryId: string | null) => void;
};

/**
 * Optional category for a memory that isn't tied to a quest.
 *
 * Eva's request (round 2, R2-11): a memory she wrote herself couldn't be put in
 * any category, so the Memories filter could never find it — "mít jen tu
 * možnost". The word that matters is *možnost*: nothing is preselected, and
 * tapping the chosen one again clears it.
 */
export function MemoryCategoryPicker({ value, onChange }: Props) {
  const categories = useQuestDomainStore((s) => s.categories);
  if (categories.length === 0) return null;

  return (
    <View style={styles.row}>
      {categories.map((c) => {
        const selected = value === c.id;
        return (
          <Chip
            key={c.id}
            label={c.name}
            icon={categoryIoniconNameForCategoryId(c.id)}
            accent={categoryAccentForCategoryId(c.id)}
            selected={selected}
            onPress={() => onChange(selected ? null : c.id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 10,
    // Same gap the memory forms leave under every other field.
    marginBottom: 20,
  },
});
