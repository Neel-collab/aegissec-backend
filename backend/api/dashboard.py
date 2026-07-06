from fastapi import APIRouter
from db.mongodb import get_db
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats():
    db = get_db()

    try:
        total_threats = await db["threats"].count_documents({})
        active_threats = await db["threats"].count_documents({"status": "Active"})
        open_incidents = await db["incidents"].count_documents({"status": "Open"})
        critical_incidents = await db["incidents"].count_documents({"severity": "Critical", "status": {"$ne": "Resolved"}})
        total_assets = await db["assets"].count_documents({})

        # Risk score: average of top 10 threat risk scores
        pipeline = [{"$sort": {"risk_score": -1}}, {"$limit": 10}, {"$group": {"_id": None, "avg": {"$avg": "$risk_score"}}}]
        risk_result = await db["threats"].aggregate(pipeline).to_list(1)
        risk_score = int(risk_result[0]["avg"]) if risk_result and risk_result[0].get("avg") else 0

        # Threats by type
        threats_by_type = {}
        for t in ["DDoS", "Phishing", "Malware", "BruteForce", "PortScan", "Ransomware", "SQLInjection"]:
            threats_by_type[t] = await db["threats"].count_documents({"threat_type": t})

        # Threats by severity
        threats_by_severity = {}
        for s in ["Critical", "High", "Medium", "Low"]:
            threats_by_severity[s] = await db["threats"].count_documents({"severity": s})

        # Incidents by status
        incidents_by_status = {}
        for s in ["Open", "In Progress", "Resolved"]:
            incidents_by_status[s] = await db["incidents"].count_documents({"status": s})

        # Compliance score average
        frameworks = await db["compliance"].find().to_list(10)
        compliance_score = round(sum(f.get("score", 0) for f in frameworks) / len(frameworks), 1) if frameworks else 0

        # Recent threats (last 5) — defensive .get() for every field
        recent_cursor = db["threats"].find().sort("detected_at", -1).limit(5)
        recent_threats_raw = await recent_cursor.to_list(5)
        recent_threats = []
        for t in recent_threats_raw:
            detected_at = t.get("detected_at")
            recent_threats.append({
                "id": t.get("id", str(t.get("_id", ""))),
                "title": t.get("title", "Unknown Threat"),
                "severity": t.get("severity", "Medium"),
                "threat_type": t.get("threat_type", t.get("type", "Unknown")),
                "detected_at": detected_at.isoformat() if hasattr(detected_at, "isoformat") else str(detected_at or ""),
                "risk_score": t.get("risk_score", 0),
                "status": t.get("status", "Active"),
            })

        # Threat timeline: last 7 days
        threat_timeline = []
        for i in range(6, -1, -1):
            day_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            count = await db["threats"].count_documents({"detected_at": {"$gte": day_start, "$lt": day_end}})
            threat_timeline.append({"date": day_start.strftime("%b %d"), "count": count})

        return {
            "total_threats": total_threats,
            "active_threats": active_threats,
            "open_incidents": open_incidents,
            "critical_incidents": critical_incidents,
            "total_assets": total_assets,
            "risk_score": risk_score,
            "threats_by_type": threats_by_type,
            "threats_by_severity": threats_by_severity,
            "incidents_by_status": incidents_by_status,
            "compliance_score": compliance_score,
            "recent_threats": recent_threats,
            "threat_timeline": threat_timeline,
        }
    except Exception as e:
        print(f"[DASHBOARD ERROR] {e}")
        # Return safe defaults so the frontend doesn't crash
        return {
            "total_threats": 0, "active_threats": 0,
            "open_incidents": 0, "critical_incidents": 0,
            "total_assets": 0, "risk_score": 0,
            "threats_by_type": {}, "threats_by_severity": {},
            "incidents_by_status": {}, "compliance_score": 0,
            "recent_threats": [], "threat_timeline": [],
        }

