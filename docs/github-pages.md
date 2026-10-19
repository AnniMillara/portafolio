# Publicación estática en GitHub Pages

GitHub Pages no ejecuta Python, Flask ni Jinja. Para usar GitHub Pages debes generar una versión estática:

1. Reemplaza las expresiones Jinja (`url_for`, `extends`, `block`, formularios Flask) por rutas y HTML estáticos.
2. Cambia el formulario de contacto por un enlace `mailto:` o integra un servicio externo compatible.
3. Asegúrate de que CSS, JavaScript e imágenes utilicen rutas válidas desde el repositorio.
4. En GitHub, abre **Settings → Pages** y elige la rama y la carpeta que contengan el HTML estático.

Para mantener Flask y el formulario con envío real, despliega la aplicación en un servicio de hosting que admita Python.
