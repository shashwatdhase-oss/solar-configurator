from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from app.core.config import Config
from app.db.extensions import db, migrate
from app.api.routes import register_routes
from app.api.error_handlers import register_error_handlers

jwt = JWTManager()


def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, supports_credentials=True)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    register_routes(app)
    register_error_handlers(app)

    @app.get("/health")
    def health() -> tuple[dict, int]:
        return {"status": "ok"}, 200

    return app

