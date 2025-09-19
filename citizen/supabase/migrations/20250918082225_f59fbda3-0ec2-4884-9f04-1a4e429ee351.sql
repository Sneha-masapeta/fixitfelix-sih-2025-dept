-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Issues policies
CREATE POLICY "Anyone can view issues" ON public.issues
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own issues" ON public.issues
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own issues" ON public.issues
  FOR UPDATE USING (auth.uid() = user_id);

-- Images policies
CREATE POLICY "Anyone can view images" ON public.images
  FOR SELECT USING (true);

CREATE POLICY "Users can upload images for their issues" ON public.images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.issues 
      WHERE issues.id = images.issue_id 
      AND issues.user_id = auth.uid()
    )
  );

-- Create storage bucket for issue images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for issue images
CREATE POLICY "Anyone can view issue images" ON storage.objects
  FOR SELECT USING (bucket_id = 'issue-images');

CREATE POLICY "Authenticated users can upload issue images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'issue-images' 
    AND auth.role() = 'authenticated'
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name)
  VALUES (new.id, new.raw_user_meta_data ->> 'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();