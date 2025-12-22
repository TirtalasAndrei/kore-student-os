from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
import json

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///notite.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=True)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/dashboard')
def aplication():
    return render_template("dashboard.html")

@app.route('/save_note', methods=['POST'])
def save_note():
    data = request.json
    content_as_string = json.dumps(data)

    nota = Note.query.get(1)

    if nota:
        nota.content = content_as_string
    else:
        nota = Note(id=1, content=content_as_string)
        db.session.add(nota)

    db.session.commit()
    return jsonify({"status": "success", "message": "Salvat in baza de date!"})

@app.route('/get_note', methods=['GET'])
def get_note():
    nota = Note.query.get(1)

    if nota and nota.content:
        return jsonify(json.loads(nota.content))
    else:
        return jsonify({})

if __name__ == "__main__":
    app.run(debug=True)