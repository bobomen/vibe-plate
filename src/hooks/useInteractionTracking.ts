import { useState, useCallback, useRef } from 'react';

/**
 * Interaction metadata structure
 * Extensible for Phase 2, 3, etc.
 */
export interface InteractionMetadata {
  // Phase 1: Card interaction
  card_view_duration_ms?: number;
  photos_viewed?: number[];
  photos_view_count?: number;
  
  // Phase 2: Hesitation and detail page (future)
  hesitation_count?: number;
  detail_interactions?: {
    clicked_phone?: boolean;
    clicked_map?: boolean;
    clicked_website?: boolean;
    clicked_menu?: boolean;
    view_duration_ms?: number;
  };
  
  // Phase 3: Time context (future)
  time_context?: {
    hour_of_day?: number;
    day_of_week?: number;
    is_meal_time?: boolean;
  };
}

/**
 * Hook for tracking user interactions with restaurant cards
 * 
 * Usage:
 * ```tsx
 * const tracking = useInteractionTracking();
 * 
 * // Start tracking when card is shown
 * tracking.startCardView();
 * 
 * // Track photo views
 * tracking.trackPhotoView(photoIndex);
 * 
 * // Get metadata when user swipes
 * const metadata = tracking.endCardView();
 * ```
 */
export function useInteractionTracking() {
  const [metadata, setMetadata] = useState<InteractionMetadata>({});
  const cardViewStartTime = useRef<number | null>(null);
  const photosViewed = useRef<Set<number>>(new Set());

  /**
   * Start tracking card view
   * Called when a new card is displayed
   */
  const startCardView = useCallback(() => {
    cardViewStartTime.current = Date.now();
    photosViewed.current = new Set();
    setMetadata({});
  }, []);

  /**
   * Track photo view
   * Called when user views a specific photo in the carousel
   */
  const trackPhotoView = useCallback((photoIndex: number) => {
    if (photoIndex >= 0) {
      photosViewed.current.add(photoIndex);
    }
  }, []);

  /**
   * End tracking and return metadata
   * Called when user swipes (like or dislike)
   */
  const endCardView = useCallback((): InteractionMetadata => {
    const viewDuration = cardViewStartTime.current 
      ? Date.now() - cardViewStartTime.current 
      : 0;

    const finalMetadata: InteractionMetadata = {
      card_view_duration_ms: viewDuration,
      photos_viewed: Array.from(photosViewed.current).sort((a, b) => a - b),
      photos_view_count: photosViewed.current.size,
    };

    // Reset for next card
    cardViewStartTime.current = null;
    photosViewed.current = new Set();

    return finalMetadata;
  }, []);

  /**
   * Reset tracking (e.g., when user navigates away)
   */
  const resetTracking = useCallback(() => {
    cardViewStartTime.current = null;
    photosViewed.current = new Set();
    setMetadata({});
  }, []);

  /**
   * Get current tracking state (for debugging)
   */
  const getCurrentState = useCallback((): InteractionMetadata => {
    const viewDuration = cardViewStartTime.current 
      ? Date.now() - cardViewStartTime.current 
      : 0;

    return {
      card_view_duration_ms: viewDuration,
      photos_viewed: Array.from(photosViewed.current).sort((a, b) => a - b),
      photos_view_count: photosViewed.current.size,
    };
  }, []);

  return {
    startCardView,
    trackPhotoView,
    endCardView,
    resetTracking,
    getCurrentState,
    metadata,
  };
}

/**
 * Validate interaction metadata before saving to database
 */
export function validateInteractionMetadata(metadata: InteractionMetadata): boolean {
  // Duration should be reasonable (< 5 minutes)
  if (metadata.card_view_duration_ms && metadata.card_view_duration_ms > 300000) {
    console.warn('⚠️ Card view duration exceeds 5 minutes:', metadata.card_view_duration_ms);
    return false;
  }

  // Photo count should match array length
  if (metadata.photos_viewed && metadata.photos_view_count !== undefined) {
    if (metadata.photos_viewed.length !== metadata.photos_view_count) {
      console.warn('⚠️ Photos viewed count mismatch:', {
        array_length: metadata.photos_viewed.length,
        count: metadata.photos_view_count,
      });
      return false;
    }
  }

  // Photo indices should be non-negative
  if (metadata.photos_viewed) {
    const hasInvalidIndex = metadata.photos_viewed.some(idx => idx < 0);
    if (hasInvalidIndex) {
      console.warn('⚠️ Invalid photo index found:', metadata.photos_viewed);
      return false;
    }
  }

  return true;
}

/**
 * Sanitize metadata before saving (remove invalid data)
 */
export function sanitizeInteractionMetadata(metadata: InteractionMetadata): InteractionMetadata {
  const sanitized: InteractionMetadata = {};

  // Cap view duration at 5 minutes
  if (metadata.card_view_duration_ms !== undefined) {
    sanitized.card_view_duration_ms = Math.min(metadata.card_view_duration_ms, 300000);
  }

  // Filter out negative photo indices
  if (metadata.photos_viewed) {
    sanitized.photos_viewed = metadata.photos_viewed.filter(idx => idx >= 0);
    sanitized.photos_view_count = sanitized.photos_viewed.length;
  } else if (metadata.photos_view_count !== undefined) {
    sanitized.photos_view_count = Math.max(0, metadata.photos_view_count);
  }

  // Copy other fields as-is (for future phases)
  if (metadata.hesitation_count !== undefined) {
    sanitized.hesitation_count = metadata.hesitation_count;
  }
  if (metadata.detail_interactions) {
    sanitized.detail_interactions = metadata.detail_interactions;
  }
  if (metadata.time_context) {
    sanitized.time_context = metadata.time_context;
  }

  return sanitized;
}
