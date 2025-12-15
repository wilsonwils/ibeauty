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

    if not flow_id or not fields:
        return jsonify({"error": "flow_id and fields required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        question_ids = []

        for label, config in fields.items():
            key = config["yes_no"]
            input_type = config.get("type", "yes_no")
            options = config.get("options")

            cur.execute("""
                INSERT INTO questions
                (flow_id, organization_id, user_id, label, key, input_type, required, options)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                flow_id,
                organization_id,
                user_id,
                label,
                key,
                input_type,
                config.get("required", False),
                json.dumps(options) if options else None
            ))

            question_ids.append(cur.fetchone()[0])

        conn.commit()

        return jsonify({
            "message": "Questionnaire saved",
            "question_ids": question_ids
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

    if not flow_id:
        return jsonify({"error": "flow_id required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO capture
            (flow_id, organization_id, user_id, text_area, created_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (flow_id, organization_id, user_id, text_area, datetime.utcnow()))

        capture_id = cur.fetchone()[0]
        conn.commit()

        return jsonify({"id": capture_id, "message": "Capture saved"}), 201

    finally:
        cur.close()
        conn.close()


@flow_bp.post("/save_contact_page")
def save_contact_page():
    #  Read token
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    #  Clean token
    token = auth.replace("Bearer ", "").strip()

    #  Decode token
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    #  Read body
    data = request.get_json() or {}
    flow_id = data.get("flow_id")

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

    #  Possible fields
    fields = ["name", "phone", "whatsapp", "email"]
    selected_fields = [f for f in fields if data.get(f)]

    if not selected_fields:
        return jsonify({"error": "Select at least one option"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        #  Validate flow belongs to org
        cur.execute("""
            SELECT id FROM flows
            WHERE id=%s AND organization_id=%s
        """, (flow_id, organization_id))

        if not cur.fetchone():
            return jsonify({"error": "Invalid flow or unauthorized"}), 403

        #  Check existing contact input
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
            """, (flow_id, user_id, organization_id, json.dumps(selected_fields)))
            contact_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Contact page saved successfully",
            "id": contact_id,
            "flow_id": flow_id,
            "organization_id": organization_id
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
    segmentation_fields = data.get("segmentation_fields")

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

    if not segmentation_fields or not isinstance(segmentation_fields, list):
        return jsonify({"error": "Select at least one segmentation option"}), 400

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
            """, (flow_id, user_id, organization_id, segmentation_json))
            segmentation_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Segmentation saved successfully",
            "id": segmentation_id,
            "flow_id": flow_id,
            "organization_id": organization_id
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

