export interface TutorialCard {
  id: string;
  type: 'swipe' | 'tip' | 'premium';
  restaurant?: {
    name: string;
    emoji: string;
    description: string;
    rating: number;
    reviewCount: string;
    cuisine: string;
    badge?: {
      text: string;
      color: string;
    };
  };
  instruction: string;
  direction?: 'left' | 'right';
  duration: number;
  animation?: string;
}

export const ONBOARDING_CARDS: TutorialCard[] = [
  {
    id: 'swipe-right',
    type: 'swipe',
    restaurant: {
      name: '美味蟹堡',
      emoji: '🍔',
      description: '海綿寶寶的獨家秘方！派大星也超愛',
      rating: 5.0,
      reviewCount: '999+ 比奇堡居民推薦',
      cuisine: '美式快餐',
      badge: {
        text: '⭐ 卡通經典',
        color: 'bg-yellow-500'
      }
    },
    instruction: '往右滑 → 收藏喜歡的餐廳',
    direction: 'right',
    duration: 10000
  },
  {
    id: 'swipe-left',
    type: 'swipe',
    restaurant: {
      name: '軟飯',
      emoji: '🍚',
      description: '專為現代人設計的舒適餐點，讓你躺平享受',
      rating: 2.5,
      reviewCount: '佛系美食家推薦',
      cuisine: '慵懶料理',
      badge: {
        text: '😌 躺平專用',
        color: 'bg-purple-600'
      }
    },
    instruction: '← 往左滑跳過不感興趣的餐廳',
    direction: 'left',
    duration: 7000
  },
  {
    id: 'tap-details',
    type: 'tip',
    instruction: '💡 點擊卡片可以查看餐廳詳細資訊（地圖、營業時間等）',
    duration: 3000,
    animation: 'tap-pulse'
  },
  {
    id: 'premium-teaser',
    type: 'premium',
    instruction: '想反悔？Premium 可以無限回到上一張！',
    duration: 5000,
    animation: 'sparkle'
  }
];

export const TUTORIAL_STORAGE_KEY = 'onboarding_completed_v1';
export const TUTORIAL_SKIPPED_KEY = 'onboarding_skipped';
