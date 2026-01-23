from flask import Blueprint, request, jsonify, send_from_directory
import jwt
from database import get_connection
import secrets, os
import json
from datetime import datetime, timedelta, timezone
from routes.auth_routes import decode_token
import psycopg2
import logging

session_bp = Blueprint("session", __name__)

logger = logging.getLogger(__name__)

SECRET = "face_app_secret"

@session_bp.route("/generate-link", methods=["POST"])
def generate_link():
    logger.info("Generating session link")
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "").strip()
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = payload["user_id"]
    org_id = payload["organization_id"]

    data = request.get_json() or {}
    logger.info("Request data: %s", data)
    print(data)
    module_id = data.get("module_id")
    print(module_id)
    # ===== BASIC INFO =====

    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=10)
    }
    IBEAUTY_URL = os.getenv("IBEAUTY_FRONTENT_URL", "http://example.com")
    token = jwt.encode(payload, SECRET, algorithm="HS256")
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id FROM app_link
        WHERE user_id = %s AND org_id = %s AND module_id=%s
        """,
        (user_id, org_id,module_id)
    )
    existing = cursor.fetchone()
    if existing:
        # 2️⃣ UPDATE
        cursor.execute(
            """
            UPDATE app_link
            SET token = %s,
                is_active = %s,
                updated_at = %s
            WHERE user_id = %s AND org_id = %s
            """,
            (token, True, datetime.utcnow(), user_id, org_id)
        )
        logger.info("Updated existing session link")
    else:
        cursor.execute(
            "INSERT INTO app_link ( user_id,org_id, app_id, token, is_active,module_id) VALUES (%s, %s, %s, %s, %s, %s)",
            ( user_id, org_id, None, token, True, module_id),
        )
        logger.info("Inserted new session link")
    conn.commit()
    cursor.close()
    conn.close()

    link = f"{IBEAUTY_URL}/session/{token}"
    logger.info("   Generated link: %s", link)

    return jsonify({"link": link}), 200

@session_bp.route("/app-data/<string:token>", methods=["GET"])
def get_all_flows_external(token):
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"error": "Token required"}), 401

    auth_token = auth.replace("Bearer ", "").strip()
    payload = decode_token(auth_token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401

    user_id = payload["user_id"]
    organization_id = payload["organization_id"]

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT is_active, user_id, org_id, module_id FROM app_link WHERE token = %s",
            (token,)
        )
        link = cur.fetchone()
        if not link or not link[0]:
            return jsonify({"error": "Link not found"}), 401
        module_id=link[3]
        cur.execute(
            "SELECT module_management_id,customized_module_id,plan_id FROM module_permission WHERE user_id = %s AND organization_id=%s LIMIT 1",
            (user_id, organization_id)
        )
        module_permission = cur.fetchone()
        if not module_permission:
             return jsonify({"error": "Module permission not found"}), 401

        allowed_module_ids = [*list(module_permission[0]), *list(module_permission[1])]

        if module_id not in allowed_module_ids:
            return jsonify({"error": "Module permission not found"}), 401

        cur.execute("""
            SELECT payment_status,trial_end_at
            FROM organization_modules
            WHERE organization_id = %s
            AND user_id = %s AND module_id = %s
            LIMIT 1
        """, (organization_id, user_id, module_id))

        row = cur.fetchone()

        if not row:
            return jsonify({"access": False, "message": "Module not found"}), 200
        
        payment_status, plan_expiry = row

        now = datetime.now(timezone.utc)
        if plan_expiry and now >= plan_expiry:
             return jsonify({"access": False, "message": "Plan Expired"}), 200
        

        if payment_status != "Success":
            return jsonify({"access": False, "message": "Subscription inactive"}), 200
        # ---------- VALIDATE SESSION LINK ----------

        # ---------- FETCH FLOWS ----------
        cur.execute("""
            SELECT id, flow_name, description, is_active, skip
            FROM flows
            WHERE organization_id = %s
            ORDER BY id
        """, (organization_id,))
        flows = cur.fetchall()

        response_flows = []

        for flow_id, flow_name, description, is_active, skip in flows:
            flow_payload = {
                "flow": {
                    "id": flow_id,
                    "flow_name": flow_name,
                    "description": description,
                    "is_active": is_active,
                    "skip": skip
                }
            }

            # =====================================================
            # LANDING PAGE
            # =====================================================
            if flow_name == "Landing Page":
                cur.execute("""
                    SELECT thumbnail, cta_position
                    FROM landing_page
                    WHERE flow_id=%s
                """, (flow_id,))
                lp = cur.fetchone()
                if lp:
                    flow_payload["landing_page"] = {
                        "thumbnail": lp[0],
                        "cta_position": lp[1]
                    }

            # =====================================================
            # QUESTIONNAIRE
            # =====================================================
            elif flow_name == "Questionaire":
                cur.execute("""
                    SELECT label, key, input_type, options, required, display_order
                    FROM questions
                    WHERE flow_id=%s AND user_id=%s
                    ORDER BY display_order
                """, (flow_id, user_id))

                questions = [{
                    "label": q[0],
                    "yes_no": q[1],
                    "type": q[2],
                    "value": q[3] if isinstance(q[3], (list, dict)) else json.loads(q[3]) if q[3] else [],
                    "required": q[4],
                    "order": q[5]
                } for q in cur.fetchall()]

                flow_payload["questionnaire"] = {
                    "questions": questions
                }

            # =====================================================
            # CAPTURE
            # =====================================================
            elif flow_name == "Capture":
                cur.execute("""
                    SELECT text_area
                    FROM capture
                    WHERE flow_id=%s AND user_id=%s
                """, (flow_id, user_id))
                cap = cur.fetchone()
                if cap:
                    flow_payload["capture_page"] = {
                        "text_area": cap[0]
                    }

            # =====================================================
            # CONTACT
            # =====================================================
            elif flow_name == "Contact":
                cur.execute("""
                    SELECT contact_information
                    FROM organization_contact_input
                    WHERE flow_id=%s AND user_id=%s
                """, (flow_id, user_id))
                contact = cur.fetchone()
                if contact:
                    flow_payload["contact_page"] = {
                        "fields": contact[0] if isinstance(contact[0], list) else json.loads(contact[0])
                    }

            # =====================================================
            # SEGMENTATION
            # =====================================================
            elif flow_name == "Segmentation":
                cur.execute("""
                    SELECT label, key, options, required
                    FROM segmentation_fields
                    WHERE flow_id=%s AND user_id=%s
                """, (flow_id, user_id))

                segmentation = [{
                    "label": s[0],
                    "key": s[1],
                    "options": s[2] if isinstance(s[2], list) else json.loads(s[2]) if s[2] else [],
                    "required": s[3]
                } for s in cur.fetchall()]

                flow_payload["segmentation"] = {
                    "fields": segmentation
                }

            # =====================================================
            # SKIN GOAL
            # =====================================================
            elif flow_name == "Skin Goal":
                cur.execute("""
                    SELECT selected_fields
                    FROM skin_goals
                    WHERE flow_id=%s AND user_id=%s
                """, (flow_id, user_id))
                sg = cur.fetchone()
                if sg:
                    flow_payload["skin_goal"] = {
                        "selected_fields": sg[0] if isinstance(sg[0], list) else json.loads(sg[0])
                    }

            # =====================================================
            # SUMMARY / ROUTINE
            # =====================================================
            elif flow_name in ("Summary", "Routine"):
                cur.execute("""
                    SELECT field_name
                    FROM organization_summary
                    WHERE flow_id=%s AND user_id=%s
                """, (flow_id, user_id))
                sm = cur.fetchone()
                if sm:
                    flow_payload["summary"] = (
                        sm[0] if isinstance(sm[0], dict) else json.loads(sm[0])
                    )

            # =====================================================
            # SUGGEST PRODUCT
            # =====================================================
            elif flow_name == "Suggest Product":
                cur.execute("""
                    SELECT field
                    FROM product_suggest
                    WHERE flow_id=%s AND user_id=%s
                """, (flow_id, user_id))
                sp = cur.fetchone()
                if sp:
                    flow_payload["suggest_product"] = (
                        sp[0] if isinstance(sp[0], dict) else json.loads(sp[0])
                    )

            response_flows.append(flow_payload)

        return jsonify({
            "organization_id": organization_id,
            "user_id": user_id,
            "flows": response_flows
        }), 200

    finally:
        cur.close()
        conn.close()
