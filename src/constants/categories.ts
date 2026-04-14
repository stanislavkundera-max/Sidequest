import type { Category } from '@/src/types/category';

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-nature',
    slug: 'nature',
    name: 'Nature',
    description: 'Get outside, notice plants, weather, and light.',
  },
  {
    id: 'cat-adventure',
    slug: 'adventure',
    name: 'Adventure',
    description: 'Small trips, new routes, and light exploration.',
  },
  {
    id: 'cat-social',
    slug: 'social',
    name: 'Social',
    description: 'Real conversations and low-pressure connection.',
  },
  {
    id: 'cat-relax',
    slug: 'relax',
    name: 'Relax',
    description: 'Slow down with something simple and restorative.',
  },
];
