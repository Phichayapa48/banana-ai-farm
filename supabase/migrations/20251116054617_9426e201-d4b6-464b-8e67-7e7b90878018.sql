-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'farm_owner', 'new_farmer');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create banana varieties table
CREATE TABLE public.banana_varieties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  cultivation_tips TEXT,
  benefits TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.banana_varieties ENABLE ROW LEVEL SECURITY;

-- Create farms table
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  auto_cancelled BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'))
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(reservation_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Banana varieties RLS policies
CREATE POLICY "Anyone can view banana varieties" ON public.banana_varieties FOR SELECT USING (true);
CREATE POLICY "Admins can insert banana varieties" ON public.banana_varieties FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update banana varieties" ON public.banana_varieties FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete banana varieties" ON public.banana_varieties FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Farms RLS policies
CREATE POLICY "Anyone can view farms" ON public.farms FOR SELECT USING (true);
CREATE POLICY "Farm owners can insert their farms" ON public.farms FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'farm_owner'));
CREATE POLICY "Farm owners can update their farms" ON public.farms FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Farm owners can delete their farms" ON public.farms FOR DELETE USING (auth.uid() = owner_id);

-- Reservations RLS policies
CREATE POLICY "Users can view their own reservations as farmer" ON public.reservations FOR SELECT USING (auth.uid() = farmer_id);
CREATE POLICY "Farm owners can view reservations for their farms" ON public.reservations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = reservations.farm_id AND farms.owner_id = auth.uid())
);
CREATE POLICY "Admins can view all reservations" ON public.reservations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Farmers can create reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Farm owners can update reservations for their farms" ON public.reservations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = reservations.farm_id AND farms.owner_id = auth.uid())
);
CREATE POLICY "Farmers can cancel their own reservations" ON public.reservations FOR UPDATE USING (auth.uid() = farmer_id AND status = 'pending');

-- Reviews RLS policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviewers can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  
  -- Assign default role as new_farmer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'new_farmer');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample banana varieties
INSERT INTO public.banana_varieties (name_th, name_en, description, cultivation_tips, benefits) VALUES
('กล้วยน้ำว้า', 'Namwa Banana', 'กล้วยน้ำว้ามีรสชาติหวานหอม เนื้อแน่น เหมาะสำหรับรับประทานสด', 'ปลูกในที่ร่มรำไร ดินร่วนซุย รดน้ำสม่ำเสมอ', 'อุดมไปด้วยวิตามินและแร่ธาตุ ช่วยเสริมพลังงาน'),
('กล้วยหอม', 'Hom Banana', 'กล้วยหอมมีกลิ่นหอมเฉพาะตัว รสชาติหวานอมเปรี้ยว', 'ปลูกในแสงแดดจัด ใส่ปุ๋ยอินทรีย์เป็นประจำ', 'มีโพแทสเซียมสูง ช่วยลดความดันโลหิต'),
('กล้วยไข่', 'Khai Banana', 'กล้วยไข่มีขนาดเล็ก รสชาติหวานมาก เนื้อละเอียด', 'ต้องการน้ำมาก รักความชื้น', 'ให้พลังงานสูง เหมาะสำหรับเด็กและผู้สูงอายุ');