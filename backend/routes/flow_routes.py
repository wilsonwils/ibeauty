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
    # 1️⃣ TOKEN
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    token = auth.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    # 2️⃣ BODY
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
                key = "no"  # mark as skipped

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
    skip = data.get("skip") is True

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

    fields = ["name", "phone", "whatsapp", "email"]

    # ✅ IF SKIP → FORCE EMPTY
    if skip:
        selected_fields = []
    else:
        selected_fields = [f for f in fields if data.get(f)]

        if not selected_fields:
            return jsonify({"error": "Select at least one option"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT id FROM flows
            WHERE id=%s AND organization_id=%s
        """, (flow_id, organization_id))

        if not cur.fetchone():
            return jsonify({"error": "Invalid flow or unauthorized"}), 403

        cur.execute("""
            SELECT id FROM organization_contact_input
            WHERE flow_id=%s AND user_id=%s
        """, (flow_id, user_id))

        existing = cur.fetchone()

        if existing:
            contact_id = existing[0]
            cur.execute("""
                UPDATE organization_contact_input
                SET contact_information=%s
                WHERE id=%s
            """, (json.dumps(selected_fields), contact_id))
        else:
            cur.execute("""
                INSERT INTO organization_contact_input
                (flow_id, user_id, organization_id, contact_information)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (
                flow_id,
                user_id,
                organization_id,
                json.dumps(selected_fields)
            ))
            contact_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Contact page saved successfully",
            "id": contact_id,
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
    skip = data.get("skip") is True

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

    segmentation_fields = data.get("segmentation_fields")

    # ✅ SKIP → FORCE EMPTY LIST
    if skip:
        segmentation_fields = []
    else:
        # Ensure valid list when not skipped
        if segmentation_fields is None:
            segmentation_fields = []

        if not isinstance(segmentation_fields, list):
            return jsonify({"error": "Invalid segmentation data"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Validate flow belongs to org
        cur.execute("""
            SELECT id FROM flows
            WHERE id=%s AND organization_id=%s
        """, (flow_id, organization_id))

        if not cur.fetchone():
            return jsonify({"error": "Invalid flow or unauthorized"}), 403

        # Check existing segmentation
        cur.execute("""
            SELECT id FROM segmentation_fields
            WHERE flow_id=%s AND user_id=%s
        """, (flow_id, user_id))

        existing = cur.fetchone()
        segmentation_json = json.dumps(segmentation_fields)

        if existing:
            segmentation_id = existing[0]
            cur.execute("""
                UPDATE segmentation_fields
                SET segmentation_details=%s
                WHERE id=%s
            """, (segmentation_json, segmentation_id))
        else:
            cur.execute("""
                INSERT INTO segmentation_fields
                (flow_id, user_id, organization_id, segmentation_details)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (
                flow_id,
                user_id,
                organization_id,
                segmentation_json
            ))
            segmentation_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Segmentation saved successfully",
            "id": segmentation_id,
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

    # ❌ Do NOT allow empty save unless skipped
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
    summary_fields = data.get("summary_fields")
    skip = data.get("skip") is True

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

    if not skip and not summary_fields:
        return jsonify({"error": "Select at least one summary option"}), 400

    summary_fields = summary_fields or {}

    conn = get_connection()
    cur = conn.cursor()

    try:
        # check if flow exists
        cur.execute("""
            SELECT id FROM flows
            WHERE id=%s AND organization_id=%s
        """, (flow_id, organization_id))
        if not cur.fetchone():
            return jsonify({"error": "Invalid flow or unauthorized"}), 403

        field_name = {}
        for key, value in summary_fields.items():
            db_key = key.lower().replace(" ", "_").replace("-", "_")
            field_name[db_key] = "yes" if value else "no"

        field_name_json = json.dumps(field_name)

        # update or insert without returning any summary_id
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
            """, (field_name_json, existing[0]))
        else:
            cur.execute("""
                INSERT INTO organization_summary
                (user_id, organization_id, flow_id, field_name)
                VALUES (%s, %s, %s, %s)
            """, (user_id, organization_id, flow_id, field_name_json))

        conn.commit()

        return jsonify({
            "message": "Summary saved successfully",
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
