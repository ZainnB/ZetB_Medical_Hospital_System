import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_mfa_code(email: str, code: str) -> bool:
    """
    Send MFA code to user's email via SMTP.
    Returns True if successful, False otherwise.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. MFA email not sent.")
        # In development, log the code instead
        if settings.ENVIRONMENT == "development":
            logger.info(f"MFA Code for {email}: {code}")
            return True
        return False
    
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = email
        msg["Subject"] = "Your Hospital Management System MFA Code"
        
        body = f"""
        Hello,
        
        Your Multi-Factor Authentication code is: {code}
        
        This code will expire in {settings.MFA_CODE_EXPIRE_MINUTES} minutes.
        
        If you did not request this code, please ignore this email.
        
        Best regards,
        Hospital Management System
        """
        
        msg.attach(MIMEText(body, "plain"))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"MFA code sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send MFA email to {email}: {str(e)}")
        return False

