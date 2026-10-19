from pathlib import Path

ROOT = Path("portafolio_editorial")

directories = [
    "templates",
    "static/css",
    "static/js",
    "static/img/profile",
    "static/img/projects",
    "static/img/backgrounds",
    "static/videos",
    "static/icons",
    "docs",
]

files = [
    "app.py", "config.py", "requirements.txt", ".env.example",
    ".gitignore", "README.md", "templates/base.html",
    "templates/index.html", "templates/contacto.html",
    "static/css/style.css", "static/js/main.js",
    "static/js/projects.js", "static/img/video-poster-placeholder.svg",
    "static/img/profile/README.md", "static/img/projects/README.md",
    "static/img/backgrounds/README.md", "static/videos/README.md",
    "docs/github-pages.md",
]

ROOT.mkdir(exist_ok=True)
print(f"Carpeta principal lista: {ROOT.resolve()}")

for folder in directories:
    path = ROOT / folder
    existed = path.exists()
    path.mkdir(parents=True, exist_ok=True)
    print(f"{'Ya existía' if existed else 'Creada'} carpeta: {path}")

for filename in files:
    path = ROOT / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        print(f"Ya existía archivo (no se sobrescribió): {path}")
    else:
        path.touch()
        print(f"Creado archivo vacío: {path}")

print("\\nEstructura preparada. Copia el contenido del proyecto en los archivos vacíos.")
