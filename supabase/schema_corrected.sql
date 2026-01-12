-- =============================================
-- LA CONTROL - Database Schema for Supabase (CORRECTED)
-- =============================================
-- Execute this SQL in your Supabase SQL Editor
-- Make sure to run this AFTER creating your project

-- =============================================
-- IMPORTANT: FUNCTIONS MUST BE DEFINED FIRST
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-set user_id to current authenticated user
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default units for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_units()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.units (user_id, name, abbreviation, default_value)
    VALUES 
        (NEW.id, 'Unidade', 'un', 1),
        (NEW.id, 'Mililitro', 'ml', 5),
        (NEW.id, 'Litro', 'l', 1),
        (NEW.id, 'Grama', 'g', 1),
        (NEW.id, 'Quilograma', 'kg', 1),
        (NEW.id, 'Par', 'par', 1),
        (NEW.id, 'Caixa', 'cx', 1),
        (NEW.id, 'Pacote', 'pct', 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 1. BRANDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brands" ON public.brands
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brands" ON public.brands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands" ON public.brands
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brands" ON public.brands
    FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_brands_user_id
    BEFORE INSERT ON public.brands
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 2. UNITS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    default_value DECIMAL(10,2) DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own units" ON public.units
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own units" ON public.units
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own units" ON public.units
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own units" ON public.units
    FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_units_user_id
    BEFORE INSERT ON public.units
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON public.units
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 3. PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_quantity DECIMAL(10,2) DEFAULT 0 NOT NULL,
    min_quantity DECIMAL(10,2) DEFAULT 0 NOT NULL,
    unit VARCHAR(20) DEFAULT 'un',
    conversion_factor DECIMAL(10,2) DEFAULT 1 NOT NULL,
    last_unit_cost DECIMAL(10,2) DEFAULT 0,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON public.products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
    FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_products_user_id
    BEFORE INSERT ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 4. STOCK ENTRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.stock_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock entries" ON public.stock_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock entries" ON public.stock_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock entries" ON public.stock_entries
    FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_stock_entries_user_id
    BEFORE INSERT ON public.stock_entries
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

-- =============================================
-- 5. SERVICE TYPES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.service_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service types" ON public.service_types
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service types" ON public.service_types
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service types" ON public.service_types
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own service types" ON public.service_types
    FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_service_types_user_id
    BEFORE INSERT ON public.service_types
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER update_service_types_updated_at
    BEFORE UPDATE ON public.service_types
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 6. SERVICE PRODUCTS TABLE (Junction)
-- =============================================
CREATE TABLE IF NOT EXISTS public.service_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_type_id UUID REFERENCES public.service_types(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    default_quantity DECIMAL(10,2) DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.service_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service products" ON public.service_products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service products" ON public.service_products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service products" ON public.service_products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own service products" ON public.service_products
    FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_service_products_user_id
    BEFORE INSERT ON public.service_products
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

-- =============================================
-- 7. SERVICES TABLE (Completed Services)
-- =============================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_type_id UUID REFERENCES public.service_types(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    product_cost DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own services" ON public.services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services" ON public.services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services" ON public.services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own services" ON public.services
    FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_services_user_id
    BEFORE INSERT ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

-- =============================================
-- 8. FINANCIAL RECORDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.financial_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial records" ON public.financial_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial records" ON public.financial_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial records" ON public.financial_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial records" ON public.financial_records
    FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_financial_records_user_id
    BEFORE INSERT ON public.financial_records
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

-- =============================================
-- AUTH TRIGGER FOR NEW USERS
-- =============================================
-- This trigger automatically creates default units when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_units ON auth.users;

CREATE TRIGGER on_auth_user_created_units
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_units();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_user_id ON public.stock_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_product_id ON public.stock_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_date ON public.stock_entries(date);
CREATE INDEX IF NOT EXISTS idx_service_types_user_id ON public.service_types(user_id);
CREATE INDEX IF NOT EXISTS idx_service_products_service_type_id ON public.service_products(service_type_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON public.services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_date ON public.services(date);
CREATE INDEX IF NOT EXISTS idx_financial_records_user_id ON public.financial_records(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_date ON public.financial_records(date);
CREATE INDEX IF NOT EXISTS idx_financial_records_type ON public.financial_records(type);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_units() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO anon, authenticated;
