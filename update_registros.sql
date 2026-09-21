ALTER TABLE public.registros_consumo ADD COLUMN IF NOT EXISTS nome_item TEXT;
ALTER TABLE public.registros_consumo ADD COLUMN IF NOT EXISTS gramas NUMERIC;

-- Transferindo dados antigos se existirem na coluna descricao
UPDATE public.registros_consumo SET nome_item = descricao WHERE nome_item IS NULL AND descricao IS NOT NULL;

-- Remove as colunas que a API não usa mais
ALTER TABLE public.registros_consumo DROP COLUMN IF EXISTS descricao;
ALTER TABLE public.registros_consumo DROP COLUMN IF EXISTS proteinas;
ALTER TABLE public.registros_consumo DROP COLUMN IF EXISTS carboidratos;
ALTER TABLE public.registros_consumo DROP COLUMN IF EXISTS gorduras;
