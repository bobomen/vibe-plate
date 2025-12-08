import React, { useState, useEffect } from 'react';
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
import { useOnboarding } from '@/hooks/useOnboarding';
import { ContextualTip } from '@/components/Onboarding/ContextualTip';
import { CUISINE_OPTIONS } from '@/config/cuisineTypes';
import { PRICE_RANGE_OPTIONS } from '@/config/priceRanges';

export interface FilterOptions {
  searchTerm: string;
  priceRange: number[];
  distanceRange: number;
  minRating: number;
  hasMichelinStars: boolean;
  has500Dishes: boolean;
  hasBibGourmand: boolean;
  cuisineTypes: string[];
  dietaryOptions: string[];
  cities: string[];
  districts: string[];
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

// Price range now uses 1-5 levels instead of 0-10 slider

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: '素食', icon: '🥬' },
  { id: 'vegan', label: '純素', icon: '🌱' },
  { id: 'halal', label: '清真', icon: '☪️' },
  { id: 'gluten_free', label: '無麩質', icon: '🌾' },
];

const CITY_OPTIONS = [
  { id: '台北市', label: '台北市' },
  { id: '新北市', label: '新北市' },
  { id: '基隆市', label: '基隆市' },
  { id: '桃園市', label: '桃園市' },
  { id: '新竹市', label: '新竹市' },
  { id: '新竹縣', label: '新竹縣' },
  { id: '苗栗縣', label: '苗栗縣' },
  { id: '台中市', label: '台中市' },
  { id: '彰化縣', label: '彰化縣' },
  { id: '南投縣', label: '南投縣' },
  { id: '雲林縣', label: '雲林縣' },
  { id: '嘉義市', label: '嘉義市' },
  { id: '嘉義縣', label: '嘉義縣' },
  { id: '台南市', label: '台南市' },
  { id: '高雄市', label: '高雄市' },
  { id: '屏東縣', label: '屏東縣' },
  { id: '宜蘭縣', label: '宜蘭縣' },
  { id: '花蓮縣', label: '花蓮縣' },
  { id: '台東縣', label: '台東縣' },
  { id: '澎湖縣', label: '澎湖縣' },
  { id: '金門縣', label: '金門縣' },
  { id: '連江縣', label: '連江縣' },
];

// Mapping from city to districts
const DISTRICT_OPTIONS: { [city: string]: Array<{ id: string; label: string }> } = {
  '台北市': [
    { id: '中正區', label: '中正區' },
    { id: '大同區', label: '大同區' },
    { id: '中山區', label: '中山區' },
    { id: '松山區', label: '松山區' },
    { id: '大安區', label: '大安區' },
    { id: '萬華區', label: '萬華區' },
    { id: '信義區', label: '信義區' },
    { id: '士林區', label: '士林區' },
    { id: '北投區', label: '北投區' },
    { id: '內湖區', label: '內湖區' },
    { id: '南港區', label: '南港區' },
    { id: '文山區', label: '文山區' },
  ],
  // Add more districts for other cities as needed
};

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  resultsCount,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium, upgradeToPremium } = usePremium();
  const { showFilterTip, markFilterTipSeen } = useOnboarding();
  const [showFilterTooltip, setShowFilterTooltip] = useState(false);

  // ✅ 當篩選打開且首次使用時顯示教學訊息
  useEffect(() => {
    if (isFilterOpen && showFilterTip) {
      setShowFilterTooltip(true);
    }
  }, [isFilterOpen, showFilterTip]);

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

  const toggleCuisineFilter = (cuisineId: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    const updated = filters.cuisineTypes.includes(cuisineId)
      ? filters.cuisineTypes.filter(c => c !== cuisineId)
      : [...filters.cuisineTypes, cuisineId];
    handleFilterChange('cuisineTypes', updated);
  };

  const toggleDietaryFilter = (dietaryId: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    const updated = filters.dietaryOptions.includes(dietaryId)
      ? filters.dietaryOptions.filter(d => d !== dietaryId)
      : [...filters.dietaryOptions, dietaryId];
    handleFilterChange('dietaryOptions', updated);
  };

  const toggleCityFilter = (cityId: string) => {
    const updated = filters.cities.includes(cityId)
      ? filters.cities.filter(c => c !== cityId)
      : [...filters.cities, cityId];
    
    // Clear districts if the city is removed
    let updatedDistricts = filters.districts;
    if (!updated.includes(cityId)) {
      const cityDistricts = DISTRICT_OPTIONS[cityId]?.map(d => d.id) || [];
      updatedDistricts = filters.districts.filter(d => !cityDistricts.includes(d));
    }
    
    onFiltersChange({
      ...filters,
      cities: updated,
      districts: updatedDistricts,
    });
  };

  const toggleDistrictFilter = (districtId: string) => {
    const updated = filters.districts.includes(districtId)
      ? filters.districts.filter(d => d !== districtId)
      : [...filters.districts, districtId];
    handleFilterChange('districts', updated);
  };

  const handleFilterSheetOpen = (open: boolean) => {
    setIsFilterOpen(open);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      priceRange: [1, 5],
      distanceRange: 999,
      minRating: 0,
      hasMichelinStars: false,
      has500Dishes: false,
      hasBibGourmand: false,
      cuisineTypes: [],
      dietaryOptions: [],
      cities: [],
      districts: [],
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.priceRange[0] > 1 || filters.priceRange[1] < 5) count++;
    if (filters.distanceRange < 999) count++;
    if (filters.minRating > 0) count++;
    if (filters.hasMichelinStars) count++;
    if (filters.has500Dishes) count++;
    if (filters.hasBibGourmand) count++;
    if (filters.cuisineTypes.length > 0) count++;
    if (filters.dietaryOptions.length > 0) count++;
    if (filters.cities.length > 0) count++;
    if (filters.districts.length > 0) count++;
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

                <Separator className="my-4" />

                {/* City Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">🏙️ 城市篩選</label>
                  <div className="flex flex-wrap gap-2">
                    {CITY_OPTIONS.map((city) => (
                      <Badge
                        key={city.id}
                        variant={filters.cities.includes(city.id) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => toggleCityFilter(city.id)}
                      >
                        {city.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* District Filter (only show if cities are selected) */}
                {filters.cities.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">📍 區域篩選</label>
                    <div className="flex flex-wrap gap-2">
                      {filters.cities.flatMap(city => 
                        (DISTRICT_OPTIONS[city] || []).map((district) => (
                          <Badge
                            key={`${city}-${district.id}`}
                            variant={filters.districts.includes(district.id) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => toggleDistrictFilter(district.id)}
                          >
                            {district.label}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">💰 價格範圍</label>
                  <div className="px-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => handleFilterChange('priceRange', value)}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      {PRICE_RANGE_OPTIONS.map((option) => (
                        <span 
                          key={option.id}
                          className={filters.priceRange[0] <= option.id && filters.priceRange[1] >= option.id ? 'text-primary font-semibold' : ''}
                        >
                          {option.shortLabel}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-center text-sm text-foreground">
                      選擇範圍: {PRICE_RANGE_OPTIONS.find(o => o.id === filters.priceRange[0])?.label || '$0-200'} - {PRICE_RANGE_OPTIONS.find(o => o.id === filters.priceRange[1])?.label || '$1200+'}
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

                  {/* Cuisine Types */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">🍽️ 菜系類型</label>
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_OPTIONS.map((cuisine) => (
                        <Badge
                          key={cuisine.id}
                          variant={filters.cuisineTypes.includes(cuisine.id) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={() => toggleCuisineFilter(cuisine.id)}
                        >
                          <span className="mr-1">{cuisine.icon}</span>
                          {cuisine.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Dietary Options */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">🥗 飲食限制</label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((dietary) => (
                        <Badge
                          key={dietary.id}
                          variant={filters.dietaryOptions.includes(dietary.id) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={() => toggleDietaryFilter(dietary.id)}
                        >
                          <span className="mr-1">{dietary.icon}</span>
                          {dietary.label}
                        </Badge>
                      ))}
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
                          onClick={upgradeToPremium}
                          className="w-full"
                          size="sm"
                        >
                          立即升級
                        </Button>
                      </div>
                    </div>
                  )}
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
            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10) && (
              <Badge variant="secondary" className="text-xs">
                ${filters.priceRange[0] * 100} - {filters.priceRange[1] === 10 ? '$1000+' : `$${filters.priceRange[1] * 100}`}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('priceRange', [0, 10])}
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
            {filters.cuisineTypes.map((cuisineId) => {
              const cuisine = CUISINE_OPTIONS.find(c => c.id === cuisineId);
              return cuisine ? (
                <Badge key={cuisineId} variant="secondary" className="text-xs">
                  {cuisine.icon} {cuisine.label}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleCuisineFilter(cuisineId)}
                  />
                </Badge>
              ) : null;
            })}
            {filters.dietaryOptions.map((dietaryId) => {
              const dietary = DIETARY_OPTIONS.find(d => d.id === dietaryId);
              return dietary ? (
                <Badge key={dietaryId} variant="secondary" className="text-xs">
                  {dietary.icon} {dietary.label}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleDietaryFilter(dietaryId)}
                  />
                </Badge>
              ) : null;
            })}
            {filters.cities.map((cityId) => {
              const city = CITY_OPTIONS.find(c => c.id === cityId);
              return city ? (
                <Badge key={cityId} variant="secondary" className="text-xs">
                  {city.label}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleCityFilter(cityId)}
                  />
                </Badge>
              ) : null;
            })}
            {filters.districts.map((districtId) => (
              <Badge key={districtId} variant="secondary" className="text-xs">
                📍 {districtId}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => toggleDistrictFilter(districtId)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <PremiumModal 
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={async () => {
          try {
            await upgradeToPremium();
            setShowPremiumModal(false);
          } catch (error) {
            console.error('Upgrade failed:', error);
          }
        }}
      />
      
      {/* Contextual Tip for First Time Filter */}
      {showFilterTooltip && (
        <ContextualTip
          message="這裡可以篩選價位、菜系和評分！"
          direction="down"
          onClose={() => {
            markFilterTipSeen();
            setShowFilterTooltip(false);
          }}
        />
      )}
    </div>
  );
};

export default SearchAndFilter;