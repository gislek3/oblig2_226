from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, DateField, URLField, validators


class ProfileForm(FlaskForm):
    username = StringField('Username', render_kw={'readonly': True})
    password = PasswordField('Password', [validators.equal_to('password_again', message='Passwords must match')])
    password_again = PasswordField('Repeat Password')
    birthdate = DateField('Birth date', [validators.optional()])
    color = StringField('Favourite color')
    picture_url = URLField('Picture URL', [validators.url(), validators.optional()])
    about = TextAreaField('About')
    save = SubmitField('Save changes')

