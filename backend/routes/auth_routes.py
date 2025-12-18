from flask import Blueprint, request, jsonify, redirect
import os
import requests
import secrets
from datetime import datetime, timedelta
import jwt
from passlib.hash import bcrypt



from database import get_connection
from utils.password_utils import verify_password
from utils.recaptcha import USE_RECAPTCHA, RECAPTCHA_SECRET
from services.email_service import send_verification_email

# ---------------------------------------------
# JWT CONFIG
# ---------------------------------------------
SECRET_KEY = os.getenv("JWT_SECRET", "fallback_dev_secret")   # fallback for local dev
ALGORITHM = "HS256"

def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=2)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ---------------------------------------------
# BLUEPRINT INIT (MUST COME FIRST)
# ---------------------------------------------
auth_bp = Blueprint("auth", __name__)


# ---------------------------------------------
# Protected Route
# ---------------------------------------------
@auth_bp.get("/protected")
def protected():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "")
    payload = decode_token(token)

    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    return jsonify({"message": "Success!", "data": payload})


# ---------------------------------------------
# SIGNUP
# ---------------------------------------------
@auth_bp.post("/signup")
def signup():
    data = request.json or {}

    if USE_RECAPTCHA:
        captcha_token = data.get("captcha_token")
        if not captcha_token:
            return jsonify({"status": "error", "message": "Captcha token missing"}), 400

        try:
            captcha_data = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={"secret": RECAPTCHA_SECRET, "response": captcha_token},
                timeout=10
            ).json()

            if not captcha_data.get("success"):
                return jsonify({"status": "error", "message": "Captcha verification failed"}), 400

        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    first = data.get("firstName")
    last = data.get("lastName")
    email = data.get("email")
    password = data.get("password")
    org_name = data.get("organization")

    if not all([first, last, email, password, org_name]):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    full_name = f"{first} {last}"
    password_hash = bcrypt.hash(password)

    # FIX: rename variable to avoid overwriting function
    email_verify_token = secrets.token_urlsafe(32)

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check existing email
        cur.execute("SELECT 1 FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            return jsonify({"status": "error", "message": "Email already registered"}), 400

        # Create organization
        cur.execute("""
            INSERT INTO organizations (name, website, plan, created_at)
            VALUES (%s, %s, %s, NOW())
            RETURNING id
        """, (org_name, None, "free"))
        org_id = cur.fetchone()[0]

        # Create user
        cur.execute("""
            INSERT INTO users
            (organization_id, email, password_hash, oauth_provider, oauth_provider_id, full_name, role, is_active, created_at)
            VALUES (%s, %s, %s, NULL, %s, %s, %s, FALSE, NOW())
            RETURNING id
        """, (org_id, email, password_hash, email_verify_token, full_name, 'user'))
        user_id = cur.fetchone()[0]

        conn.commit()

        try:
            send_verification_email(email, email_verify_token)
        except Exception:
            pass

        return jsonify({
            "status": "success",
            "message": "Account created. Please verify email.",
            "organizationId": org_id,
            "userId": user_id
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

    finally:
        cur.close()
        conn.close()


# ---------------------------------------------
# EMAIL VERIFICATION
# ---------------------------------------------
@auth_bp.get("/verify/<token>")
def verify(token):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT id FROM users WHERE oauth_provider_id=%s", (token,))
        row = cur.fetchone()

        if not row:
            return redirect("http://localhost:5173/verify?status=invalid")

        user_id = row[0]

        cur.execute("""
            UPDATE users
            SET is_active = TRUE,
                is_verified = TRUE,
                oauth_provider_id = NULL
            WHERE id=%s
        """, (user_id,))
        conn.commit()

        return redirect("http://localhost:5173/verify?status=success")

    finally:
        cur.close()
        conn.close()


# ---------------------------------------------
# LOGIN
# ---------------------------------------------
@auth_bp.post("/login")
def login():
    data = request.json or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT id, password_hash, organization_id, is_verified
            FROM users
            WHERE email=%s
        """, (email,))
        row = cur.fetchone()

        if not row:
            return jsonify({"error": "User not found"}), 404

        user_id, stored_hash, org_id, verified = row

        if not verified:
            return jsonify({"error": "Please verify email"}), 401

        if not verify_password(password, stored_hash):
            return jsonify({"error": "Incorrect password"}), 401

        # Create token
        token = create_token({
            "user_id": user_id,
            "organization_id": org_id
        })
        from services.module_permission_service import get_allowed_modules
        modules = get_allowed_modules(org_id, user_id)
        return jsonify({
            "message": "Login successful",
            "token": token,
            "userId": user_id,
            "organizationId": org_id,
            "allowed_modules": modules
        }), 200

    finally:
        cur.close()
        conn.close()



# ---------------------------------------------
# GET USER
# ---------------------------------------------
@auth_bp.get("/user/<int:user_id>")
def get_user(user_id):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT id, full_name, email, is_verified, role, is_active, organization_id
            FROM users
            WHERE id=%s
        """, (user_id,))
        row = cur.fetchone()

        if not row:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "id": row[0],
            "fullName": row[1],
            "email": row[2],
            "isVerified": row[3],
            "role": row[4],
            "isActive": row[5],
            "organizationId": row[6],
        })

    finally:
        cur.close()
        conn.close()


# ---------------------------------------------
# GET Modules
# ---------------------------------------------
@auth_bp.get("/modules")
def get_modules():
    # 1️⃣ Read token from Authorization header
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token required"}), 401

    # 2️⃣ Clean token
    token = token.replace("Bearer ", "").strip()

    # 3️⃣ Verify token
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    # 4️⃣ Extract user + org from token
    user_id = payload.get("user_id")
    organization_id = payload.get("organization_id")

    # 5️⃣ Query DB
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT id, name, description
            FROM modules
        """)

        rows = cur.fetchall()

        modules = [{
            "id": r[0],
            "title": r[1],
            "text": r[2],
            "bg": '#25afc1',
            "shadow": '4'
           
        } for r in rows]

        return jsonify({
            "status": "success",
            "data": modules,
            "userId": user_id,
            "organizationId": organization_id
        })

    finally:
        cur.close()
        conn.close()


# ---------------------------------------------

@auth_bp.post("/check-module-access")
def check_module_access():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "").strip()
    payload = decode_token(token)

    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    data = request.json or {}
    module_id = data.get("moduleId")

    if not module_id:
        return jsonify({"error": "moduleId required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT payment_status
            FROM organization_modules
            WHERE organization_id = %s
              AND module_id = %s
        """, (organization_id, module_id))

        row = cur.fetchone()

        if not row:
            return jsonify({"access": False, "message": "Module not found"}), 200

        payment_status = row[0]

        if payment_status != "Success":
            return jsonify({"access": False, "message": "Subscription inactive"}), 200

        # ACCESS GRANTED
        return jsonify({"access": True, "message": "Access granted"}), 200

    finally:
        cur.close()
        conn.close()




# ---------------------------------------------
# LOGOUT
# ---------------------------------------------
@auth_bp.post("/logout")
def logout():
    data = request.json or {}
    user_id = data.get("userId")

    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("UPDATE users SET is_active = FALSE WHERE id=%s", (user_id,))
        conn.commit()
        return jsonify({"message": "Logged out successfully"}), 200

    finally:
        cur.close()
        conn.close()
