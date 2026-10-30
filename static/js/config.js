/* js/config.js */
(function () {
    "use strict";

    window.PORTFOLIO_AUDIO = {
        normal:    "assets/audio/fondo.mp3",
        cielo:     "assets/audio/cielo.mp3",
        lluvia:    "assets/audio/lluvia.mp3",
        galaxia:   "assets/audio/galaxia.mp3",
        invierno:  "assets/audio/invierno.mp3",
        verano:    "assets/audio/verano.mp3",
        primavera: "assets/audio/primavera.mp3",
        otono:     "assets/audio/otono.mp3",
        agujero:   "assets/audio/agujero.mp3",
        codigo:    "assets/audio/codigo.mp3",
        binario:   "assets/audio/binario.mp3",
        bosquejo:  "assets/audio/bosquejo.mp3"
    };

    window.PORTFOLIO_LETTER_SOUND = "assets/audio/letter-found.mp3";

    window.PORTFOLIO_VOCABULARY = {
        CODIGO: {
            category: "tecnologia",
            label: "Código",
            hint: "Lo que escribís para hablarle a la máquina.",
            effect: "codigo"
        },
        BINARIO: {
            category: "tecnologia",
            label: "Binario",
            hint: "Solo ceros y unos.",
            effect: "binario"
        },
        CIELO: {
            category: "naturaleza",
            label: "Cielo",
            hint: "Lo que ves cuando mirás arriba.",
            effect: "cielo"
        },
        TORNADO: {
            category: "naturaleza",
            label: "Tornado",
            hint: "Gira y se lleva todo a su paso.",
            effect: "tornado"
        },
        LLUVIA: {
            category: "naturaleza",
            label: "Lluvia",
            hint: "Cae del cielo cuando las nubes se cansan.",
            effect: "lluvia"
        },
        PRIMAVERA: {
            category: "estaciones",
            label: "Primavera",
            hint: "Flores, verde y días que se alargan.",
            effect: "primavera"
        },
        INVIERNO: {
            category: "estaciones",
            label: "Invierno",
            hint: "Frío, silencio y nieve.",
            effect: "invierno"
        },
        OTONO: {
            category: "estaciones",
            label: "Otoño",
            hint: "Hojas que caen en tonos ocres.",
            effect: "otono"
        },
        VERANO: {
            category: "estaciones",
            label: "Verano",
            hint: "Calor, luz y días largos.",
            effect: "verano"
        },
        GALAXIA: {
            category: "universo",
            label: "Galaxia",
            hint: "Una ciudad de estrellas.",
            effect: "galaxia"
        },
        AGUJERONEGRO: {
            category: "universo",
            label: "Agujero negro",
            hint: "Absorbe todo, incluso la luz.",
            effect: "agujero"
        },
        SUPERCALIFARSTILISTICOESPALIDOSO: {
            category: "especial",
            label: "¡Supersorpresa!",
            hint: "Una palabra larguísima de una canción.",
            effect: "super",
            aliases: [
                "SUPERCALIFRASTILISTICOESPIALIDOSO",
                "SUPERCALIFRAGILISTICEXPIALIDOCIOUS"
            ]
        },
        BOSQUEJO: {
            category: "especial",
            label: "Bosquejo",
            hint: "Un dibujo a lápiz, en proceso.",
            effect: "bosquejo"
        }
    };

    window.PORTFOLIO_RELATED = {
        "HTML": ["querido-diario", "cinepedia", "nido"],
        "CSS": ["querido-diario", "cinepedia", "apps-bd", "nido"],
        "JavaScript": ["querido-diario", "cinepedia", "nido"],
        "Python": ["nido", "politicore", "apps-bd", "forestguard"],
        "Flask": ["nido", "politicore", "forestguard"],
        "Jinja2": ["nido", "politicore", "cinepedia"],
        "SQL / MySQL": ["nido", "politicore", "apps-bd", "cinepedia", "forestguard"],
        "Redes LAN": ["laboratorio"],
        "Soporte técnico": ["laboratorio"]
    };

    window.PORTFOLIO_LETTER_WEIGHTS = {
        A:9, B:1, C:3, D:3, E:9, F:1, G:2, H:1, I:6, J:1, K:1, L:4, M:2,
        N:6, O:8, P:2, Q:1, R:6, S:5, T:5, U:4, V:2, W:1, X:1, Y:1, Z:1
    };

    window.PORTFOLIO_PALETTE_EFFECTS = [
        "cielo", "lluvia", "primavera", "invierno", "otono",
        "verano", "galaxia", "codigo", "binario", "bosquejo"
    ];

    window.PORTFOLIO_NORMALIZE = (s) => s.toUpperCase()
        .replace(/[ÁÀÄÂ]/g, "A").replace(/[ÉÈËÊ]/g, "E").replace(/[ÍÌÏÎ]/g, "I")
        .replace(/[ÓÒÖÔ]/g, "O").replace(/[ÚÙÜÛ]/g, "U").replace(/Ñ/g, "N")
        .replace(/[^A-Z]/g, "");
})();