from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.incident import IncidentCreate, IncidentResponse, IncidentInDB
from db.mongodb import get_db
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/", response_model=IncidentResponse)
async def create_incident(incident: IncidentCreate):
    db = get_db()
    new_incident = IncidentInDB(
        id=str(uuid.uuid4()),
        **incident.model_dump(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    await db["incidents"].insert_one(new_incident.model_dump())
    return IncidentResponse(**new_incident.model_dump())

@router.get("/", response_model=List[IncidentResponse])
async def get_incidents():
    db = get_db()
    cursor = db["incidents"].find()
    incidents = await cursor.to_list(length=100)
    return [IncidentResponse(**inc) for inc in incidents]
