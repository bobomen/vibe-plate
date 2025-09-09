import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { usePremium } from '@/hooks/usePremium';
import PremiumModal from '@/components/PremiumModal';

export interface FilterOptions {
  searchTerm: string;
  priceRange: number[];
  distanceRange: number;
  minRating: number;
  hasMichelinStars: boolean;
  has500Dishes: boolean;
  hasBibGourmand: boolean;
}

interface SearchAndFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onSearch: () => void;
  resultsCount?: number;
}

const DISTANCE_OPTIONS = [
  { value: 0.5, label: '500公尺內' },
  { value: 1, label: '1公里內' },
  { value: 2, label: '2公里內' },
  { value: 5, label: '5公里內' },
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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium } = usePremium();

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    // Allow basic filters (search, price, distance) for everyone
    if (key === 'searchTerm' || key === 'priceRange' || key === 'distanceRange') {
      onFiltersChange({
        ...filters,
        [key]: value,
      });
      return;
    }
    
    // Premium-only filters
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleFilterSheetOpen = (open: boolean) => {
    setIsFilterOpen(open);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      priceRange: [1, 4],
      distanceRange: 999,
      minRating: 0,
      hasMichelinStars: false,
      has500Dishes: false,
      hasBibGourmand: false,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.priceRange[0] > 1 || filters.priceRange[1] < 4) count++;
    if (filters.distanceRange < 999) count++;
    if (filters.minRating > 0) count++;
    if (filters.hasMichelinStars) count++;
    if (filters.has500Dishes) count++;
    if (filters.hasBibGourmand) count++;
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
          <Sheet open={isFilterOpen} onOpenChange={handleFilterSheetOpen}>
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
            <SheetContent side="bottom" className="h-[85vh] bg-background z-[100] border-t">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-lg font-semibold">篩選條件</SheetTitle>
              </SheetHeader>
              <div className="py-2 space-y-6 overflow-y-auto max-h-[calc(85vh-100px)]">
                
                {/* Distance Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">📍 離使用者的距離</label>
                  <Select value={filters.distanceRange.toString()} onValueChange={(value) => handleFilterChange('distanceRange', parseFloat(value))}>
                    <SelectTrigger className="bg-background border-input">
                      <SelectValue placeholder="選擇距離範圍" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-input z-[110]">
                      {DISTANCE_OPTIONS.map((distance) => (
                        <SelectItem key={distance.value} value={distance.value.toString()}>
                          {distance.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">💰 價格範圍</label>
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

                {/* Premium Features with Blur Overlay */}
                <div className="relative">
                  {/* Minimum Rating - Google 4+ stars */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">⭐ Google評分</label>
                      <Button
                        variant={filters.minRating >= 4.0 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('minRating', filters.minRating >= 4.0 ? 0 : 4.0)}
                        className="h-8"
                      >
                        {filters.minRating >= 4.0 ? '✓ 四顆星以上' : '四顆星以上'}
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Special Recognition */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-foreground">🏆 特殊認證</label>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        variant={filters.has500Dishes ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('has500Dishes', !filters.has500Dishes)}
                        className="justify-start h-12 text-left"
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-3">🍽️</span>
                          <div>
                            <div className="font-medium">500盤</div>
                            <div className="text-xs opacity-70">台灣500盤認證餐廳</div>
                          </div>
                          {filters.has500Dishes && <span className="ml-auto">✓</span>}
                        </div>
                      </Button>
                      
                      <Button
                        variant={filters.hasMichelinStars ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('hasMichelinStars', !filters.hasMichelinStars)}
                        className="justify-start h-12 text-left"
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-3">⭐</span>
                          <div>
                            <div className="font-medium">米其林星級</div>
                            <div className="text-xs opacity-70">米其林指南星級餐廳</div>
                          </div>
                          {filters.hasMichelinStars && <span className="ml-auto">✓</span>}
                        </div>
                      </Button>
                      
                      <Button
                        variant={filters.hasBibGourmand ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('hasBibGourmand', !filters.hasBibGourmand)}
                        className="justify-start h-12 text-left"
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-3">🍴</span>
                          <div>
                            <div className="font-medium">必比登推介</div>
                            <div className="text-xs opacity-70">米其林必比登推介餐廳</div>
                          </div>
                          {filters.hasBibGourmand && <span className="ml-auto">✓</span>}
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Premium blur overlay for advanced filters only */}
                  {!isPremium && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg border border-border/50">
                      <div className="text-center p-6 bg-card rounded-lg shadow-lg border max-w-sm mx-4">
                        <div className="text-2xl mb-3">🔒</div>
                        <h3 className="text-lg font-semibold mb-2">會員專屬功能</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          評分與特殊認證篩選僅限會員使用
                        </p>
                        <Button 
                          onClick={() => setShowPremiumModal(true)}
                          className="w-full"
                          size="sm"
                        >
                          立即升級
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">💰 價格範圍</label>
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

                {/* Minimum Rating - Google 4+ stars */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">⭐ Google評分</label>
                    <Button
                      variant={filters.minRating >= 4.0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('minRating', filters.minRating >= 4.0 ? 0 : 4.0)}
                      className="h-8"
                    >
                      {filters.minRating >= 4.0 ? '✓ 四顆星以上' : '四顆星以上'}
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Special Recognition */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-foreground">🏆 特殊認證</label>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant={filters.has500Dishes ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('has500Dishes', !filters.has500Dishes)}
                      className="justify-start h-12 text-left"
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">🍽️</span>
                        <div>
                          <div className="font-medium">500盤</div>
                          <div className="text-xs opacity-70">台灣500盤認證餐廳</div>
                        </div>
                        {filters.has500Dishes && <span className="ml-auto">✓</span>}
                      </div>
                    </Button>
                    
                    <Button
                      variant={filters.hasMichelinStars ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('hasMichelinStars', !filters.hasMichelinStars)}
                      className="justify-start h-12 text-left"
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">⭐</span>
                        <div>
                          <div className="font-medium">米其林星級</div>
                          <div className="text-xs opacity-70">米其林指南星級餐廳</div>
                        </div>
                        {filters.hasMichelinStars && <span className="ml-auto">✓</span>}
                      </div>
                    </Button>
                    
                    <Button
                      variant={filters.hasBibGourmand ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('hasBibGourmand', !filters.hasBibGourmand)}
                      className="justify-start h-12 text-left"
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">🍴</span>
                        <div>
                          <div className="font-medium">必比登推介</div>
                          <div className="text-xs opacity-70">米其林必比登推介餐廳</div>
                        </div>
                        {filters.hasBibGourmand && <span className="ml-auto">✓</span>}
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 pb-4">
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
                    套用篩選 ({getActiveFiltersCount()})
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
            {filters.hasBibGourmand && (
              <Badge variant="secondary" className="text-xs">
                必比登推介
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('hasBibGourmand', false)}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <PremiumModal 
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => setShowPremiumModal(false)}
      />
    </div>
  );
};

export default SearchAndFilter;