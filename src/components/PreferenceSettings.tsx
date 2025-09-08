import { useState } from 'react';
import { ChefHat, DollarSign, Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PreferenceSettingsProps {
  preferences: {
    dietary_preferences: string[];
    preferred_price_min: number;
    preferred_price_max: number;
    favorite_cuisines: string[];
    preferences: {
      michelin_stars: boolean;
      bib_gourmand: boolean;
      has_500_dishes: boolean;
    };
  };
  onUpdate: (preferences: any) => Promise<void>;
}

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: '素食', icon: '🥬' },
  { id: 'vegan', label: '純素', icon: '🌱' },
  { id: 'halal', label: '清真', icon: '☪️' },
  { id: 'kosher', label: '猶太潔食', icon: '✡️' },
  { id: 'gluten_free', label: '無麩質', icon: '🌾' },
  { id: 'dairy_free', label: '無乳製品', icon: '🥛' },
];

const CUISINE_OPTIONS = [
  { id: 'chinese', label: '中式', icon: '🥢' },
  { id: 'japanese', label: '日式', icon: '🍣' },
  { id: 'korean', label: '韓式', icon: '🍲' },
  { id: 'italian', label: '義式', icon: '🍝' },
  { id: 'french', label: '法式', icon: '🥐' },
  { id: 'american', label: '美式', icon: '🍔' },
  { id: 'thai', label: '泰式', icon: '🍛' },
  { id: 'indian', label: '印度', icon: '🍛' },
  { id: 'mexican', label: '墨西哥', icon: '🌮' },
  { id: 'mediterranean', label: '地中海', icon: '🫒' },
];

const PRICE_LABELS = ['$', '$$', '$$$', '$$$$'];

export const PreferenceSettings = ({ preferences, onUpdate }: PreferenceSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([preferences.preferred_price_min, preferences.preferred_price_max]);

  const toggleDietaryPreference = (preferenceId: string) => {
    const updated = preferences.dietary_preferences.includes(preferenceId)
      ? preferences.dietary_preferences.filter(p => p !== preferenceId)
      : [...preferences.dietary_preferences, preferenceId];
    
    handleUpdate({ dietary_preferences: updated });
  };

  const toggleCuisine = (cuisineId: string) => {
    const updated = preferences.favorite_cuisines.includes(cuisineId)
      ? preferences.favorite_cuisines.filter(c => c !== cuisineId)
      : [...preferences.favorite_cuisines, cuisineId];
    
    handleUpdate({ favorite_cuisines: updated });
  };

  const updatePreference = (key: string, value: boolean) => {
    handleUpdate({
      preferences: {
        ...preferences.preferences,
        [key]: value
      }
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    handleUpdate({
      preferred_price_min: values[0],
      preferred_price_max: values[1]
    });
  };

  const handleUpdate = async (updates: any) => {
    setLoading(true);
    try {
      await onUpdate(updates);
    } catch (error) {
      toast({
        title: "更新失敗",
        description: "無法更新偏好設定，請重試",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          飲食偏好
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dietary Preferences */}
        <div>
          <Label className="text-base font-medium">飲食限制</Label>
          <p className="text-sm text-muted-foreground mb-3">選擇您的飲食需求</p>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((option) => (
              <Badge
                key={option.id}
                variant={preferences.dietary_preferences.includes(option.id) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => toggleDietaryPreference(option.id)}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-base font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            價位偏好
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            從 {PRICE_LABELS[priceRange[0] - 1]} 到 {PRICE_LABELS[priceRange[1] - 1]}
          </p>
          <Slider
            value={priceRange}
            onValueChange={handlePriceRangeChange}
            min={1}
            max={4}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            {PRICE_LABELS.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>
        </div>

        {/* Favorite Cuisines */}
        <div>
          <Label className="text-base font-medium">喜愛菜系</Label>
          <p className="text-sm text-muted-foreground mb-3">選擇您偏好的料理類型</p>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((cuisine) => (
              <Badge
                key={cuisine.id}
                variant={preferences.favorite_cuisines.includes(cuisine.id) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => toggleCuisine(cuisine.id)}
              >
                <span className="mr-1">{cuisine.icon}</span>
                {cuisine.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Special Preferences */}
        <div>
          <Label className="text-base font-medium">特殊偏好</Label>
          <p className="text-sm text-muted-foreground mb-3">選擇您感興趣的餐廳特色</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>米其林星級餐廳</span>
              </div>
              <Switch
                checked={preferences.preferences.michelin_stars}
                onCheckedChange={(checked) => updatePreference('michelin_stars', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-600" />
                <span>米其林必比登推介</span>
              </div>
              <Switch
                checked={preferences.preferences.bib_gourmand}
                onCheckedChange={(checked) => updatePreference('bib_gourmand', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-blue-600" />
                <span>500盤推薦餐廳</span>
              </div>
              <Switch
                checked={preferences.preferences.has_500_dishes}
                onCheckedChange={(checked) => updatePreference('has_500_dishes', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};