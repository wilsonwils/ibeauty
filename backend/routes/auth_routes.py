from flask import Blueprint, request, jsonify, redirect
import requests

from database import get_connection
from utils.password_utils import verify_password, safe_pw
from utils.recaptcha import verify_recaptcha, USE_RECAPTCHA, RECAPTCHA_SECRET
from services.email_service import send_verification_email
import secrets
from passlib.hash import bcrypt
from datetime import datetime

auth_bp = Blueprint("auth", __name__)

# -------------------------------------------------------------------
# SIGNUP
# -------------------------------------------------------------------
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
    phone = data.get("phone")
    password = data.get("password")
    org_name = data.get("organization")

    if not all([first, last, email, password, org_name]):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    full_name = f"{first} {last}"

    # Password hashing
    password_hash = bcrypt.hash(password)

    # Generate verification token (store in oauth_provider_id)
    verify_token = secrets.token_urlsafe(32)

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Ensure email is not already used within any organization (or adapt rule as needed)
        cur.execute("SELECT 1 FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            return jsonify({
                "status": "error",
                "message": "Email already registered. Please login."
            }), 400

        # Insert organization and get integer id
        cur.execute("""
            INSERT INTO organizations (name, website, plan, created_at)
            VALUES (%s, %s, %s, NOW())
            RETURNING id
        """, (org_name, None, "free"))
        org_id = cur.fetchone()[0]

        # Insert user and get id
        cur.execute("""
            INSERT INTO users
            (organization_id, email, password_hash, oauth_provider, oauth_provider_id, full_name, role, is_active, created_at)
            VALUES (%s, %s, %s, NULL, %s, %s, %s, FALSE, NOW())
            RETURNING id
        """, (org_id, email, password_hash, verify_token, full_name, 'user'))
        user_id = cur.fetchone()[0]

        conn.commit()

        # Send verification email (your implementation)
        try:
            from send_email import send_verification_email
            send_verification_email(email, verify_token)
        except Exception:
            # It's okay if email sending fails here; we already created the user.
            pass

        return jsonify({
            "status": "success",
            "message": "Account created. Please verify your email.",
            "organizationId": org_id,
            "userId": user_id
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

    finally:
        cur.close()
        conn.close()

# -------------------------------------------------------------------
# EMAIL VERIFICATION
# -------------------------------------------------------------------
@auth_bp.get("/verify/<token>")
def verify(token):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT id FROM users WHERE oauth_provider_id=%s", (token,))
        user = cur.fetchone()

        if not user:
            return redirect("http://localhost:5173/verify?status=invalid")

        user_id = user[0]

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

# -------------------------------------------------------------------
# LOGIN
# -------------------------------------------------------------------
@auth_bp.post("/login")
def login():
    data = request.json or {}
    email = data.get("email")
    raw_password = data.get("password")

    if not email or not raw_password:
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

        # If you have an is_verified column, ensure it's present in DB schema. If not, adapt.
        if hasattr(row, '__len__') and verified is False:
            return jsonify({"error": "Please verify your email"}), 401

        if not verify_password(raw_password, stored_hash):
            return jsonify({"error": "Incorrect password"}), 401

        cur.execute("UPDATE users SET is_active = TRUE WHERE id=%s", (user_id,))
        conn.commit()

        return jsonify({
            "message": "Login successful",
            "userId": user_id,
            "organizationId": org_id
        }), 200

    finally:
        cur.close()
        conn.close()

# -------------------------------------------------------------------
# SOCIAL LOGIN
# -------------------------------------------------------------------
@auth_bp.post("/social-login")
def social_login():
    data = request.json or {}
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT id, is_verified FROM users WHERE email=%s", (email,))
        row = cur.fetchone()

        if not row:
            return jsonify({"userExists": False}), 200

        user_id, verified = row

        cur.execute("UPDATE users SET is_active = TRUE WHERE id=%s", (user_id,))
        conn.commit()

        return jsonify({
            "userExists": True,
            "isVerified": verified,
            "userId": user_id
        }), 200

    finally:
        cur.close()
        conn.close()

# -------------------------------------------------------------------
# GET USER
# -------------------------------------------------------------------
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

# -------------------------------------------------------------------
# LOGOUT
# -------------------------------------------------------------------
@auth_bp.post("/logout")
def logout():
    data = request.json or {}
    user_id = data.get("userId")

    if user_id is None:
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



