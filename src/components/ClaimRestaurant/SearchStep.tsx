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
        <h2 className="text-2xl font-bold text-foreground">搜索您的餐厅</h2>
        <p className="text-muted-foreground">
          请输入餐厅名称或地址进行搜索
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="餐厅名称或地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
          {isSearching ? '搜索中...' : '搜索'}
        </Button>
      </div>

      {hasSearched && (
        <div className="space-y-4">
          {searchResults.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                找到 {searchResults.length} 个结果
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
                  <p className="text-foreground font-medium">找不到您的餐厅？</p>
                  <p className="text-sm text-muted-foreground">
                    如果搜索结果中没有您的餐厅，您可以创建一个新的餐厅资料
                  </p>
                </div>
                <Button onClick={onCreateNew} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  创建新餐厅
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
              输入餐厅名称或地址开始搜索
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
