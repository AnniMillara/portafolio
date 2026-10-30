/* js/effects.js
   Orquestador principal de efectos + lluvia + cielo + estaciones + tornado + binario + super. */
(function () {
    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let activeEffects = [];
    let tornadoTimer = null;
    let tornadoActiveTargets = [];
    const tornadoResetBtn = document.getElementById("tornado-reset");
    const TORNADO_DURATION = 30000;
    const TORNADO_SELECTOR = ".project-card, .skill-card, .cert-card, .note-card, .hero-frame, .module-card, .timeline-item, .formation-feature, .video-frame";

    /* ═══════════════════════════════════════════
       TORNADO
       ═══════════════════════════════════════════ */
    function spawnOrbitParticles() {
        const container = document.querySelector(".fx-tornado");
        if (!container) return;
        clearOrbitParticles();
        if (reducedMotion) return;
        for (let i = 0; i < 7; i++) {
            const span = document.createElement("span");
            span.className = "tornado-orbit-particle";
            span.style.setProperty("--orbit-r", (80 + Math.random() * 280) + "px");
            span.style.setProperty("--orbit-d", (2.5 + Math.random() * 3.5) + "s");
            span.style.setProperty("--orbit-delay", (-Math.random() * 5) + "s");
            const size = 20 + Math.random() * 50;
            span.style.width = size + "px";
            span.style.height = size + "px";
            span.style.borderColor = i % 2 === 0 ? "var(--accent)" : "var(--accent-soft)";
            span.style.borderStyle = i % 3 === 0 ? "solid" : "dashed";
            container.appendChild(span);
        }
    }

    function clearOrbitParticles() {
        document.querySelectorAll(".tornado-orbit-particle").forEach(el => el.remove());
    }

    function startTornado() {
        if (document.body.classList.contains("tornado-active")) return;
        document.body.classList.add("tornado-active");
        document.body.classList.remove("tornado-settled");
        if (tornadoResetBtn) tornadoResetBtn.hidden = true;
        spawnOrbitParticles();
        const targets = Array.from(document.querySelectorAll(TORNADO_SELECTOR))
            .filter(el => !el.hidden && el.offsetParent !== null);
        tornadoActiveTargets = targets;
        targets.forEach(el => {
            const distance = 80 + Math.random() * 380;
            const angle = Math.random() * Math.PI * 2;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance * 0.55 + 40 + Math.random() * 180;
            const rot = (Math.random() - 0.5) * 180;
            el.style.setProperty("--tx", tx.toFixed(0) + "px");
            el.style.setProperty("--ty", ty.toFixed(0) + "px");
            el.style.setProperty("--rot", rot.toFixed(0) + "deg");
            el.classList.remove("is-loose", "is-dropped", "is-dragging");
            el.style.removeProperty("transform");
            el.style.removeProperty("animation");
            el._tornadoDropped = false;
            el._looseHandlerAttached = false;
            el.classList.add("tornado-throwing");
        });
        clearTimeout(tornadoTimer);
        tornadoTimer = setTimeout(settleTornado, TORNADO_DURATION);
    }

    function settleTornado() {
        document.body.classList.remove("tornado-active");
        document.body.classList.add("tornado-settled");
        clearOrbitParticles();
        const visible = tornadoActiveTargets.filter(el => {
            const r = el.getBoundingClientRect();
            return r.right > 40 && r.left < window.innerWidth - 40 && r.bottom > 40 && r.top < window.innerHeight - 40;
        });
        const pool = visible.length >= 2 ? visible : tornadoActiveTargets;
        const shuffled = pool.slice().sort(() => Math.random() - 0.5);
        const looseCount = Math.min(5, Math.max(3, Math.floor(shuffled.length * 0.35)));
        shuffled.slice(0, looseCount).forEach(el => {
            el.classList.add("is-loose");
            attachLooseCardDrag(el);
        });
        if (tornadoResetBtn) tornadoResetBtn.hidden = false;
    }

    function attachLooseCardDrag(el) {
        if (el._looseHandlerAttached) return;
        el._looseHandlerAttached = true;
        let dragState = null;
        const onDown = (ev) => {
            if (ev.button !== undefined && ev.button !== 0) return;
            if (el._tornadoDropped || !el.classList.contains("is-loose")) return;
            if (!document.body.classList.contains("tornado-settled")) return;
            const cs = window.getComputedStyle(el);
            const m = cs.transform === "none" ? new DOMMatrix() : new DOMMatrix(cs.transform);
            dragState = {
                id: ev.pointerId, startX: ev.clientX, startY: ev.clientY,
                baseX: m.m41 || 0, baseY: m.m42 || 0,
                baseRot: Math.atan2(m.b, m.a) * 180 / Math.PI, moved: false
            };
            try { el.setPointerCapture(ev.pointerId); } catch (_) { }
        };
        const onMove = (ev) => {
            if (!dragState || ev.pointerId !== dragState.id) return;
            const dx = ev.clientX - dragState.startX;
            const dy = ev.clientY - dragState.startY;
            if (!dragState.moved && Math.hypot(dx, dy) < 8) return;
            if (!dragState.moved) {
                dragState.moved = true;
                const cs = window.getComputedStyle(el);
                const m = cs.transform === "none" ? new DOMMatrix() : new DOMMatrix(cs.transform);
                dragState.baseX = m.m41 || 0;
                dragState.baseY = m.m42 || 0;
                dragState.baseRot = Math.atan2(m.b, m.a) * 180 / Math.PI;
                el.style.animation = "none";
                el.classList.add("is-dragging");
            }
            ev.preventDefault();
            const nx = dragState.baseX + dx;
            const ny = dragState.baseY + dy;
            el.style.setProperty("--tx", nx + "px");
            el.style.setProperty("--ty", ny + "px");
            el.style.setProperty("--rot", dragState.baseRot + "deg");
            el.style.transform = `translate(${nx}px, ${ny}px) rotate(${dragState.baseRot}deg)`;
        };
        const onUp = (ev) => {
            if (!dragState || ev.pointerId !== dragState.id) return;
            const wasMoved = dragState.moved;
            try { el.releasePointerCapture(ev.pointerId); } catch (_) { }
            el.classList.remove("is-dragging");
            dragState = null;
            if (!wasMoved) dropTornadoCard(el);
        };
        el.addEventListener("pointerdown", onDown);
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
        el.addEventListener("pointercancel", onUp);
        el._looseHandlers = { onDown, onMove, onUp };
    }

    function dropTornadoCard(el) {
        if (el._tornadoDropped) return;
        el._tornadoDropped = true;
        el.classList.remove("is-loose");
        el.classList.add("is-dropped");
        if (el._looseHandlers) {
            el.removeEventListener("pointerdown", el._looseHandlers.onDown);
            el.removeEventListener("pointermove", el._looseHandlers.onMove);
            el.removeEventListener("pointerup", el._looseHandlers.onUp);
            el.removeEventListener("pointercancel", el._looseHandlers.onUp);
            el._looseHandlers = null;
        }
    }

    function stopTornado() {
        clearTimeout(tornadoTimer);
        tornadoTimer = null;
        clearOrbitParticles();
        document.body.classList.remove("tornado-active", "tornado-settled");
        document.querySelectorAll(".tornado-throwing").forEach(el => {
            el.classList.remove("tornado-throwing", "is-loose", "is-dropped", "is-dragging");
            ["--tx", "--ty", "--rot", "transform", "animation"].forEach(p => el.style.removeProperty(p));
            el._tornadoDropped = false;
            el._looseHandlerAttached = false;
            if (el._looseHandlers) {
                el.removeEventListener("pointerdown", el._looseHandlers.onDown);
                el.removeEventListener("pointermove", el._looseHandlers.onMove);
                el.removeEventListener("pointerup", el._looseHandlers.onUp);
                el.removeEventListener("pointercancel", el._looseHandlers.onUp);
                el._looseHandlers = null;
            }
        });
        tornadoActiveTargets = [];
        if (tornadoResetBtn) tornadoResetBtn.hidden = true;
    }

    /* ═══════════════════════════════════════════
       LLUVIA
       ═══════════════════════════════════════════ */
    let rainIntervalId = null;
    let rainBlurLevel = 0;
    let rainLayerCount = 0;

    const RAIN_MAX_BLUR = 10;
    const RAIN_MAX_LAYERS = 30;
    const RAIN_LAYER_INTERVAL = 2000;
    const RAIN_LAYER_DURATION = 2500;

    function applyRainToMedia() {
        const targets = document.querySelectorAll(".hero-photo, .project-media, .video-frame");
        targets.forEach(container => {
            if (container.querySelector(".rain-overlay")) return;
            const overlay = document.createElement("div");
            overlay.className = "rain-overlay";
            overlay.setAttribute("aria-hidden", "true");
            const acc = document.createElement("div");
            acc.className = "rain-blur-accumulator";
            overlay.appendChild(acc);
            container.appendChild(overlay);
        });
        startRainCycle();
    }

    function startRainCycle() {
        stopRainCycle();
        rainBlurLevel = 0;
        rainLayerCount = 0;
        spawnRainLayer();
        rainIntervalId = setInterval(() => {
            if (rainLayerCount < RAIN_MAX_LAYERS) {
                rainLayerCount++;
                rainBlurLevel = (rainLayerCount / RAIN_MAX_LAYERS) * RAIN_MAX_BLUR;
                document.querySelectorAll(".rain-blur-accumulator").forEach(acc => {
                    const filter = `blur(${rainBlurLevel.toFixed(2)}px) brightness(0.93) saturate(0.88)`;
                    acc.style.backdropFilter = filter;
                    acc.style.webkitBackdropFilter = filter;
                });
            }
            spawnRainLayer();
        }, RAIN_LAYER_INTERVAL);
    }

    function spawnRainLayer() {
        document.querySelectorAll(".rain-overlay").forEach(overlay => {
            const existing = overlay.querySelectorAll(".rain-wet-layer");
            if (existing.length >= 3) existing[0].remove();
            const layer = document.createElement("div");
            layer.className = "rain-wet-layer";
            layer.style.setProperty("--rain-dur", RAIN_LAYER_DURATION + "ms");
            overlay.appendChild(layer);
            setTimeout(() => { if (layer.parentNode) layer.remove(); }, RAIN_LAYER_DURATION + 400);
        });
    }

    function stopRainCycle() {
        if (rainIntervalId) { clearInterval(rainIntervalId); rainIntervalId = null; }
        rainBlurLevel = 0;
        rainLayerCount = 0;
    }

    function removeRainFromMedia() {
        stopRainCycle();
        document.querySelectorAll(".rain-overlay").forEach(el => el.remove());
    }

    function generateRainDrops() {
        const container = document.querySelector(".fx-rain");
        if (!container) return;
        container.querySelectorAll(".rain-drop-dyn").forEach(el => el.remove());
        const count = 60;
        for (let i = 0; i < count; i++) {
            const drop = document.createElement("span");
            drop.className = "rain-drop-dyn";
            drop.style.setProperty("--x", (Math.random() * 100) + "%");
            const dur = 0.6 + Math.random() * 0.8;
            drop.style.setProperty("--dur", dur.toFixed(2) + "s");
            drop.style.setProperty("--d", (-Math.random() * 3).toFixed(2) + "s");
            drop.style.setProperty("--l", (30 + Math.random() * 70).toFixed(0) + "vh");
            if (Math.random() > 0.65) {
                drop.style.width = "2px";
                drop.style.height = (52 + Math.random() * 22) + "px";
                drop.style.filter = "blur(0.5px)";
                drop.style.zIndex = "2";
            } else {
                drop.style.opacity = "0.7";
            }
            container.appendChild(drop);
        }
    }

    function removeRainDrops() {
        document.querySelectorAll(".rain-drop-dyn").forEach(el => el.remove());
    }

    function updateRain() {
        if (activeEffects.includes("lluvia")) {
            applyRainToMedia();
            generateRainDrops();
        } else {
            removeRainFromMedia();
            removeRainDrops();
        }
    }

    /* ═══════════════════════════════════════════
       CIELO
       ═══════════════════════════════════════════ */
    function generateSkyClouds() {
        const container = document.querySelector(".fx-sky");
        if (!container || container.children.length) return;
        const count = 12;
        for (let i = 0; i < count; i++) {
            const cloud = document.createElement("div");
            cloud.className = "sky-cloud";
            const size = 140 + Math.random() * 240;
            cloud.style.width = size.toFixed(0) + "px";
            cloud.style.height = (size * 0.5).toFixed(0) + "px";
            cloud.style.top = (5 + Math.random() * 58).toFixed(1) + "%";
            cloud.style.left = (-20 + Math.random() * 110).toFixed(1) + "%";
            cloud.style.setProperty("--dur", (100 + Math.random() * 80).toFixed(0) + "s");
            cloud.style.setProperty("--delay", (-Math.random() * 130).toFixed(0) + "s");
            cloud.style.setProperty("--cloud-op", (0.72 + Math.random() * 0.26).toFixed(2));
            if (Math.random() > 0.55) cloud.style.filter = "blur(8px)";
            container.appendChild(cloud);
        }
    }

    /* ═══════════════════════════════════════════
       ESTACIONES
       ═══════════════════════════════════════════ */
    function generateSeasonParticles() {
        const prim = document.querySelector(".fx-primavera");
        if (prim && !prim.children.length) {
            for (let i = 0; i < 26; i++) {
                const p = document.createElement("span");
                p.style.setProperty("--x", (Math.random() * 100) + "%");
                p.style.setProperty("--d", (12 + Math.random() * 8).toFixed(1) + "s");
                p.style.setProperty("--delay", (-Math.random() * 12).toFixed(1) + "s");
                p.style.setProperty("--size", (8 + Math.random() * 8).toFixed(0) + "px");
                prim.appendChild(p);
            }
        }
        const inv = document.querySelector(".fx-invierno");
        if (inv && !inv.children.length) {
            for (let i = 0; i < 32; i++) {
                const p = document.createElement("span");
                p.style.setProperty("--x", (Math.random() * 100) + "%");
                p.style.setProperty("--d", (7 + Math.random() * 7).toFixed(1) + "s");
                p.style.setProperty("--delay", (-Math.random() * 8).toFixed(1) + "s");
                p.style.setProperty("--size", (3 + Math.random() * 5).toFixed(0) + "px");
                inv.appendChild(p);
            }
        }
        const oto = document.querySelector(".fx-otono");
        if (oto && !oto.children.length) {
            for (let i = 0; i < 20; i++) {
                const p = document.createElement("span");
                p.style.setProperty("--x", (Math.random() * 100) + "%");
                p.style.setProperty("--d", (10 + Math.random() * 6).toFixed(1) + "s");
                p.style.setProperty("--delay", (-Math.random() * 10).toFixed(1) + "s");
                p.style.setProperty("--size", (8 + Math.random() * 8).toFixed(0) + "px");
                const palettes = ["#a84a1c", "#b85c2a", "#c8955a", "#8a7a4a"];
                p.style.background = `linear-gradient(135deg, ${palettes[Math.floor(Math.random() * palettes.length)]}, #d47a4a)`;
                oto.appendChild(p);
            }
        }
        const ver = document.querySelector(".fx-verano");
        if (ver && !ver.children.length) {
            for (let i = 0; i < 26; i++) {
                const p = document.createElement("span");
                p.style.setProperty("--x", (Math.random() * 100) + "%");
                p.style.setProperty("--y", (Math.random() * 100) + "%");
                p.style.setProperty("--d", (3 + Math.random() * 5).toFixed(1) + "s");
                p.style.setProperty("--delay", (-Math.random() * 6).toFixed(1) + "s");
                p.style.setProperty("--size", (6 + Math.random() * 8).toFixed(0) + "px");
                ver.appendChild(p);
            }
        }
    }

    /* ═══════════════════════════════════════════
       BINARIO — panel LED superior
       ═══════════════════════════════════════════ */
    function toBinary(str) {
        return [...str].map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
    }

    function syncBinario(list) {
        const active = list.includes("binario");
        let header = document.getElementById("binario-led-header");
        if (active && !header) {
            header = document.createElement("div");
            header.id = "binario-led-header";
            header.className = "binario-led-header";
            header.setAttribute("aria-hidden", "true");
            const parts = [];
            document.querySelectorAll("[data-binary]").forEach(el => {
                const txt = el.textContent.trim();
                if (txt) parts.push(txt);
            });
            if (!parts.length) {
                parts.push("Portafolio", "Annerill Anabalón", "Programación", "Santiago de Chile");
            }
            const binText = parts.map(toBinary).join("   ·   ");
            header.innerHTML = `<div class="led-track"><span>${binText}   ·   </span><span>${binText}   ·   </span></div>`;
            document.body.appendChild(header);
        } else if (!active && header) {
            header.remove();
        }
    }

    /* ═══════════════════════════════════════════
       SUPER — banda karaoke con letras congeladas + bloqueo
       ═══════════════════════════════════════════ */
    const specialMusic = document.getElementById("special-music");
    let superTimer = null;
    let superLetterTimers = [];
    let superEndedHandler = null;

    function showSuperBand() {
        if (document.querySelector(".super-band")) return;
        const word = "Supercalifragilisticoespialidoso";
        const band = document.createElement("div");
        band.className = "super-band";
        band.setAttribute("aria-hidden", "true");
        const label = document.createElement("div");
        label.className = "super-band-text";
        const letters = [];
        for (const ch of word) {
            const span = document.createElement("span");
            span.className = "super-letter";
            span.textContent = ch;
            label.appendChild(span);
            letters.push(span);
        }
        band.appendChild(label);
        document.body.appendChild(band);

        const dur = (specialMusic && !isNaN(specialMusic.duration) && specialMusic.duration > 0)
            ? specialMusic.duration * 1000
            : 80000;
        const perLetter = Math.max(120, dur / letters.length);
        superLetterTimers = [];
        letters.forEach((s, i) => {
            const t = setTimeout(() => {
                if (!document.body.contains(s)) return;
                s.classList.add("is-lit");
                // Letras se quedan congeladas (no se remueve is-lit)
            }, i * perLetter);
            superLetterTimers.push(t);
        });
    }

    function hideSuperBand() {
        superLetterTimers.forEach(t => clearTimeout(t));
        superLetterTimers = [];
        document.querySelectorAll(".super-band").forEach(el => el.remove());
    }

    function lockSuperControls(lock) {
        const resetBtn = document.getElementById("word-tray-reset");
        const clearBtn = document.getElementById("word-tray-clear");
        const muteBtn = document.querySelector(".audio-toggle");
        const secretsBtn = document.getElementById("secrets-btn");
        [resetBtn, clearBtn, muteBtn, secretsBtn].forEach(b => {
            if (!b) return;
            b.disabled = !!lock;
            b.style.pointerEvents = lock ? "none" : "";
            b.style.opacity = lock ? "0.4" : "";
            if (lock) b.setAttribute("aria-disabled", "true");
            else b.removeAttribute("aria-disabled");
        });
    }

    function syncSuper(list) {
        const active = list.includes("super");
        clearTimeout(superTimer);

        if (active) {
            showSuperBand();
            lockSuperControls(true);

            const finishSuper = () => {
                hideSuperBand();
                lockSuperControls(false);
                removeEffect("super");
            };

            if (specialMusic) {
                try { specialMusic.currentTime = 0; } catch (_) { }
                const promise = specialMusic.play();
                if (promise && typeof promise.then === "function") {
                    promise.then(() => {
                        if (superEndedHandler) {
                            specialMusic.removeEventListener("ended", superEndedHandler);
                        }
                        superEndedHandler = finishSuper;
                        specialMusic.addEventListener("ended", superEndedHandler, { once: true });
                    }).catch((err) => {
                        console.warn("[super] music failed to play:", err);
                        setTimeout(finishSuper, 3000);
                    });
                } else {
                    setTimeout(finishSuper, 90000);
                }
            } else {
                setTimeout(finishSuper, 30000);
            }

            superTimer = setTimeout(finishSuper, 90000);
        } else {
            hideSuperBand();
            lockSuperControls(false);
            if (specialMusic) { try { specialMusic.pause(); } catch (_) { } }
            if (specialMusic && superEndedHandler) {
                specialMusic.removeEventListener("ended", superEndedHandler);
                superEndedHandler = null;
            }
        }
    }

    /* ═══════════════════════════════════════════
       APLICAR / QUITAR EFECTOS
       ═══════════════════════════════════════════ */
    function applyEffects(list) {
        list = list.slice();

        const paletteIn = list.filter(e => window.PORTFOLIO_PALETTE_EFFECTS.includes(e));
        if (paletteIn.length > 1) {
            const keep = paletteIn[paletteIn.length - 1];
            list = list.filter(e => !window.PORTFOLIO_PALETTE_EFFECTS.includes(e) || e === keep);
        }

        if (list.includes("super")) list = ["super"];
        if (list.includes("tornado") && list.includes("agujero")) list = list.filter(e => e !== "tornado");
        if (list.includes("agujero") && list.includes("lluvia")) list = list.filter(e => e !== "lluvia");
        if (list.length > 4) list = list.slice(-4);

        const prevAgujero = activeEffects.includes("agujero");
        activeEffects = list;

        if (!list.length) delete document.body.dataset.effect;
        else document.body.dataset.effect = list.join(" ");

        const willTornado = list.includes("tornado");
        const wasTornado = document.body.classList.contains("tornado-active")
            || document.body.classList.contains("tornado-settled");
        if (willTornado && !wasTornado) startTornado();
        else if (!willTornado && wasTornado) stopTornado();

        const willAgujero = list.includes("agujero");
        if (willAgujero && !prevAgujero) {
            document.body.classList.add("is-swallow-active");
            window.BlackHole?.ensureSpace?.();
            setTimeout(() => {
                if (activeEffects.includes("agujero")) window.BlackHole?.applySwallow();
            }, 400);
        } else if (!willAgujero && prevAgujero) {
            document.body.classList.remove("is-swallow-active");
            window.BlackHole?.restoreSwallow();
            setTimeout(() => {
                if (!activeEffects.includes("agujero")) {
                    window.BlackHole?.cleanupSpace?.();
                }
            }, 2000);
        }

        // AUDIO: si "super" está activo, usa su propia música (gestionada en syncSuper).
        // En cualquier otro caso, usa el audio del efecto o "normal" por defecto.
        const superActive = list.includes("super");
        if (superActive) {
            window.AudioManager?.stopAudio(true);
        } else {
            const audioEffect = list.find(e => window.PORTFOLIO_AUDIO && window.PORTFOLIO_AUDIO[e]);
            if (audioEffect) {
                window.AudioManager?.playAudioFor(audioEffect);
            } else {
                window.AudioManager?.playAudioFor("normal");
            }
        }

        syncBinario(list);
        syncSuper(list);
        updateRain();

        if (!list.length) {
            document.querySelectorAll("[style*='--rdx'], [style*='--rdy'], [style*='--pull-x']").forEach(el => {
                el.style.removeProperty("--rdx");
                el.style.removeProperty("--rdy");
                el.style.removeProperty("--pull-x");
                el.style.removeProperty("--pull-y");
                el.style.removeProperty("--pull-r");
            });
        }
    }

    function removeEffect(key) {
        activeEffects = activeEffects.filter(e => e !== key);
        applyEffects(activeEffects);
    }

    tornadoResetBtn?.addEventListener("click", () => removeEffect("tornado"));

    /* ═══════════════════════════════════════════
       INIT
       ═══════════════════════════════════════════ */
    function init() {
        generateSeasonParticles();
        generateSkyClouds();
    }

    window.EffectsManager = {
        init,
        applyEffects,
        removeEffect,
        getActiveEffects: () => activeEffects.slice()
    };
})();