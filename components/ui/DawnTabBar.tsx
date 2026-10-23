import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Dawn, Theme } from '@/constants/Theme';

/**
 * The Dawn tab bar: a dark pill floating above the bottom edge, the current tab a
 * peach capsule with dark ink (canvas, every tab screen). Replaces the full-width
 * white bar; the active tab is carried by fill, weight and colour together, so it
 * never depends on colour alone.
 */
const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  explore: { on: 'compass', off: 'compass-outline' },
  journey: { on: 'map', off: 'map-outline' },
  memories: { on: 'book', off: 'book-outline' },
};

/** Progress is the cairn, the app's own mark — four stones, stacked like the logo. */
function CairnIcon({ color }: { color: string }) {
  return (
    <View style={styles.cairn} accessible={false}>
      <View style={[styles.stone, { width: 6, height: 4, backgroundColor: color }]} />
      <View style={[styles.stone, { width: 9, height: 5, marginLeft: -1, backgroundColor: color }]} />
      <View style={[styles.stone, { width: 12, height: 5, marginLeft: 1, backgroundColor: color }]} />
      <View style={[styles.stone, { width: 16, height: 6, backgroundColor: color }]} />
    </View>
  );
}

export function DawnTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((route) => {
    // Expo Router hides `href: null` routes with display: none.
    const itemStyle = descriptors[route.key].options.tabBarItemStyle as { display?: string } | undefined;
    return itemStyle?.display !== 'none';
  });

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
      <View style={styles.pill}>
        {routes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = state.routes[state.index]?.key === route.key;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const color = focused ? Theme.onAccent : Dawn.navInactive;
          const icon = ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              // react-native-web drops `accessibilityState.selected` on a tab; the ARIA prop carries it.
              aria-selected={focused}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              style={({ pressed }) => [styles.tab, focused && styles.tabActive, pressed && !focused && styles.pressed]}>
              {icon ? (
                <Ionicons name={focused ? icon.on : icon.off} size={21} color={color} />
              ) : (
                <CairnIcon color={color} />
              )}
              <Text style={[styles.label, { color }, focused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: Theme.bg,
  },
  pill: {
    height: 64,
    borderRadius: 32,
    padding: 6,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Dawn.navFill,
    borderWidth: 1,
    borderColor: Dawn.navBorder,
    boxShadow: '0 12px 32px rgba(10, 9, 5, 0.5)',
  },
  tab: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabActive: { backgroundColor: Theme.accent },
  pressed: { opacity: 0.7 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', fontWeight: '500' },
  labelActive: { fontFamily: 'Inter_700Bold', fontWeight: '700' },
  cairn: { height: 21, alignItems: 'center', justifyContent: 'flex-end', gap: 1 },
  stone: { borderRadius: 999 },
});
