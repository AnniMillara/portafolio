/* js/audio.js */
(function () {
    "use strict";

    let isMuted = localStorage.getItem("portfolio-muted") === "1";
    let currentAudio = null;
    let currentAudioKey = null;
    let currentFadeIn = null;
    let unlocked = false;

    function stopAudio(fadeOut = true) {
        if (currentFadeIn) { clearInterval(currentFadeIn); currentFadeIn = null; }
        if (!currentAudio) return;
        const audio = currentAudio;
        currentAudio = null;
        currentAudioKey = null;
        if (!fadeOut) { try { audio.pause(); } catch (_) { } return; }
        let v = audio.volume;
        const step = Math.max(0.01, v / 20);
        const fade = setInterval(() => {
            v -= step;
            if (v <= 0.01) { clearInterval(fade); try { audio.pause(); } catch (_) { } }
            else { try { audio.volume = Math.max(0, v); } catch (_) { } }
        }, 50);
    }

    function playAudioFor(effectKey) {
        if (isMuted) return;
        const url = window.PORTFOLIO_AUDIO && window.PORTFOLIO_AUDIO[effectKey];
        if (!url) return;
        if (currentAudioKey === effectKey) return;
        stopAudio(true);
        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = 0;
        audio.preload = "auto";
        currentAudio = audio;
        currentAudioKey = effectKey;
        audio.play().then(() => {
            if (currentAudio !== audio) return;
            let v = 0;
            if (currentFadeIn) clearInterval(currentFadeIn);
            currentFadeIn = setInterval(() => {
                v += 0.02;
                if (v >= 0.35) { v = 0.35; clearInterval(currentFadeIn); currentFadeIn = null; }
                try { audio.volume = v; } catch (_) { }
            }, 60);
        }).catch(() => {
            if (currentAudio === audio) { currentAudio = null; currentAudioKey = null; }
        });
    }

    function playLetterChime() {
        if (isMuted) return;
        const url = window.PORTFOLIO_LETTER_SOUND;
        if (!url) return;
        try { const a = new Audio(url); a.volume = 0.4; a.play().catch(() => { }); } catch (_) { }
    }

    function syncButton(toggle) {
        toggle.setAttribute("aria-pressed", String(isMuted));
        toggle.setAttribute("aria-label", isMuted ? "Activar audio ambiental" : "Silenciar audio ambiental");
        toggle.setAttribute("title", isMuted ? "Activar audio" : "Silenciar audio");
    }

    function tryStartBackground() {
        if (isMuted) return;
        if (currentAudioKey) return;
        playAudioFor("normal");
    }

    function init() {
        const toggle = document.querySelector(".audio-toggle");
        if (!toggle) return;
        syncButton(toggle);

        toggle.addEventListener("click", () => {
            isMuted = !isMuted;
            try { localStorage.setItem("portfolio-muted", isMuted ? "1" : "0"); } catch (_) { }
            syncButton(toggle);
            if (isMuted) {
                stopAudio(true);
            } else {
                const effects = (document.body.dataset.effect || "").split(/\s+/).filter(Boolean);
                const last = effects.find(e => window.PORTFOLIO_AUDIO && window.PORTFOLIO_AUDIO[e]);
                playAudioFor(last || "normal");
            }
        });

        // Desbloqueo por autoplay policy
        const unlock = () => {
            if (unlocked) return;
            unlocked = true;
            tryStartBackground();
            document.removeEventListener("pointerdown", unlock);
            document.removeEventListener("keydown", unlock);
            document.removeEventListener("touchstart", unlock);
        };
        document.addEventListener("pointerdown", unlock);
        document.addEventListener("keydown", unlock);
        document.addEventListener("touchstart", unlock);

        // Intento inmediato (a veces funciona)
        tryStartBackground();
    }

    window.AudioManager = {
        init, playAudioFor, stopAudio, playLetterChime,
        isMuted: () => isMuted,
        lockMute: (lock) => {
            const t = document.querySelector(".audio-toggle");
            if (t) { t.disabled = !!lock; t.style.pointerEvents = lock ? "none" : ""; }
        }
    };
})();