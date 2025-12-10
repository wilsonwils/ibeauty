import requests
import os

RECAPTCHA_SECRET = os.environ.get("RECAPTCHA_SECRET", "")
USE_RECAPTCHA = False

def verify_recaptcha(token):
    """Verify Google reCAPTCHA token."""
    url = "https://www.google.com/recaptcha/api/siteverify"
    data = {
        "secret": RECAPTCHA_SECRET,
        "response": token
    }
    response = requests.post(url, data=data)
    result = response.json()
    return result.get("success", False)
