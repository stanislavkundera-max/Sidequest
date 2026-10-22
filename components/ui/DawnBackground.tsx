import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Dawn } from '@/constants/Theme';

/**
 * The Dawn ground behind a whole screen: the olive gradient, top to bottom, with
 * the warm light low on the right that every redesigned screen carries.
 *
 * Drawn with CSS gradients, which React Native renders natively on the New
 * Architecture (`experimental_backgroundImage`, RN 0.79+; radial from 0.80), so
 * it needs no native module and ships over the air. The web build gets the same
 * strings through `backgroundImage`.
 */
const GROUND = `linear-gradient(180deg, ${Dawn.ground[0]} 0%, ${Dawn.ground[1]} 50%, ${Dawn.ground[2]} 100%)`;
const GLOW = `radial-gradient(90% 45% at 100% 100%, ${Dawn.glow} 0%, rgba(240, 150, 120, 0) 70%)`;

/** A CSS background string as the style prop this platform reads. */
export function gradientStyle(css: string): ViewStyle {
  return (Platform.OS === 'web' ? { backgroundImage: css } : { experimental_backgroundImage: css }) as ViewStyle;
}

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Leave out the warm corner light, e.g. behind a full-screen map. */
  noGlow?: boolean;
};

export function DawnBackground({ children, style, noGlow = false }: Props) {
  return (
    <View style={[styles.fill, gradientStyle(noGlow ? GROUND : `${GLOW}, ${GROUND}`), style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  // The solid first stop underneath, for the moment before a gradient paints.
  fill: { flex: 1, backgroundColor: Dawn.ground[0] },
});
