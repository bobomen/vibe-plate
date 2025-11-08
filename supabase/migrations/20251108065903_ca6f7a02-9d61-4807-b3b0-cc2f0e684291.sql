-- Add unique constraint to prevent duplicate restaurant claims
-- This allows restaurant_id to be null (for new restaurant claims)
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_claims_user_restaurant_unique 
ON restaurant_claims (user_id, restaurant_id) 
WHERE restaurant_id IS NOT NULL;