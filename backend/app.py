from flask import Flask, request, jsonify, redirect, send_from_directory
from flask_cors import CORS
from passlib.hash import bcrypt, bcrypt_sha256
import uuid
import requests
import os
import json
from database import get_connection
from send_email import send_verification_email
import re
from datetime import datetime, timedelta
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)


# CAPTCHA Secret (you may override via ENV)
RECAPTCHA_SECRET = os.environ.get(
    "RECAPTCHA_SECRET",
    "6Ld0lB4sAAAAAD3tTX9-cfn3FaZcLCL-xNfIA9bS"
)
USE_RECAPTCHA = False
# -------------------------------------------------------------------
# PASSWORD SAFETY HELPERS (Very Important)
# -------------------------------------------------------------------

MAX_PWD_LEN = 72

def safe_pw(pw):
    """Truncate password to bcrypt's 72-byte limit."""
    return (pw or "")[:MAX_PWD_LEN]

def verify_password(raw_password, stored_hash):
    """
    SAFEST possible password checker:
    - Supports bcrypt and bcrypt_sha256
    - Prevents bcrypt 72-byte crash completely
    - Prevents invalid hash crash
    - Gracefully handles legacy hashes
    """

    pw = safe_pw(raw_password)

    # 1) bcrypt_sha256 (new users)
    if stored_hash.startswith("$bcrypt-sha256$"):
        try:
            return bcrypt_sha256.verify(pw, stored_hash)
        except Exception:
            return False

    # 2) Legacy bcrypt hash ($2b$, $2a$, etc.)
    try:
        return bcrypt.verify(pw, stored_hash)
    except ValueError:
        # This is the bcrypt 72-byte crash — stop here.
        return False
    except Exception:
        return False

    # Should not reach here
    return False



# -------------------------------------------------------------------
# SIGNUP
# -------------------------------------------------------------------@app.post("/signup")
@app.post("/signup")
def signup():
    data = request.json or {}

    # ----------------------------------------------------
    # CAPTCHA CHECK (uses your version-2 logic)
    # ----------------------------------------------------
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

    # ----------------------------------------------------
    # USER INPUT
    # ----------------------------------------------------
    first = data.get("firstName")
    last = data.get("lastName")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    org_name = data.get("organization")

    if not all([first, last, email, password, org_name]):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    full_name = f"{first} {last}"

    # ----------------------------------------------------
    # MODULE MAP (from Version 1)
    # ----------------------------------------------------
    MODULE_MAP = {
        "ibeauty": {"code": "A", "name": "iBeauty"},
        "ishowroom": {"code": "B", "name": "iShowroom"},
        "iinsights": {"code": "C", "name": "iInsights"},
        "isupport": {"code": "D", "name": "iSupport"},
    }

    # Normalize organization → module mapping key
    key = re.sub(r"[^a-z0-9]", "", org_name.strip().lower())
    module_info = MODULE_MAP.get(key)

    if not module_info:
        return jsonify({"status": "error", "message": "Invalid organization name"}), 400

    module_code = module_info["code"]
    module_name = module_info["name"]

    # ----------------------------------------------------
    # GENERATE IDS
    # ----------------------------------------------------
    user_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    verify_token = str(uuid.uuid4())

    now = datetime.utcnow()
    trial_end = now + timedelta(days=14)

    # Password hashing
    password_hash = bcrypt.hash(password)

    # ----------------------------------------------------
    conn = get_connection()
    cur = conn.cursor()

    try:
        # ------------------------------------------------
        #  Check existing email
        # ------------------------------------------------
        cur.execute("SELECT 1 FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            return jsonify({
                "status": "error",
                "message": "Email already registered. Please login."
            }), 400

        # ------------------------------------------------
        #  Create organization
        # ------------------------------------------------
        cur.execute("""
            INSERT INTO organizations (id, name, website, plan, created_at)
            VALUES (%s, %s, %s, %s, NOW())
        """, (org_id, org_name, None, "free"))

        # ------------------------------------------------
        #  Create user
        # ------------------------------------------------
        cur.execute("""
            INSERT INTO users
            (id, organization_id, email, password_hash, oauth_provider,
             oauth_provider_id, full_name, role, is_active, created_at, is_verified)
            VALUES (%s, %s, %s, %s, NULL, %s, %s, 'user', FALSE, NOW(), FALSE)
        """, (user_id, org_id, email, password_hash, verify_token, full_name))

        # ------------------------------------------------
        #  MODULE handling (Version 1 logic)
        # ------------------------------------------------
        cur.execute("SELECT id FROM modules WHERE code=%s", (module_code,))
        module_row = cur.fetchone()

        if module_row:
            module_id = module_row[0]
        else:
            module_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO modules (id, code, name, description, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (module_id, module_code, module_name, None, now))

        # ------------------------------------------------
        #  Link organization → module
        # ------------------------------------------------
        cur.execute("""
            INSERT INTO organization_modules
            (organization_id, module_id, plan, status, trial_ends_at, subscribed_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (org_id, module_id, "free", "active", trial_end, now))

        conn.commit()

        # ------------------------------------------------
        #  Send verification email
        # ------------------------------------------------
        send_verification_email(email, verify_token)

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
@app.get("/verify/<token>")
def verify(token):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT id FROM users WHERE oauth_provider_id=%s", (token,))
        user = cur.fetchone()

        if not user:
            return redirect("http://localhost:5173/verify?status=invalid")

        cur.execute("""
            UPDATE users
            SET is_verified = TRUE,
                oauth_provider_id = NULL
            WHERE id=%s
        """, (user[0],))

        conn.commit()

        return redirect("http://localhost:5173/verify?status=success")

    finally:
        cur.close()
        conn.close()


# -------------------------------------------------------------------
# LOGIN
# -------------------------------------------------------------------
@app.post("/login")
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

        if not verified:
            return jsonify({"error": "Please verify your email"}), 401

        if not verify_password(raw_password, stored_hash):
            return jsonify({"error": "Incorrect password"}), 401

        cur.execute("UPDATE users SET is_active = TRUE WHERE id=%s", (user_id,))
        conn.commit()

        return jsonify({
            "message": "Login successful",
            "userId": user_id,
            "organizationId": org_id   # <-- added
        }), 200

    finally:
        cur.close()
        conn.close()


# -------------------------------------------------------------------
# SOCIAL LOGIN
# -------------------------------------------------------------------
@app.post("/social-login")
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
@app.get("/user/<user_id>")
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
            "organization_id": row[6],
        })

    finally:
        cur.close()
        conn.close()

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory("uploads", filename)


@app.post("/upload_image")
def upload_image():
    image_file = request.files.get("image")
    if not image_file:
        return jsonify({"error": "No image provided"}), 400

    try:
        filename = f"{uuid.uuid4()}_{image_file.filename}"
        upload_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        filepath = os.path.join(upload_dir, filename)
        image_file.save(filepath)

        return jsonify({"imageUrl": f"/uploads/{filename}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/add_product")
def add_product():
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    name = data.get("productName")
    sku = data.get("sku")
    description = data.get("description")
    amount = data.get("amount")
    stock = data.get("stock")
    gst = data.get("gst")
    routines = data.get("routines")
    image_url = data.get("image_url")

    if not all([name, sku, description, amount, stock, gst, routines]):
        return jsonify({"error": "All product fields are required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT organization_id FROM users WHERE id=%s", (user_id,))
        row = cur.fetchone()

        if not row:
            return jsonify({"error": "User not found"}), 404

        org_id = row[0]

        query = """
            INSERT INTO products 
            (id, organization_id, name, sku, description, image_url, attributes, amount, available_stock, gst, routines, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, true)
        """

        values = (
            str(uuid.uuid4()),
            org_id,
            name,
            sku,
            description,
            image_url,
            None,
            amount,
            stock,
            gst,
            routines
        )

        cur.execute(query, values)
        conn.commit()

        return jsonify({"status": "success", "organizationId": org_id})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

@app.route("/get_products", methods=["GET"])
def get_products():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Get organization_id of user
        cur.execute("SELECT organization_id FROM users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404
        org_id = row[0]

        # Fetch only required fields
        cur.execute("""
            SELECT id, sku, name, image_url, amount, available_stock, gst
            FROM products
            WHERE organization_id = %s
            ORDER BY name
        """, (org_id,))

        products = []
        columns = [desc[0] for desc in cur.description]
        for record in cur.fetchall():
            product = dict(zip(columns, record))
            # Add status field for frontend
            product["is_active"] = True
            products.append(product)

        return jsonify({"products": products})

    except Exception as e:
        print("Error fetching products:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()


@app.delete("/delete_product/<id>")
def delete_product(id):  # id is a string UUID
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM products WHERE id=%s", (id,))
        conn.commit()
        return jsonify({"message": "Product deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500




@app.post("/edit_product")
def edit_product():
    data = request.json
    product_id = data.get("id")

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            UPDATE products 
            SET product_name=%s, sku=%s, description=%s,
                amount=%s, gst=%s, stock=%s
            WHERE id=%s
        """, (
            data.get("productName"),
            data.get("sku"),
            data.get("description"),
            data.get("amount"),
            data.get("gst"),
            data.get("stock"),
            product_id,
        ))

        conn.commit()
        return jsonify({"message": "Product updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/update_product/<product_id>", methods=["PUT"])
def update_product(product_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    product_name = data.get("name")  # matches frontend
    sku = data.get("sku")
    description = data.get("description")
    amount = data.get("amount")
    stock = data.get("available_stock")  # <- fixed
    gst = data.get("gst")
    image_url = data.get("image_url")  

    if not all([product_name, sku, description, amount, stock, gst]):
        return jsonify({"error": "All product fields are required"}), 400

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE products
            SET name=%s,
                sku=%s,
                description=%s,
                amount=%s,
                available_stock=%s,
                gst=%s,
                image_url=%s
            WHERE id=%s
        """, (
            product_name,
            sku,
            description,
            amount,
            stock,
            gst,
            image_url,
            product_id
        ))
        conn.commit()
        return jsonify({"message": "Product updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        print("Error updating product:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@app.post("/create_flow")
def create_flow():
    data = request.get_json()
    user_id = data.get("user_id")
    flow_name = data.get("flow_name")  # <- changed from name
    description = data.get("description", "")
    is_active = True
    created_at = datetime.utcnow()

    if not user_id or not flow_name:
        return jsonify({"error": "Missing required fields: user_id and flow_name are required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # 1. Fetch organization_id from user
        cur.execute("SELECT organization_id FROM users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": f"Invalid user_id: {user_id}"}), 400
        organization_id = row[0]

        # 2. Create a new flow
        flow_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO flows (id, organization_id, flow_name, description, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (flow_id, organization_id, flow_name, description, is_active, created_at))

        conn.commit()

        return jsonify({
            "flow_id": flow_id,
            "organization_id": organization_id,
            "message": f"Flow '{flow_name}' created successfully."
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()
@app.post("/save_landing_page")
def save_landing_page():
    data = request.get_json()

    flow_id = data.get("flow_id")
    user_id = data.get("user_id")
    organization_id = data.get("organization_id")
    thumbnail = data.get("thumbnail")
    cta_position = data.get("cta_position")
    created_at = datetime.utcnow()

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # -------------------------------------------------------------
        # 1. VERIFY FLOW EXISTS
        # -------------------------------------------------------------
        cur.execute("SELECT organization_id FROM flows WHERE id=%s", (flow_id,))
        flow_row = cur.fetchone()
        if not flow_row:
            return jsonify({"error": f"Invalid flow_id: {flow_id}"}), 400

        # -------------------------------------------------------------
        # 2. If organization_id not provided, get from flows automatically
        # -------------------------------------------------------------
        if not organization_id:
            organization_id = flow_row[0]

        # -------------------------------------------------------------
        # 3. Optional: prevent duplicate landing page for same flow
        # -------------------------------------------------------------
        cur.execute("SELECT id FROM landing_page WHERE flow_id=%s", (flow_id,))
        existing = cur.fetchone()
        if existing:
            return jsonify({
                "error": "Landing page already exists for this flow",
                "landing_page_id": existing[0]
            }), 409

        # -------------------------------------------------------------
        # 4. Insert landing page
        # -------------------------------------------------------------
        landing_id = str(uuid.uuid4())

        cur.execute("""
            INSERT INTO landing_page 
            (id, flow_id, organization_id, user_id, thumbnail, cta_position, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (landing_id, flow_id, organization_id, user_id, thumbnail, cta_position, created_at))

        conn.commit()

        return jsonify({
            "id": landing_id,
            "flow_id": flow_id,
            "organization_id": organization_id,
            "message": "Landing page saved successfully"
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()




# -------------------------------------------------------------------
# LOGOUT
# -------------------------------------------------------------------
@app.post("/logout")
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


# -------------------------------------------------------------------
# START SERVER
# -------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
