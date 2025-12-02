export const CUISINE_OPTIONS = [
  { id: 'chinese', label: '中式', icon: '🥢' },
  { id: 'taiwanese', label: '台式', icon: '🍜' },
  { id: 'japanese', label: '日式', icon: '🍣' },
  { id: 'korean', label: '韓式', icon: '🍲' },
  { id: 'thai', label: '泰式', icon: '🍛' },
  { id: 'american', label: '美式', icon: '🍔' },
  { id: 'italian', label: '義式', icon: '🍝' },
  { id: 'french', label: '法式', icon: '🥐' },
  { id: 'mediterranean', label: '地中海', icon: '🫒' },
  { id: 'other', label: '其他', icon: '🍴' },
] as const;

export type CuisineType = typeof CUISINE_OPTIONS[number]['id'];

// 輔助函數：取得顯示標籤
export const getCuisineLabel = (id: string): string => {
  return CUISINE_OPTIONS.find(c => c.id === id)?.label || id;
};

// 輔助函數：取得 icon
export const getCuisineIcon = (id: string): string => {
  return CUISINE_OPTIONS.find(c => c.id === id)?.icon || '🍴';
};
