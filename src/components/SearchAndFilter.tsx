import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export interface FilterOptions {
  searchTerm: string;
  cuisineType: string;
  priceRange: number[];
  distanceRange: number;
  minRating: number;
  hasMichelinStars: boolean;
  has500Dishes: boolean;
}

interface SearchAndFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onSearch: () => void;
  resultsCount?: number;
}

const CUISINE_TYPES = [
  { value: '', label: '所有菜系' },
  { value: '日式', label: '日式料理' },
  { value: '中式', label: '中式料理' },
  { value: '西式', label: '西式料理' },
  { value: '韓式', label: '韓式料理' },
  { value: '泰式', label: '泰式料理' },
  { value: '其他', label: '其他料理' },
];

const DISTANCE_OPTIONS = [
  { value: 0.5, label: '500公尺' },
  { value: 1, label: '1公里' },
  { value: 2, label: '2公里' },
  { value: 5, label: '5公里' },
  { value: 999, label: '不限距離' },
];

const PRICE_LABELS = ['$', '$$', '$$$', '$$$$'];

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  resultsCount,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      cuisineType: '',
      priceRange: [1, 4],
      distanceRange: 999,
      minRating: 0,
      hasMichelinStars: false,
      has500Dishes: false,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.cuisineType) count++;
    if (filters.priceRange[0] > 1 || filters.priceRange[1] < 4) count++;
    if (filters.distanceRange < 999) count++;
    if (filters.minRating > 0) count++;
    if (filters.hasMichelinStars) count++;
    if (filters.has500Dishes) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b">
      <div className="p-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜尋餐廳名稱或地址..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filter Button and Active Filters */}
        <div className="flex items-center gap-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                篩選
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>篩選條件</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                {/* Cuisine Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">菜系類型</label>
                  <Select value={filters.cuisineType} onValueChange={(value) => handleFilterChange('cuisineType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇菜系" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUISINE_TYPES.map((cuisine) => (
                        <SelectItem key={cuisine.value} value={cuisine.value}>
                          {cuisine.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">價位範圍</label>
                  <div className="px-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => handleFilterChange('priceRange', value)}
                      max={4}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      {PRICE_LABELS.map((label, index) => (
                        <span key={label} className={
                          filters.priceRange[0] <= index + 1 && filters.priceRange[1] >= index + 1 
                            ? 'text-primary font-semibold' 
                            : ''
                        }>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Distance Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">距離範圍</label>
                  <Select value={filters.distanceRange.toString()} onValueChange={(value) => handleFilterChange('distanceRange', parseFloat(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇距離" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTANCE_OPTIONS.map((distance) => (
                        <SelectItem key={distance.value} value={distance.value.toString()}>
                          {distance.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Minimum Rating */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">最低評分: {filters.minRating > 0 ? filters.minRating.toFixed(1) : '不限'}</label>
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={(value) => handleFilterChange('minRating', value[0])}
                    max={5}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <Separator />

                {/* Special Tags */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">特殊標籤</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filters.hasMichelinStars ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('hasMichelinStars', !filters.hasMichelinStars)}
                    >
                      ⭐ 米其林星級
                    </Button>
                    <Button
                      variant={filters.has500Dishes ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('has500Dishes', !filters.has500Dishes)}
                    >
                      🏆 500盤認證
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={clearAllFilters} variant="outline" className="flex-1">
                    清除所有篩選
                  </Button>
                  <Button 
                    onClick={() => {
                      onSearch();
                      setIsFilterOpen(false);
                    }} 
                    className="flex-1"
                  >
                    套用篩選
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Results Count */}
          {resultsCount !== undefined && (
            <span className="text-sm text-muted-foreground">
              找到 {resultsCount} 間餐廳
            </span>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              清除篩選
            </Button>
          )}
        </div>

        {/* Active Filter Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {filters.searchTerm && (
              <Badge variant="secondary" className="text-xs">
                搜尋: {filters.searchTerm}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('searchTerm', '')}
                />
              </Badge>
            )}
            {filters.cuisineType && (
              <Badge variant="secondary" className="text-xs">
                {CUISINE_TYPES.find(c => c.value === filters.cuisineType)?.label}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('cuisineType', '')}
                />
              </Badge>
            )}
            {(filters.priceRange[0] > 1 || filters.priceRange[1] < 4) && (
              <Badge variant="secondary" className="text-xs">
                {PRICE_LABELS[filters.priceRange[0] - 1]} - {PRICE_LABELS[filters.priceRange[1] - 1]}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('priceRange', [1, 4])}
                />
              </Badge>
            )}
            {filters.distanceRange < 999 && (
              <Badge variant="secondary" className="text-xs">
                {DISTANCE_OPTIONS.find(d => d.value === filters.distanceRange)?.label}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('distanceRange', 999)}
                />
              </Badge>
            )}
            {filters.minRating > 0 && (
              <Badge variant="secondary" className="text-xs">
                評分 {filters.minRating}+
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('minRating', 0)}
                />
              </Badge>
            )}
            {filters.hasMichelinStars && (
              <Badge variant="secondary" className="text-xs">
                米其林星級
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('hasMichelinStars', false)}
                />
              </Badge>
            )}
            {filters.has500Dishes && (
              <Badge variant="secondary" className="text-xs">
                500盤認證
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('has500Dishes', false)}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilter;