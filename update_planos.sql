ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS id_item UUID DEFAULT gen_random_uuid();
ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS embedding_texto TEXT;
ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS embedding_vec JSONB;

-- Transferindo dados se houver (caso a coluna nome_alimento tenha sido preenchida)
UPDATE public.planos SET nome = nome_alimento WHERE nome IS NULL AND nome_alimento IS NOT NULL;

-- Removendo a coluna antiga que não é usada pelo backend
ALTER TABLE public.planos DROP COLUMN IF EXISTS nome_alimento;
