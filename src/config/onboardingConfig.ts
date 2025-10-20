export interface TutorialCard {
  id: string;
  type: 'swipe' | 'tip';
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
      name: '好吃粗飯',
      emoji: '🍚',
      description: '傳說中最難吃的食物，勇者才敢挑戰',
      rating: 1.5,
      reviewCount: '勇者限定',
      cuisine: '創意料理',
      badge: {
        text: '🫣 傳說黑暗料理',
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
    instruction: '點擊卡片可以查看餐廳詳細資訊',
    duration: 3000,
    animation: 'tap-pulse'
  },
  {
    id: 'filters',
    type: 'tip',
    instruction: '點這裡可以篩選價位、菜系和評分',
    duration: 2000,
    animation: 'arrow-up'
  }
];

export const TUTORIAL_STORAGE_KEY = 'onboarding_completed_v1';
export const TUTORIAL_SKIPPED_KEY = 'onboarding_skipped';
