from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from db.mongodb import get_db
from datetime import datetime
from core.config import settings
import google.generativeai as genai

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
    
    if not settings.GEMINI_API_KEY:
        return {
            "response": "Error: GEMINI_API_KEY is not configured in the environment. Please configure it to use the AI Assistant.",
            "timestamp": datetime.utcnow().isoformat()
        }

    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    system_prompt = f"""You are the AegisSec AI Cybersecurity Assistant, an elite AI designed to train employees and provide expert cybersecurity advice.
    You have access to any and every data of cybersecurity available in the world. Answer questions professionally, clearly, and thoroughly.
    
    Current System Context (Incorporate this into your answers if relevant):
    - Active Threats: {ctx['active_threats']} ({ctx['critical_threats']} Critical)
    - Open Incidents: {ctx['open_incidents']}
    - Recent Threats: {", ".join(ctx['recent_threats']) if ctx['recent_threats'] else 'None'}
    
    Format your responses using Markdown for readability (bolding, lists, code blocks).
    Always encourage security best practices.
    """
    
    # Extract the last user message and build history
    user_message = request.messages[-1].message if request.messages else ""
    
    try:
        chat_session = model.start_chat(history=[])
        chat_session.send_message(system_prompt)
        
        # Send any prior conversation history for context
        for msg in request.messages[:-1]:
            chat_session.send_message(msg.message)
        
        response = chat_session.send_message(user_message)
        
        return {"response": response.text, "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        print(f"[AI ASSISTANT ERROR] {e}")
        return {
            "response": f"I encountered an error connecting to the intelligence network. Please try again. Error: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }

