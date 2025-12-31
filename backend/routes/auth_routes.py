from flask import Blueprint, request, jsonify, redirect
import os
import requests
import secrets
from datetime import datetime, timedelta, timezone
import jwt
from passlib.hash import bcrypt
import json
import traceback
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
    phone = data.get("phone")  # NEW: get phone

    if not all([first, last, email, password, org_name, phone]):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    full_name = f"{first} {last}"
    password_hash = bcrypt.hash(password)
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

        # Create user with phone
        cur.execute("""
            INSERT INTO users
            (organization_id, email, password_hash, oauth_provider, oauth_provider_id, full_name, phone, role, is_active, created_at)
            VALUES (%s, %s, %s, NULL, %s, %s, %s, %s, FALSE, NOW())
            RETURNING id
        """, (org_id, email, password_hash, email_verify_token, full_name, phone, 'user'))
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

@auth_bp.get("/get-profile/<int:user_id>")
def get_profile(user_id):
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT 
                u.id,
                u.full_name,
                u.email,
                u.phone,
                o.name AS organization_name,
                o.organization_whatsapp
            FROM users u
            LEFT JOIN organizations o ON u.organization_id = o.id
            WHERE u.id = %s
        """, (user_id,))
        
        row = cur.fetchone()
        if not row:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        user_data = {
            "id": row[0],
            "fullName": row[1],
            "email": row[2],
            "phone": row[3],
            "organization": row[4],
            "whatsapp": row[5] 
        }

        # Split full_name
        if user_data["fullName"]:
            parts = user_data["fullName"].split(" ", 1)
            user_data["firstName"] = parts[0]
            user_data["lastName"] = parts[1] if len(parts) > 1 else ""

        return jsonify({"status": "success", "user": user_data}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

    finally:
        cur.close()
        conn.close()


@auth_bp.put("/update-profile")
def update_profile():
    data = request.json or {}

    user_id = data.get("user_id")
    first = data.get("firstName")
    last = data.get("lastName")
    phone = data.get("phone")
    organization_name = data.get("organization")
    organization_whatsapp = data.get("whatsapp") 

    if not user_id:
        return jsonify({"status": "error", "message": "User ID required"}), 400

    if not first or not last:
        return jsonify({"status": "error", "message": "First and last name required"}), 400

    full_name = f"{first} {last}"

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Get organization_id
        cur.execute("""
            SELECT organization_id
            FROM users
            WHERE id = %s
        """, (user_id,))
        row = cur.fetchone()

        if not row:
            return jsonify({"status": "error", "message": "User not found"}), 404

        organization_id = row[0]

        #  Update users table
        cur.execute("""
            UPDATE users
            SET full_name = %s,
                phone = %s
            WHERE id = %s
        """, (full_name, phone, user_id))

        #  Update organization (NAME + WHATSAPP)
        if organization_id:
            cur.execute("""
                UPDATE organizations
                SET 
                    name = COALESCE(%s, name),
                    organization_whatsapp = %s
                WHERE id = %s
            """, (organization_name, organization_whatsapp, organization_id))

        conn.commit()

        return jsonify({
            "status": "success",
            "message": "Profile updated successfully"
        }), 200

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
    #  Read token from Authorization header
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token required"}), 401

    #  Clean token
    token = token.replace("Bearer ", "").strip()

    #  Verify token
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    #  Extract user + org from token
    user_id = payload.get("user_id")
    organization_id = payload.get("organization_id")


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



@auth_bp.get("/my-modules")
def get_my_modules():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID not found in token"}), 401

    conn = get_connection()
    cur = conn.cursor()

    try:
        # -------- GET PLAN --------
        cur.execute("""
            SELECT plan_id, organization_id
            FROM module_permission
            WHERE user_id = %s
            LIMIT 1
        """, (user_id,))
        row = cur.fetchone()

        plan_id = row[0] if row else 0
        organization_id = row[1] if row else None

        # -------- CHECK TRIAL EXPIRY --------
        trial_expired = False

        if organization_id:
            cur.execute("""
                SELECT trial_end_at
                FROM organization_modules
                WHERE organization_id = %s
                LIMIT 1
            """, (organization_id,))
            trial_row = cur.fetchone()

            if trial_row and trial_row[0]:
                now = datetime.now(timezone.utc)
                if now >= trial_row[0]:
                    trial_expired = True

        return jsonify({
            "status": "success",
            "plan_id": plan_id,
            "trial_expired": trial_expired
        }), 200

    finally:
        cur.close()
        conn.close()




@auth_bp.post("/update-modules")
def update_modules():
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    # Optional: logged-in user ID (for permission check)
    logged_in_user_id = payload.get("user_id")

    data = request.json or {}
    target_user_id = data.get("user_id")
    if not target_user_id:
        return jsonify({"error": "User ID is required"}), 400

    module_ids = data.get("module_ids", [])
    if not isinstance(module_ids, list):
        module_ids = []

    conn = get_connection()
    cur = conn.cursor()

    try:
        module_ids_json = json.dumps(module_ids)

        # Update the selected user's modules
        cur.execute("""
            UPDATE module_permission
            SET customized_module_id = %s
            WHERE user_id = %s
        """, (module_ids_json, target_user_id))

        conn.commit()

        return jsonify({
            "status": "success",
            "message": f"Customized modules updated successfully for user {target_user_id}"
        }), 200

    except Exception as e:
        conn.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

        
@auth_bp.post("/add-plan")
def add_plan_to_user():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    admin_id = payload["user_id"]
    data = request.json or {}

    user_id = data.get("user_id")
    plan_id = data.get("plan_id")
    customized_modules = data.get("customized_module_id", [])
    organization_id = data.get("organization_id")

    if user_id is None or plan_id is None:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # ---------------- GET ORGANIZATION ----------------
        if not organization_id:
            cur.execute(
                "SELECT organization_id FROM users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "User not found"}), 400
            organization_id = row[0]

        # ---------------- GET TRIAL INFO ----------------
        cur.execute("""
            SELECT trial_start_at, trial_end_at
            FROM organization_modules
            WHERE organization_id = %s
        """, (organization_id,))
        trial_row = cur.fetchone()

        now = datetime.now(timezone.utc)

        # BLOCK EXPIRED TRIAL (ONLY FOR TRIAL PLAN)
        if plan_id == 0 and trial_row and trial_row[1] and now >= trial_row[1]:
            return jsonify({"error": "FREE_TRIAL_EXPIRED"}), 403

        # BLOCK REUSED TRIAL
        if plan_id == 0 and trial_row and trial_row[0]:
            return jsonify({"error": "FREE_TRIAL_ALREADY_USED"}), 403

        # ---------------- GET PLAN DEFAULT MODULES ----------------
        cur.execute("""
            SELECT module_permission_default
            FROM module_payment_plan
            WHERE id = %s
        """, (plan_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Invalid plan_id"}), 400

        module_management_id = row[0]

        # ---------------- UPSERT MODULE PERMISSION ----------------
        cur.execute("""
            SELECT id
            FROM module_permission
            WHERE user_id = %s AND organization_id = %s
        """, (user_id, organization_id))
        exists = cur.fetchone()

        if exists:
            cur.execute("""
                UPDATE module_permission
                SET
                    plan_id = %s,
                    module_management_id = %s,
                    customized_module_id = %s,
                    added_by = %s,
                    updated_at = NOW()
                WHERE user_id = %s AND organization_id = %s
            """, (
                plan_id,
                json.dumps(module_management_id),
                json.dumps(customized_modules),
                admin_id,
                user_id,
                organization_id
            ))
            message = "Plan updated successfully"
        else:
            cur.execute("""
                INSERT INTO module_permission (
                    organization_id,
                    user_id,
                    added_by,
                    module_management_id,
                    plan_id,
                    customized_module_id,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, (
                organization_id,
                user_id,
                admin_id,
                json.dumps(module_management_id),
                plan_id,
                json.dumps(customized_modules)
            ))
            message = "Plan added successfully"

        # ---------------- CREATE FREE TRIAL (ONLY ONCE) ----------------
        if plan_id == 0:
            trial_start_at = now
            trial_end_at = trial_start_at + timedelta(days=15)

            if trial_row:
                cur.execute("""
                    UPDATE organization_modules
                    SET trial_start_at = %s,
                        trial_end_at = %s
                    WHERE organization_id = %s
                """, (trial_start_at, trial_end_at, organization_id))
            else:
                cur.execute("""
                    INSERT INTO organization_modules (
                        organization_id,
                        trial_start_at,
                        trial_end_at
                    ) VALUES (%s, %s, %s)
                """, (organization_id, trial_start_at, trial_end_at))

        conn.commit()
        return jsonify({"message": message}), 201

    except Exception as e:
        conn.rollback()
        print("ADD PLAN ERROR:", e)
        return jsonify({
            "error": "Server error",
            "details": str(e)
        }), 500

    finally:
        cur.close()
        conn.close()





@auth_bp.get("/users")
def get_all_users():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT 
                u.id,
                u.organization_id,
                u.full_name,
                u.email,
                u.phone,
                o.name AS organization_name,
                mpp.plan_name,
                COALESCE(mp.module_management_id, '[]'::jsonb) AS default_module_id,
                COALESCE(mp.customized_module_id, '[]'::jsonb) AS customized_module_id
            FROM users u
            LEFT JOIN organizations o 
                ON o.id = u.organization_id
            LEFT JOIN module_permission mp 
                ON mp.user_id = u.id
                AND mp.organization_id = u.organization_id
            LEFT JOIN module_payment_plan mpp 
                ON mpp.id = mp.plan_id
            ORDER BY u.created_at DESC
        """)

        rows = cur.fetchall()

        users = []
        for r in rows:
            user_id = r[0]
            organization_id = r[1]
            plan_name = r[6] or "-"

            # ---------------- CHECK TRIAL EXPIRY ----------------
            trial_expired = False
            if plan_name.lower() == "trial":
                cur.execute("""
                    SELECT trial_end_at
                    FROM organization_modules
                    WHERE organization_id = %s
                    LIMIT 1
                """, (organization_id,))
                trial_row = cur.fetchone()
                if trial_row and trial_row[0]:
                    now = datetime.now(timezone.utc)
                    trial_expired = now >= trial_row[0]

            users.append({
                "id": user_id,
                "organization_id": organization_id,
                "full_name": r[2],
                "email": r[3],
                "phone": r[4],
                "organization_name": r[5] or "",
                "plan": plan_name if not trial_expired else "-",  # show "-" if trial expired
                "trial_expired": trial_expired,
                "default_module_id": r[7] or [],
                "customized_module_id": r[8] or [],
            })

        return jsonify({"users": users}), 200

    except Exception as e:
        print("Error fetching users:", e)
        return jsonify({"error": "Server error"}), 500

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
