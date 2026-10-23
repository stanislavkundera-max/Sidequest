import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Dawn, Theme } from '@/constants/Theme';
import { EXPLORE_MAP_MARKERS, EXPLORE_MAP_SOURCE_SIZE } from '@/src/constants/exploreMapMarkers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';

const MAP = require('@/assets/images/explore-map-background.jpg');
/** The painting is shown at this width, so each tile is a close-up around its place's landmark. */
const MAP_W = 560;
const MAP_H = (MAP_W * EXPLORE_MAP_SOURCE_SIZE.height) / EXPLORE_MAP_SOURCE_SIZE.width;
const TILE_H = 84;

/**
 * The four places, each a piece of the map around its landmark with the stones you have from
 * it (redesign screen 34). A place with none yet is faded, not locked: "not yet", never a gap
 * to fill. Tapping opens that place on the map.
 */
export function PlacesOnMap() {
  const router = useRouter();
  const categories = useQuestDomainStore((s) => s.categories);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const [tileW, setTileW] = useState(80);

  const stones = useMemo(() => {
    const counts = new Map<string, number>();
    for (const uq of userQuests) {
      if (uq.status !== 'completed') continue;
      const cid = uq.snapshotCategoryId || getQuestById(uq.questId)?.categoryId;
      if (cid) counts.set(cid, (counts.get(cid) ?? 0) + 1);
    }
    return counts;
  }, [userQuests, getQuestById]);

  // Map order (Nature, Adventure, Relax, Social), the order people meet them on Explore.
  const order = ['cat-nature', 'cat-adventure', 'cat-relax', 'cat-social'];
  const markers = order
    .map((id) => EXPLORE_MAP_MARKERS.find((m) => m.categoryId === id))
    .filter((m): m is (typeof EXPLORE_MAP_MARKERS)[number] => Boolean(m));

  return (
    <View style={styles.row}>
      {markers.map((m) => {
        const n = stones.get(m.categoryId) ?? 0;
        const name = categories.find((c) => c.id === m.categoryId)?.name ?? m.categoryId;
        return (
          <Pressable
            key={m.categoryId}
            onLayout={(e) => setTileW(Math.round(e.nativeEvent.layout.width))}
            onPress={() => router.push({ pathname: '/(tabs)/explore', params: { category: m.categoryId } } as never)}
            accessibilityRole="button"
            accessibilityLabel={`${name}: ${n === 0 ? 'no stones yet' : `${n} stone${n === 1 ? '' : 's'}`}. Open on the map`}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <Image
              source={MAP}
              accessible={false}
              style={[
                styles.map,
                { left: -(m.u * MAP_W - tileW / 2), top: -(m.v * MAP_H - TILE_H / 2) },
                n === 0 && styles.faded,
              ]}
            />
            <View style={styles.shade} />
            <View style={styles.label}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.count}>{n === 0 ? 'not yet' : `${n} stone${n === 1 ? '' : 's'}`}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, height: TILE_H, borderRadius: 16, overflow: 'hidden', backgroundColor: Dawn.card },
  map: { position: 'absolute', width: MAP_W, height: MAP_H },
  faded: { opacity: 0.3 },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 22, 12, 0.35)',
  },
  label: { position: 'absolute', left: 8, right: 6, bottom: 7 },
  name: { fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  count: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  pressed: { opacity: 0.85 },
});
