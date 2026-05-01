import { memo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import type { JourneyArtifact, JourneyArtifactVisual } from '@/src/features/journey/journeyArtifacts';

/** Dusty pastel “study playlist” palette — readable on the Journey path, not icon-like. */
type LofiInk = {
  fill: string;
  deep: string;
  mist?: string;
  paper: string;
  halo: string;
  stroke: string;
};

function categoryInk(cat: JourneyArtifact['category']): LofiInk {
  switch (cat) {
    case 'nature':
      return {
        fill: '#7d9f84',
        deep: '#4d6a52',
        mist: 'rgba(190, 225, 195, 0.55)',
        paper: 'rgba(248, 252, 246, 0.94)',
        halo: 'rgba(170, 210, 175, 0.5)',
        stroke: 'rgba(95, 130, 102, 0.35)',
      };
    case 'adventure':
      return {
        fill: '#d4b896',
        deep: '#9a7b5c',
        mist: 'rgba(240, 215, 185, 0.55)',
        paper: 'rgba(255, 248, 238, 0.94)',
        halo: 'rgba(230, 195, 150, 0.48)',
        stroke: 'rgba(160, 125, 90, 0.32)',
      };
    case 'social':
      return {
        fill: '#e8b89a',
        deep: '#b87d62',
        mist: 'rgba(255, 220, 200, 0.58)',
        paper: 'rgba(255, 244, 238, 0.94)',
        halo: 'rgba(255, 195, 165, 0.45)',
        stroke: 'rgba(200, 130, 105, 0.3)',
      };
    case 'relax':
      return {
        fill: '#a8bdd4',
        deep: '#6d8498',
        mist: 'rgba(210, 225, 240, 0.55)',
        paper: 'rgba(244, 248, 252, 0.94)',
        halo: 'rgba(175, 200, 225, 0.5)',
        stroke: 'rgba(110, 135, 155, 0.32)',
      };
    default:
      return {
        fill: '#b8c4d4',
        deep: '#758899',
        mist: 'rgba(210, 220, 235, 0.5)',
        paper: 'rgba(246, 248, 252, 0.92)',
        halo: 'rgba(185, 205, 225, 0.45)',
        stroke: 'rgba(120, 140, 160, 0.28)',
      };
  }
}

function GlyphBody({
  type,
  ink,
  s,
}: {
  type: JourneyArtifactVisual;
  ink: LofiInk;
  s: number;
}) {
  const r = (n: number) => n * s;
  switch (type) {
    case 'flower':
      return (
        <View style={{ width: r(1), height: r(0.9), alignItems: 'center', justifyContent: 'flex-end' }}>
          <View style={[styles.oval, { width: r(0.55), height: r(0.24), backgroundColor: ink.deep, opacity: 0.45 }]} />
          <View style={{ flexDirection: 'row', gap: r(0.07), marginTop: -r(0.1), alignItems: 'flex-end' }}>
            {[0.95, 1, 0.88].map((op, i) => (
              <View
                key={i}
                style={[
                  styles.oval,
                  {
                    width: r(0.16 + i * 0.02),
                    height: r(0.16 + i * 0.02),
                    backgroundColor: i === 1 ? '#f4a8b8' : ink.fill,
                    opacity: op,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.35)',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      );
    case 'grass_patch':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: r(0.55), gap: -r(0.06) }}>
          <View style={[styles.oval, { width: r(0.38), height: r(0.26), backgroundColor: ink.fill, opacity: 0.82 }]} />
          <View style={[styles.oval, { width: r(0.46), height: r(0.34), backgroundColor: ink.fill, opacity: 0.95 }]} />
          <View style={[styles.oval, { width: r(0.36), height: r(0.24), backgroundColor: ink.fill, opacity: 0.78 }]} />
        </View>
      );
    case 'small_tree':
      return (
        <View style={{ alignItems: 'center', width: r(0.58), height: r(1.05) }}>
          <View
            style={[
              styles.oval,
              {
                width: r(0.55),
                height: r(0.5),
                backgroundColor: ink.fill,
                opacity: 0.95,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
              },
            ]}
          />
          <View
            style={{
              width: r(0.12),
              height: r(0.4),
              backgroundColor: ink.deep,
              marginTop: -r(0.12),
              borderRadius: 4,
              opacity: 0.72,
            }}
          />
        </View>
      );
    case 'grove':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: r(1), gap: -r(0.1) }}>
          {[0.38, 0.52, 0.42].map((w, i) => (
            <View
              key={i}
              style={[
                styles.oval,
                {
                  width: r(w),
                  height: r(0.58),
                  backgroundColor: ink.fill,
                  opacity: 0.72 + i * 0.1,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                },
              ]}
            />
          ))}
        </View>
      );
    case 'stream':
      return (
        <View
          style={[
            styles.oval,
            {
              width: r(1.15),
              height: r(0.38),
              backgroundColor: ink.deep,
              opacity: 0.55,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: ink.stroke,
            },
          ]}>
          <View
            style={[
              styles.oval,
              { position: 'absolute', left: '10%', top: '32%', width: '58%', height: 3, backgroundColor: ink.mist },
            ]}
          />
        </View>
      );
    case 'meadow':
      return (
        <View
          style={[
            styles.oval,
            {
              width: r(1.05),
              height: r(0.44),
              backgroundColor: ink.fill,
              opacity: 0.62,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.22)',
            },
          ]}
        />
      );
    case 'forest_clearing':
      return (
        <View
          style={{
            width: r(1.15),
            height: r(0.78),
            borderRadius: r(0.42),
            backgroundColor: ink.mist,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.35)',
          }}
        />
      );
    case 'mountain_peak':
      return (
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: r(0.58),
            borderRightWidth: r(0.58),
            borderBottomWidth: r(1),
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: ink.fill,
            opacity: 0.92,
          }}
        />
      );
    case 'aurora':
      return (
        <View style={{ width: r(1.25), height: r(0.52), borderRadius: r(0.22), overflow: 'hidden' }}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(180, 220, 200, 0.45)' }]} />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '35%',
              height: r(0.12),
              borderRadius: r(0.06),
              backgroundColor: 'rgba(200, 180, 240, 0.5)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '55%',
              height: r(0.1),
              borderRadius: r(0.05),
              backgroundColor: 'rgba(255, 220, 200, 0.45)',
            }}
          />
        </View>
      );
    case 'trail_marker':
      return (
        <View style={{ alignItems: 'center', width: r(0.2), height: r(0.9) }}>
          <View
            style={{
              width: r(0.16),
              height: r(0.72),
              backgroundColor: ink.deep,
              borderRadius: 5,
              opacity: 0.85,
            }}
          />
          <View
            style={[
              styles.oval,
              {
                position: 'absolute',
                top: r(0.06),
                width: r(0.36),
                height: r(0.2),
                backgroundColor: '#f2e6d4',
                borderWidth: 1,
                borderColor: ink.stroke,
              },
            ]}
          />
        </View>
      );
    case 'stepping_stone':
      return (
        <View
          style={[
            styles.oval,
            {
              width: r(0.62),
              height: r(0.26),
              backgroundColor: '#e8e0d4',
              opacity: 0.95,
              borderWidth: 2,
              borderColor: ink.stroke,
            },
          ]}
        />
      );
    case 'signpost':
      return (
        <View style={{ width: r(0.58), height: r(1), alignItems: 'center' }}>
          <View style={{ width: r(0.14), height: r(0.78), backgroundColor: ink.deep, borderRadius: 5, opacity: 0.88 }} />
          <View
            style={{
              position: 'absolute',
              top: r(0.06),
              width: r(0.56),
              height: r(0.22),
              backgroundColor: '#f4e8c8',
              borderRadius: 6,
              borderWidth: 2,
              borderColor: ink.stroke,
              transform: [{ rotate: '-6deg' }],
            }}
          />
        </View>
      );
    case 'bridge':
      return (
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: r(1.05),
              height: r(0.14),
              backgroundColor: '#dccfb8',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: ink.stroke,
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: r(0.9), marginTop: 3 }}>
            <View style={{ width: r(0.1), height: r(0.32), backgroundColor: ink.deep, opacity: 0.65, borderRadius: 3 }} />
            <View style={{ width: r(0.1), height: r(0.32), backgroundColor: ink.deep, opacity: 0.65, borderRadius: 3 }} />
          </View>
        </View>
      );
    case 'camp':
      return (
        <View style={{ alignItems: 'center', width: r(0.95) }}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: r(0.48),
              borderRightWidth: r(0.48),
              borderBottomWidth: r(0.42),
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#c4a892',
              opacity: 0.92,
            }}
          />
          <View style={[styles.oval, { width: r(0.4), height: r(0.14), marginTop: -3, backgroundColor: '#f0c090', opacity: 0.55 }]} />
        </View>
      );
    case 'cliff_path':
      return (
        <View
          style={{
            width: r(0.95),
            height: r(0.48),
            borderTopLeftRadius: r(0.22),
            borderTopRightRadius: r(0.1),
            backgroundColor: ink.deep,
            opacity: 0.72,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        />
      );
    case 'mountain_pass':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: -r(0.18) }}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: r(0.42),
              borderRightWidth: r(0.42),
              borderBottomWidth: r(0.78),
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: ink.fill,
              opacity: 0.88,
            }}
          />
          <View style={{ width: r(0.28), height: r(0.38), backgroundColor: '#c8bdb0', opacity: 0.75, borderRadius: 4 }} />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: r(0.42),
              borderRightWidth: r(0.42),
              borderBottomWidth: r(0.78),
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: ink.fill,
              opacity: 0.88,
            }}
          />
        </View>
      );
    case 'island':
      return (
        <View
          style={[
            styles.oval,
            {
              width: r(1.05),
              height: r(0.44),
              backgroundColor: ink.deep,
              opacity: 0.68,
              borderWidth: 2,
              borderColor: ink.mist,
            },
          ]}
        />
      );
    case 'expedition_landmark':
      return (
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: r(0.15), height: r(0.58), backgroundColor: ink.deep, opacity: 0.78, borderRadius: 4 }} />
          <View
            style={{
              width: r(0.52),
              height: r(0.22),
              backgroundColor: '#e89880',
              opacity: 0.85,
              borderRadius: 5,
              marginTop: -r(0.48),
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.35)',
            }}
          />
        </View>
      );
    case 'lantern':
      return (
        <View style={{ alignItems: 'center', width: r(0.58) }}>
          <View
            style={[
              styles.oval,
              {
                width: r(0.42),
                height: r(0.46),
                backgroundColor: '#ffd9a8',
                opacity: 0.82,
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.45)',
              },
            ]}
          />
          <View style={{ width: r(0.1), height: r(0.38), backgroundColor: ink.deep, marginTop: -r(0.1), opacity: 0.7, borderRadius: 4 }} />
        </View>
      );
    case 'warm_window':
      return (
        <View
          style={{
            width: r(0.58),
            height: r(0.7),
            borderRadius: r(0.08),
            backgroundColor: '#ffe8c4',
            opacity: 0.72,
            borderWidth: 2,
            borderColor: 'rgba(255,200,120,0.55)',
          }}
        />
      );
    case 'small_campfire':
      return (
        <View style={{ alignItems: 'center', width: r(0.55), height: r(0.45) }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                bottom: 0,
                width: r(0.14),
                height: r(0.32 + i * 0.08),
                backgroundColor: i === 1 ? '#ffb366' : '#d48860',
                opacity: 0.55 + i * 0.12,
                borderRadius: 4,
                transform: [{ rotate: `${(i - 1) * 14}deg` }],
              }}
            />
          ))}
        </View>
      );
    case 'village_lights':
      return (
        <View style={{ flexDirection: 'row', gap: r(0.1), alignItems: 'flex-end', height: r(0.55) }}>
          {[0.38, 0.52, 0.45, 0.4].map((h, i) => (
            <View
              key={i}
              style={{
                width: r(0.12),
                height: r(h),
                borderRadius: 4,
                backgroundColor: '#ffd8a0',
                opacity: 0.55 + i * 0.08,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </View>
      );
    case 'shared_table':
      return (
        <View
          style={{
            width: r(1.05),
            height: r(0.2),
            backgroundColor: '#d8c8b0',
            borderRadius: 8,
            opacity: 0.92,
            borderWidth: 2,
            borderColor: ink.stroke,
          }}
        />
      );
    case 'gathering_place':
      return (
        <View
          style={[
            styles.oval,
            {
              width: r(1.05),
              height: r(0.48),
              backgroundColor: ink.mist,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.35)',
            },
          ]}
        />
      );
    case 'settlement':
      return (
        <View style={{ flexDirection: 'row', gap: r(0.07), alignItems: 'flex-end' }}>
          {[0.48, 0.68, 0.55, 0.6].map((h, i) => (
            <View
              key={i}
              style={{
                width: r(0.17),
                height: r(h),
                backgroundColor: '#c8c0d0',
                opacity: 0.78 + i * 0.04,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </View>
      );
    case 'festival_lights':
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: r(1.15), gap: r(0.09), justifyContent: 'center' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={{
                width: r(0.12),
                height: r(0.12),
                borderRadius: 999,
                backgroundColor: i % 2 === 0 ? '#ffb8c8' : '#ffe8a0',
                opacity: 0.72,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </View>
      );
    case 'constellation':
      return (
        <View style={{ width: r(1.05), height: r(0.58) }}>
          {[
            [0.15, 0.2],
            [0.45, 0.45],
            [0.75, 0.25],
            [0.3, 0.65],
            [0.65, 0.72],
          ].map(([lx, ly], i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: r(lx as number),
                top: r(ly as number),
                width: r(0.1),
                height: r(0.1),
                borderRadius: 999,
                backgroundColor: '#f0f4ff',
                opacity: 0.88,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </View>
      );
    case 'mist':
      return (
        <View
          style={[
            styles.oval,
            { width: r(1.05), height: r(0.44), backgroundColor: 'rgba(235, 242, 248, 0.52)', borderWidth: 1, borderColor: ink.stroke },
          ]}
        />
      );
    case 'soft_cloud':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: -r(0.1) }}>
          <View style={[styles.oval, { width: r(0.48), height: r(0.32), backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: ink.stroke }]} />
          <View style={[styles.oval, { width: r(0.58), height: r(0.38), backgroundColor: 'rgba(255,255,255,0.62)', borderWidth: 1, borderColor: ink.stroke }]} />
        </View>
      );
    case 'pond_ripple':
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', width: r(0.75), height: r(0.55) }}>
          <View
            style={{
              width: r(0.58),
              height: r(0.36),
              borderRadius: 999,
              borderWidth: 2,
              borderColor: ink.deep,
              opacity: 0.65,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: r(0.38),
              height: r(0.24),
              borderRadius: 999,
              borderWidth: 2,
              borderColor: ink.fill,
              opacity: 0.5,
            }}
          />
        </View>
      );
    case 'lake':
      return (
        <View
          style={[
            styles.oval,
            {
              width: r(1.18),
              height: r(0.46),
              backgroundColor: ink.deep,
              opacity: 0.62,
              borderWidth: 2,
              borderColor: ink.mist,
            },
          ]}
        />
      );
    case 'moonlit_clearing':
      return (
        <View
          style={{
            width: r(1.05),
            height: r(0.52),
            borderRadius: r(0.26),
            backgroundColor: 'rgba(230, 236, 248, 0.45)',
            borderWidth: 1,
            borderColor: ink.stroke,
          }}>
          <View
            style={[
              styles.oval,
              {
                position: 'absolute',
                right: r(0.08),
                top: r(0.06),
                width: r(0.24),
                height: r(0.24),
                backgroundColor: 'rgba(255,255,255,0.75)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)',
              },
            ]}
          />
        </View>
      );
    case 'quiet_garden':
      return (
        <View style={{ flexDirection: 'row', gap: r(0.1), alignItems: 'flex-end' }}>
          <View style={[styles.oval, { width: r(0.38), height: r(0.3), backgroundColor: ink.fill, opacity: 0.78 }]} />
          <View style={[styles.oval, { width: r(0.45), height: r(0.42), backgroundColor: ink.fill, opacity: 0.9 }]} />
        </View>
      );
    case 'sanctuary':
      return (
        <View
          style={{
            width: r(1.05),
            height: r(0.78),
            borderRadius: r(0.14),
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.35)',
            backgroundColor: 'rgba(200, 215, 235, 0.42)',
          }}
        />
      );
    case 'calm_valley':
      return (
        <View
          style={[
            styles.oval,
            {
              width: r(1.22),
              height: r(0.4),
              backgroundColor: ink.fill,
              opacity: 0.58,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
            },
          ]}
        />
      );
    case 'night_sky':
      return (
        <View
          style={{
            width: r(1.12),
            height: r(0.58),
            borderRadius: r(0.1),
            backgroundColor: '#3a4560',
            opacity: 0.75,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
          }}>
          {[
            [0.12, 0.14],
            [0.42, 0.22],
            [0.72, 0.16],
            [0.28, 0.42],
            [0.58, 0.48],
            [0.18, 0.62],
            [0.82, 0.38],
            [0.5, 0.72],
          ].map(([lx, ly], i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: r(lx as number),
                top: r(ly as number),
                width: 3,
                height: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255,250,240,0.95)',
              }}
            />
          ))}
        </View>
      );
    default:
      return (
        <View
          style={[
            styles.oval,
            {
              width: r(0.5),
              height: r(0.5),
              backgroundColor: ink.fill,
              opacity: 0.85,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.35)',
            },
          ]}
        />
      );
  }
}

export const JourneyArtifactGlyph = memo(function JourneyArtifactGlyph({
  artifact,
  pixelScale,
}: {
  artifact: JourneyArtifact;
  pixelScale: number;
}) {
  const ink = categoryInk(artifact.category);
  const s = pixelScale * 1.08;

  const shadowStyle =
    Platform.OS === 'web'
      ? ({ boxShadow: '0 4px 14px rgba(45, 40, 35, 0.18)' } as Record<string, string>)
      : {
          shadowColor: '#2d2823',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        };

  return (
    <View style={styles.outer}>
      <View
        pointerEvents="none"
        style={[
          styles.haloBlob,
          {
            width: s * 1.65,
            height: s * 1.65,
            borderRadius: s * 0.82,
            backgroundColor: ink.halo,
            opacity: 0.65,
          },
        ]}
      />
      <View
        style={[
          styles.pedestal,
          {
            backgroundColor: ink.paper,
            borderColor: ink.stroke,
            ...shadowStyle,
          },
          artifact.hasMemoryLink && {
            borderWidth: 2,
            borderColor: 'rgba(230, 170, 120, 0.65)',
            backgroundColor: 'rgba(255, 252, 246, 0.98)',
          },
        ]}>
        <GlyphBody type={artifact.type} ink={ink} s={s} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  haloBlob: {
    position: 'absolute',
    alignSelf: 'center',
  },
  pedestal: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  oval: { borderRadius: 999 },
  dot: { borderRadius: 999 },
});
