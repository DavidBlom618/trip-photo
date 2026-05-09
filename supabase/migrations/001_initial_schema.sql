-- ============================================
-- TripPhoto: Initial Database Schema
-- 复制全部内容到 Supabase SQL Editor 中执行
-- 可重复执行（已添加 IF NOT EXISTS / ON CONFLICT 防护）
-- ============================================

-- 1. Cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read cities" ON public.cities FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id BIGSERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  taken_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can view all photos"
    ON public.photos FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own photos"
    ON public.photos FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own photos"
    ON public.photos FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Storage bucket for photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Anyone can read photos storage"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own storage objects"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'photos' AND auth.role() = 'authenticated' AND owner = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Seed cities data
INSERT INTO public.cities (name, province, slug, latitude, longitude) VALUES
  ('北京', '北京市', 'beijing', 39.9042, 116.4074),
  ('上海', '上海市', 'shanghai', 31.2304, 121.4737),
  ('广州', '广东省', 'guangzhou', 23.1291, 113.2644),
  ('深圳', '广东省', 'shenzhen', 22.5431, 114.0579),
  ('成都', '四川省', 'chengdu', 30.5728, 104.0668),
  ('重庆', '重庆市', 'chongqing', 29.4316, 106.9123),
  ('杭州', '浙江省', 'hangzhou', 30.2741, 120.1551),
  ('南京', '江苏省', 'nanjing', 32.0603, 118.7969),
  ('武汉', '湖北省', 'wuhan', 30.5928, 114.3055),
  ('西安', '陕西省', 'xian', 34.3416, 108.9398),
  ('昆明', '云南省', 'kunming', 25.0389, 102.7183),
  ('长沙', '湖南省', 'changsha', 28.2282, 112.9388),
  ('郑州', '河南省', 'zhengzhou', 34.7466, 113.6254),
  ('济南', '山东省', 'jinan', 36.6512, 116.9970),
  ('青岛', '山东省', 'qingdao', 36.0671, 120.3826),
  ('大连', '辽宁省', 'dalian', 38.9140, 121.6147),
  ('哈尔滨', '黑龙江省', 'haerbin', 45.8038, 126.5350),
  ('沈阳', '辽宁省', 'shenyang', 41.8057, 123.4315),
  ('厦门', '福建省', 'xiamen', 24.4798, 118.0894),
  ('福州', '福建省', 'fuzhou', 26.0745, 119.2965),
  ('苏州', '江苏省', 'suzhou', 31.2990, 120.5853),
  ('三亚', '海南省', 'sanya', 18.2528, 109.5120),
  ('桂林', '广西', 'guilin', 25.2736, 110.2900),
  ('贵阳', '贵州省', 'guiyang', 26.6470, 106.6302),
  ('兰州', '甘肃省', 'lanzhou', 36.0611, 103.8343),
  ('乌鲁木齐', '新疆', 'wulumuqi', 43.8256, 87.6168),
  ('拉萨', '西藏', 'lasa', 29.6500, 91.1000),
  ('西宁', '青海省', 'xining', 36.6171, 101.7785),
  ('银川', '宁夏', 'yinchuan', 38.4872, 106.2309),
  ('呼和浩特', '内蒙古', 'huhehaote', 40.8424, 111.7490),
  ('南宁', '广西', 'nanning', 22.8170, 108.3665),
  ('合肥', '安徽省', 'hefei', 31.8206, 117.2272),
  ('南昌', '江西省', 'nanchang', 28.6820, 115.8582),
  ('天津', '天津市', 'tianjin', 39.0842, 117.2009),
  ('港澳', '特别行政区', 'gangao', 22.3000, 114.1700)
ON CONFLICT (slug) DO NOTHING;
