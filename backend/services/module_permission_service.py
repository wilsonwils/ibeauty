from database import get_connection

def get_allowed_modules(organization_id, user_id):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT DISTINCT
                mm.id,
                mm.purchase_module_name
            FROM module_permission mp
            JOIN module_management mm
              ON mm.id = ANY (
                  SELECT jsonb_array_elements_text(mp.module_management_id)::BIGINT
              )
            WHERE mp.organization_id = %s
              AND mp.user_id = %s
            ORDER BY mm.id
        """, (organization_id, user_id))

        rows = cur.fetchall()

        return [
            {"id": row[0], "name": row[1]}
            for row in rows
        ]

    finally:
        cur.close()
        conn.close()
