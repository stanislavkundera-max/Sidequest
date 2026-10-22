import type { ImageSourcePropType } from 'react-native';

/**
 * Quest thumbnails — one illustrated world per category (redesign, canvas "Quest art per
 * category"): Nature green hills and woods, Adventure ochre rock, Relax still blue water,
 * Social rose dusk with warm lit places. All share the Dawn sky.
 *
 * There are a handful of scenes per category and many more quests, so a quest takes a scene
 * by a stable hash of its id: the same quest always shows the same picture, and neighbours in
 * a list rarely repeat. Drawing a scene per quest is later work; this keeps the look until then.
 * The PNGs are rendered from the canvas SVGs (no native SVG module, so this ships over the air).
 */
const ART: Record<string, ImageSourcePropType[]> = {
  'cat-nature': [
    require('@/assets/images/dawn/quest-art/sleepOut.png'),
    require('@/assets/images/dawn/quest-art/followWater.png'),
    require('@/assets/images/dawn/quest-art/eatOutside.png'),
    require('@/assets/images/dawn/quest-art/litterWalk.png'),
    require('@/assets/images/dawn/quest-art/outdoorSkill.png'),
  ],
  'cat-adventure': [
    require('@/assets/images/dawn/quest-art/climb.png'),
    require('@/assets/images/dawn/quest-art/canyon.png'),
    require('@/assets/images/dawn/quest-art/rapids.png'),
  ],
  'cat-relax': [
    require('@/assets/images/dawn/quest-art/slowMorning.png'),
    require('@/assets/images/dawn/quest-art/hammock.png'),
    require('@/assets/images/dawn/quest-art/dock.png'),
  ],
  'cat-social': [
    require('@/assets/images/dawn/quest-art/cookTogether.png'),
    require('@/assets/images/dawn/quest-art/stringLights.png'),
    require('@/assets/images/dawn/quest-art/campfireCircle.png'),
  ],
};

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function questArtFor(questId: string, categoryId: string): ImageSourcePropType {
  const set = ART[categoryId] ?? ART['cat-nature'];
  return set[hash(questId) % set.length];
}
