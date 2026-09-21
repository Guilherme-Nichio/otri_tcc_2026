ALTER TABLE public.nutricionistas ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS peso_inicial NUMERIC;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS agua_meta_ml NUMERIC;
