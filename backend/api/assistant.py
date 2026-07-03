from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from db.mongodb import get_db
from datetime import datetime, timedelta

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []


async def _query_db_context(db) -> dict:
    active_threats = await db["threats"].count_documents({"status": "Active"})
    critical = await db["threats"].count_documents({"severity": "Critical"})
    open_incidents = await db["incidents"].count_documents({"status": "Open"})
    recent_cursor = db["threats"].find({"status": "Active"}).sort("detected_at", -1).limit(3)
    recent = await recent_cursor.to_list(3)
    recent_names = [f"{t['title']} ({t['severity']})" for t in recent]
    return {
        "active_threats": active_threats,
        "critical_threats": critical,
        "open_incidents": open_incidents,
        "recent_threats": recent_names,
    }


def _generate_response(message: str, ctx: dict) -> str:
    msg = message.lower()

    if any(w in msg for w in ["threat", "threats", "active threat"]):
        names = ", ".join(ctx["recent_threats"]) if ctx["recent_threats"] else "none currently"
        return (
            f"Currently there are **{ctx['active_threats']} active threats** in your environment, "
            f"with **{ctx['critical_threats']} classified as Critical**. "
            f"The most recent threats are: {names}. "
            f"I recommend prioritizing critical threats for immediate response."
        )

    if any(w in msg for w in ["incident", "incidents"]):
        return (
            f"You have **{ctx['open_incidents']} open incidents** currently requiring attention. "
            f"Navigate to the Incidents tab to view details, assign responders, and update statuses. "
            f"I recommend triaging by severity — resolve Critical incidents within 4 hours."
        )

    if any(w in msg for w in ["risk", "risk score", "risk assessment"]):
        return (
            f"Your environment has **{ctx['active_threats']} active threats** and **{ctx['open_incidents']} open incidents**. "
            f"Key risk factors include unresolved critical threats and assets with high vulnerability counts. "
            f"Recommended actions: patch critical systems, enable MFA for all users, review firewall rules."
        )

    if any(w in msg for w in ["mitigate", "mitigation", "fix", "remediate", "recommendation"]):
        return (
            "**Top Mitigation Recommendations:**\n\n"
            "1. **Network Segmentation** — Isolate critical assets from general network traffic\n"
            "2. **Patch Management** — Apply latest OS and application security patches\n"
            "3. **MFA Enforcement** — Enable multi-factor authentication for all privileged accounts\n"
            "4. **EDR Deployment** — Deploy Endpoint Detection & Response on all endpoints\n"
            "5. **Log Monitoring** — Ensure SIEM ingests logs from all critical assets\n"
            "6. **Phishing Training** — Conduct regular security awareness training"
        )

    if any(w in msg for w in ["phishing", "email", "spam"]):
        return (
            "**Phishing Defense Guidance:**\n\n"
            "Phishing remains the #1 attack vector. Key defenses:\n"
            "- Enable SPF, DKIM, and DMARC email authentication\n"
            "- Deploy email filtering with sandboxing for attachments\n"
            "- Train employees to verify sender addresses and report suspicious emails\n"
            "- Use the Threat Detection tab to analyze suspicious URLs in real-time."
        )

    if any(w in msg for w in ["ddos", "denial of service"]):
        return (
            "**DDoS Mitigation Steps:**\n\n"
            "1. Enable DDoS protection on your cloud provider or CDN (e.g., Cloudflare, AWS Shield)\n"
            "2. Configure rate limiting on all public-facing services\n"
            "3. Set up traffic baseline monitoring to detect anomalies early\n"
            "4. Have an incident response playbook ready for DDoS events\n"
            "5. Consider upstream filtering with your ISP for volumetric attacks."
        )

    if any(w in msg for w in ["compliance", "iso", "nist", "pci"]):
        return (
            "**Compliance Overview:**\n\n"
            "AegisSec tracks ISO/IEC 27001, NIST CSF, and PCI-DSS compliance. "
            "Navigate to the **Compliance** tab to view your current scores per framework, "
            "review individual control statuses, and mark controls as passed after implementing them. "
            "A score above 80% is generally considered audit-ready."
        )

    if any(w in msg for w in ["hello", "hi", "hey", "help", "what can you do"]):
        return (
            "👋 **Hello! I'm the AegisSec AI Security Assistant.**\n\n"
            "I can help you with:\n"
            "- **Threat Analysis** — 'Show me active threats' or 'Explain this attack'\n"
            "- **Incident Summary** — 'What incidents are open today?'\n"
            "- **Risk Assessment** — 'What is my current risk score?'\n"
            "- **Mitigation Advice** — 'How do I mitigate ransomware?'\n"
            "- **Compliance Guidance** — 'What is my ISO 27001 score?'\n\n"
            "Ask me anything about your security posture!"
        )

    return (
        f"I processed your query: **\"{message}\"**\n\n"
        f"Based on your current environment: **{ctx['active_threats']} active threats**, "
        f"**{ctx['open_incidents']} open incidents**. "
        f"For detailed analysis, I recommend reviewing the specific module tabs. "
        f"You can also ask me about threats, incidents, risk scores, or mitigation strategies."
    )


@router.post("/chat")
async def chat(request: ChatRequest):
    db = get_db()
    ctx = await _query_db_context(db)
    response = _generate_response(request.message, ctx)
    return {"response": response, "timestamp": datetime.utcnow().isoformat()}
