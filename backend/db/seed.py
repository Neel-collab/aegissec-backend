"""
AegisSec Database Seeder
Run: python db/seed.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from core.config import settings
from core.security import get_password_hash
import uuid
import random


def rid(): return str(uuid.uuid4())
def rdt(days_ago_max=30):
    return datetime.utcnow() - timedelta(days=random.uniform(0, days_ago_max), hours=random.randint(0, 23))


async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    print("[SEED] Seeding AegisSec database...")

    # Clear existing
    for col in ["users", "threats", "incidents", "assets", "compliance"]:
        await db[col].drop()
        print(f"  - Cleared {col}")

    # --- USERS ---
    users = [
        {"id": rid(), "email": "admin@aegissec.io", "full_name": "Alex Morgan", "role": "admin",
         "department": "Security Operations", "phone": "+1-555-0101",
         "hashed_password": get_password_hash("Admin@123"), "created_at": datetime.utcnow(),
         "is_active": True, "mfa_enabled": True, "face_embedding": None,
         "otp_hash": None, "otp_created_at": None, "otp_purpose": None},
        {"id": rid(), "email": "analyst@aegissec.io", "full_name": "Jamie Chen", "role": "analyst",
         "department": "Threat Intelligence", "phone": "+1-555-0102",
         "hashed_password": get_password_hash("Analyst@123"), "created_at": datetime.utcnow(),
         "is_active": True, "mfa_enabled": False, "face_embedding": None,
         "otp_hash": None, "otp_created_at": None, "otp_purpose": None},
        {"id": rid(), "email": "responder@aegissec.io", "full_name": "Sam Patel", "role": "responder",
         "department": "Incident Response", "phone": "+1-555-0103",
         "hashed_password": get_password_hash("Responder@123"), "created_at": datetime.utcnow(),
         "is_active": True, "mfa_enabled": False, "face_embedding": None,
         "otp_hash": None, "otp_created_at": None, "otp_purpose": None},
    ]
    await db["users"].insert_many(users)
    print(f"  - Inserted {len(users)} users")

    # --- THREATS ---
    threat_data = [
        ("DDoS Attack on Web Gateway", "DDoS", "Critical", "185.220.101.45", "10.0.0.1", 0.97, "T1498", "Massive UDP flood targeting the main web gateway. 45Gbps peak traffic detected.", 95),
        ("Ransomware Activity - LockBit 3.0", "Ransomware", "Critical", "91.192.100.22", "10.0.1.15", 0.94, "T1486", "LockBit 3.0 ransomware detected encrypting files on finance workstation.", 92),
        ("SQL Injection on Customer Portal", "SQLInjection", "High", "203.0.113.55", "10.0.2.8", 0.89, "T1190", "Multiple SQL injection attempts on customer login portal detected.", 88),
        ("Phishing Campaign Targeting HR", "Phishing", "High", "198.51.100.10", None, 0.91, "T1566.001", "Spear-phishing emails impersonating IT dept sent to HR team.", 85),
        ("Brute Force SSH - Admin Account", "BruteForce", "High", "45.33.32.156", "10.0.0.5", 0.88, "T1110", "2,400 failed SSH login attempts from Tor exit node.", 82),
        ("Malware Dropper - Financial Trojan", "Malware", "High", "192.0.2.100", "10.0.1.22", 0.85, "T1059", "Trojan dropper detected in email attachment opened by finance user.", 80),
        ("Port Scan - Network Reconnaissance", "PortScan", "Medium", "104.21.45.67", "10.0.0.0/24", 0.78, "T1046", "Systematic port scan across entire internal network subnet.", 65),
        ("Cryptomining Malware on Server", "Malware", "Medium", None, "10.0.3.5", 0.82, "T1496", "XMRig cryptominer detected on application server consuming 95% CPU.", 70),
        ("Phishing URL in Slack Message", "Phishing", "Medium", "172.16.10.1", None, 0.75, "T1566.002", "Suspicious link shared in Slack channel redirecting to credential harvester.", 60),
        ("Suspicious PowerShell Execution", "Malware", "Medium", None, "10.0.1.30", 0.72, "T1059.001", "Obfuscated PowerShell script executed by non-admin user.", 62),
        ("DDoS - HTTP Flood on API", "DDoS", "High", "185.156.73.54", "10.0.0.2", 0.90, "T1499", "HTTP flood attack sending 500k requests/sec to REST API endpoints.", 84),
        ("Lateral Movement Detected", "Malware", "High", None, "10.0.1.0/24", 0.86, "T1021", "Credential reuse detected across multiple internal systems.", 81),
        ("Brute Force RDP - Windows Server", "BruteForce", "Medium", "51.178.24.103", "10.0.2.20", 0.76, "T1110.003", "1,800 failed RDP authentication attempts from foreign IP.", 68),
        ("Malicious DNS Query - C2 Communication", "Malware", "Critical", None, "10.0.1.18", 0.93, "T1071.004", "Endpoint making repeated DNS queries to known C2 infrastructure.", 91),
        ("Data Exfiltration via HTTPS", "Malware", "Critical", "198.51.100.200", "10.0.1.18", 0.88, "T1048.002", "Large data transfer to external IP detected during off-hours.", 90),
        ("Weak TLS Configuration Detected", "Other", "Low", None, "10.0.0.8", 0.65, "T1573", "Web server using TLS 1.0 and weak cipher suites.", 35),
        ("Insider Threat - Mass Download", "Other", "High", None, "10.0.1.25", 0.79, "T1052", "User downloaded 15GB of customer data outside business hours.", 76),
        ("Log Tampering Detected", "Malware", "High", None, "10.0.0.5", 0.84, "T1070", "System audit logs cleared on compromised server.", 83),
        ("SQL Injection Attempt - API", "SQLInjection", "Medium", "203.0.113.99", "10.0.2.10", 0.71, "T1190", "Blind SQL injection probing detected on internal API endpoint.", 64),
        ("Port Scan - Pre-Attack Recon", "PortScan", "Low", "104.156.155.200", "10.0.0.0/24", 0.60, "T1046", "Light port scan, possible pre-attack reconnaissance phase.", 30),
    ]

    threats = []
    for title, ttype, sev, src, tgt, conf, mitre, desc, risk in threat_data:
        threats.append({
            "id": rid(), "title": title, "threat_type": ttype, "severity": sev,
            "source_ip": src, "target_ip": tgt, "confidence": conf,
            "mitre_technique": mitre, "description": desc,
            "status": random.choice(["Active", "Active", "Active", "Investigating", "Resolved"]),
            "indicators": [f"IP:{src}" if src else f"HOST:{tgt}"],
            "risk_score": risk,
            "detected_at": rdt(25),
            "updated_at": rdt(5),
        })
    await db["threats"].insert_many(threats)
    print(f"  - Inserted {len(threats)} threats")

    # --- INCIDENTS ---
    severities = ["Critical", "High", "Medium", "Low"]
    statuses = ["Open", "Open", "In Progress", "Resolved"]
    incident_data = [
        ("DDoS Incident - Web Gateway Down", "Critical", "The main web gateway is under active DDoS attack. Service degraded."),
        ("Ransomware on Finance PC-04", "Critical", "LockBit ransomware encrypting files on finance workstation. User locked out."),
        ("SQL Injection Breach Investigation", "High", "Customer portal may have been compromised via SQL injection."),
        ("Phishing Campaign Response", "High", "Multiple HR employees clicked phishing link. Credential reset in progress."),
        ("SSH Brute Force - Admin Account Lockout", "High", "Admin account temporarily locked after brute force. Investigating source."),
        ("Cryptominer Removal - App Server 3", "Medium", "XMRig miner found on server. Scheduled for remediation."),
        ("Unauthorized Data Access - Finance", "High", "Finance user accessed records outside their scope. HR notified."),
        ("Malware Quarantine - Endpoint 22", "Medium", "Trojan isolated by AV. Forensic analysis pending."),
        ("TLS Downgrade Attack Attempt", "Medium", "Weak TLS targeted on web server 08. Certificate renewal required."),
        ("Log Tampering on Server 05", "High", "Audit logs cleared. Full forensic investigation initiated."),
        ("Lateral Movement Containment", "Critical", "Credential reuse spreading across internal network. Containment underway."),
        ("C2 Communication Blocked", "High", "Endpoint blocked from reaching C2. Malware sample extracted for analysis."),
        ("Insider Threat Investigation", "High", "Mass data download by employee. Legal and HR involved."),
        ("RDP Brute Force Alert", "Medium", "Windows Server 2020 targeted. RDP access restricted to VPN."),
        ("Data Exfiltration Attempt Blocked", "Critical", "DLP blocked large transfer to external IP. Endpoint isolated."),
    ]

    incidents = []
    assignees = ["Jamie Chen", "Sam Patel", "Alex Morgan", "Jordan Lee", "Riley Kim"]
    for i, (title, sev, desc) in enumerate(incident_data):
        st = random.choice(statuses)
        incidents.append({
            "id": rid(), "title": title, "description": desc,
            "severity": sev, "status": st,
            "assigned_to": random.choice(assignees) if st != "Open" else None,
            "created_at": rdt(20), "updated_at": rdt(3),
            "related_threats": [],
        })
    await db["incidents"].insert_many(incidents)
    print(f"  - Inserted {len(incidents)} incidents")

    # --- ASSETS ---
    asset_data = [
        ("Web Gateway 01", "Firewall", "10.0.0.1", "Linux", "Critical", "Network Team"),
        ("API Server 01", "Server", "10.0.0.2", "Ubuntu 22.04", "Critical", "DevOps"),
        ("Finance DB 01", "Database", "10.0.1.5", "Windows Server 2022", "Critical", "Finance"),
        ("Finance Workstation PC-04", "Endpoint", "10.0.1.15", "Windows 11", "High", "Finance"),
        ("HR Server 01", "Server", "10.0.2.8", "Ubuntu 20.04", "High", "HR"),
        ("Core Router", "Router", "10.0.0.254", "Cisco IOS", "Critical", "Network Team"),
        ("App Server 01", "Server", "10.0.3.5", "CentOS 8", "High", "DevOps"),
        ("App Server 02", "Server", "10.0.3.6", "CentOS 8", "High", "DevOps"),
        ("Windows Server 2020", "Server", "10.0.2.20", "Windows Server 2020", "High", "IT Ops"),
        ("Backup Server", "Server", "10.0.4.1", "Ubuntu 22.04", "Medium", "IT Ops"),
        ("Dev Workstation - User A", "Endpoint", "10.0.1.22", "macOS 14", "Medium", "Engineering"),
        ("Dev Workstation - User B", "Endpoint", "10.0.1.23", "Windows 11", "Medium", "Engineering"),
        ("AWS S3 Bucket - Prod", "Cloud", None, "AWS", "Critical", "DevOps"),
        ("AWS EC2 - Frontend", "Cloud", "10.0.0.10", "AWS", "High", "DevOps"),
        ("Azure Blob Storage", "Cloud", None, "Azure", "High", "IT Ops"),
        ("Perimeter Firewall", "Firewall", "10.0.0.3", "Palo Alto", "Critical", "Network Team"),
        ("Internal Firewall", "Firewall", "10.0.0.4", "FortiGate", "High", "Network Team"),
        ("VPN Gateway", "Firewall", "10.0.0.5", "OpenVPN", "Critical", "Network Team"),
        ("Marketing Workstation 01", "Endpoint", "10.0.5.1", "macOS 13", "Low", "Marketing"),
        ("HR Workstation 01", "Endpoint", "10.0.5.10", "Windows 11", "Medium", "HR"),
        ("Email Server", "Server", "10.0.2.15", "Ubuntu 22.04", "High", "IT Ops"),
        ("Monitoring Server", "Server", "10.0.4.5", "Ubuntu 22.04", "Medium", "DevOps"),
        ("Customer DB 01", "Database", "10.0.1.8", "PostgreSQL on Linux", "Critical", "Engineering"),
        ("Log Aggregator", "Server", "10.0.4.10", "Elastic on Linux", "High", "Security Ops"),
        ("CI/CD Server", "Server", "10.0.3.20", "Ubuntu 22.04", "Medium", "DevOps"),
    ]

    criticalities = ["Critical", "High", "High", "Medium", "Medium", "Low"]
    assets = []
    for name, atype, ip, os_name, crit, dept in asset_data:
        vuln_count = {"Critical": random.randint(5, 15), "High": random.randint(2, 8), "Medium": random.randint(0, 5), "Low": 0}
        assets.append({
            "id": rid(), "name": name, "asset_type": atype, "ip_address": ip,
            "mac_address": f"00:1A:{random.randint(10,99):02X}:{random.randint(10,99):02X}:{random.randint(10,99):02X}:{random.randint(10,99):02X}",
            "os": os_name, "owner": dept, "department": dept, "criticality": crit,
            "tags": [atype.lower(), dept.lower().replace(" ", "-")],
            "created_at": rdt(180), "last_seen": rdt(1),
            "vulnerabilities_count": vuln_count.get(crit, 0),
            "risk_score": {"Critical": random.randint(70, 95), "High": random.randint(50, 70), "Medium": random.randint(20, 50), "Low": random.randint(0, 20)}.get(crit, 10),
            "is_active": True,
        })
    await db["assets"].insert_many(assets)
    print(f"  - Inserted {len(assets)} assets")

    # --- COMPLIANCE ---
    iso_controls = [
        ("A.5.1", "Information Security Policies", "Policies for information security must be defined.", "Pass", "Policy documented and approved by CISO"),
        ("A.6.1", "Internal Organisation", "Security roles and responsibilities are defined.", "Pass", "RACI matrix updated Q3"),
        ("A.7.1", "Human Resources Security", "Security screening before employment.", "In Progress", "Background checks for 80% of staff"),
        ("A.8.1", "Asset Management", "Assets are identified and inventoried.", "Pass", "Asset inventory in AegisSec system"),
        ("A.9.1", "Access Control", "Access control policy implemented.", "Pass", "Zero-trust IAM deployed"),
        ("A.10.1", "Cryptography", "Encryption policies implemented.", "Fail", "TLS 1.0 still in use on server-08"),
        ("A.11.1", "Physical Security", "Physical access controls in place.", "Pass", "Badge access and CCTV verified"),
        ("A.12.1", "Operations Security", "Operating procedures documented.", "In Progress", "70% of runbooks updated"),
        ("A.13.1", "Communications Security", "Network security managed.", "Pass", "Firewall rules reviewed monthly"),
        ("A.16.1", "Incident Management", "Incident response process defined.", "Pass", "IRP tested in Q2 tabletop exercise"),
    ]
    nist_controls = [
        ("ID.AM", "Asset Management", "Physical and software assets are inventoried.", "Pass", "Full asset inventory maintained"),
        ("PR.AC", "Access Control", "Access to assets is limited to authorized users.", "Pass", "RBAC enforced"),
        ("PR.DS", "Data Security", "Data-at-rest and in-transit is protected.", "In Progress", "Encryption gaps in legacy DB"),
        ("PR.IP", "Protective Technology", "Security policies are maintained.", "Pass", "Policies reviewed annually"),
        ("DE.CM", "Continuous Monitoring", "Networks are monitored for anomalies.", "Pass", "AegisSec SIEM active"),
        ("DE.DP", "Detection Processes", "Detection processes are maintained.", "Pass", "Alert rules reviewed monthly"),
        ("RS.RP", "Response Planning", "Response plan executed during incidents.", "In Progress", "Playbooks 60% complete"),
        ("RC.RP", "Recovery Planning", "Recovery plans are in place.", "Fail", "DR plan not tested in 18 months"),
    ]
    pci_controls = [
        ("1.1", "Firewall Configuration", "Firewalls protect cardholder data environment.", "Pass", "Firewall ruleset audited"),
        ("2.1", "Default Credentials", "Vendor defaults changed.", "Pass", "All defaults changed at deployment"),
        ("3.1", "Protect Stored Data", "Cardholder data storage minimized.", "In Progress", "Data retention policy under review"),
        ("6.1", "Patch Management", "Systems protected from known vulnerabilities.", "Fail", "3 critical patches pending"),
        ("8.1", "Identity Management", "Unique IDs for all users.", "Pass", "No shared accounts in production"),
        ("10.1", "Audit Logs", "All access to cardholder data logged.", "Pass", "Logs retained 12 months"),
    ]

    def calc_score(controls):
        passed = sum(1 for c in controls if c[3] == "Pass")
        return round((passed / len(controls)) * 100, 1)

    def build_controls(data):
        return [{"control_id": d[0], "title": d[1], "description": d[2], "status": d[3], "evidence": d[4]} for d in data]

    frameworks = [
        {"id": rid(), "framework": "ISO 27001", "version": "2022",
         "controls": build_controls(iso_controls), "score": calc_score(iso_controls),
         "last_assessed": datetime.utcnow() - timedelta(days=15),
         "next_assessment": datetime.utcnow() + timedelta(days=75)},
        {"id": rid(), "framework": "NIST CSF", "version": "1.1",
         "controls": build_controls(nist_controls), "score": calc_score(nist_controls),
         "last_assessed": datetime.utcnow() - timedelta(days=30),
         "next_assessment": datetime.utcnow() + timedelta(days=60)},
        {"id": rid(), "framework": "PCI-DSS", "version": "4.0",
         "controls": build_controls(pci_controls), "score": calc_score(pci_controls),
         "last_assessed": datetime.utcnow() - timedelta(days=45),
         "next_assessment": datetime.utcnow() + timedelta(days=45)},
    ]
    await db["compliance"].insert_many(frameworks)
    print(f"  - Inserted {len(frameworks)} compliance frameworks")

    client.close()
    print("\n[SEED] Database seeding complete!")
    print("\nDemo accounts:")
    print("  admin@aegissec.io    / Admin@123    (admin, MFA enabled)")
    print("  analyst@aegissec.io  / Analyst@123  (analyst)")
    print("  responder@aegissec.io / Responder@123 (responder)")


if __name__ == "__main__":
    asyncio.run(seed())
