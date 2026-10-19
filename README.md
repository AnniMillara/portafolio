# ✦ Portafolio editorial

Portafolio personal con estética editorial: verde bosque, crema, amarillo dorado y terracota. Incluye secciones de presentación, habilidades, proyectos, video y contacto con Flask.

## Requisitos

- Python 3.10 o superior
- Git (opcional, para versionar el proyecto)

## Ejecutar en Windows

1. Abre una terminal dentro de esta carpeta.
2. Crea un entorno virtual:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Instala las dependencias:

   ```powershell
   py -m pip install -r requirements.txt
   ```

4. Copia `.env.example` y renómbralo a `.env`. Cambia `SECRET_KEY` por una clave privada.
5. Inicia el sitio:

   ```powershell
   py app.py
   ```

6. Abre `http://127.0.0.1:5000`.

## Personalización

- Edita los textos y enlaces en `templates/index.html`.
- Cambia las imágenes provisionales por tus propias imágenes dentro de `static/img/`.
- Coloca el video en `static/videos/presentacion.mp4`.
- Configura SMTP en `.env` para activar el envío real del formulario.

## Contacto con Flask

El formulario valida los campos en el servidor, usa protección CSRF y limita los envíos. Si SMTP no está configurado, no afirma que el mensaje se envió: ofrece una alternativa por correo.

## GitHub Pages

GitHub Pages solo aloja archivos estáticos; no ejecuta Python ni Flask. Para publicar una versión estática, habría que convertir la plantilla Jinja a HTML estático y reemplazar el formulario Flask por un enlace `mailto:` o un servicio de formularios. Para conservar el formulario Flask, publica la aplicación en un servicio que admita Python.

## Antes de publicar

- Reemplaza los textos provisionales, el nombre y los enlaces.
- No publiques `.env` ni contraseñas.
- Añade una fotografía propia y capturas reales de tus proyectos.
- Comprueba el diseño en móvil, tablet y escritorio.
