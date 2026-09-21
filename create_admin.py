import asyncio
import os
from dotenv import load_dotenv

load_dotenv()
os.environ['SUPABASE_URL'] = os.getenv('SUPABASE_URL', '')
os.environ['SUPABASE_KEY'] = os.getenv('SUPABASE_KEY', '')

import chatbot_nutri as bot

async def main():
    await bot.init_db()
    
    # Criar nutricionista
    id_nutri = await bot.criar_nutricionista("Nutri Teste", "nutri@teste.com", "123456")
    if id_nutri:
        print(f"Nutricionista criado com ID: {id_nutri}")
        print("Login: nutri@teste.com | Senha: 123456")
    else:
        print("Nutricionista já existe ou erro ao criar.")

asyncio.run(main())
