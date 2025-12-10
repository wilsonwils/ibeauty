from passlib.hash import bcrypt, bcrypt_sha256

MAX_PWD_LEN = 72

def safe_pw(pw):
    return (pw or "")[:MAX_PWD_LEN]

def verify_password(raw_password, stored_hash):
    pw = safe_pw(raw_password)

    if not stored_hash:
        return False

    # bcrypt_sha256 (new users)
    if stored_hash.startswith("$bcrypt-sha256$"):
        try:
            return bcrypt_sha256.verify(pw, stored_hash)
        except Exception:
            return False

    try:
        return bcrypt.verify(pw, stored_hash)
    except ValueError:
        return False
    except Exception:
        return False

    return False