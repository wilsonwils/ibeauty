from flask import Blueprint, request, jsonify
from database import get_connection
from datetime import datetime
import json

flow_bp = Blueprint("flow", __name__)
# -------------------------------------------------------------------
# CREATE FLOW
# -------------------------------------------------------------------
@flow_bp.post("/create_flow")
def create_flow():
    data = request.get_json()
    user_id = data.get("user_id")
    flow_name = data.get("flow_name")
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

        # 2. Insert flow WITHOUT specifying id
        cur.execute("""
            INSERT INTO flows (organization_id, flow_name, description, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (organization_id, flow_name, description, is_active, created_at))

        flow_id = cur.fetchone()[0]  # PostgreSQL assigns auto-increment integer ID
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


@flow_bp.post("/save_landing_page")
def save_landing_page():
    data = request.get_json() or {}
    flow_id = data.get("flow_id")

    if not flow_id:
        return jsonify({"error": "flow_id is required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Validate flow_id
        cur.execute("SELECT organization_id FROM flows WHERE id=%s", (flow_id,))
        flow_row = cur.fetchone()
        if not flow_row:
            return jsonify({"error": f"Invalid flow_id: {flow_id}"}), 400

        organization_id = data.get("organization_id") or flow_row[0]

        # Check if landing page already exists
        cur.execute("SELECT id FROM landing_page WHERE flow_id=%s", (flow_id,))
        existing = cur.fetchone()
        if existing:
            return jsonify({
                "error": "Landing page already exists",
                "landing_page_id": existing[0]
            }), 409

        # Insert landing page
        cur.execute("""
            INSERT INTO landing_page
            (flow_id, organization_id, user_id, thumbnail, cta_position, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            flow_id,
            organization_id,
            data.get("user_id"),
            data.get("thumbnail"),
            data.get("cta_position"),
            datetime.utcnow()
        ))

        landing_id = cur.fetchone()[0]
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


# ----------------------------------------------------
# SAVE QUESTIONNAIRE (FRONTEND YES/NO MAPPED)
# ----------------------------------------------------
@flow_bp.post("/save_questionaire")
def save_questionaire():
    try:
        data = request.get_json()
        flow_id = data.get("flow_id")
        organization_id = data.get("organization_id")
        user_id = data.get("user_id")
        fields = data.get("fields")

        if not flow_id:
            return jsonify({"error": "flow_id required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        # Auto-fetch organization_id if not provided
        if not organization_id:
            cur.execute("SELECT organization_id FROM flows WHERE id=%s", (flow_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({"error": f"Invalid flow_id: {flow_id}"}), 400
            organization_id = row[0]

        order = 1
        question_ids = []

        for label, config in fields.items():

            # -------------------------------
            # key ALWAYS stores yes or no
            # -------------------------------
            key = config["yes_no"]

            input_type = config.get("type") or "yes_no"

            # -------------------------------------------------------
            # STORE AGE + SKIN TYPE INPUT INSIDE OPTIONS COLUMN
            # -------------------------------------------------------
            if label == "Age":
                options = {"min_age": config.get("keyValue")}
            elif label == "Skin Type":
                options = {"skin_type": config.get("keyValue")}
            elif input_type == "multi-select":
                options = {"selected": config.get("keyValue", [])}
            else:
                options = config.get("options") if input_type == "select" else None
            # -------------------------------------------------------

            cur.execute("""
                INSERT INTO questions 
                (flow_id, organization_id, user_id, label, key, input_type, required, options, display_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                flow_id,
                organization_id,
                user_id,
                label,
                key,  
                input_type,
                config.get("required", False),
                json.dumps(options) if options else None,
                order
            ))

            question_ids.append(cur.fetchone()[0])
            order += 1

        conn.commit()

        return jsonify({
            "message": "Questionaire saved",
            "question_ids": question_ids,
            "organization_id": organization_id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()
