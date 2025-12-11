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
    skip = data.get("skip", False)
    is_active = True

    if not user_id or not flow_name:
        return jsonify({"error": "Missing required fields: user_id and flow_name are required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # 1. Get organization id
        cur.execute("SELECT organization_id FROM users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": f"Invalid user_id: {user_id}"}), 400
        organization_id = row[0]

        # 2. Check if flow already exists for this user + step
        cur.execute("""
            SELECT id FROM flows
            WHERE organization_id=%s AND flow_name=%s
        """, (organization_id, flow_name))
        existing = cur.fetchone()

        if existing:
            # UPDATE existing flow
            flow_id = existing[0]
            cur.execute("""
                UPDATE flows
                SET description=%s, skip=%s, is_active=%s
                WHERE id=%s
            """, (description, skip, is_active, flow_id))
        else:
            # INSERT new flow
            cur.execute("""
                INSERT INTO flows (organization_id, flow_name, description, is_active, skip)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (organization_id, flow_name, description, is_active, skip))
            flow_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "flow_id": flow_id,
            "organization_id": organization_id,
            "skip": skip,
            "message": f"Flow '{flow_name}' saved/updated (skip={skip})."
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
        user_id = data.get("user_id")

        # Check if landing page already exists for this flow
        cur.execute("SELECT id FROM landing_page WHERE flow_id=%s", (flow_id,))
        existing = cur.fetchone()

        if existing:
            # UPDATE existing landing page
            landing_id = existing[0]
            cur.execute("""
                UPDATE landing_page
                SET thumbnail=%s,
                    cta_position=%s
                WHERE id=%s
            """, (
                data.get("thumbnail"),
                data.get("cta_position"),
                landing_id
            ))

            conn.commit()
            return jsonify({
                "id": landing_id,
                "flow_id": flow_id,
                "organization_id": organization_id,
                "message": "Landing page updated successfully",
            }), 200

        else:
            # INSERT new landing page
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

        question_ids = []

        for label, config in fields.items():
            key = config["yes_no"]
            input_type = config.get("type") or "yes_no"

            # STORE AGE + SKIN TYPE INPUT INSIDE OPTIONS COLUMN
            if label == "Age":
                options = {"min_age": config.get("keyValue")}
            elif label == "Skin Type":
                options = {"skin_type": config.get("keyValue")}
            elif input_type == "multi-select":
                options = {"selected": config.get("keyValue", [])}
            else:
                options = config.get("options") if input_type == "select" else None

            # --- Check if question already exists for this flow
            cur.execute("""
                SELECT id FROM questions
                WHERE flow_id=%s AND label=%s
            """, (flow_id, label))
            existing = cur.fetchone()

            if existing:
                # UPDATE existing question
                question_id = existing[0]
                cur.execute("""
                    UPDATE questions
                    SET key=%s,
                        input_type=%s,
                        required=%s,
                        options=%s,
                        display_order=%s
                    WHERE id=%s
                """, (
                    key,
                    input_type,
                    config.get("required", False),
                    json.dumps(options) if options else None,
                    config.get("display_order") or 1,
                    question_id
                ))
            else:
                # INSERT new question
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
                    config.get("required", False),
                    json.dumps(options) if options else None,
                    config.get("display_order") or 1
                ))
                question_id = cur.fetchone()[0]

            question_ids.append(question_id)

        conn.commit()

        return jsonify({
            "message": "Questionaire saved/updated successfully",
            "question_ids": question_ids,
            "organization_id": organization_id
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

@flow_bp.post("/save_capture_page")
def save_capture_page():
    data = request.get_json() or {}

    flow_id = data.get("flow_id")  # this is capture_id in frontend (alias)
    user_id = data.get("user_id")
    text_area = data.get("text_area", "")

    if not flow_id or not user_id:
        return jsonify({"error": "flow_id and user_id are required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Validate flow_id from flows table
        cur.execute("SELECT organization_id FROM flows WHERE id=%s", (flow_id,))
        row = cur.fetchone()

        if not row:
            return jsonify({"error": f"Invalid flow_id: {flow_id}"}), 400

        organization_id = row[0]

        # Check if capture already exists for this flow_id
        cur.execute("SELECT id FROM capture WHERE flow_id=%s", (flow_id,))
        existing = cur.fetchone()

        if existing:
            # ---------- UPDATE EXISTING ----------
            capture_id = existing[0]

            cur.execute("""
                UPDATE capture
                SET text_area=%s
                WHERE id=%s
            """, (text_area, capture_id))

            conn.commit()

            return jsonify({
                "message": "Capture page updated successfully",
                "id": capture_id,
                "flow_id": flow_id,
                "organization_id": organization_id
            }), 200

        else:
            # ---------- INSERT NEW ----------
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

            new_id = cur.fetchone()[0]
            conn.commit()

            return jsonify({
                "message": "Capture page saved successfully",
                "id": new_id,
                "flow_id": flow_id,
                "organization_id": organization_id
            }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()
