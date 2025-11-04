-- Schema para Supabase
-- Execute este SQL no painel SQL do seu projeto Supabase

-- Criar tabela de usuários (estendida da auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  has_2fa BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  is_2fa_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de propriedades
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  value DECIMAL(15,2),
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  enterprise_name TEXT,
  description TEXT,
  image TEXT,
  type TEXT,
  total_units INTEGER,
  available_units INTEGER
);

-- Criar tabela de preços de propriedades
CREATE TABLE IF NOT EXISTS property_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_type TEXT,
  unit_number TEXT,
  value DECIMAL(15,2),
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  private_area DECIMAL(8,2),
  block TEXT,
  sun_position TEXT,
  typology TEXT,
  parking_spaces INTEGER,
  appraisal_value DECIMAL(15,2),
  financing_value DECIMAL(15,2),
  sale_value DECIMAL(15,2),
  payments JSONB,
  installments JSONB,
  notary_payment_method TEXT,
  notary_installments INTEGER,
  broker_name TEXT,
  broker_creci TEXT,
  selected_unit TEXT
);

-- Criar triggers para updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_properties_timestamp
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_property_pricing_timestamp
BEFORE UPDATE ON property_pricing
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Criar função para automaticamente criar perfil quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para automaticamente criar perfil
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_pricing ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para profiles
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Políticas de segurança para properties
CREATE POLICY "Users can view all properties"
ON properties FOR SELECT
USING (true);

CREATE POLICY "Users can insert properties"
ON properties FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own properties"
ON properties FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete properties"
ON properties FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Políticas de segurança para property_pricing
CREATE POLICY "Users can view all property pricing"
ON property_pricing FOR SELECT
USING (true);

CREATE POLICY "Users can insert property pricing"
ON property_pricing FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_pricing.property_id
    AND properties.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update own property pricing"
ON property_pricing FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_pricing.property_id
    AND properties.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can delete property pricing"
ON property_pricing FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Inserir usuário admin padrão (será criado via função)
-- O ID será gerado automaticamente quando o usuário se registrar