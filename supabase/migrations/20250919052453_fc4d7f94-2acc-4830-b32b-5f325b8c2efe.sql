-- Create favorite categories table
CREATE TABLE public.favorite_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'heart',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for favorite_categories
ALTER TABLE public.favorite_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for favorite_categories
CREATE POLICY "Users can view their own categories" 
ON public.favorite_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
ON public.favorite_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
ON public.favorite_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
ON public.favorite_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create favorite category items (many-to-many) table
CREATE TABLE public.favorite_category_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  favorite_id UUID NOT NULL,
  category_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(favorite_id, category_id)
);

-- Enable RLS for favorite_category_items
ALTER TABLE public.favorite_category_items ENABLE ROW LEVEL SECURITY;

-- Create policies for favorite_category_items
CREATE POLICY "Users can view their own category items" 
ON public.favorite_category_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.favorites f 
    WHERE f.id = favorite_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own category items" 
ON public.favorite_category_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.favorites f 
    WHERE f.id = favorite_id AND f.user_id = auth.uid()
  ) AND EXISTS (
    SELECT 1 FROM public.favorite_categories c 
    WHERE c.id = category_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own category items" 
ON public.favorite_category_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.favorites f 
    WHERE f.id = favorite_id AND f.user_id = auth.uid()
  )
);

-- Add foreign key constraints
ALTER TABLE public.favorite_category_items 
ADD CONSTRAINT fk_favorite_category_items_favorite_id 
FOREIGN KEY (favorite_id) REFERENCES public.favorites(id) ON DELETE CASCADE;

ALTER TABLE public.favorite_category_items 
ADD CONSTRAINT fk_favorite_category_items_category_id 
FOREIGN KEY (category_id) REFERENCES public.favorite_categories(id) ON DELETE CASCADE;

-- Create trigger for updated_at on favorite_categories
CREATE TRIGGER update_favorite_categories_updated_at
BEFORE UPDATE ON public.favorite_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to insert default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.favorite_categories (user_id, name, description, color, icon) VALUES
    (target_user_id, '約會餐廳', '浪漫約會的完美選擇', '#ef4444', 'heart'),
    (target_user_id, '家庭聚餐', '適合全家人一起用餐', '#f59e0b', 'users'),
    (target_user_id, '商務用餐', '商務會談的理想場所', '#3b82f6', 'briefcase'),
    (target_user_id, '慶祝特殊場合', '生日、紀念日等特殊慶祝', '#8b5cf6', 'gift'),
    (target_user_id, '朋友聚會', '和朋友放鬆聚餐的地方', '#10b981', 'users-2'),
    (target_user_id, '米其林精選', '米其林星級餐廳收藏', '#fbbf24', 'star'),
    (target_user_id, '平價美食', '經濟實惠的美味選擇', '#06b6d4', 'dollar-sign'),
    (target_user_id, '想去清單', '還沒去過但想要嘗試', '#f97316', 'bookmark');
END;
$$;