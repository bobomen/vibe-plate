/**
 * Algorithm Configuration
 * 
 * Centralized configuration for the restaurant recommendation algorithm.
 * Adjust weights here to fine-tune the algorithm without changing business logic.
 * 
 * Total weight should equal 100%
 */

export interface AlgorithmWeights {
  // Core preference matching (70%)
  cuisine_match: number;        // Match with user's favorite cuisines
  price_match: number;          // Match with user's preferred price range
  district_preference: number;  // User's preferred districts
  rating_preference: number;    // Restaurant rating importance
  
  // Interaction depth (5% - Phase 1)
  card_engagement: number;      // How deeply user engages with cards
  
  // Special features (25%)
  special_features: number;     // Michelin stars, bib gourmand, etc.
  
  // Reserved for future phases
  detail_engagement?: number;   // Phase 2: Detail page interaction
  time_context?: number;        // Phase 3: Time-based preferences
  social_signals?: number;      // Phase 4: Friend preferences
}

/**
 * Current algorithm weights (Phase 1)
 * 
 * Phase 1 introduces card_engagement (5%) by reducing cuisine_match from 40% to 35%
 */
export const ALGORITHM_WEIGHTS: AlgorithmWeights = {
  // Core preferences (70%)
  cuisine_match: 35,      // Reduced from 40% to make room for engagement
  price_match: 15,
  district_preference: 10,
  rating_preference: 10,
  
  // Interaction depth (5%)
  card_engagement: 5,     // NEW: Rewards restaurants user engages with deeply
  
  // Special features (25%)
  special_features: 25,
};

/**
 * Interaction depth thresholds
 * Define what counts as "high engagement"
 */
export const INTERACTION_THRESHOLDS = {
  // Card view duration (milliseconds)
  view_duration: {
    low: 3000,      // < 3s: Quick glance
    medium: 8000,   // 3-8s: Normal viewing
    high: 15000,    // > 15s: Deep interest
  },
  
  // Photo viewing behavior
  photos_viewed: {
    low: 0,         // No photos viewed
    medium: 2,      // 1-2 photos
    high: 3,        // 3+ photos
  },
  
  // Hesitation behavior (Phase 2)
  hesitation: {
    low: 0,         // No hesitation
    medium: 1,      // 1 hesitation
    high: 2,        // 2+ hesitations
  },
};

/**
 * Calculate engagement score from interaction metadata
 * Returns a score between 0-1
 */
export function calculateEngagementScore(interactionMetadata: {
  card_view_duration_ms?: number;
  photos_viewed?: number[];
  photos_view_count?: number;
}): number {
  if (!interactionMetadata || Object.keys(interactionMetadata).length === 0) {
    return 0.5; // Neutral score for no data
  }

  let score = 0;
  let factors = 0;

  // Factor 1: View duration (0-1)
  const viewDuration = interactionMetadata.card_view_duration_ms || 0;
  if (viewDuration > 0) {
    if (viewDuration >= INTERACTION_THRESHOLDS.view_duration.high) {
      score += 1.0;
    } else if (viewDuration >= INTERACTION_THRESHOLDS.view_duration.medium) {
      score += 0.7;
    } else if (viewDuration >= INTERACTION_THRESHOLDS.view_duration.low) {
      score += 0.4;
    } else {
      score += 0.2; // Very quick glance
    }
    factors++;
  }

  // Factor 2: Photos viewed (0-1)
  const photosViewCount = interactionMetadata.photos_view_count || 0;
  const photosViewedArray = interactionMetadata.photos_viewed || [];
  
  if (photosViewCount > 0 || photosViewedArray.length > 0) {
    const photoCount = Math.max(photosViewCount, photosViewedArray.length);
    if (photoCount >= INTERACTION_THRESHOLDS.photos_viewed.high) {
      score += 1.0;
    } else if (photoCount >= INTERACTION_THRESHOLDS.photos_viewed.medium) {
      score += 0.6;
    } else {
      score += 0.3;
    }
    factors++;
  }

  // Average the factors
  return factors > 0 ? score / factors : 0.5;
}

/**
 * Validate algorithm weights sum to 100
 */
export function validateWeights(weights: AlgorithmWeights): boolean {
  const sum = Object.values(weights)
    .filter((v): v is number => typeof v === 'number')
    .reduce((acc, val) => acc + val, 0);
  
  return Math.abs(sum - 100) < 0.01; // Allow for floating point errors
}

// Validate on module load
if (!validateWeights(ALGORITHM_WEIGHTS)) {
  console.error('❌ Algorithm weights do not sum to 100%:', ALGORITHM_WEIGHTS);
}
