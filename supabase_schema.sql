-- Script para criação das tabelas no Supabase (PostgreSQL)
-- Copie e cole este código no SQL Editor do seu novo projeto no Supabase

-- 1. Tabela de Nutricionistas
CREATE TABLE IF NOT EXISTS public.nutricionistas (
    id_nutri UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    bot_persona TEXT,
    bot_restricoes TEXT,
    bot_cor TEXT
);

-- 2. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id_cliente UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_nutri UUID NOT NULL REFERENCES public.nutricionistas(id_nutri) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    idade INT,
    sexo TEXT,
    peso_kg NUMERIC,
    altura_cm NUMERIC,
    atividade TEXT,
    meta TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    anamnese JSONB DEFAULT '{}'::JSONB,
    ia_persona TEXT,
    ia_restricoes TEXT
);

-- 3. Tabela de Planos Alimentares
CREATE TABLE IF NOT EXISTS public.planos (
    id_plano UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_cliente UUID NOT NULL REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
    refeicao TEXT NOT NULL,
    nome_alimento TEXT NOT NULL,
    cal_100g NUMERIC DEFAULT 0,
    prot_100g NUMERIC DEFAULT 0,
    carb_100g NUMERIC DEFAULT 0,
    fat_100g NUMERIC DEFAULT 0
);

-- 4. Tabela de Registros de Consumo
CREATE TABLE IF NOT EXISTS public.registros_consumo (
    id_registro UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_cliente UUID NOT NULL REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    refeicao TEXT,
    descricao TEXT,
    kcal NUMERIC DEFAULT 0,
    proteinas NUMERIC DEFAULT 0,
    carboidratos NUMERIC DEFAULT 0,
    gorduras NUMERIC DEFAULT 0
);

-- 5. Tabela de Conversas
CREATE TABLE IF NOT EXISTS public.conversas (
    id_conversa UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_cliente UUID NOT NULL REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' ou 'bot'
    texto TEXT NOT NULL,
    "time" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- (Opcional) Habilitar RLS (Row Level Security) caso queira, 
-- mas recomendo manter desabilitado inicialmente se você controla tudo pela API
-- ALTER TABLE nutricionistas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
