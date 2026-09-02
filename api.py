import chatbot_nutri as bot 
from fastapi import FastAPI, HTTPException, Depends, APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()


class ChatMessage(BaseModel):
    texto: str

class ChatResponse(BaseModel):
    resposta: str

class LoginRequest(BaseModel):
    email: str
    senha: str

class ClienteRequest(BaseModel):
    id_nutri: str
    nome: str
    email: str
    senha: str
    idade: int
    sexo: str
    peso_kg: float
    altura_cm: float
    atividade: str = "sedentario"

class OpcaoPlanoRequest(BaseModel):
    refeicao: str
    nome_alimento: str
    cal_100g: float
    prot_100g: float = 0.0
    carb_100g: float = 0.0
    fat_100g: float = 0.0

class BotConfigRequest(BaseModel):
    persona: Optional[str] = None
    restricoes: Optional[str] = None
    cor: Optional[str] = None

class NutriPerfilRequest(BaseModel):
    nome: str
    email: str
    senha: Optional[str] = None

class ClienteStatusRequest(BaseModel):
    ativo: bool

class ClienteDetalhesRequest(BaseModel):
    anamnese: Dict[str, Any] = {}
    ia_persona: str = ""
    ia_restricoes: str = ""

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando API...")
    await bot.init_db()         
    bot.carregar_modelos() 
    print("API pronta para receber requisições.")
    yield
    print("Encerrando API.")

app = FastAPI(
    title="OTRI/Gruwth API",
    description="API para o backend do chatbot de nutrição.",
    version="1.0.0",
    lifespan=lifespan 
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

api_router = APIRouter() 

@api_router.post("/login/cliente")
async def login_cliente(request: LoginRequest):
    cliente = await bot.login_cliente(request.email, request.senha)
    if not cliente:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    return {"id_cliente": cliente["id_cliente"], "nome": cliente["nome"], "nome_nutri": cliente["nome_nutri"], "id_nutri": cliente["id_nutri"]}

@api_router.post("/login/nutricionista")
async def login_nutri(request: LoginRequest):
    nutri = await bot.login_nutri(request.email, request.senha)
    if not nutri:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    return {"id_nutri": nutri["id_nutri"], "nome": nutri["nome"]}

@api_router.post("/chat/{id_cliente}", response_model=ChatResponse)
async def post_chat_message(id_cliente: str, message: ChatMessage):
    if not await bot.get_cliente_por_id(id_cliente):
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    resposta = await bot.responder_pergunta(id_cliente, message.texto)
    return {"resposta": resposta}

@api_router.get("/chat/{id_cliente}/historico")
async def get_chat_historico(id_cliente: str):
    return await bot.get_historico_conversa(id_cliente)

@api_router.get("/clientes/{id_cliente}/perfil")
async def get_perfil_cliente(id_cliente: str):
    perfil = await bot.get_cliente_perfil(id_cliente)
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil do cliente não encontrado")
    return perfil

@api_router.delete("/clientes/{id_cliente}")
async def delete_cliente(id_cliente: str):
    sucesso = await bot.delete_cliente(id_cliente)
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao deletar cliente do banco de dados.")
    return {"status": "sucesso", "deleted_id": id_cliente}

@api_router.put("/clientes/{id_cliente}/status")
async def put_status_cliente(id_cliente: str, request: ClienteStatusRequest):
    sucesso = await bot.atualizar_status_cliente(id_cliente, request.ativo)
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao atualizar status.")
    return {"status": "sucesso"}

@api_router.put("/clientes/{id_cliente}/detalhes")
async def put_detalhes_cliente(id_cliente: str, request: ClienteDetalhesRequest):
    sucesso = await bot.atualizar_detalhes_cliente(id_cliente, request.anamnese, request.ia_persona, request.ia_restricoes)
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao atualizar detalhes (anamnese/IA).")
    return {"status": "sucesso"}

@api_router.get("/clientes/{id_cliente}/monitoramento")
async def get_monitoramento(id_cliente: str):
    return await bot.get_monitoramento_cliente(id_cliente)

@api_router.get("/planos/{id_cliente}")
async def get_plano_cliente(id_cliente: str):
    return await bot.listar_plano(id_cliente)

@api_router.get("/nutricionistas/{id_nutri}/clientes")
async def get_lista_clientes(id_nutri: str):
    return await bot.listar_clientes_por_nutri(id_nutri)

@api_router.get("/nutricionistas/{id_nutri}/perfil")
async def get_perfil_nutri(id_nutri: str):
    perfil = await bot.get_nutri_perfil(id_nutri)
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil do nutricionista não encontrado")
    return perfil

@api_router.put("/nutricionistas/{id_nutri}/perfil")
async def put_perfil_nutri(id_nutri: str, request: NutriPerfilRequest):
    senha_para_salvar = request.senha if request.senha else None
    
    sucesso = await bot.update_nutri_perfil(id_nutri, request.nome, request.email, senha_para_salvar)
    if not sucesso:
        raise HTTPException(status_code=400, detail="Erro ao atualizar perfil. O email pode já estar em uso.")
    return {"status": "sucesso", "nome": request.nome, "email": request.email}

@api_router.get("/nutricionistas/{id_nutri}/bot-config")
async def get_config_bot(id_nutri: str):
    config = await bot.get_bot_config(id_nutri)
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    return config

@api_router.post("/nutricionistas/{id_nutri}/bot-config")
async def post_config_bot(id_nutri: str, config: BotConfigRequest):
    sucesso = await bot.update_bot_config(id_nutri, config.persona, config.restricoes, config.cor)
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao salvar configuração")
    return {"status": "sucesso"}

@api_router.post("/clientes", status_code=201)
async def criar_novo_cliente(request: ClienteRequest):
    idc = await bot.criar_cliente(
        id_nutri=request.id_nutri,
        nome=request.nome,
        email=request.email,
        senha=request.senha, 
        idade=request.idade,
        sexo=request.sexo,
        peso_kg=request.peso_kg,
        altura_cm=request.altura_cm,
        atividade=request.atividade
    )
    if not idc:
        raise HTTPException(status_code=400, detail="Email de cliente já cadastrado.")
    return {"id_cliente": idc, "nome": request.nome}

@api_router.get("/admin/buscar-alimento")
async def buscar_alimento(q: str):
    if len(q) < 3:
        raise HTTPException(status_code=400, detail="Query deve ter pelo menos 3 caracteres")
    matches = bot.buscar_alimento_base_dados(q)
    return matches

@api_router.post("/planos/{id_cliente}")
async def adicionar_item_plano(id_cliente: str, item: OpcaoPlanoRequest):
    sucesso = await bot.adicionar_opcao_plano(
        id_cliente=id_cliente,
        refeicao=item.refeicao,
        nome_alimento=item.nome_alimento,
        cal_100g=item.cal_100g,
        prot_100g=item.prot_100g,
        carb_100g=item.carb_100g,
        fat_100g=item.fat_100g
    )
    if not sucesso:
        raise HTTPException(status_code=400, detail="Falha ao adicionar item. Talvez já exista.")
    return {"status": "sucesso", "id_cliente": id_cliente, "item_nome": item.nome_alimento}

app.include_router(api_router, prefix="/api")

@app.get("/")
async def get_root():
    return {"status": "API Online"}