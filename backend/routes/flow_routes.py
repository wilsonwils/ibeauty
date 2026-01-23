from flask import Blueprint, request, jsonify
from database import get_connection
from datetime import datetime
import json
from routes.auth_routes import decode_token


flow_bp = Blueprint("flow", __name__)
# -------------------------------------------------------------------
# CREATE FLOW
# -------------------------------------------------------------------
@flow_bp.post("/create_flow")
def create_flow():
    # 1 TOKEN
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    # 2 BODY
    data = request.get_json() or {}
    flow_name = data.get("flow_name")
    description = data.get("description", "")
    skip = data.get("skip", False)
    is_active = True

    if not flow_name:
        return jsonify({"error": "flow_name required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT id FROM flows
            WHERE organization_id=%s AND flow_name=%s
        """, (organization_id, flow_name))

        existing = cur.fetchone()

        if existing:
            flow_id = existing[0]
            cur.execute("""
                UPDATE flows
                SET description=%s, skip=%s, is_active=%s
                WHERE id=%s
            """, (description, skip, is_active, flow_id))
        else:
            cur.execute("""
                INSERT INTO flows
                (organization_id, flow_name, description, is_active, skip)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (organization_id, flow_name, description, is_active, skip))
            flow_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "flow_id": flow_id,
            "organization_id": organization_id,
            "message": "Flow saved successfully"
        }), 201

    finally:
        cur.close()
        conn.close()


def get_user_from_token():
    auth = request.headers.get("Authorization")

    if not auth:
        return None, None, ("Authorization header missing", 401)

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)

    if not payload:
        return None, None, ("Invalid token", 401)

    organization_id = payload.get("organization_id")
    user_id = payload.get("user_id")

    if not organization_id or not user_id:
        return None, None, ("Invalid token payload", 401)

    return organization_id, user_id, None


def safe_json(value, default=None):
    if not value:
        return default
    try:
        return json.loads(value)
    except:
        return default


# =========================================================
#  LANDING PAGE
# =========================================================

@flow_bp.get("/flow/landing")
def get_landing():
    org_id, user_id, err = get_user_from_token()
    if err:
        return jsonify({"error": err[0]}), err[1]

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT thumbnail, cta_position
        FROM landing_page
        WHERE organization_id=%s
    """, (org_id,))

    row = cur.fetchone()

    cur.close()
    conn.close()

    return jsonify({
        "thumbnail": row[0] if row else None,
        "cta_position": row[1] if row else None
    })


# =========================================================
#  QUESTIONNAIRE
# =========================================================

@flow_bp.get("/flow/questionnaire")
def get_questionnaire():
    org_id, user_id, err = get_user_from_token()
    if err:
        return jsonify({"error": err[0]}), err[1]

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT label, key, input_type, options, required
        FROM questions
        WHERE user_id=%s
        ORDER BY display_order
    """, (user_id,))

    rows = cur.fetchall()

    data = {
        r[0]: {
            "key": r[1],
            "type": r[2],
            "value": r[3],
            "required": r[4]
        }
        for r in rows
    }

    cur.close()
    conn.close()

    return jsonify(data)


# =========================================================
#  CAPTURE
# =========================================================

@flow_bp.get("/flow/capture")
def get_capture():
    org_id, user_id, err = get_user_from_token()
    if err:
        return jsonify({"error": err[0]}), err[1]

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT text_area
        FROM capture
        WHERE user_id=%s
    """, (user_id,))

    row = cur.fetchone()

    cur.close()
    conn.close()

    return jsonify({
        "text_area": row[0] if row else ""
    })


# =========================================================
#  CONTACT
# =========================================================

@flow_bp.get("/flow/contact")
def get_contact():
    org_id, user_id, err = get_user_from_token()
    if err:
        return jsonify({"error": err[0]}), err[1]

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT contact_information
        FROM organization_contact_input
        WHERE user_id = %s
        ORDER BY id DESC
        LIMIT 1
    """, (user_id,))

    row = cur.fetchone()

    cur.close()
    conn.close()

    #  No saved contact
    if not row or row[0] is None:
        return jsonify([])

    #  jsonb already comes as Python list
    if isinstance(row[0], list):
        return jsonify(row[0])

    #  fallback safety (should never happen)
    return jsonify([])

# =========================================================
#  SEGMENTATION
# =========================================================


@flow_bp.get("/flow/segmentation")
def get_segmentation():
    org_id, user_id, err = get_user_from_token()
    if err:
        return jsonify({"error": err[0]}), err[1]

    conn = get_connection()
    cur = conn.cursor()

    # Fetch segmentation fields
    cur.execute("""
        SELECT label, key, options, required
        FROM segmentation_fields
        WHERE user_id=%s
    """, (user_id,))

    rows = cur.fetchall()

    def safe_json(value, default):
        # If already a list, return as is
        if isinstance(value, list):
            return value
        # If string, try parsing as JSON
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return default
        # Fallback to default
        return default

    data = [
        {
            "label": r[0],
            "key": r[1],
            "options": safe_json(r[2], []),
            "required": r[3] if r[3] is not None else False
        }
        for r in rows
    ]

    cur.close()
    conn.close()

    return jsonify(data)

# =========================================================
#  SKIN GOAL
# =========================================================

@flow_bp.get("/flow/skin-goal")
def get_skin_goal():
    org_id, user_id, err = get_user_from_token()
    if err:
        return jsonify({"error": err[0]}), err[1]

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT selected_fields
        FROM skin_goals
        WHERE user_id=%s
        ORDER BY id DESC
        LIMIT 1
    """, (user_id,))

    row = cur.fetchone()
    cur.close()
    conn.close()

    # No saved skin goal
    if not row or row[0] is None:
        return jsonify([])

    #  jsonb already comes as Python list
    if isinstance(row[0], list):
        return jsonify(row[0])

    # fallback safety (should never happen)
    return jsonify([])


# =========================================================
#  SUMMARY
# =========================================================

@flow_bp.get("/flow/summary")
def get_summary():
    org_id, user_id, err = get_user_from_token()
    if err:
        return jsonify({"error": err[0]}), err[1]

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT field_name
        FROM organization_summary
        WHERE user_id = %s
        ORDER BY id DESC
        LIMIT 1
    """, (user_id,))

    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row or row[0] is None:
        return jsonify({})  # default empty object

    summary_data = row[0]
    if isinstance(summary_data, dict):
        return jsonify(summary_data)

    return jsonify({})


# =========================================================
# SUGGEST PRODUCT
# =========================================================



@flow_bp.get("/flow/suggest-product")
def get_suggest_product():
    org_id, user_id, err = get_user_from_token()
    if err:
        return jsonify({"error": err[0]}), err[1]

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT field
        FROM product_suggest
        WHERE user_id = %s
          AND field->>'product_suggestion' IS NOT NULL
        ORDER BY id DESC
        LIMIT 1
    """, (user_id,))

    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row or not row[0]:
        return jsonify({})

    data = row[0]

    # handle jsonb returned as string
    if isinstance(data, str):
        data = json.loads(data)

    return jsonify(data)



@flow_bp.post("/save_landing_page")
def save_landing_page():
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    data = request.get_json() or {}
    flow_id = data.get("flow_id")

    if not flow_id:
        return jsonify({"error": "flow_id required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT id FROM landing_page WHERE flow_id=%s", (flow_id,))
        existing = cur.fetchone()

        if existing:
            landing_id = existing[0]
            cur.execute("""
                UPDATE landing_page
                SET thumbnail=%s, cta_position=%s
                WHERE id=%s
            """, (data.get("thumbnail"), data.get("cta_position"), landing_id))
        else:
            cur.execute("""
                INSERT INTO landing_page
                (flow_id, organization_id, user_id, thumbnail, cta_position, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                flow_id,
                organization_id,
                user_id,
                data.get("thumbnail"),
                data.get("cta_position"),
                datetime.utcnow()
            ))
            landing_id = cur.fetchone()[0]

        conn.commit()
        return jsonify({"id": landing_id, "message": "Landing page saved"}), 200

    finally:
        cur.close()
        conn.close()



# ----------------------------------------------------
# SAVE QUESTIONNAIRE (FRONTEND YES/NO MAPPED)
# ----------------------------------------------------
@flow_bp.post("/save_questionaire")
def save_questionaire():
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    data = request.get_json() or {}
    flow_id = data.get("flow_id")
    fields = data.get("fields")
    skip = data.get("skip", False)  # check if skip mode is on

    if not flow_id or not fields:
        return jsonify({"error": "flow_id and fields required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        question_ids = []
        display_order = 1  # start numbering questions

        for label, config in fields.items():
            key = config["yes_no"]
            input_type = config.get("type", "yes_no")
            selected_options = config.get("value")
            required = config.get("required", False)

            # If skip mode, clear any previously saved answer
            if skip:
                selected_options = [] if isinstance(selected_options, list) else None
                key = "null"  # mark as skipped

            # Check if a row already exists
            cur.execute("""
                SELECT id FROM questions
                WHERE flow_id=%s AND user_id=%s AND label=%s
            """, (flow_id, user_id, label))
            existing = cur.fetchone()

            if existing:
                # Update existing row
                cur.execute("""
                    UPDATE questions
                    SET key=%s, input_type=%s, options=%s, required=%s, display_order=%s
                    WHERE id=%s
                """, (
                    key,
                    input_type,
                    json.dumps(selected_options) if selected_options is not None else None,
                    required,
                    display_order,
                    existing[0]
                ))
                question_ids.append(existing[0])
            else:
                # Insert new row
                cur.execute("""
                    INSERT INTO questions
                    (flow_id, organization_id, user_id, label, key, input_type, required, options, display_order)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    flow_id,
                    organization_id,
                    user_id,
                    label,
                    key,
                    input_type,
                    required,
                    json.dumps(selected_options) if selected_options is not None else None,
                    display_order
                ))
                question_ids.append(cur.fetchone()[0])

            display_order += 1  # increment question number

        conn.commit()

        return jsonify({
            "message": "Questionnaire saved/updated",
            "question_ids": question_ids,
            "skip": skip
        }), 200

    finally:
        cur.close()
        conn.close()




@flow_bp.post("/save_capture_page")
def save_capture_page():
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    data = request.get_json() or {}
    flow_id = data.get("flow_id")
    text_area = data.get("text_area", "")
    skip = data.get("skip", False)  # <-- skip flag

    if not flow_id:
        return jsonify({"error": "flow_id required"}), 400

    if skip:
        text_area = None  # empty on skip

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check if capture already exists
        cur.execute("""
            SELECT id FROM capture
            WHERE flow_id = %s AND user_id = %s
        """, (flow_id, user_id))
        existing = cur.fetchone()

        if existing:
            capture_id = existing[0]
            cur.execute("""
                UPDATE capture
                SET text_area = %s
                WHERE id = %s
            """, (text_area, capture_id))
        else:
            cur.execute("""
                INSERT INTO capture
                (flow_id, organization_id, user_id, text_area, created_at)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                flow_id,
                organization_id,
                user_id,
                text_area,
                datetime.utcnow()
            ))
            capture_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "id": capture_id,
            "message": "Capture saved"
        }), 200

    except Exception as e:
        conn.rollback()
        print("SAVE CAPTURE ERROR:", e)
        return jsonify({"error": "Server error"}), 500

    finally:
        cur.close()
        conn.close()




@flow_bp.post("/save_contact_page")
def save_contact_page():
    # ===== AUTH =====
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    # ===== REQUEST DATA =====
    data = request.get_json() or {}
    flow_id = data.get("flow_id")
    skip = data.get("skip") is True

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

    fields = ["name", "phone", "whatsapp", "email", "instagram"]  # make sure Instagram is here

    # ===== SELECTED FIELDS =====
    if skip:
        selected_fields = []
    else:
        # Only keep fields that are truthy (selected)
        selected_fields = [field for field in fields if data.get(field)]
        if not selected_fields:
            return jsonify({"error": "Select at least one option"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # ===== VALIDATE FLOW =====
        cur.execute("""
            SELECT id FROM flows
            WHERE id = %s AND organization_id = %s
        """, (flow_id, organization_id))

        if not cur.fetchone():
            return jsonify({"error": "Invalid flow or unauthorized"}), 403

        # ===== CHECK EXISTING RECORD =====
        cur.execute("""
            SELECT id FROM organization_contact_input
            WHERE flow_id = %s AND user_id = %s
        """, (flow_id, user_id))

        existing = cur.fetchone()
        contact_info_json = json.dumps(selected_fields)

        if existing:
            contact_id = existing[0]
            cur.execute("""
                UPDATE organization_contact_input
                SET contact_information = %s
                WHERE id = %s
            """, (contact_info_json, contact_id))
        else:
            cur.execute("""
                INSERT INTO organization_contact_input
                (flow_id, user_id, organization_id, contact_information)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (flow_id, user_id, organization_id, contact_info_json))
            contact_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Contact page saved successfully",
            "id": contact_id,
            "flow_id": flow_id,
            "organization_id": organization_id,
            "contact_information": selected_fields,
            "skip": skip
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()



@flow_bp.post("/save_segmentation")
def save_segmentation():
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    data = request.get_json() or {}
    flow_id = data.get("flow_id")
    fields = data.get("segmentation_fields", [])
    skip = data.get("skip", False)

    if not flow_id:
        return jsonify({"error": "flow_id required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        segmentation_ids = []

        for field in fields:
            label = field.get("label")
            key = field.get("key")           
            required = field.get("required", False)
            options = field.get("options", [])

            if skip:
                key = None
                required = False
                options = []

            cur.execute("""
                SELECT id FROM segmentation_fields
                WHERE flow_id=%s AND user_id=%s AND label=%s
            """, (flow_id, user_id, label))

            existing = cur.fetchone()

            if existing:
                cur.execute("""
                    UPDATE segmentation_fields
                    SET key=%s,
                        options=%s,
                        required=%s
                    WHERE id=%s
                """, (
                    key,
                    json.dumps(options),
                    required,
                    existing[0]
                ))
                segmentation_ids.append(existing[0])
            else:
                cur.execute("""
                    INSERT INTO segmentation_fields
                    (flow_id, organization_id, user_id, label, key, options, required)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    flow_id,
                    organization_id,
                    user_id,
                    label,
                    key,
                    json.dumps(options),
                    required
                ))
                segmentation_ids.append(cur.fetchone()[0])

        conn.commit()

        return jsonify({
            "message": "Segmentation saved successfully",
            "segmentation_ids": segmentation_ids,
            "skip": skip
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()




@flow_bp.post("/save_skingoal")
def save_skingoal():
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    data = request.get_json() or {}
    flow_id = data.get("flow_id")
    skingoal_fields = data.get("skingoal_fields")
    skip = data.get("skip") is True

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

   
    if not skip and not skingoal_fields:
        return jsonify({"error": "Select at least one skin goal"}), 400

    # Normalize to list
    skingoal_fields = skingoal_fields or []

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Validate flow
        cur.execute("""
            SELECT id FROM flows
            WHERE id=%s AND organization_id=%s
        """, (flow_id, organization_id))
        if not cur.fetchone():
            return jsonify({"error": "Invalid flow or unauthorized"}), 403

        # Check existing record
        cur.execute("""
            SELECT id FROM skin_goals
            WHERE flow_id=%s AND user_id=%s
        """, (flow_id, user_id))
        existing = cur.fetchone()

        skingoal_json = json.dumps(skingoal_fields)

        if existing:
            skingoal_id = existing[0]
            cur.execute("""
                UPDATE skin_goals
                SET selected_fields=%s,
                    description=NULL
                WHERE id=%s
            """, (skingoal_json, skingoal_id))
        else:
            cur.execute("""
                INSERT INTO skin_goals
                (flow_id, user_id, organization_id, description, selected_fields)
                VALUES (%s, %s, %s, NULL, %s)
                RETURNING id
            """, (flow_id, user_id, organization_id, skingoal_json))
            skingoal_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Skin Goal saved successfully",
            "id": skingoal_id,
            "flow_id": flow_id,
            "organization_id": organization_id,
            "skip": skip
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()



@flow_bp.post("/save_summary")
def save_summary():
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    data = request.get_json() or {}
    flow_id = data.get("flow_id")
    summary_fields = data.get("summary_fields") or {}
    skip = data.get("skip") is True

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

    if not skip and not summary_fields:
        return jsonify({
            "error": "please select yes or no for all summary options"
        }), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # check flow ownership
        cur.execute("""
            SELECT id FROM flows
            WHERE id=%s AND organization_id=%s
        """, (flow_id, organization_id))

        if not cur.fetchone():
            return jsonify({"error": "Invalid flow or unauthorized"}), 403

        # convert frontend keys → db keys
        field_name = {
            key.lower().replace(" ", "_"): "yes" if value else "no"
            for key, value in summary_fields.items()
        }

        cur.execute("""
            SELECT id FROM organization_summary
            WHERE flow_id=%s AND user_id=%s
        """, (flow_id, user_id))

        existing = cur.fetchone()

        if existing:
            cur.execute("""
                UPDATE organization_summary
                SET field_name=%s
                WHERE id=%s
            """, (json.dumps(field_name), existing[0]))
        else:
            cur.execute("""
                INSERT INTO organization_summary
                (user_id, organization_id, flow_id, field_name)
                VALUES (%s, %s, %s, %s)
            """, (user_id, organization_id, flow_id, json.dumps(field_name)))

        conn.commit()
        return jsonify({"message": "Summary saved"}), 201

    except Exception:
        conn.rollback()
        return jsonify({"error": "Something went wrong"}), 500

    finally:
        cur.close()
        conn.close()




@flow_bp.post("/save_suggestproduct")
def save_suggestproduct():
    # ---------- AUTH ----------
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    # ---------- REQUEST DATA ----------
    data = request.get_json() or {}
    flow_id = data.get("flow_id")
    suggest_fields = data.get("suggest_fields") or {}
    skip = data.get("skip", False)  # <-- check skip flag

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # ---------- VALIDATE FLOW ----------
        cur.execute("""
            SELECT id
            FROM flows
            WHERE id = %s AND organization_id = %s
        """, (flow_id, organization_id))

        if not cur.fetchone():
            return jsonify({"error": "Invalid flow or unauthorized"}), 403
        
        

        # ---------- CONVERT TO JSONB ----------
        field_data = {}
        for key, value in suggest_fields.items():
            db_key = key.lower().replace(" ", "_").replace("-", "_")
            if skip:
                field_data[db_key] = None  # empty on skip
            else:
                field_data[db_key] = "yes" if value else "no"

        field_json = json.dumps(field_data)

        # ---------- CHECK EXISTING RECORD ----------
        cur.execute("""
            SELECT id
            FROM product_suggest
            WHERE user_id = %s
              AND organization_id = %s
              AND flow_id = %s
        """, (user_id, organization_id, flow_id))

        existing = cur.fetchone()

        # ---------- UPDATE OR INSERT ----------
        if existing:
            suggest_id = existing[0]
            cur.execute("""
                UPDATE product_suggest
                SET field = %s
                WHERE id = %s
                  AND organization_id = %s
            """, (field_json, suggest_id, organization_id))
        else:
            cur.execute("""
                INSERT INTO product_suggest
                (user_id, organization_id, flow_id, field)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (
                user_id,
                organization_id,
                flow_id,
                field_json
            ))
            suggest_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Product suggestion saved successfully",
            "id": suggest_id,
            "flow_id": flow_id,
            "organization_id": organization_id
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()
