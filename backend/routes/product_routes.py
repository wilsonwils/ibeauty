from flask import Blueprint, request, jsonify, send_from_directory
from database import get_connection
import secrets, os

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
        # Get organization_id from user
        cur.execute("SELECT organization_id FROM users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404

        org_id = row[0]

    
        query = """
            INSERT INTO products 
            (organization_id, name, sku, description, image_url, amount, available_stock, gst, routines, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, true)
            RETURNING id
        """
        values = (
            org_id,
            name,
            sku,
            description,
            image_url,
            amount,
            stock,
            gst,
            routines
        )

        cur.execute(query, values)
        product_id = cur.fetchone()[0] 
        conn.commit()

        return jsonify({"status": "success", "organizationId": org_id, "productId": product_id})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

# GET PRODUCTS 
@product_bp.route("/get_products", methods=["GET"])
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
            SELECT id, sku, name, image_url, amount, available_stock, gst, routines, is_active
            FROM products
            WHERE organization_id = %s
            ORDER BY name
        """, (org_id,))

        products = []
        columns = [desc[0] for desc in cur.description]
        for record in cur.fetchall():
            product = dict(zip(columns, record))
            products.append(product)

        return jsonify({"products": products})

    except Exception as e:
        print("Error fetching products:", e)
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

    name = data.get("name")
    sku = data.get("sku")
    description = data.get("description")
    amount = data.get("amount")
    stock = data.get("available_stock")
    gst = data.get("gst")
    routines = data.get("routines")
    image_url = data.get("image_url")

    if not all([name, sku, description, amount, stock, gst, routines]):
        return jsonify({"error": "Required fields missing"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            UPDATE products
            SET 
                name = %s,
                sku = %s,
                description = %s,
                image_url = %s,
                amount = %s,
                available_stock = %s,
                gst = %s,
                routines = %s
            WHERE id = %s
        """, (
            name,
            sku,
            description,
            image_url,
            amount,
            stock,
            gst,
            routines,
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


