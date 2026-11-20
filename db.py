from flask import Flask,render_template,request,jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, LoginManager,login_user, logout_user, login_required
from flask_bcrypt import Bcrypt

db = SQLAlchemy()

class User(UserMixin):
    id = db.Column(db.Integer,primary_key=True)
    username = db.Column(db.String(64),unique=True)
    email = db.Column(db.String(128),unique=True)
    password_hash = db.Column(db.String(128))
    
    def __repr__(self):
        return f'<User{self.username}>'