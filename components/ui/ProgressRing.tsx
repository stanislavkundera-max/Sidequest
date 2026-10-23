import { StyleSheet, View } from 'react-native';

type Props = {
  /** Outer diameter. */
  size: number;
  thickness: number;
  /** 0–1. */
  progress: number;
  color: string;
  trackColor: string;
};

/**
 * A progress arc drawn with plain Views, so it needs no native SVG module and ships over the
 * air. Used for a quest in motion on its map marker (redesign screen 15).
 *
 * How: a ring coloured on its top and right edges is a half-ring spanning −45°…135°. Rotated by
 * (deg − 135°) it spans (deg − 180°)…deg. Clipping one copy to the right half and one to the
 * left half shows exactly 0…deg, starting at 12 o'clock and running clockwise.
 */
export function ProgressRing({ size, thickness, progress, color, trackColor }: Props) {
  const deg = Math.max(0, Math.min(1, progress)) * 360;
  const ring = {
    position: 'absolute' as const,
    top: 0,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: thickness,
  };
  const halfRing = (rotate: number) => ({
    ...ring,
    borderColor: 'transparent',
    borderTopColor: color,
    borderRightColor: color,
    transform: [{ rotate: `${rotate}deg` }],
  });

  return (
    <View style={{ width: size, height: size }} pointerEvents="none" accessible={false}>
      <View style={[ring, { left: 0, borderColor: trackColor }]} />
      {deg > 0 ? (
        <View style={[styles.clip, { left: size / 2, width: size / 2, height: size }]}>
          <View style={[halfRing(Math.min(deg, 180) - 135), { left: -size / 2 }]} />
        </View>
      ) : null}
      {deg > 180 ? (
        <View style={[styles.clip, { left: 0, width: size / 2, height: size }]}>
          <View style={[halfRing(deg - 135), { left: 0 }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { position: 'absolute', top: 0, overflow: 'hidden' },
});
