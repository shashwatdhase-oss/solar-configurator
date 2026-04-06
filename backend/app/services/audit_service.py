from app.db.extensions import db
from app.models import AuditLog


def log_action(actor_id: int | None, entity_type: str, entity_id: int, action: str, details: dict | None = None):
    log = AuditLog(
        actor_id=actor_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        details=details or {},
    )
    db.session.add(log)

