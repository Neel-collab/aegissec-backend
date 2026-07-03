from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ThreatBase(BaseModel):
    title: str
    threat_type: str
    severity: str
    source_ip: Optional[str] = None
    target_ip: Optional[str] = None
    confidence: float = 0.0
    mitre_technique: Optional[str] = None
    description: str
    status: str = "Active"
    indicators: List[str] = []


class ThreatCreate(ThreatBase):
    pass


class ThreatInDB(ThreatBase):
    id: str
    detected_at: datetime
    updated_at: datetime
    risk_score: int = 0


class ThreatResponse(ThreatInDB):
    pass


class AssetBase(BaseModel):
    name: str
    asset_type: str
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    os: Optional[str] = None
    owner: Optional[str] = None
    department: Optional[str] = None
    criticality: str = "Medium"
    tags: List[str] = []


class AssetCreate(AssetBase):
    pass


class AssetInDB(AssetBase):
    id: str
    created_at: datetime
    last_seen: Optional[datetime] = None
    vulnerabilities_count: int = 0
    risk_score: int = 0
    is_active: bool = True


class AssetResponse(AssetInDB):
    pass


class ComplianceControl(BaseModel):
    control_id: str
    title: str
    description: str
    status: str = "In Progress"
    evidence: str = ""


class ComplianceFramework(BaseModel):
    id: str
    framework: str
    version: str
    controls: List[ComplianceControl]
    score: float = 0.0
    last_assessed: datetime
    next_assessment: datetime


class AssistantMessage(BaseModel):
    message: str
    history: List[dict] = []
