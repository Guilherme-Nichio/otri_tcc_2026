import os
import json
import re
import math
import pandas as pd
from rapidfuzz import process
import uuid
from unidecode import unidecode
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
from supabase import create_async_client, AsyncClient
import google.generativeai as genai

try:
    from sentence_transformers import SentenceTransformer, util
except Exception as e:
    raise RuntimeError("Erro ao importar sentence-transformers. "
                       "Instale com: pip install sentence-transformers torch numpy") from e

MODELO_EMBEDDING = "paraphrase-multilingual-MiniLM-L12-v2"
MODELO_IA = None
DF_ALIMENTOS = None
INTENCOES_EMBED = {}

supabase: Optional[AsyncClient] = None

FATORES_ATIVIDADE = {
    "sedentario": 1.2,
    "leve": 1.375,
    "moderado": 1.55,
    "ativo": 1.725,
    "muito_ativo": 1.9
}
MEAL_KEYS = ["cafe da manha", "almoco", "lanche", "lanche da tarde", "janta", "ceia", "lanche noturno"]
GRAMAS_PATTERN = re.compile(r'(\d+(?:[.,]\d+)?)\s*(g|gramas|grama|gr)\b', re.I)
ITEM_GRAMA_PAIR_PATTERN = re.compile(r'([A-Za-zÀ-ú0-9\s\-\+]+?)\s*,?\s*(\d+(?:[.,]\d+)?\s*(?:g|gramas|gr)\b)', re.I)

def carregar_modelos():
    global MODELO_IA, DF_ALIMENTOS, INTENCOES_EMBED
    
    if MODELO_IA: 
        return

    print("Carregando modelo de IA...")
    MODELO_IA = SentenceTransformer(MODELO_EMBEDDING)
    print("Modelo de IA carregado.")

    print("Carregando base de alimentos...")
    try:
        if os.path.exists("base-comidas-tratada.xlsx - basona.csv"):
            DF_ALIMENTOS = pd.read_csv("base-comidas-tratada.xlsx - basona.csv")
        elif os.path.exists("base-comidas-tratada.xlsx"):
            DF_ALIMENTOS = pd.read_excel("base-comidas-tratada.xlsx", sheet_name="basona")
        else:
            raise FileNotFoundError("Nenhuma base de dados (CSV ou Excel) foi encontrada na pasta.")
            
        if "descricao_alimento" not in DF_ALIMENTOS.columns:
            raise ValueError("Coluna 'descricao_alimento' não encontrada na base de dados.")
            
        DF_ALIMENTOS["descricao_alimento_norm"] = DF_ALIMENTOS["descricao_alimento"].astype(str).str.lower().str.strip().apply(lambda x: unidecode(x))
        print(f"Base de alimentos carregada: {len(DF_ALIMENTOS)} itens.")
    except Exception as e:
        print(f"Erro fatal ao carregar base de alimentos: {e}")
        DF_ALIMENTOS = pd.DataFrame(columns=["descricao_alimento", "descricao_alimento_norm", "energia_kcal", "proteina_g", "carboidrato_g", "lipideo_g"])

    print("Carregando intenções...")
    CAMINHO_INTENCOES = "intencoes.json"
    if os.path.exists(CAMINHO_INTENCOES):
        with open(CAMINHO_INTENCOES, "r", encoding="utf-8") as f:
            INTENCOES_EXEMPLO = json.load(f)
        
        INTENCOES_EMBED = {k: MODELO_IA.encode(v, convert_to_tensor=True) for k, v in INTENCOES_EXEMPLO.items()}
        print("Intenções carregadas.")
    else:
        print(f"Aviso: Arquivo '{CAMINHO_INTENCOES}' não encontrado. A IA de intenção ficará limitada.")
        INTENCOES_EXEMPLO = {}
        INTENCOES_EMBED = {}

async def init_db():
    global supabase
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")
    
    if url and key:
        supabase = await create_async_client(url, key)
        print("Supabase client initialized.")
    else:
        print("AVISO: Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY não configuradas.")
        
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if gemini_key:
        genai.configure(api_key=gemini_key)
        print("Gemini configurado com sucesso.")
    else:
        print("AVISO: GEMINI_API_KEY não configurada. Respostas serão baseadas no cálculo apenas.")

def gerar_id() -> str:
    return str(uuid.uuid4())

def normalizar_texto(txt: str) -> str:
    if not isinstance(txt, str):
        return ""
    return re.sub(r'\s+', ' ', txt.strip().lower())

async def criar_nutricionista(nome: str, email: str, senha: str) -> str:
    idn = gerar_id()
    try:
        data = {
            "id_nutri": idn,
            "nome": nome,
            "email": email,
            "senha": senha,
            "criado_em": datetime.utcnow().isoformat()
        }
        await supabase.table("nutricionistas").insert(data).execute()
        return idn
    except Exception as e:
        print(f"Erro ao criar nutricionista: {e}")
        return None 

async def criar_cliente(id_nutri: str, nome: str, email: str, senha: str, idade: int, sexo: str, peso_kg: float, altura_cm: float, atividade: str="sedentario") -> str:
    idc = gerar_id()
    try:
        data = {
            "id_cliente": idc,
            "id_nutri": id_nutri,
            "nome": nome,
            "email": email,
            "senha": senha,
            "idade": int(idade),
            "sexo": sexo,
            "peso_kg": float(peso_kg),
            "altura_cm": float(altura_cm),
            "atividade": atividade,
            "peso_inicial": float(peso_kg),
            "criado_em": datetime.utcnow().isoformat()
        }
        await supabase.table("clientes").insert(data).execute()
        return idc
    except Exception as e:
        print(f"Erro ao criar cliente: {e}")
        return None

async def atualizar_cliente(id_cliente: str, campos: Dict[str, Any]) -> bool:
    campos_permitidos = {"nome", "idade", "sexo", "peso_kg", "altura_cm", "atividade", "meta", "agua_meta_ml"}
    dados_atualizar = {k: v for k, v in campos.items() if k in campos_permitidos}
    
    if not dados_atualizar:
        return False 
        
    try:
        await supabase.table("clientes").update(dados_atualizar).eq("id_cliente", id_cliente).execute()
        return True
    except Exception as e:
        print(f"Erro ao atualizar cliente: {e}")
        return False

async def get_cliente_por_id(id_cliente: str) -> Optional[Dict[str, Any]]:
    try:
        res = await supabase.table("clientes").select("*").eq("id_cliente", id_cliente).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"Erro ao obter cliente: {e}")
        return None

async def get_cliente_perfil(id_cliente: str) -> Optional[Dict[str, Any]]:
    try:
        res = await supabase.table("clientes").select("id_cliente, nome, email, idade, sexo, peso_kg, altura_cm, meta, nutricionistas(id_nutri, nome, email)").eq("id_cliente", id_cliente).execute()
        
        if not res.data:
            return None
            
        cliente = res.data[0]
        nutri_info = cliente.pop("nutricionistas", {})
        if isinstance(nutri_info, list) and len(nutri_info) > 0:
            nutri_info = nutri_info[0]
        elif nutri_info is None:
            nutri_info = {}

        perfil_dict = dict(cliente)
        perfil_dict["nome_nutri"] = nutri_info.get("nome")
        perfil_dict["email_nutri"] = nutri_info.get("email")
        perfil_dict["id_nutri"] = nutri_info.get("id_nutri")
        
        if perfil_dict.get("peso_kg") and perfil_dict.get("altura_cm"):
            perfil_dict["imc"] = calcular_imc(perfil_dict["peso_kg"], perfil_dict["altura_cm"])
            perfil_dict["imc_class"] = classificar_imc(perfil_dict["imc"])
        else:
            perfil_dict["imc"] = None
            perfil_dict["imc_class"] = "Dados insuficientes"
            
        return perfil_dict
    except Exception as e:
        print(f"Erro ao obter perfil cliente: {e}")
        return None

async def get_nutri_perfil(id_nutri: str) -> Optional[Dict[str, Any]]:
    try:
        res = await supabase.table("nutricionistas").select("id_nutri, nome, email").eq("id_nutri", id_nutri).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        return None

async def update_nutri_perfil(id_nutri: str, nome: str, email: str, senha: Optional[str] = None) -> bool:
    try:
        dados = {"nome": nome, "email": email}
        if senha:
            dados["senha"] = senha
            
        await supabase.table("nutricionistas").update(dados).eq("id_nutri", id_nutri).execute()
        return True
    except Exception as e:
        print(f"Erro ao atualizar perfil da nutri: {e}")
        return False

async def delete_cliente(id_cliente: str) -> bool:
    try:
        await supabase.table("conversas").delete().eq("id_cliente", id_cliente).execute()
        await supabase.table("planos").delete().eq("id_cliente", id_cliente).execute()
        await supabase.table("registros_consumo").delete().eq("id_cliente", id_cliente).execute()
        await supabase.table("clientes").delete().eq("id_cliente", id_cliente).execute()
        return True
    except Exception as e:
        print(f"Erro ao deletar cliente: {e}")
        return False

async def listar_clientes_por_nutri(id_nutri: str) -> List[Dict[str, Any]]:
    try:
        res = await supabase.table("clientes").select("id_cliente, nome, email, peso_kg, altura_cm, meta").eq("id_nutri", id_nutri).execute()
        return res.data
    except Exception as e:
        print(e)
        return []

async def login_cliente(email: str, senha: str) -> Optional[Dict[str, Any]]:
    try:
        res = await supabase.table("clientes").select("id_cliente, nome, senha, nutricionistas(id_nutri, nome)").eq("email", email).execute()
        if not res.data:
            return None
        
        cliente_data = res.data[0]
        if cliente_data.get("senha") != senha:
            return None
            
        nutri_info = cliente_data.pop("nutricionistas", {})
        if isinstance(nutri_info, list) and len(nutri_info) > 0:
            nutri_info = nutri_info[0]
        elif nutri_info is None:
            nutri_info = {}
            
        return {
            "id_cliente": cliente_data["id_cliente"],
            "nome": cliente_data["nome"],
            "nome_nutri": nutri_info.get("nome"),
            "id_nutri": nutri_info.get("id_nutri")
        }
    except Exception as e:
        print(e)
        return None

async def login_nutri(email: str, senha: str) -> Optional[Dict[str, Any]]:
    try:
        res = await supabase.table("nutricionistas").select("*").eq("email", email).eq("senha", senha).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        return None

async def get_bot_config(id_nutri: str) -> Optional[Dict[str, Any]]:
    try:
        res = await supabase.table("nutricionistas").select("bot_persona, bot_restricoes, bot_cor").eq("id_nutri", id_nutri).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        return None

async def update_bot_config(id_nutri: str, persona: str, restricoes: str, cor: str) -> bool:
    try:
        await supabase.table("nutricionistas").update({
            "bot_persona": persona,
            "bot_restricoes": restricoes,
            "bot_cor": cor
        }).eq("id_nutri", id_nutri).execute()
        return True
    except Exception as e:
        print(f"Erro ao salvar config do bot: {e}")
        return False

async def adicionar_opcao_plano(id_cliente: str, refeicao: str, nome_alimento: str,
                          cal_100g: float, prot_100g: float=0.0, carb_100g: float=0.0, fat_100g: float=0.0) -> bool:
    if MODELO_IA is None:
        print("Modelo de IA não carregado. Não é possível adicionar embedding.")
        return False
        
    refeicao_key = refeicao.strip().lower()
    id_item = gerar_id()
    
    texto_repr = f"{nome_alimento} - {cal_100g:.0f} kcal por 100g"
    embedding_vec_list = None
    try:
        emb = MODELO_IA.encode(texto_repr, convert_to_tensor=True)
        embedding_vec_list = emb.cpu().detach().numpy().tolist()
    except Exception as e:
        print(f"[AVISO] falha ao gerar embedding para '{nome_alimento}': {e}")

    try:
        await supabase.table("planos").insert({
            "id_cliente": id_cliente,
            "refeicao": refeicao_key,
            "id_item": id_item,
            "nome": nome_alimento,
            "cal_100g": float(cal_100g),
            "prot_100g": float(prot_100g),
            "carb_100g": float(carb_100g),
            "fat_100g": float(fat_100g),
            "embedding_texto": texto_repr,
            "embedding_vec": json.dumps(embedding_vec_list) if embedding_vec_list else None 
        }).execute()
        return True
    except Exception as e:
        print(f"Erro ao adicionar opção ao plano: {e}")
        return False

async def listar_plano(id_cliente: str) -> Dict[str, List[Dict[str,Any]]]:
    plano_dict = {}
    try:
        res = await supabase.table("planos").select("*").eq("id_cliente", id_cliente).order("refeicao").execute()
        itens = res.data
    except Exception as e:
        print(e)
        return plano_dict

    for item in itens:
        refeicao = item["refeicao"]
        if refeicao not in plano_dict:
            plano_dict[refeicao] = []
            
        item_formatado = {
            "id": item["id_item"],
            "nome": item["nome"],
            "per_100g": {
                "cal": item["cal_100g"],
                "prot": item["prot_100g"],
                "carb": item["carb_100g"],
                "fat": item["fat_100g"]
            }
        }
        plano_dict[refeicao].append(item_formatado)
        
    return plano_dict

async def _encontrar_item_por_nome_por_embedding(id_cliente: str, texto_item: str, limiar: float=0.55) -> Optional[Tuple[str, Dict[str,Any]]]:
    if MODELO_IA is None: return None

    try:
        res = await supabase.table("planos").select("*").eq("id_cliente", id_cliente).execute()
        itens = res.data
    except Exception:
        return None

    if not itens:
        return None

    emb_texto = MODELO_IA.encode(texto_item, convert_to_tensor=True)
    melhor_sim = -1.0
    melhor_match = None
    
    for item in itens:
        vec_data = item.get("embedding_vec")
        if not vec_data:
            continue
            
        try:
            if isinstance(vec_data, str):
                vec_list = json.loads(vec_data)
            else:
                vec_list = vec_data

            vec = pd.np.array(vec_list, dtype=pd.np.float32) 
            sim = float(util.cos_sim(emb_texto, vec))
            
            if sim > melhor_sim:
                melhor_sim = sim
                item_formatado = {
                    "id": item["id_item"],
                    "nome": item["nome"],
                    "per_100g": {
                        "cal": item["cal_100g"],
                        "prot": item["prot_100g"],
                        "carb": item["carb_100g"],
                        "fat": item["fat_100g"]
                    },
                    "_embedding_vec": vec 
                }
                melhor_match = (item["refeicao"], item_formatado)
        except Exception as e:
            print(f"Erro ao processar embedding do item {item['id_item']}: {e}")
            
    if melhor_match and melhor_sim >= limiar:
        return melhor_match
        
    return None

def calcular_bmr(peso_kg: float, altura_cm: float, idade: int, sexo: str) -> float:
    s = sexo.lower()[0] if sexo else "f"
    if s in ("f", "m") and s == "f":
        return 10 * peso_kg + 6.25 * altura_cm - 5 * idade - 161
    else:
        return 10 * peso_kg + 6.25 * altura_cm - 5 * idade + 5

def calcular_tdee(bmr: float, atividade: str) -> float:
    fator = FATORES_ATIVIDADE.get(atividade, FATORES_ATIVIDADE["sedentario"])
    return bmr * fator

def recomendacao_agua_ml(peso_kg: float) -> float:
    return peso_kg * 35

def calcular_imc(peso_kg: float, altura_cm: float) -> Optional[float]:
    try:
        altura_m = float(altura_cm) / 100.0
        if altura_m <= 0:
            return None
        return peso_kg / (altura_m * altura_m)
    except Exception:
        return None

def classificar_imc(imc: float) -> str:
    if imc is None:
        return "IMC não calculável"
    if imc < 18.5:
        return "Magreza (IMC < 18.5)"
    if imc < 25:
        return "Normal (IMC 18.5–24.9)"
    if imc < 30:
        return "Sobrepeso (IMC 25–29.9)"
    return "Obesidade (IMC ≥ 30)"

def extrair_itens_e_gramas(frase: str) -> List[Tuple[str, float]]:
    frase = frase.lower()
    resultados = []
    matches = list(ITEM_GRAMA_PAIR_PATTERN.finditer(frase))
    if matches:
        for m in matches:
            nome = m.group(1).strip(" ,.;")
            grams_text = re.search(r'(\d+(?:[.,]\d+)?)', m.group(2))
            grams = float(grams_text.group(1).replace(",", ".")) if grams_text else 100.0
            resultados.append((nome, grams))
        return resultados
    tokens = re.split(r' e |,|;|\band\b', frase)
    for t in tokens:
        t = t.strip()
        mg = GRAMAS_PATTERN.search(t)
        if mg:
            grams = float(mg.group(1).replace(",", "."))
            nome = GRAMAS_PATTERN.sub('', t).strip()
            if nome:
                resultados.append((nome, grams))
    if not resultados:
        palavras = re.findall(r'[A-Za-zÀ-ú0-9]+', frase)
        if 'comi' in frase:
            idx = palavras.index('comi') if 'comi' in palavras else -1
            if idx >= 0 and idx + 1 < len(palavras):
                nome = ' '.join(palavras[idx+1: idx+4])
                resultados.append((nome, 100.0))
    return resultados

async def registrar_consumo(id_cliente: str, refeicao: str, nome_item_usuario: str, gramas: float) -> Dict[str, Any]:
    cliente = await get_cliente_por_id(id_cliente)
    if not cliente:
        raise ValueError("Cliente não encontrado")

    encontrado = await _encontrar_item_por_nome_por_embedding(id_cliente, nome_item_usuario)
    if encontrado:
        refeicao_plano, item_plano = encontrado
        cal100 = item_plano["per_100g"]["cal"]
        kcal = cal100 * (gramas / 100.0)
        nome_final = item_plano["nome"]
    else:
        m = re.search(r'(\d+(?:[.,]\d+)?)\s*(kcal|calorias|cal)', nome_item_usuario)
        if m:
            kcal = float(m.group(1).replace(",", "."))
            nome_final = nome_item_usuario
        else:
            kcal = gramas * 1.0 
            nome_final = nome_item_usuario

    registro = {
        "id_cliente": id_cliente,
        "data_hora": datetime.utcnow().isoformat(),
        "refeicao": refeicao,
        "nome_item": nome_final,
        "gramas": float(gramas),
        "kcal": float(kcal)
    }

    try:
        await supabase.table("registros_consumo").insert(registro).execute()
        
        texto_log = f"registrei: {nome_final} {gramas}g no {refeicao}"
        await _salvar_conversa(id_cliente, "user", texto_log)
        return registro
    except Exception as e:
        print(f"Erro ao registrar consumo: {e}")
        return None

async def consumo_total_hoje(id_cliente: str) -> Tuple[float, List[Dict[str,Any]]]:
    hoje = date.today().isoformat()
    try:
        res = await supabase.table("registros_consumo").select("*").eq("id_cliente", id_cliente).like("data_hora", f"{hoje}%").execute()
        itens = res.data
    except Exception:
        itens = []
        
    total = sum(r.get("kcal", 0.0) for r in itens)
    return total, itens

async def _salvar_conversa(id_cliente: str, role: str, texto: str):
    try:
        await supabase.table("conversas").insert({
            "id_cliente": id_cliente,
            "role": role,
            "texto": texto,
            "time": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"Erro ao salvar conversa: {e}")

async def get_historico_conversa(id_cliente: str) -> List[Dict[str, Any]]:
    try:
        res = await supabase.table("conversas").select("role, texto, time").eq("id_cliente", id_cliente).order("time").execute()
        return res.data
    except Exception:
        return []

async def saudacoes_cliente(id_cliente: str) -> str:
    cliente = await get_cliente_por_id(id_cliente)
    nome = cliente.get('nome','Cliente') if cliente else 'Cliente'
    resposta = f"Olá, {nome}! 👋 Estou aqui para te ajudar. Sobre o que vamos conversar hoje?"
    return resposta

async def recomendar_opcoes_refeicao(id_cliente: str, refeicao: str) -> str:
    plano = await listar_plano(id_cliente)
    refeicao_key = refeicao.strip().lower()
    opcoes = plano.get(refeicao_key, [])
    
    if not opcoes:
        resposta = f"Ainda não tenho opções cadastradas para o seu '<b>{refeicao_key}</b>'. 😕 Você pode me pedir sugestões de outra refeição ou falar com seu/sua nutri para adicionar novas opções!"
    else:
        linhas = [f"Claro! Aqui estão as opções que seu/sua nutri cadastrou para o seu <b>{refeicao_key}</b>:"]
        for it in opcoes:
            p = it["per_100g"]
            linhas.append(f"• <b>{it['nome']}</b>: {p['cal']:.0f} kcal, {p.get('prot',0):.1f}g prot, {p.get('carb',0):.1f}g carb, {p.get('fat',0):.1f}g gord. (por 100g)")
        resposta = "\n".join(linhas)

    return resposta

async def recomendar_para_restante(id_cliente: str, margem_kcal: float = 0.0) -> str:
    cliente = await get_cliente_por_id(id_cliente)
    if not cliente:
        return "Cliente não encontrado."
    if not (cliente.get("peso_kg") and cliente.get("altura_cm") and cliente.get("idade")):
        return "Faltam dados (peso/altura/idade) para calcular sua meta calórica."

    bmr = calcular_bmr(cliente["peso_kg"], cliente["altura_cm"], cliente["idade"], cliente["sexo"])
    tdee = calcular_tdee(bmr, cliente.get("atividade", "sedentario"))
    consumido, itens = await consumo_total_hoje(id_cliente)
    restante = tdee - consumido - margem_kcal
    
    if restante <= 50: 
        resposta = f"Parabéns! 🥳 Você já atingiu sua meta diária de ~{tdee:.0f} kcal (consumido: {consumido:.0f} kcal). Por hoje, o ideal é focar em bebidas sem calorias, como água ou chá."
    else:
        plano = await listar_plano(id_cliente)
        candidatos = []
        for refeicao, lista in plano.items():
            for item in lista:
                cal100 = item["per_100g"].get("cal", 0.0)
                if cal100 <= 0: continue
                maxg = (restante / cal100) * 100.0
                if maxg >= 20: 
                    candidatos.append((item["nome"], cal100, int(maxg), refeicao))
        
        if not candidatos:
            resposta = f"Hmm, pelas minhas contas, restam apenas <b>~{restante:.0f} kcal</b> para hoje. Nenhuma das opções do seu plano se encaixa facilmente nesse valor. Que tal uma porção menor de algo que você já comeu, uma fruta leve ou um chá? 🍵"
        else:
            candidatos.sort(key=lambda x: -x[2]) 
            linhas = [f"Você ainda tem <b>~{restante:.0f} kcal</b> para hoje (Meta: ~{tdee:.0f} kcal | Consumido: {consumido:.0f} kcal)."]
            linhas.append("\nCom base no seu plano, aqui estão algumas sugestões e a <b>porção máxima</b> que você pode comer de cada uma para se manter na meta:")
            for nome, cal100, maxg, refeicao in candidatos[:5]: 
                linhas.append(f"• <b>{nome}</b> ({refeicao}): Até <b>{maxg}g</b> (~{cal100:.0f} kcal/100g)")
            resposta = "\n".join(linhas)

    return resposta

def interpretar_intencao(pergunta: str) -> Tuple[Optional[str], float]:
    if MODELO_IA is None: return None, 0.0
    
    emb = MODELO_IA.encode(pergunta, convert_to_tensor=True)
    melhor = None
    melhor_sim = -1.0
    for chave, embs in INTENCOES_EMBED.items():
        sim = float(util.cos_sim(emb, embs).max())
        if sim > melhor_sim:
            melhor_sim = sim
            melhor = chave
    return melhor, melhor_sim

async def ultima_resposta_contexto(id_cliente: str) -> Optional[Dict[str,Any]]:
    try:
        res = await supabase.table("conversas").select("*").eq("id_cliente", id_cliente).eq("role", "bot").order("time", desc=True).limit(1).execute()
        return res.data[0] if res.data else None
    except Exception:
        return None

async def procurar_item_por_texto_no_plano(id_cliente: str, texto: str) -> Optional[Dict[str,Any]]:
    match_emb = await _encontrar_item_por_nome_por_embedding(id_cliente, texto)
    if match_emb:
        return match_emb[1] 

    plano = await listar_plano(id_cliente)
    texto_norm = normalizar_texto(texto)
    for refeicao, itens in plano.items():
        for item in itens:
            if normalizar_texto(item["nome"]) in texto_norm:
                return item
    return None

async def mostrar_informacoes_cliente(id_cliente: str) -> str:
    cliente = await get_cliente_por_id(id_cliente)
    if not cliente:
        return "Cliente não encontrado."
    
    try:
        peso = cliente.get("peso_kg")
        altura = cliente.get("altura_cm")
        idade = cliente.get("idade")
        
        bmr = calcular_bmr(peso, altura, idade, cliente.get("sexo", "f"))
        tdee = calcular_tdee(bmr, cliente.get("atividade", "sedentario"))
        agua_ml = recomendacao_agua_ml(peso) if peso else None
        consumo_hoje, itens = await consumo_total_hoje(id_cliente)
        imc = calcular_imc(peso, altura)
        imc_class = classificar_imc(imc)

        linhas = [
            f"Aqui está um resumo do seu perfil, {cliente.get('nome', 'Cliente')}:",
            f"• <b>Peso:</b> {peso} kg (Altura: {altura} cm)",
            f"• <b>IMC:</b> {imc:.2f} ({imc_class})",
            f"• <b>Meta Diária:</b> ~{tdee:.0f} kcal",
            f"• <b>Consumo Hoje:</b> {consumo_hoje:.0f} kcal ({len(itens)} registros)",
        ]
        if agua_ml:
            linhas.append(f"• <b>Água:</b> ~{int(agua_ml)} ml/dia")
        
        resposta = "\n".join(linhas)
    except Exception as e:
        resposta = "Parece que alguns dos seus dados de perfil (peso, altura, idade) não estão preenchidos. Peça para seu/sua nutri completar seu cadastro! 😉"

    return resposta

async def gerar_relatorio_completo_cliente(id_cliente: str) -> str:
    cliente = await get_cliente_por_id(id_cliente)
    if not cliente:
        return "Cliente não encontrado."

    peso = cliente.get("peso_kg")
    altura = cliente.get("altura_cm")
    idade = cliente.get("idade")
    sexo = cliente.get("sexo", "F")
    atividade = cliente.get("atividade", "sedentario")

    imc = calcular_imc(peso, altura) if peso and altura else None
    imc_txt = f"{imc:.2f}" if imc else "—"
    imc_class = classificar_imc(imc)
    
    agua_txt = "—"
    if peso:
        ml = recomendacao_agua_ml(peso)
        agua_txt = f"~{int(ml)} ml/dia (~{ml/1000:.2f} L)"

    bmr_txt = "—"
    tdee_txt = "—"
    if peso and altura and idade:
        try:
            bmr = calcular_bmr(peso, altura, int(idade), sexo)
            tdee = calcular_tdee(bmr, atividade)
            bmr_txt = f"{bmr:.0f} kcal/dia"
            tdee_txt = f"{tdee:.0f} kcal/dia (atividade: {atividade})"
        except Exception:
            pass
    
    plano = await listar_plano(id_cliente)
    consumo_hoje_total, ultimos_registros = await consumo_total_hoje(id_cliente)
    conversas = await get_historico_conversa(id_cliente)
    conversas = conversas[-10:] 

    linhas = [
        "Aqui está o relatório completo que eu gero para seu/sua nutri (e para você, claro! 😉):",
        f"\n<b>=== DADOS DO CLIENTE ===</b>",
        f"• <b>Nome:</b> {cliente.get('nome', '—')}",
        f"• <b>Idade:</b> {idade} | Sexo: {sexo}",
        f"• <b>Peso Atual:</b> {peso if peso else '—'} kg | Altura: {altura if altura else '—'} cm",
        f"• <b>Peso Inicial:</b> {cliente.get('peso_inicial', '—')} | <b>Meta:</b> {cliente.get('meta', '—')}",
        f"• <b>IMC:</b> {imc_txt} ({imc_class})",
        f"• <b>Água:</b> {agua_txt}",
        f"• <b>Metas:</b> BMR: {bmr_txt} | TDEE: {tdee_txt}",
        f"• <b>Consumo Hoje:</b> {consumo_hoje_total:.1f} kcal ({len(ultimos_registros)} registros)"
    ]

    linhas.append("\n<b>--- PLANO ALIMENTAR ---</b>")
    if not plano:
        linhas.append("• Plano vazio.")
    else:
        for refeicao, itens in plano.items():
            linhas.append(f"• <b>{refeicao.upper()}</b>: {len(itens)} opções")
            for item in itens:
                p = item.get("per_100g", {})
                linhas.append(f"    - {item.get('nome')}: {p.get('cal',0):.0f} kcal/100g")

    linhas.append("\n<b>--- REGISTROS DE HOJE ---</b>")
    if not ultimos_registros:
        linhas.append("• Sem registros de consumo hoje.")
    else:
        for r in ultimos_registros:
            linhas.append(f"• {r.get('data_hora')} | {r.get('nome_item')} ({r.get('gramas')}g) → {r.get('kcal'):.0f} kcal")

    linhas.append("\n<b>--- ÚLTIMAS MENSAGENS ---</b>")
    if not conversas:
        linhas.append("• Sem histórico de conversas.")
    else:
        for c in conversas:
            linhas.append(f"• [{c.get('time')}] <b>{c.get('role')}</b>: {c.get('texto')}")

    return "\n".join(linhas)

async def _gerar_contexto_calculado(id_cliente: str, texto: str) -> str:
    texto_lower = texto.lower().strip()
    
    if re.search(r'(forne(c|ç)a|me dê|me de|me mande|)\s+(todas as informa(c|ç)oes|meu resumo|meu relatório)', texto_lower):
        resposta = await gerar_relatorio_completo_cliente(id_cliente)
        return resposta

    m_peso = re.search(r'\b(?:meu\s+)?peso\s*(?:é|=)?\s*(\d+(?:[.,]\d+)?)\s*(kg)?\b', texto_lower)
    if m_peso:
        peso_novo = float(m_peso.group(1).replace(",", "."))
        if await atualizar_cliente(id_cliente, {"peso_kg": peso_novo}):
            resposta = f"Entendido! Atualizei seu peso para <b>{peso_novo:.1f} kg</b>. Vou usar esse valor para recalcular suas metas de calorias e água. 👍"
        else:
            resposta = "Erro ao atualizar peso. Peça para a nutricionista atualizar manualmente."
        return resposta

    if any(w in texto_lower for w in ["água", "agua", "quanta água", "quanta agua"]):
        cliente = await get_cliente_por_id(id_cliente)
        if cliente and cliente.get("peso_kg"):
            ml = recomendacao_agua_ml(cliente["peso_kg"])
            resposta = f"Com base no seu peso, a sugestão de ingestão de água é de <b>~{int(ml)} ml/dia</b> (cerca de {ml/1000:.2f} L). Mantenha-se hidratado! 💧"
        else:
            resposta = "Não tenho seu peso cadastrado. Peça para a nutricionista cadastrar ou escreva 'Meu peso 72kg' para atualizar."
        return resposta

    chave_intencao, sim = interpretar_intencao(texto_lower)
    
    if chave_intencao == "saudacoes" and sim > 0.5:
        return await saudacoes_cliente(id_cliente) 
    if chave_intencao == "perguntar_opcoes_cafe" and sim > 0.5:
        return await recomendar_opcoes_refeicao(id_cliente, "cafe da manha") 
    if chave_intencao == "perguntar_opcoes_almoco" and sim > 0.5:
        return await recomendar_opcoes_refeicao(id_cliente, "almoco") 
    if chave_intencao == "perguntar_opcoes_janta" and sim > 0.5:
        return await recomendar_opcoes_refeicao(id_cliente, "janta") 
    if chave_intencao == "calorias_disponiveis" and sim > 0.5:
        return await recomendar_para_restante(id_cliente) 
    if chave_intencao == "mostrar_info" and sim > 0.5:
        resposta = await mostrar_informacoes_cliente(id_cliente)
        return resposta

    if "comi" in texto_lower or "comemos" in texto_lower or "comeu" in texto_lower or "registrei" in texto_lower or "anota aí" in texto_lower:
        refeicao_encontrada = "refeicao" 
        for mk in MEAL_KEYS:
            if mk in texto_lower:
                refeicao_encontrada = mk
                break
        
        pares = extrair_itens_e_gramas(texto_lower)
        if not pares:
            resposta = "Não entendi o que você comeu. 😅 Para eu registrar, tente dizer o alimento e a quantidade, por exemplo: 'Comi 100g de arroz e 150g de frango no almoço'."
        else:
            mensagens = []
            for nome_item, gramas in pares:
                registro = await registrar_consumo(id_cliente, refeicao_encontrada, nome_item, gramas)
                if registro:
                    mensagens.append(f"Anotado! ✅ <b>{registro['nome_item']}</b> ({registro['gramas']}g) com ~{registro['kcal']:.0f} kcal.")
            resposta = "\n".join(mensagens)
        
        return resposta

    if any(k in texto_lower for k in ["quanto isso", "quantas calorias", "quantas kcal", "quanto tem"]):
        ultima = await ultima_resposta_contexto(id_cliente)
        if not ultima:
            resposta = "Não achei referência anterior clara."
        else:
            texto_bot = ultima.get("texto", "")
            m = re.search(r'(\d+(?:[.,]\d+)?)\s*kcal', texto_bot)
            if m:
                resposta = f"A última opção que mencionei tem <b>~{float(m.group(1)):.0f} kcal</b> (a cada 100g, geralmente)."
            else:
                resposta = "Não consegui inferir as calorias da mensagem anterior."
        
        return resposta

    match = await procurar_item_por_texto_no_plano(id_cliente, texto_lower)
    if match:
        p = match["per_100g"]
        resposta = f"Encontrei <b>{match['nome']}</b> no seu plano! Aqui estão os detalhes (para 100g):\n• <b>Calorias:</b> {p['cal']:.0f} kcal\n• <b>Proteínas:</b> {p.get('prot',0):.1f}g\n• <b>Carboidratos:</b> {p.get('carb',0):.1f}g\n• <b>Gorduras:</b> {p.get('fat',0):.1f}g"
    else:
        resposta = "Desculpe, não consegui entender. 😅 Você pode tentar perguntar de outra forma? Lembre-se que eu funciono melhor com perguntas como 'O que posso jantar?' ou 'Comi 150g de frango'."
    
    return resposta

async def responder_pergunta(id_cliente: str, texto: str) -> str:
    # 1. Salvar a mensagem do usuário
    await _salvar_conversa(id_cliente, "user", texto)
    
    # 2. Obter o texto lógico puramente calculado pelo RAG interno
    contexto_calculado = await _gerar_contexto_calculado(id_cliente, texto)
    
    # 3. Preparar contexto do LLM
    cliente = await get_cliente_por_id(id_cliente)
    persona = "Um(a) assistente amigável e focado(a) na saúde."
    restricoes = "Não dar diagnósticos médicos."
    
    if cliente and cliente.get("id_nutri"):
        config = await get_bot_config(cliente["id_nutri"])
        if config:
            persona = config.get("bot_persona") or persona
            restricoes = config.get("bot_restricoes") or restricoes

    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        print("Fallback: GEMINI_API_KEY ausente. Retornando texto calculado cru.")
        resposta_final = contexto_calculado
    else:
        try:
            model = genai.GenerativeModel("gemini-pro") # Modelo padrão e amplamente compatível
            prompt = f"""Você é o nutricionista deste paciente (cliente). Aja de forma empática, natural e humana.
Sua persona: {persona}
Suas restrições/instruções extras: {restricoes}

O paciente acabou de falar a seguinte mensagem: "{texto}"

O nosso sistema já rodou a lógica interna e extraiu os seguintes DADOS E CÁLCULOS EXATOS:
--- INÍCIO DOS CÁLCULOS DO SISTEMA ---
{contexto_calculado}
--- FIM DOS CÁLCULOS DO SISTEMA ---

REGRAS ESTABELECIDAS:
1. Responda ao paciente baseando-se EXCLUSIVAMENTE nos dados fornecidos nos "CÁLCULOS DO SISTEMA". Você é apenas a "voz" da resposta.
2. É ESTRITAMENTE PROIBIDO inventar valores calóricos, pesos, ou alimentos. Se o cálculo disse que a comida tem X calorias, use esse valor.
3. Se os cálculos disserem que não há opções, que faltam dados, ou que não entendeu, responda de acordo e de forma amigável.
4. Você pode formatar o texto (usar negrito, quebras de linha e emojis).
5. Fale diretamente com o paciente. Nunca mencione que você recebeu "cálculos do sistema" ou que você é uma IA.
"""
            response = model.generate_content(prompt)
            resposta_final = response.text.strip()
        except Exception as e:
            print(f"Erro ao gerar resposta com Gemini: {e}")
            resposta_final = contexto_calculado

    # 4. Salvar a resposta final gerada e retorná-la
    await _salvar_conversa(id_cliente, "bot", resposta_final)
    return resposta_final

def buscar_alimento_base_dados(nome_alimento: str) -> List[Dict[str, Any]]:
    if DF_ALIMENTOS is None:
        return []

    nome_alimento = nome_alimento.lower().strip()
    opcoes = DF_ALIMENTOS["descricao_alimento_norm"].tolist()
    
    resultados = process.extract(nome_alimento, opcoes, score_cutoff=60, limit=5)
    
    matches = []
    if resultados:
        for melhor, score, idx in resultados:
            alimento = DF_ALIMENTOS.iloc[idx].to_dict()
            alimento_limpo = {k: (v if pd.notna(v) else None) for k, v in alimento.items()}
            alimento_limpo['score'] = score 
            matches.append(alimento_limpo)
            
    return matches