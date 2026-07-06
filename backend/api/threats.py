from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from models.models import ThreatCreate, ThreatInDB, ThreatResponse
from db.mongodb import get_db
from datetime import datetime
import uuid

router = APIRouter()


@router.get("/", response_model=List[ThreatResponse])
async def get_threats(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    threat_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
):
    db = get_db()
    query = {}
    if severity:
        query["severity"] = severity
    if status:
        query["status"] = status
    if threat_type:
        query["threat_type"] = threat_type

    cursor = db["threats"].find(query).sort("detected_at", -1).limit(limit)
    threats = await cursor.to_list(length=limit)
    result = []
    for t in threats:
        # Normalize old docs that used "type" instead of "threat_type"
        if "threat_type" not in t and "type" in t:
            t["threat_type"] = t["type"]
        try:
            result.append(ThreatResponse(**t))
        except Exception:
            pass  # Skip malformed documents
    return result


@router.get("/stats/summary")
async def get_threat_stats():
    db = get_db()
    total = await db["threats"].count_documents({})
    active = await db["threats"].count_documents({"status": "Active"})

    by_severity = {}
    for sev in ["Critical", "High", "Medium", "Low"]:
        by_severity[sev] = await db["threats"].count_documents({"severity": sev})

    by_type = {}
    types = ["DDoS", "Phishing", "Malware", "BruteForce", "PortScan", "Ransomware", "SQLInjection", "Other"]
    for t in types:
        count = await db["threats"].count_documents({"threat_type": t})
        if count > 0:
            by_type[t] = count

    return {"total": total, "active": active, "by_severity": by_severity, "by_type": by_type}


@router.get("/{threat_id}", response_model=ThreatResponse)
async def get_threat(threat_id: str):
    db = get_db()
    threat = await db["threats"].find_one({"id": threat_id})
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    return ThreatResponse(**threat)


@router.post("/", response_model=ThreatResponse)
async def create_threat(threat: ThreatCreate):
    db = get_db()
    new_threat = ThreatInDB(
        id=str(uuid.uuid4()),
        **threat.model_dump(),
        detected_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        risk_score=int(threat.confidence * 100),
    )
    await db["threats"].insert_one(new_threat.model_dump())
    return ThreatResponse(**new_threat.model_dump())


@router.put("/{threat_id}", response_model=ThreatResponse)
async def update_threat(threat_id: str, updates: dict):
    db = get_db()
    updates["updated_at"] = datetime.utcnow()
    result = await db["threats"].update_one({"id": threat_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Threat not found")
    updated = await db["threats"].find_one({"id": threat_id})
    return ThreatResponse(**updated)


@router.delete("/{threat_id}")
async def delete_threat(threat_id: str):
    db = get_db()
    result = await db["threats"].delete_one({"id": threat_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Threat not found")
    return {"message": "Threat deleted"}
