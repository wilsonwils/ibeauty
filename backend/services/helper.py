

from datetime import datetime, timezone
from backend.database import get_connection


def validate_plan(org_id, user_id):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT plan, status, trial_end_at, payment_status
            FROM organization_plan
            WHERE organization_id = %s AND user_id = %s
        """, (org_id, user_id))
        org_module = cur.fetchone()
        if not org_module:
            return False

        plan, status, trial_end_at, payment_status = org_module


    

        trial_expired = False
        if trial_end_at:
            trial_expired = datetime.now(timezone.utc) >= trial_end_at

        if trial_expired or payment_status != "Success":
            return False 

        return True
    except Exception as e:
        print(f"Error validating plan: {e}")
        return False
    finally:
        cur.close()
        conn.close()