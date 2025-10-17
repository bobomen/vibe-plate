import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TopRestaurantData {
  rank: 1 | 2 | 3;
  restaurantId?: string;
  restaurantName: string;
  photoIndex: number;
}

interface RestaurantOption {
  id: string;
  name: string;
}

interface TopRestaurantSelectorProps {
  rank: 1 | 2 | 3;
  uploadedPhotos: File[];
  restaurants: RestaurantOption[];
  value: TopRestaurantData | null;
  onChange: (data: TopRestaurantData | null) => void;
  disabled?: boolean;
}

const rankLabels = {
  1: { title: '🥇 Top 1', color: 'from-yellow-500/20 to-yellow-500/5' },
  2: { title: '🥈 Top 2', color: 'from-gray-400/20 to-gray-400/5' },
  3: { title: '🥉 Top 3', color: 'from-orange-600/20 to-orange-600/5' },
};

export const TopRestaurantSelector = ({
  rank,
  uploadedPhotos,
  restaurants,
  value,
  onChange,
  disabled = false,
}: TopRestaurantSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(
    value?.restaurantName || ''
  );
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(
    value?.photoIndex ?? -1
  );

  // Update parent when selection changes
  useEffect(() => {
    if (selectedRestaurant && selectedPhotoIndex >= 0) {
      const restaurantOption = restaurants.find(
        (r) => r.name === selectedRestaurant
      );
      onChange({
        rank,
        restaurantId: restaurantOption?.id,
        restaurantName: selectedRestaurant,
        photoIndex: selectedPhotoIndex,
      });
    } else {
      onChange(null);
    }
  }, [selectedRestaurant, selectedPhotoIndex, rank, restaurants, onChange]);

  const handleRestaurantSelect = (restaurantName: string) => {
    setSelectedRestaurant(restaurantName);
    setOpen(false);
  };

  const handlePhotoSelect = (index: string) => {
    setSelectedPhotoIndex(parseInt(index));
  };

  const { title, color } = rankLabels[rank];

  return (
    <Card className={`bg-gradient-to-br ${color} border-primary/20`}>
      <CardContent className="p-4 space-y-4">
        <h3 className="font-semibold text-lg">{title}</h3>

        {/* Restaurant Selector */}
        <div className="space-y-2">
          <Label htmlFor={`restaurant-${rank}`}>選擇餐廳</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={`restaurant-${rank}`}
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={disabled}
              >
                {selectedRestaurant || '選擇或輸入餐廳名稱...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="搜尋或輸入餐廳名稱..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        if (searchValue.trim()) {
                          handleRestaurantSelect(searchValue.trim());
                        }
                      }}
                    >
                      使用「{searchValue}」
                    </Button>
                  </CommandEmpty>
                  <CommandGroup>
                    {restaurants.map((restaurant) => (
                      <CommandItem
                        key={restaurant.id}
                        value={restaurant.name}
                        onSelect={handleRestaurantSelect}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedRestaurant === restaurant.name
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {restaurant.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Photo Selector */}
        {selectedRestaurant && (
          <div className="space-y-2">
            <Label>選擇代表照片</Label>
            <RadioGroup
              value={selectedPhotoIndex.toString()}
              onValueChange={handlePhotoSelect}
              className="grid grid-cols-3 gap-2"
              disabled={disabled}
            >
              {uploadedPhotos.map((file, index) => (
                <div key={index} className="relative">
                  <RadioGroupItem
                    value={index.toString()}
                    id={`photo-${rank}-${index}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`photo-${rank}-${index}`}
                    className={cn(
                      'flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-muted hover:border-primary transition-colors overflow-hidden',
                      selectedPhotoIndex === index &&
                        'border-primary ring-2 ring-primary ring-offset-2'
                    )}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`照片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedPhotoIndex === index && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-6 w-6 text-primary-foreground" />
                      </div>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Validation Message */}
        {!selectedRestaurant && (
          <p className="text-xs text-muted-foreground">請選擇餐廳名稱</p>
        )}
        {selectedRestaurant && selectedPhotoIndex < 0 && (
          <p className="text-xs text-muted-foreground">請選擇代表照片</p>
        )}
      </CardContent>
    </Card>
  );
};
