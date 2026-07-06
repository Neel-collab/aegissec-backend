from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from db.mongodb import get_db
from datetime import datetime
from core.config import settings
from groq import Groq

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    message: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

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

@router.post("/chat")
async def chat(request: ChatRequest):
    db = get_db()
    ctx = await _query_db_context(db)
    
    if not settings.GROQ_API_KEY:
        return {
            "response": "Error: GROQ_API_KEY is not configured in the environment. Please configure it to use the AI Assistant.",
            "timestamp": datetime.utcnow().isoformat()
        }

    client = Groq(api_key=settings.GROQ_API_KEY)
    
    system_prompt = f"""You are the AegisSec AI Cybersecurity Assistant, an elite AI designed to train employees and provide expert cybersecurity advice.
    You have access to any and every data of cybersecurity available in the world. Answer questions professionally, clearly, and thoroughly.
    
    Current System Context (Incorporate this into your answers if relevant):
    - Active Threats: {ctx['active_threats']} ({ctx['critical_threats']} Critical)
    - Open Incidents: {ctx['open_incidents']}
    - Recent Threats: {", ".join(ctx['recent_threats']) if ctx['recent_threats'] else 'None'}
    
    Format your responses using Markdown for readability (bolding, lists, code blocks).
    Always encourage security best practices.
    """
    
    messages = [{"role": "system", "content": system_prompt}]
    
    # Build conversation history
    for msg in request.messages:
        # Map user/assistant roles (frontend sends user/assistant)
        role = "assistant" if msg.role == "assistant" else "user"
        messages.append({"role": role, "content": msg.message})
    
    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
        )
        
        return {"response": completion.choices[0].message.content, "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        error_msg = str(e)
        print(f"[AI ASSISTANT ERROR] {error_msg}")
        return {
            "response": f"I encountered an error connecting to the intelligence network. Please try again. Error: {error_msg}",
            "timestamp": datetime.utcnow().isoformat()
        }


