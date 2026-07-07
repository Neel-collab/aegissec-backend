import platform
import psutil
import uuid
from datetime import datetime
import feedparser
from db.mongodb import get_db

async def populate_real_data():
    db = get_db()
    # 1. Real Server Assets
    asset_count = await db['assets'].count_documents({'name': 'Primary App Server'})
    if asset_count == 0:
        await db['assets'].delete_many({}) # Clear mock data
        server_asset = {
            'id': str(uuid.uuid4()),
            'name': 'Primary App Server',
            'asset_type': 'Server',
            'ip_address': '127.0.0.1',
            'os': f'{platform.system()} {platform.release()}',
            'owner': 'AegisSec Admin',
            'department': 'IT Infrastructure',
            'criticality': 'Critical',
            'tags': ['Production', platform.machine()],
            'created_at': datetime.utcnow(),
            'last_seen': datetime.utcnow(),
            'vulnerabilities_count': 0,
            'risk_score': 10,
            'is_active': True
        }
        await db['assets'].insert_one(server_asset)
    
    # 2. Real Incidents (from real breach news)
    inc_count = await db['incidents'].count_documents({'source': 'RealNews'})
    if inc_count == 0:
        await db['incidents'].delete_many({})
        feed = feedparser.parse('https://feeds.feedburner.com/TheHackersNews')
        incidents = []
        for entry in feed.entries[:5]:
            incidents.append({
                'id': str(uuid.uuid4()),
                'title': entry.get('title', 'Security Incident'),
                'description': entry.get('description', '')[:200] + '...',
                'severity': 'High',
                'status': 'Open',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'source': 'RealNews'
            })
        if incidents:
            await db['incidents'].insert_many(incidents)
            
    # Fix existing bad data from previous run
    await db['incidents'].update_many(
        {"created_at": {"$exists": False}, "reported_at": {"$exists": True}},
        [{"$set": {"created_at": "$reported_at"}}]
    )
    
    # 3. Real Compliance (Server Audit)
    comp_count = await db['compliance'].count_documents({'framework': 'Server Baseline Audit'})
    if comp_count == 0:
        await db['compliance'].delete_many({})
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        compliance = {
            'id': str(uuid.uuid4()),
            'framework': 'Server Baseline Audit',
            'version': '1.0',
            'controls': [
                {'control_id': 'SYS-01', 'title': 'OS Validation', 'description': 'Verify OS version', 'status': 'Passed', 'evidence': platform.version()},
                {'control_id': 'SYS-02', 'title': 'Memory Audit', 'description': 'Check available RAM', 'status': 'Passed' if ram.percent < 90 else 'Failed', 'evidence': f'{ram.percent}% used'},
                {'control_id': 'SYS-03', 'title': 'Disk Audit', 'description': 'Check disk capacity', 'status': 'Passed' if disk.percent < 90 else 'Failed', 'evidence': f'{disk.percent}% used'}
            ],
            'score': 100.0 if ram.percent < 90 else 66.0,
            'last_assessed': datetime.utcnow(),
            'next_assessment': datetime.utcnow()
        }
        await db['compliance'].insert_one(compliance)
