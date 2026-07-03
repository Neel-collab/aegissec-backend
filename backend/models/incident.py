from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class IncidentBase(BaseModel):
    title: str
    description: str
    severity: str # Low, Medium, High, Critical
    status: str = "Open" # Open, In Progress, Resolved
    assigned_to: Optional[str] = None

class IncidentCreate(IncidentBase):
    pass

class IncidentInDB(IncidentBase):
    id: str
    created_at: datetime
    updated_at: datetime
    related_threats: List[str] = []

class IncidentResponse(IncidentInDB):
    pass
