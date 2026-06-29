import aiosmtplib
from email.mime.text import MIMEText
from app.core.config import settings

async def send_verification_email(to_email:str,code:str):
    if not settings.SMTP_HOST:
        print(f"[EMAIL] Код для {to_email}: {code}")
        return
    try:
        message=MIMEText(f"Ваш код подтверждения: {code}")
        message["From"]=settings.SMTP_FROM
        message["To"]=to_email
        message["Subject"]="Подтверждение email - Качки в Иркутске"
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True
        )
        print(f"[EMAIL] Отправлено на {to_email}: {code}")
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        print(f"[EMAIL FALLBACK] Код для {to_email}: {code}")