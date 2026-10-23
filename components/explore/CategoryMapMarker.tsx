import { memo, useCallback, useEffect, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { CategoryMapMarkerGlyph } from '@/components/explore/CategoryMapMarkerGlyph';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Dawn } from '@/constants/Theme';
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
  /** A quest in motion here: how far along it is (0–1). Draws the orange arc and the pulse. */
  inMotionProgress?: number | null;
  onPress: (categoryId: string) => void;
};

const MARKER_SIZE = 56;
/** The progress arc sits just outside the cream rim. */
const RING_SIZE = MARKER_SIZE + 18;
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
  inMotionProgress = null,
  onPress,
}: Props) {
  const inMotion = inMotionProgress != null;
  // A slow warm pulse says "something of yours is going on here" without a number (Standa
  // rejected "2/4" and "Step 2/4" on the map, 2026-10-22).
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = inMotion
      ? withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false)
      : 0;
  }, [inMotion, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.45 }],
  }));
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
        accessibilityLabel={`${categoryName}${inMotion ? ', a quest in motion here' : ''}. ${accessibilityHint}`}
        accessibilityState={{ selected }}
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}>
        <View style={styles.circleSlot}>
          {inMotion ? <Animated.View style={[styles.halo, pulseStyle]} /> : null}
          {inMotion ? (
            <View style={styles.ringSlot}>
              <ProgressRing
                size={RING_SIZE}
                thickness={4.5}
                progress={inMotionProgress ?? 0}
                color={Dawn.secondaryBorder}
                trackColor="rgba(246, 234, 214, 0.45)"
              />
            </View>
          ) : null}
          <View
            style={[
              styles.circle,
              { backgroundColor: accent },
              selected && styles.circleSelected,
            ]}>
            <CategoryMapMarkerGlyph categoryId={categoryId} color="#ffffff" size={selected ? 28 : 25} />
          </View>
          {!revealed && !selected && !inMotion ? <View style={styles.newDot} /> : null}
        </View>

        <View style={[styles.label, { backgroundColor: accent }, inMotion && styles.labelBelowRing]}>
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
  halo: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: 'rgba(240, 178, 122, 0.45)',
  },
  ringSlot: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    left: (MARKER_SIZE - RING_SIZE) / 2,
    top: (MARKER_SIZE - RING_SIZE) / 2,
  },
  // Dawn (canvas screen 15): the category colour solid, a cream rim, a white glyph. The old
  // outline-on-light marker sat too close in value to the painted forest behind it.
  circle: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 3,
    borderColor: Dawn.cream,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 14px rgba(10, 9, 5, 0.55)',
  },
  circleSelected: { transform: [{ scale: 1.12 }] },
  // "Not opened yet": a small peach dot on the rim.
  newDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Dawn.cream,
    backgroundColor: Dawn.secondaryBorder,
  },
  label: {
    maxWidth: WRAP_WIDTH,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(246, 234, 214, 0.7)',
    boxShadow: '0 3px 8px rgba(10, 9, 5, 0.45)',
  },
  // The arc reaches 9 px below the disc; keep the label clear of it.
  labelBelowRing: { marginTop: 6 },
  labelText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});

export { MARKER_SIZE };
