import smtplib
import os
from email.mime.text import MIMEText

def send_verification_email(email, token):
    link = f"http://localhost:5000/verify/{token}"

    msg = MIMEText(f"Click here to verify your account: {link}")
    msg['Subject'] = "Verify Your Account"
    msg['From'] = os.getenv("EMAIL_USER")
    msg['To'] = email

    server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
    server.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
    server.sendmail(os.getenv("EMAIL_USER"), email, msg.as_string())
    server.quit()
