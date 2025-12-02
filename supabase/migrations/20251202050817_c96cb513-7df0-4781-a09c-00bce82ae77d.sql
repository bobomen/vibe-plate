-- Function to sync photos from restaurant_photos to restaurants.photos array
CREATE OR REPLACE FUNCTION sync_photo_to_restaurant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When photo becomes active, add it to the photos array (at the beginning)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'active' THEN
    UPDATE restaurants
    SET photos = array_prepend(NEW.photo_url, COALESCE(photos, ARRAY[]::text[]))
    WHERE id = NEW.restaurant_id
      AND NOT (NEW.photo_url = ANY(COALESCE(photos, ARRAY[]::text[])));
  END IF;
  
  -- When photo is deleted or becomes inactive, remove it from the array
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') THEN
    UPDATE restaurants
    SET photos = array_remove(photos, COALESCE(OLD.photo_url, NEW.photo_url))
    WHERE id = COALESCE(OLD.restaurant_id, NEW.restaurant_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on restaurant_photos table
DROP TRIGGER IF EXISTS sync_photo_trigger ON restaurant_photos;
CREATE TRIGGER sync_photo_trigger
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON restaurant_photos
  FOR EACH ROW
  EXECUTE FUNCTION sync_photo_to_restaurant();

-- One-time sync for existing active photos
DO $$
DECLARE
  photo_record RECORD;
BEGIN
  FOR photo_record IN 
    SELECT restaurant_id, photo_url 
    FROM restaurant_photos 
    WHERE status = 'active'
  LOOP
    UPDATE restaurants
    SET photos = array_prepend(photo_record.photo_url, COALESCE(photos, ARRAY[]::text[]))
    WHERE id = photo_record.restaurant_id
      AND NOT (photo_record.photo_url = ANY(COALESCE(photos, ARRAY[]::text[])));
  END LOOP;
END $$;