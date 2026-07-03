from fastapi import APIRouter, HTTPException
from typing import List
from models.models import ComplianceFramework, ComplianceControl
from db.mongodb import get_db
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[ComplianceFramework])
async def get_compliance():
    db = get_db()
    cursor = db["compliance"].find()
    frameworks = await cursor.to_list(length=20)
    return [ComplianceFramework(**f) for f in frameworks]


@router.get("/{framework_id}", response_model=ComplianceFramework)
async def get_framework(framework_id: str):
    db = get_db()
    framework = await db["compliance"].find_one({"id": framework_id})
    if not framework:
        raise HTTPException(status_code=404, detail="Framework not found")
    return ComplianceFramework(**framework)


@router.put("/{framework_id}/controls/{control_id}")
async def update_control(framework_id: str, control_id: str, updates: dict):
    db = get_db()
    framework = await db["compliance"].find_one({"id": framework_id})
    if not framework:
        raise HTTPException(status_code=404, detail="Framework not found")

    controls = framework.get("controls", [])
    updated = False
    for c in controls:
        if c["control_id"] == control_id:
            c.update(updates)
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Control not found")

    # Recalculate score
    passed = sum(1 for c in controls if c["status"] == "Pass")
    score = round((passed / len(controls)) * 100, 1) if controls else 0

    await db["compliance"].update_one(
        {"id": framework_id},
        {"$set": {"controls": controls, "score": score, "last_assessed": datetime.utcnow()}}
    )
    return {"message": "Control updated", "new_score": score}
