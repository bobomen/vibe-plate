import { useState } from 'react';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { SearchedRestaurant } from '@/types/claimRestaurant';

interface SearchStepProps {
  onSelectRestaurant: (restaurant: SearchedRestaurant) => void;
  onCreateNew: () => void;
}

export function SearchStep({ onSelectRestaurant, onCreateNew }: SearchStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedRestaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, address, city, district, cuisine_type, phone')
        .or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">搜尋您的餐廳</h2>
        <p className="text-muted-foreground">
          請輸入餐廳名稱或地址進行搜尋
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="餐廳名稱或地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
          {isSearching ? '搜尋中...' : '搜尋'}
        </Button>
      </div>

      {hasSearched && (
        <div className="space-y-4">
          {searchResults.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                找到 {searchResults.length} 個結果
              </p>
              <div className="space-y-2">
                {searchResults.map((restaurant) => (
                  <Card
                    key={restaurant.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => onSelectRestaurant(restaurant)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {restaurant.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {restaurant.address}
                        </p>
                        {restaurant.cuisine_type && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {restaurant.cuisine_type}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-6 text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-foreground font-medium">找不到您的餐廳？</p>
                  <p className="text-sm text-muted-foreground">
                    如果搜尋結果中沒有您的餐廳，您可以創建一個新的餐廳資料
                  </p>
                </div>
                <Button onClick={onCreateNew} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  創建新餐廳
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!hasSearched && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              輸入餐廳名稱或地址開始搜尋
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
