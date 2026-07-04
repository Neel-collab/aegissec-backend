import feedparser
import uuid
import re
from datetime import datetime
from db.mongodb import get_db

THREAT_FEEDS = [
    "https://feeds.feedburner.com/TheHackersNews",
    "https://www.cisa.gov/cybersecurity-advisories/all.xml"
]

async def fetch_real_threats():
    """
    Fetches 100% authentic real-world threats from cyber intelligence RSS feeds.
    Parses them and inserts them into the MongoDB 'threats' collection.
    """
    db = get_db()
    
    # Check if we already have recent authentic threats so we don't spam the DB on every startup
    existing_count = await db["threats"].count_documents({"source": "ThreatIntel"})
    if existing_count > 50:
        return

    all_threats = []
    
    for feed_url in THREAT_FEEDS:
        feed = feedparser.parse(feed_url)
        
        for entry in feed.entries[:15]:  # Take top 15 from each feed
            title = entry.get("title", "Unknown Threat")
            
            # Extract plain text from description (removing HTML tags)
            raw_desc = entry.get("description", "")
            clean_desc = re.sub(r'<[^>]+>', '', raw_desc)
            clean_desc = (clean_desc[:250] + '...') if len(clean_desc) > 250 else clean_desc
            
            # Determine severity based on keywords
            severity = "Medium"
            lower_title = title.lower() + clean_desc.lower()
            if any(w in lower_title for w in ["critical", "zero-day", "0-day", "actively exploited", "urgent"]):
                severity = "Critical"
            elif any(w in lower_title for w in ["high", "vulnerability", "breach", "ransomware", "cve"]):
                severity = "High"
                
            # Determine type
            threat_type = "Malware"
            if "ransomware" in lower_title: threat_type = "Ransomware"
            elif "phishing" in lower_title: threat_type = "Phishing"
            elif "cve" in lower_title or "vulnerability" in lower_title: threat_type = "Vulnerability"
            elif "breach" in lower_title or "leak" in lower_title: threat_type = "Data Breach"

            threat = {
                "id": str(uuid.uuid4()),
                "title": title,
                "threat_type": threat_type,
                "severity": severity,
                "status": "Active",
                "detected_at": datetime.utcnow(),
                "description": clean_desc,
                "source": "ThreatIntel",
                "link": entry.get("link", "")
            }
            all_threats.append(threat)
            
    if all_threats:
        # Clear out old synthetic mock threats safely, and insert the real ones
        await db["threats"].delete_many({"source": {"$ne": "ThreatIntel"}})
        await db["threats"].insert_many(all_threats)
        print(f"[THREAT INTEL] Successfully loaded {len(all_threats)} 100% authentic real-world threats into the database.")
