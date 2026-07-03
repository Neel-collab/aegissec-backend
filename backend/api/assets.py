from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from models.models import AssetCreate, AssetInDB, AssetResponse
from db.mongodb import get_db
from datetime import datetime
import uuid

router = APIRouter()


@router.get("/", response_model=List[AssetResponse])
async def get_assets(criticality: Optional[str] = Query(None), asset_type: Optional[str] = Query(None)):
    db = get_db()
    query = {}
    if criticality:
        query["criticality"] = criticality
    if asset_type:
        query["asset_type"] = asset_type
    cursor = db["assets"].find(query).sort("created_at", -1)
    assets = await cursor.to_list(length=200)
    return [AssetResponse(**a) for a in assets]


@router.get("/stats/summary")
async def get_asset_stats():
    db = get_db()
    total = await db["assets"].count_documents({})
    by_type = {}
    for t in ["Server", "Endpoint", "Firewall", "Router", "Database", "Cloud"]:
        count = await db["assets"].count_documents({"asset_type": t})
        by_type[t] = count
    by_criticality = {}
    for c in ["Critical", "High", "Medium", "Low"]:
        count = await db["assets"].count_documents({"criticality": c})
        by_criticality[c] = count
    return {"total": total, "by_type": by_type, "by_criticality": by_criticality}


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str):
    db = get_db()
    asset = await db["assets"].find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse(**asset)


@router.post("/", response_model=AssetResponse)
async def create_asset(asset: AssetCreate):
    db = get_db()
    new_asset = AssetInDB(
        id=str(uuid.uuid4()),
        **asset.model_dump(),
        created_at=datetime.utcnow(),
        last_seen=datetime.utcnow(),
    )
    await db["assets"].insert_one(new_asset.model_dump())
    return AssetResponse(**new_asset.model_dump())


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: str, updates: dict):
    db = get_db()
    result = await db["assets"].update_one({"id": asset_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    updated = await db["assets"].find_one({"id": asset_id})
    return AssetResponse(**updated)


@router.delete("/{asset_id}")
async def delete_asset(asset_id: str):
    db = get_db()
    result = await db["assets"].delete_one({"id": asset_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted"}
