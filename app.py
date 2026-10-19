import os
from flask import Flask, render_template, request, flash, redirect, url_for
from flask_wtf import FlaskForm
from flask_wtf.csrf import CSRFProtect
from wtforms import StringField, EmailField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Email, Length
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail, Message
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "cambia-esta-clave-en-produccion")
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER", "")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", "587"))
app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME", "")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD", "")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_USERNAME", "")
app.config["CONTACT_EMAIL"] = os.getenv("CONTACT_EMAIL", "")

CSRFProtect(app)
limiter = Limiter(get_remote_address, app=app, default_limits=[])
mail = Mail(app)

class ContactForm(FlaskForm):
    name = StringField("Nombre", validators=[DataRequired(), Length(min=2, max=80)])
    email = EmailField("Correo electrónico", validators=[DataRequired(), Email(), Length(max=120)])
    subject = StringField("Asunto", validators=[DataRequired(), Length(min=3, max=120)])
    message = TextAreaField("Mensaje", validators=[DataRequired(), Length(min=10, max=3000)])
    submit = SubmitField("Enviar mensaje")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/contacto", methods=["GET", "POST"])
@limiter.limit("5 per hour", methods=["POST"])
def contacto():
    form = ContactForm()
    if form.validate_on_submit():
        if not app.config["MAIL_SERVER"] or not app.config["CONTACT_EMAIL"] or not app.config["MAIL_USERNAME"]:
            flash("El formulario está preparado, pero el envío directo aún no está configurado. Puedes escribirme por correo.", "warning")
            return redirect(url_for("contacto") + "#contacto")

        try:
            msg = Message(
                subject=f"[Portafolio] {form.subject.data.strip()}",
                recipients=[app.config["CONTACT_EMAIL"]],
                reply_to=form.email.data.strip(),
                body=(
                    f"Nombre: {form.name.data.strip()}\n"
                    f"Correo: {form.email.data.strip()}\n\n"
                    f"{form.message.data.strip()}"
                ),
            )
            mail.send(msg)
            flash("¡Mensaje enviado! Gracias por contactarme.", "success")
            return redirect(url_for("contacto") + "#contacto")
        except Exception:
            app.logger.exception("No se pudo enviar el correo de contacto")
            flash("No se pudo enviar el mensaje en este momento. Intenta por correo directo.", "error")
            return redirect(url_for("contacto") + "#contacto")

    return render_template("contacto.html", form=form)

if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")
