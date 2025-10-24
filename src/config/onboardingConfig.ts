import { Restaurant } from '@/types/restaurant';

// Tutorial restaurants that will appear in the swipe flow
export const TUTORIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'tutorial-crab-patty',
    name: '美味蟹堡',
    address: '比奇堡鳳梨屋隔壁',
    city: '比奇堡',
    district: '海底',
    lat: 25.033,
    lng: 121.565,
    phone: '🍔',
    google_rating: 5.0,
    google_reviews_count: 999,
    price_range: 1,
    cuisine_type: '美式快餐',
    michelin_stars: 0,
    bib_gourmand: false,
    has_500_dishes: false,
    photos: [],
    dietary_options: {},
  },
  {
    id: 'tutorial-soft-rice',
    name: '軟飯',
    address: '舒適圈1號',
    city: '躺平市',
    district: '佛系區',
    lat: 25.033,
    lng: 121.565,
    phone: '🍚',
    google_rating: 2.5,
    google_reviews_count: 42,
    price_range: 1,
    cuisine_type: '慵懶料理',
    michelin_stars: 0,
    bib_gourmand: false,
    has_500_dishes: false,
    photos: [],
    dietary_options: {},
  }
];

// Tutorial messages for each card
export const TUTORIAL_MESSAGES: { [key: string]: { instruction: string; direction: 'left' | 'right' } } = {
  'tutorial-crab-patty': {
    instruction: '往右滑 → 收藏喜歡的餐廳',
    direction: 'right'
  },
  'tutorial-soft-rice': {
    instruction: '← 往左滑跳過不感興趣的餐廳',
    direction: 'left'
  }
};

export const TUTORIAL_STORAGE_KEY = 'onboarding_completed_v1';
export const TUTORIAL_SKIPPED_KEY = 'onboarding_skipped';
