/**
 * 價格等級配置
 * 用於餐廳資料編輯、滑卡顯示、篩選器
 */
export interface PriceRangeOption {
  id: number;
  label: string;
  shortLabel: string;
  description: string;
  minPrice: number;
  maxPrice: number | null; // null 表示無上限
}

export const PRICE_RANGE_OPTIONS: PriceRangeOption[] = [
  {
    id: 1,
    label: '$0-200',
    shortLabel: '$',
    description: '平價美食',
    minPrice: 0,
    maxPrice: 200,
  },
  {
    id: 2,
    label: '$200-500',
    shortLabel: '$$',
    description: '中等消費',
    minPrice: 200,
    maxPrice: 500,
  },
  {
    id: 3,
    label: '$500-800',
    shortLabel: '$$$',
    description: '中高消費',
    minPrice: 500,
    maxPrice: 800,
  },
  {
    id: 4,
    label: '$800-1200',
    shortLabel: '$$$$',
    description: '高級餐廳',
    minPrice: 800,
    maxPrice: 1200,
  },
  {
    id: 5,
    label: '$1200+',
    shortLabel: '$$$$$',
    description: '頂級餐廳',
    minPrice: 1200,
    maxPrice: null,
  },
];

/**
 * 根據 price_range ID 獲取顯示標籤
 */
export function getPriceRangeLabel(priceRange: number | null | undefined): string {
  if (!priceRange) return '';
  const option = PRICE_RANGE_OPTIONS.find(o => o.id === priceRange);
  return option?.label || '';
}

/**
 * 根據 price_range ID 獲取簡短標籤（用於 Badge 顯示）
 */
export function getPriceRangeShortLabel(priceRange: number | null | undefined): string {
  if (!priceRange) return '';
  const option = PRICE_RANGE_OPTIONS.find(o => o.id === priceRange);
  return option?.shortLabel || '';
}
