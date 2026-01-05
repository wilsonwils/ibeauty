from flask import Blueprint, request, jsonify, send_from_directory
from database import get_connection
import secrets, os
import json
import pandas as pd
from routes.auth_routes import decode_token
import psycopg2


product_bp = Blueprint("products", __name__)

# static uploads route
@product_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory("uploads", filename)

#-----------------------------------------------
# upload image
#-----------------------------------------------

@product_bp.post("/upload_image")
def upload_image():
    image_file = request.files.get("image")
    if not image_file:
        return jsonify({"error": "No image provided"}), 400

    try:
        filename = f"{secrets.token_hex(8)}_{image_file.filename}"
        upload_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        filepath = os.path.join(upload_dir, filename)
        image_file.save(filepath)

        return jsonify({"imageUrl": f"/uploads/{filename}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------------------
# ADD PRODUCT
# -------------------------------------------------------------------

@product_bp.post("/add_product")
def add_product():
    # ===== TOKEN AUTH =====
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    data = request.get_json() or {}

    # ===== BASIC INFO =====
    name = data.get("name")
    sku = data.get("sku")
    variant_id = data.get("variant_id")
    brand = data.get("brand")
    description = data.get("description")
    image_url = data.get("image_url")

    amount = data.get("amount")
    stock = data.get("stock")


    gst = data.get("gst") if data.get("gst") not in ["", None] else None

    # ===== OTHER FIELDS =====
    major_usp = data.get("major_usp")
    concerns = data.get("concerns")

    product_types = data.get("product_types", [])
    skin_types = data.get("skin_types", [])
    gender = data.get("gender", [])
    age = data.get("age")
    time_session = data.get("time_session", [])

 

    # ===== REQUIRED VALIDATION =====
    if not all([name, sku, amount, stock]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # ===== GET ORGANIZATION =====
        cur.execute("SELECT organization_id FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404

        org_id = row[0]

        query = """
            INSERT INTO products (
                organization_id,
                name,
                sku,
                variant_id,
                brand,
                description,
                image_url,
                amount,
                stock,
                gst,
                major_usp,
                concerns,
                product_types,
                skin_types,
                gender,
                age,
                time_session,
                is_active
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true)
            RETURNING id
        """

        values = (
            org_id,
            name,
            sku,
            variant_id,
            brand,
            description,
            image_url,
            amount,
            stock,
            gst,  
            major_usp,
            concerns,
            json.dumps(product_types),
            json.dumps(skin_types),
            json.dumps(gender),
            age,
            json.dumps(time_session)
        )

        cur.execute(query, values)
        product_id = cur.fetchone()[0]
        conn.commit()

        return jsonify({
            "status": "success",
            "product_id": product_id
        }), 201
    
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({
            "error": "Duplicate SKU. SKU already exists."
        }), 400

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()


# GET PRODUCTS 
@product_bp.route("/get_products", methods=["GET"])
def get_products():
    # ===== TOKEN AUTH =====
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]

    conn = get_connection()
    cur = conn.cursor()

    try:
        # ===== GET ORGANIZATION =====
        cur.execute(
            "SELECT organization_id FROM users WHERE id=%s",
            (user_id,)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404

        org_id = row[0]

        
        cur.execute("""
            SELECT
                id,
                sku,
                variant_id,
                brand,
                name,
                image_url,
                amount,
                stock,
                gst,
                major_usp,
                description,
                concerns,
                product_types,
                skin_types,
                gender,
                age,
                time_session,
                is_active
            FROM products
            WHERE organization_id = %s
            ORDER BY name
        """, (org_id,))

        columns = [desc[0] for desc in cur.description]
        products = []

        for row in cur.fetchall():
            p = dict(zip(columns, row))

            # ===== SAFE JSON FIELDS =====
            p["product_types"] = p["product_types"] or []
            p["skin_types"] = p["skin_types"] or []
            p["gender"] = p["gender"] or []
            p["time_session"] = p["time_session"] or []
            p["age"] = p["age"] or ""

            products.append(p)

        return jsonify({"products": products}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()




# -------------------------------------------------------------------
# DELETE PRODUCT
# -------------------------------------------------------------------

@product_bp.delete("/delete_product/<int:id>")
def delete_product(id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM products WHERE id=%s", (id,))
        conn.commit()
        return jsonify({"message": "Product deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# -------------------------------------------------------------------
# UPDATE PRODUCT (id in path)
# -------------------------------------------------------------------
@product_bp.put("/update_product/<int:product_id>")
def update_product(product_id):
    data = request.get_json() or {}

    conn = get_connection()
    cur = conn.cursor()

    try:
       
        query = """
            UPDATE products SET
                name = %s,
                sku = %s,
                variant_id = %s,
                brand = %s,
                description = %s,
                image_url = %s,
                amount = %s,
                stock = %s,
                gst = %s,
                major_usp = %s,
                concerns = %s,
                product_types = %s,
                skin_types = %s,
                gender = %s,
                age = %s,
                time_session = %s
            WHERE id = %s
        """

        values = (
            data.get("name"),
            data.get("sku"),
            data.get("variant_id"),
            data.get("brand"),
            data.get("description"),
            data.get("image_url"),
            data.get("amount"),
            data.get("stock"),
            data.get("gst"),
            data.get("major_usp"),
            data.get("concerns"),
            json.dumps(data.get("product_types", [])),
            json.dumps(data.get("skin_types", [])),
            json.dumps(data.get("gender", [])),
            json.dumps(data.get("age")),
            json.dumps(data.get("time_session", [])),
            product_id
        )

        cur.execute(query, values)
        conn.commit()

        return jsonify({"message": "Product updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()



@product_bp.post("/bulk-upload-products")
def bulk_upload_products():
    data = request.get_json() or {}
    products = data.get("products", [])
    if not products:
        return jsonify({"error": "No products provided"}), 400

    # Get token from headers
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401

    token = auth_header.split(" ")[1]
    user_info = decode_token(token)
    if not user_info:
        return jsonify({"error": "Invalid or expired token"}), 401

    organization_id = user_info.get("organization_id")
    if not organization_id:
        return jsonify({"error": "Organization not found for the user."}), 400

    # Now proceed with the bulk upload as before
    conn = get_connection()
    cur = conn.cursor()

    updated = 0
    inserted = 0

    try:
        for prod in products:
            name = prod.get("name", "").strip()
            if not name:
                continue  # skip empty names

            # Check if product exists by name + organization
            cur.execute(
                "SELECT id FROM products WHERE LOWER(name) = LOWER(%s) AND organization_id = %s",
                (name, organization_id)
            )
            existing = cur.fetchone()

            values = (
                name,
                prod.get("sku"),
                prod.get("variant_id"),
                prod.get("brand"),
                prod.get("description"),
                prod.get("image_url"),
                prod.get("amount"),
                prod.get("stock"),
                prod.get("gst"),
                prod.get("major_usp"),
                prod.get("concerns"),
                json.dumps(prod.get("product_types", [])),
                json.dumps(prod.get("skin_types", [])),
                json.dumps(prod.get("gender", [])),
                json.dumps(prod.get("age")),
                json.dumps(prod.get("time_session", [])),
                organization_id
            )

            if existing:
                query = """
                    UPDATE products SET
                        name=%s, sku=%s, variant_id=%s, brand=%s, description=%s,
                        image_url=%s, amount=%s, stock=%s, gst=%s, major_usp=%s,
                        concerns=%s, product_types=%s, skin_types=%s, gender=%s,
                        age=%s, time_session=%s, organization_id=%s
                    WHERE id=%s
                """
                cur.execute(query, values + (existing[0],))
                updated += 1
            else:
                query = """
                    INSERT INTO products (
                        name, sku, variant_id, brand, description, image_url,
                        amount, stock, gst, major_usp, concerns,
                        product_types, skin_types, gender, age, time_session,
                        organization_id
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """
                cur.execute(query, values)
                inserted += 1

        conn.commit()
        return jsonify({
            "message": "Bulk upload successful",
            "updated": updated,
            "inserted": inserted
        }), 200

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Duplicate SKU. SKU already exists."}), 400

    except Exception as e:
        conn.rollback()
        print("Error:", e)
        return jsonify({"error": "Bulk upload failed. Please try again."}), 500

    finally:
        cur.close()
        conn.close()




@product_bp.get("/product_types")
def get_product_types():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT name FROM product_types")
    rows = cur.fetchall()
    return jsonify([row[0] for row in rows])

@product_bp.get("/skin_types")
def get_skin_types():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT name FROM skin_types")
    rows = cur.fetchall()
    return jsonify([row[0] for row in rows])



