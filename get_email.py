import os
import asyncio
from dotenv import load_dotenv

load_dotenv()
import chatbot_nutri as bot

async def main():
    await bot.init_db()
    res = await bot.supabase.table('nutricionistas').select('email, senha').limit(1).execute()
    if res.data:
        print(f"EMAIL_NUTRI: {res.data[0]['email']}")
        print(f"SENHA_NUTRI: {res.data[0]['senha']}")
    else:
        print("Nenhum nutri.")

asyncio.run(main())
