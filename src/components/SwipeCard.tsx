import React, { memo, useState, useCallback } from 'react';
import { Heart, X, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/LazyImage';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  google_rating: number;
  google_reviews_count: number;
  michelin_stars: number;
  has_500_dishes: boolean;
  photos: string[];
  cuisine_type: string;
  price_range: number;
  bib_gourmand: boolean;
}

interface SwipeCardProps {
  restaurant: Restaurant;
  distance: number | null;
  onSwipe: (liked: boolean) => void;
  onCardClick: () => void;
  swipeDirection: 'left' | 'right' | null;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  isOnboarding?: boolean;
  onboardingStep?: 1 | 2;
}

export const SwipeCard = memo(({
  restaurant,
  distance,
  onSwipe,
  onCardClick,
  swipeDirection,
  isDragging,
  dragOffset,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  isOnboarding,
  onboardingStep
}: SwipeCardProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const photos = restaurant.photos?.slice(0, 3) || ['/placeholder.svg'];

  const nextPhoto = useCallback(() => {
    setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSwipe(true);
  }, [onSwipe]);

  const handleDislikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSwipe(false);
  }, [onSwipe]);

  return (
    <Card 
      className={`relative w-full max-w-sm mx-auto bg-card shadow-xl border-0 overflow-hidden cursor-pointer transition-all duration-300 ${
        swipeDirection === 'right' ? 'transform rotate-12 translate-x-full opacity-0' : 
        swipeDirection === 'left' ? 'transform -rotate-12 -translate-x-full opacity-0' : 
        isDragging ? `transform rotate-${dragOffset.x > 0 ? '3' : '-3'} translate-x-${Math.abs(dragOffset.x) / 10}` : ''
      }`}
      style={{
        transform: isDragging ? 
          `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)` : 
          undefined
      }}
      onClick={onCardClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe Indicators */}
      {isDragging && (
        <>
          <div className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200 ${
            dragOffset.x > 50 ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg transform rotate-12">
              喜歡
            </div>
          </div>
          <div className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200 ${
            dragOffset.x < -50 ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg transform -rotate-12">
              跳過
            </div>
          </div>
        </>
      )}

      {/* Image Section */}
      <div className="relative h-80 overflow-hidden card-content">
        <LazyImage
          src={photos[currentPhotoIndex]}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        
        {/* Photo Navigation */}
        {photos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Photo indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 z-20">
              {photos.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Special badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-20">
          {restaurant.michelin_stars > 0 && (
            <Badge className="bg-yellow-500 text-black font-semibold">
              <Star className="h-3 w-3 mr-1 fill-current" />
              {restaurant.michelin_stars} 米其林星
            </Badge>
          )}
          {restaurant.bib_gourmand && (
            <Badge className="bg-red-600 text-white font-semibold">
              必比登推介
            </Badge>
          )}
          {restaurant.has_500_dishes && (
            <Badge className="bg-purple-600 text-white font-semibold">
              饕客精選
            </Badge>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 card-content">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1 line-clamp-1">
              {restaurant.name}
            </h2>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {restaurant.cuisine_type}
            </p>
          </div>
          <div className="text-right ml-4">
            <div className="flex items-center gap-1 text-sm text-amber-600 font-medium">
              <Star className="h-4 w-4 fill-current" />
              {restaurant.google_rating?.toFixed(1) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {restaurant.google_reviews_count || 0} 評論
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{restaurant.address}</span>
          {distance && (
            <span className="text-xs bg-secondary px-2 py-1 rounded">
              {distance.toFixed(1)}km
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all ${
              isOnboarding && onboardingStep === 2 
                ? 'animate-pulse ring-4 ring-destructive/30 ring-offset-2 ring-offset-background' 
                : ''
            }`}
            onClick={handleDislikeClick}
          >
            <X className="h-5 w-5 text-red-500" />
          </Button>
          
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">價位：</span>
            <span className="text-sm font-medium text-primary">
              {(() => {
                const priceRanges = [
                  '$0-100', '$100-200', '$200-300', '$300+'
                ];
                return priceRanges[Math.min(restaurant.price_range - 1, 3)] || '$0-100';
              })()}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all ${
              isOnboarding && onboardingStep === 1 
                ? 'animate-pulse ring-4 ring-green-300 ring-offset-2 ring-offset-background' 
                : ''
            }`}
            onClick={handleLikeClick}
          >
            <Heart className="h-5 w-5 text-green-500" />
          </Button>
        </div>
      </div>
    </Card>
  );
});

SwipeCard.displayName = 'SwipeCard';