from flask import Flask
from app.api.routes.auth import auth_bp
from app.api.routes.projects import projects_bp
from app.api.routes.layers import layers_bp
from app.api.routes.geometry import geometry_bp
from app.api.routes.modules import modules_bp, jobs_bp
from app.api.routes.reports import reports_bp
from app.api.routes.terrain import terrain_bp
from app.api.routes.help import help_bp


def register_routes(app: Flask):
    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(layers_bp)
    app.register_blueprint(geometry_bp)
    app.register_blueprint(modules_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(terrain_bp)
    app.register_blueprint(help_bp)

