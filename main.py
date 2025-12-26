from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import json
from datetime import datetime

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///kore.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'cheie-de-rezerva-doar-pentru-local')

db = SQLAlchemy(app)


# ==================== DATABASE MODELS ====================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship: one user has many notes
    notes = db.relationship('Note', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), default='Untitled Note')
    content = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign key to User
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }


# Create tables
with app.app_context():
    db.create_all()

    # Create demo user if doesn't exist
    demo_user = User.query.filter_by(email='student@kore.com').first()
    if not demo_user:
        demo_user = User(email='student@kore.com', name='Demo Student')
        demo_user.set_password('admin')
        db.session.add(demo_user)
        db.session.commit()
        print("Demo user created: student@kore.com / admin")


# ==================== AUTHENTICATION DECORATOR ====================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('sign_up_login'))
        return f(*args, **kwargs)

    return decorated_function


# ==================== ROUTES ====================

@app.route('/')
def home():
    return render_template("index.html")


@app.route('/dashboard')
@login_required
def application():
    return render_template("dashboard.html")


@app.route('/login', methods=['GET', 'POST'])
def sign_up_login():
    if request.method == 'GET':
        # If already logged in, redirect to dashboard
        if 'user_id' in session:
            return redirect(url_for('application'))
        return render_template("loginpage.html")

    if request.method == 'POST':
        data = request.json
        email = data.get("email")
        password = data.get("password")

        # Find user
        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            # Login successful
            session['user_id'] = user.id
            session['user_email'] = user.email
            session['user_name'] = user.name or email
            return jsonify({"success": True, "message": "Autentificare reușită!"})
        else:
            return jsonify({"success": False, "message": "Email sau parolă greșită!"})


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


@app.route('/register', methods=['POST'])
def register():
    """Create new user account"""
    data = request.json
    email = data.get("email")
    password = data.get("password")
    name = data.get("name", "")

    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Email deja înregistrat!"})

    # Create new user
    new_user = User(email=email, name=name)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    # Auto-login after registration
    session['user_id'] = new_user.id
    session['user_email'] = new_user.email
    session['user_name'] = new_user.name or email

    return jsonify({"success": True, "message": "Cont creat cu succes!"})


# ==================== NOTES API ====================

@app.route('/api/notes', methods=['GET'])
@login_required
def get_all_notes():
    """Get all notes for current user"""
    user_id = session.get('user_id')
    notes = Note.query.filter_by(user_id=user_id).order_by(Note.updated_at.desc()).all()
    return jsonify([note.to_dict() for note in notes])


@app.route('/api/notes/<int:note_id>', methods=['GET'])
@login_required
def get_note(note_id):
    """Get a specific note"""
    user_id = session.get('user_id')
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()

    if not note:
        return jsonify({"error": "Note not found"}), 404

    return jsonify(note.to_dict())


@app.route('/api/notes', methods=['POST'])
@login_required
def create_note():
    """Create a new note"""
    user_id = session.get('user_id')
    data = request.json

    new_note = Note(
        title=data.get('title', 'Untitled Note'),
        content=data.get('content', ''),
        user_id=user_id
    )

    db.session.add(new_note)
    db.session.commit()

    return jsonify(new_note.to_dict()), 201


@app.route('/api/notes/<int:note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    """Update an existing note"""
    user_id = session.get('user_id')
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()

    if not note:
        return jsonify({"error": "Note not found"}), 404

    data = request.json
    note.title = data.get('title', note.title)
    note.content = data.get('content', note.content)
    note.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify(note.to_dict())


@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
@login_required
def delete_note(note_id):
    """Delete a note"""
    user_id = session.get('user_id')
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()

    if not note:
        return jsonify({"error": "Note not found"}), 404

    db.session.delete(note)
    db.session.commit()

    return jsonify({"success": True, "message": "Note deleted"})


@app.route('/api/user/info', methods=['GET'])
@login_required
def get_user_info():
    """Get current user info"""
    return jsonify({
        "email": session.get('user_email'),
        "name": session.get('user_name'),
        "user_id": session.get('user_id')
    })


if __name__ == "__main__":
    app.run(debug=True)