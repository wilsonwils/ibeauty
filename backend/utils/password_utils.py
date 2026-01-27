import os
import base64
import hashlib
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
from passlib.hash import bcrypt, bcrypt_sha256

MAX_PWD_LEN = 72
SECRET_KEY = os.getenv("PASSWORD_SECRET", "").encode()


def safe_pw(pw):
    return (pw or "")[:MAX_PWD_LEN]


def _try_decrypt(raw_password: str):
    """
    Decrypt CryptoJS AES encrypted password.
    Returns decrypted password or None (old users).
    """
    try:
        raw = base64.b64decode(raw_password)

        if raw[:8] != b"Salted__":
            return None

        salt = raw[8:16]

        key_iv = b""
        last = b""
        while len(key_iv) < 48:
            last = hashlib.md5(last + SECRET_KEY + salt).digest()
            key_iv += last

        key = key_iv[:32]
        iv = key_iv[32:48]

        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted = unpad(cipher.decrypt(raw[16:]), AES.block_size)

        return decrypted.decode("utf-8")

    except Exception:
        return None


def decrypt_password(raw_password: str):
    decrypted = _try_decrypt(raw_password)
    return decrypted if decrypted else raw_password


def verify_password(raw_password, stored_hash):
    if not stored_hash:
        return False

    final_password = decrypt_password(raw_password)
    pw = safe_pw(final_password)

    if stored_hash.startswith("$bcrypt-sha256$"):
        try:
            return bcrypt_sha256.verify(pw, stored_hash)
        except Exception:
            return False

    try:
        return bcrypt.verify(pw, stored_hash)
    except Exception:
        return False


def hash_password(raw_password):
    final_password = decrypt_password(raw_password)
    return bcrypt.hash(safe_pw(final_password))
