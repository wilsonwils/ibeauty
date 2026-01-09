from flask import Flask
from flask_cors import CORS

from routes.auth_routes import auth_bp
from routes.product_routes import product_bp
from routes.flow_routes import flow_bp


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(product_bp)
app.register_blueprint(flow_bp)

if __name__ == "__main__":
    app.run(debug=True)
