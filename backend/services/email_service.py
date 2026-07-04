import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from core.config import settings


def _build_otp_html(otp: str, purpose: str, user_name: str = "User") -> str:
    title = "Email Verification Code" if purpose == "mfa" else "Password Reset Code"
    message = (
        "Use the code below to complete your login verification."
        if purpose == "mfa"
        else "Use the code below to reset your AegisSec account password."
    )
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 0;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0"
            style="background:linear-gradient(135deg,#0d1b2a,#1a2744);border:1px solid #1e3a5f;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(90deg,#1e3a8a,#3b82f6);padding:28px 36px;">
                <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">&#x1F6E1; AegisSec</p>
                <p style="color:#93c5fd;font-size:12px;margin:4px 0 0;">AI-Powered Cyber Threat Detection</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px;">
                <h2 style="color:#e2e8f0;font-size:20px;margin:0 0 8px;">{title}</h2>
                <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;">Hi {user_name}, {message}</p>
                <div style="background:#0f1e35;border:1px solid #1e3a5f;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                  <p style="color:#64748b;font-size:12px;letter-spacing:2px;margin:0 0 8px;text-transform:uppercase;">Your Secure Code</p>
                  <p style="color:#3b82f6;font-size:42px;font-weight:800;letter-spacing:12px;margin:0;font-family:monospace;">{otp}</p>
                </div>
                <p style="color:#64748b;font-size:12px;margin:0 0 4px;">&#x23F0; This code expires in <strong style="color:#94a3b8;">10 minutes</strong>.</p>
                <p style="color:#64748b;font-size:12px;margin:0;">If you didn't request this, please ignore this email and secure your account.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px;border-top:1px solid #1e3a5f;">
                <p style="color:#475569;font-size:11px;margin:0;">&copy; 2024 AegisSec &mdash; All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """


async def send_otp_email(to_email: str, otp: str, purpose: str, user_name: str = "User") -> bool:
    """Send an OTP email via Gmail SMTP. Returns True on success."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL] SMTP not configured. OTP for {to_email}: {otp}")
        return True  # Graceful fallback in dev

    subject = "AegisSec — Your Verification Code" if purpose == "mfa" else "AegisSec — Password Reset Code"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"AegisSec Security <{settings.SMTP_USER}>"
    msg["To"] = to_email

    html_body = _build_otp_html(otp, purpose, user_name)
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        print(f"[EMAIL] OTP sent to {to_email}")
        return True
    except Exception as e:
        err_msg = str(e)
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {err_msg}")
        return err_msg
