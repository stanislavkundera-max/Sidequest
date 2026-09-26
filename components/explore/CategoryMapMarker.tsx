import { memo, useCallback, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CategoryMapMarkerGlyph } from '@/components/explore/CategoryMapMarkerGlyph';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';

type Props = {
  categoryId: string;
  categoryName: string;
  selected: boolean;
  revealed: boolean;
  left: number;
  top: number;
  accessibilityHint: string;
  /** Size of the map the marker sits on; a dragged marker is kept inside it. */
  bounds: { w: number; h: number };
  onPress: (categoryId: string) => void;
};

const MARKER_SIZE = 52;
/** Finger travel, in px, before a touch stops being a tap and becomes a drag. A finger always
 * wobbles a little on a tap, so this is generous. */
const DRAG_SLOP = 12;
/** Keeps a dragged marker off the very edge, and its label clear of the bottom. */
const EDGE = MARKER_SIZE / 2 + 8;
const LABEL_ROOM = 44;
/** Wide enough for the longest category name; the circle stays centred in it. */
const WRAP_WIDTH = 112;

export const CategoryMapMarker = memo(function CategoryMapMarker({
  categoryId,
  categoryName,
  selected,
  revealed,
  left,
  top,
  accessibilityHint,
  bounds,
  onPress,
}: Props) {
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  // Bubbles can be picked up and moved about (round 2, R2-15 — Marian: "když by se ty
  // bublinky na mapě daly posouvat a hrát si s nimi", who wants something to fidget with).
  // They spring back to their landmark when let go: the map stays what it is, and nobody
  // can leave a category stranded somewhere meaningless. A tap still opens the panel — the
  // gesture only takes over once the finger has actually moved.
  const geometry = useRef({ left, top, bounds });
  geometry.current = { left, top, bounds };
  const dragging = useRef(false);

  const settle = useCallback(() => {
    tx.value = withSpring(0, { damping: 11, stiffness: 140 });
    ty.value = withSpring(0, { damping: 11, stiffness: 140 });
    scale.value = withTiming(1, { duration: 200 });
  }, [scale, tx, ty]);

  // The marker claims the touch straight away and decides tap-vs-drag on release: react-native-web
  // never offers a parent the chance to take over from a child that already holds the press.
  // The pan decides taps itself; the Pressable's own press (a browser click after mouseup) is
  // ignored right after a gesture, so a drag never opens the panel. Screen readers still use it.
  const ignorePressUntil = useRef(0);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        dragging.current = false;
        scale.value = withTiming(0.92, { duration: 120 });
      },
      onPanResponderMove: (_e, g) => {
        if (!dragging.current) {
          if (Math.hypot(g.dx, g.dy) <= DRAG_SLOP) return;
          dragging.current = true;
          scale.value = withTiming(1.12, { duration: 120 });
        }
        const { left: cx, top: cy, bounds: b } = geometry.current;
        const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
        tx.value = clamp(cx + g.dx, EDGE, b.w - EDGE) - cx;
        ty.value = clamp(cy + g.dy, EDGE + 100, b.h - LABEL_ROOM) - cy;
      },
      onPanResponderRelease: () => {
        const wasDrag = dragging.current;
        ignorePressUntil.current = Date.now() + 400;
        dragging.current = false;
        settle();
        if (!wasDrag) onPressRef.current(categoryId);
      },
      onPanResponderTerminate: () => {
        ignorePressUntil.current = Date.now() + 400;
        dragging.current = false;
        settle();
      },
    })
  ).current;

  const handlePress = useCallback(() => {
    if (Date.now() < ignorePressUntil.current) return;
    onPress(categoryId);
  }, [categoryId, onPress]);

  const accent = categoryAccentForCategoryId(categoryId);

  return (
    <Animated.View
      {...pan.panHandlers}
      style={[
        styles.wrap,
        { left: left - WRAP_WIDTH / 2, top: top - MARKER_SIZE / 2 },
        animatedStyle,
      ]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${categoryName}. ${accessibilityHint}`}
        accessibilityState={{ selected }}
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}>
        <View style={styles.circleSlot}>
          {/* Soft glow so the marker separates from the busy illustration. */}
          <View style={[styles.glow, { backgroundColor: `${accent}38` }]} />
          <View
            style={[
              styles.circle,
              {
                borderColor: accent,
                backgroundColor: selected ? accent : Theme.surface,
              },
            ]}>
            <CategoryMapMarkerGlyph
              categoryId={categoryId}
              color={selected ? '#ffffff' : accent}
              size={26}
            />
          </View>
          {!revealed && !selected ? (
            <View style={[styles.newDot, { backgroundColor: accent }]} />
          ) : null}
        </View>

        <View style={[styles.label, selected && { borderColor: accent, borderWidth: 1.5 }]}>
          <Text style={styles.labelText} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: WRAP_WIDTH,
    zIndex: 2,
  },
  press: {
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.92,
  },
  circleSlot: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: MARKER_SIZE + 16,
    height: MARKER_SIZE + 16,
    borderRadius: (MARKER_SIZE + 16) / 2,
  },
  circle: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1c1a17',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  newDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  label: {
    maxWidth: WRAP_WIDTH,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(24,22,19,0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  labelText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export { MARKER_SIZE };
