import os
import sys
import asyncio
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()

import chatbot_nutri as bot

async def run_tests():
    print("Iniciando testes...")
    await bot.init_db()
    
    try:
        print("Testando criar nutricionista (se não existir)...")
        # Cria um id aleatorio no email para nao dar conflito de unique caso ja exista
        import random
        email_nutri = f"nutri{random.randint(1000,9999)}@teste.com"
        id_nutri = await bot.criar_nutricionista("Nutri Teste", email_nutri, "123")
        if id_nutri:
            print(f"Nutricionista criado: {id_nutri}")
        else:
            print("Falha ao criar Nutricionista")
            return

        print("Testando criar cliente...")
        email_cliente = f"cliente{random.randint(1000,9999)}@teste.com"
        id_cliente = await bot.criar_cliente(id_nutri, "Cliente Teste", email_cliente, "123", 30, "M", 80.0, 180.0)
        if id_cliente:
            print(f"Cliente criado: {id_cliente}")
        else:
            print("Falha ao criar Cliente")
            return
                
        print("Carregando Modelos Locais (sentence-transformers)...")
        bot.carregar_modelos()

        print("\nTestando RAG Híbrido com Gemini...")
        print("Mensagem do Usuário: 'Olá, me forneça meu resumo por favor.'")
        resposta = await bot.responder_pergunta(id_cliente, "Olá, me forneça meu resumo por favor.")
        print("\n===== RESPOSTA DO BOT =====")
        print(resposta)
        print("===========================")

    except Exception as e:
        print(f"Erro nos testes: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())
