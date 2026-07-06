import asyncio
from db.mongodb import get_db, connect_to_mongo
from api.assistant import _query_db_context

async def main():
    await connect_to_mongo()
    db = get_db()
    print(await _query_db_context(db))

asyncio.run(main())
