import asyncio
from db.mongodb import connect_to_mongo
from api.assistant import chat, ChatRequest, ChatMessage

async def main():
    await connect_to_mongo()
    req = ChatRequest(messages=[ChatMessage(role='user', message='What is a DDoS attack?')])
    print(await chat(req))

asyncio.run(main())
