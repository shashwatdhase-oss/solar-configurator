from flask import jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException


def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def handle_validation_error(err):
        return jsonify({"error": "validation_error", "messages": err.messages}), 400

    @app.errorhandler(HTTPException)
    def handle_http_error(err):
        return jsonify({"error": err.name.lower().replace(" ", "_"), "message": err.description}), err.code

    @app.errorhandler(Exception)
    def handle_exception(err):
        app.logger.exception("Unhandled exception", exc_info=err)
        return jsonify({"error": "internal_server_error", "message": "Unexpected server error"}), 500

