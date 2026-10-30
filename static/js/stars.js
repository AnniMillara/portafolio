/* js/stars.js
   Estrellas interactivas + descubrimiento de letras (con pausa + auto-ocultar 15s). */
(function () {
    "use strict";

    const positions = new Map();
    const originals = new Map();
    const HINT_KEY = "stars-hint-v8";
    let hintTimer = null;
    const HIDE_AFTER_MS = 15000;

    function init() {
        const field = document.querySelector(".stars-field");
        if (!field) return;
        const stars = Array.from(field.querySelectorAll(".star"));
        const resetBtn = document.querySelector(".stars-reset");
        const hint = document.querySelector(".stars-hint");
        const hintClose = document.querySelector(".stars-hint-close");
        if (!stars.length) return;

        (function shuffleLetters() {
            const withLetter = stars.filter(st => st.dataset.starLetter);
            const letters = withLetter.map(st => st.dataset.starLetter);
            for (let i = letters.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [letters[i], letters[j]] = [letters[j], letters[i]];
            }
            withLetter.forEach((st, i) => { st.dataset.starLetter = letters[i]; });
        })();

        stars.forEach((st, i) => { if (!st.dataset.uid) st.dataset.uid = "star-" + i; });

        const dismiss = () => {
            if (!hint || hint.hidden) return;
            hint.hidden = true;
            try { localStorage.setItem(HINT_KEY, "1"); } catch (_) {}
            clearTimeout(hintTimer);
        };
        const size = () => stars[0].offsetWidth || 44;
        const clampPos = (x, y) => {
            const r = field.getBoundingClientRect();
            const w = size();
            return { x: Math.max(0, Math.min(x, r.width - w)), y: Math.max(0, Math.min(y, r.height - w)) };
        };
        const setPos = (s, x, y) => { s.style.left = x + "px"; s.style.top = y + "px"; };

        function initPositions() {
            const r = field.getBoundingClientRect();
            const s = size();
            stars.forEach(st => {
                const px = parseFloat(st.dataset.starX || "50");
                const py = parseFloat(st.dataset.starY || "50");
                const pos = clampPos(r.width * px / 100 - s / 2, r.height * py / 100 - s / 2);
                positions.set(st, pos);
                originals.set(st, { ...pos });
                setPos(st, pos.x, pos.y);
            });
            field.classList.add("is-ready");
        }

        /* ─── Revelar letra ─── */
        function revealStarLetter(star) {
            if (star.classList.contains("is-revealed") ||
                star.classList.contains("is-collected") ||
                star.classList.contains("is-discovering")) return;

            document.body.classList.add("is-pausing-for-letter");
            star.classList.add("is-discovering");
            window.AudioManager?.playLetterChime();

            setTimeout(() => {
                star.classList.remove("is-discovering");
                star.classList.add("is-revealed");
                document.body.classList.remove("is-pausing-for-letter");

                // Auto-ocultar a los 15s si no la recogen
                clearTimeout(star._hideTimer);
                star._hideTimer = setTimeout(() => {
                    if (!star.classList.contains("is-collected") &&
                        star.classList.contains("is-revealed")) {
                        star.classList.remove("is-revealed");
                        star.classList.add("is-hiding");
                        setTimeout(() => star.classList.remove("is-hiding"), 500);
                    }
                }, HIDE_AFTER_MS);
            }, 220);
        }

        /* ─── Recoger letra ─── */
        function collectStarLetter(star) {
            if (star.classList.contains("is-collecting") ||
                star.classList.contains("is-collected")) return;

            clearTimeout(star._hideTimer);

            document.body.classList.add("is-pausing-for-letter");
            star.classList.add("is-collecting");
            window.AudioManager?.playLetterChime();

            setTimeout(() => {
                window.__portfolioAddChip?.(star.dataset.starLetter, null);
                star.classList.remove("is-collecting");
                star.classList.add("is-collected");
                star.classList.remove("is-revealed");
                window.__portfolioShowToast?.(`letra ${star.dataset.starLetter} recogida`);
                setTimeout(() => {
                    document.body.classList.remove("is-pausing-for-letter");
                }, 400);
            }, 220);
        }

        stars.forEach(star => {
            let drag = null, rafId = null, pending = null, pointerDown = null;
            const apply = () => {
                if (pending) { setPos(star, pending.x, pending.y); pending = null; }
                rafId = null;
            };
            star.addEventListener("pointerdown", e => {
                if (e.button !== undefined && e.button !== 0) return;
                e.preventDefault();
                const r = field.getBoundingClientRect();
                const p = positions.get(star);
                drag = { id: e.pointerId, ox: e.clientX - r.left - p.x, oy: e.clientY - r.top - p.y };
                pointerDown = { id: e.pointerId, startX: e.clientX, startY: e.clientY, startTime: Date.now(), moved: 0 };
                star.classList.add("is-dragging");
                try { star.setPointerCapture(e.pointerId); } catch (_) {}
                dismiss();
            });
            star.addEventListener("pointermove", e => {
                if (pointerDown && e.pointerId === pointerDown.id) {
                    const d = Math.hypot(e.clientX - pointerDown.startX, e.clientY - pointerDown.startY);
                    if (d > pointerDown.moved) pointerDown.moved = d;
                }
                if (!drag || e.pointerId !== drag.id) return;
                const r = field.getBoundingClientRect();
                const c = clampPos(e.clientX - r.left - drag.ox, e.clientY - r.top - drag.oy);
                positions.set(star, c);
                pending = c;
                if (rafId === null) rafId = requestAnimationFrame(apply);
            });
            const end = (e) => {
                if (!drag || e.pointerId !== drag.id) return;
                const pd = pointerDown;
                drag = null; pointerDown = null;
                star.classList.remove("is-dragging");
                try { star.releasePointerCapture(e.pointerId); } catch (_) {}
                if (!pd) return;
                const isClick = pd.moved < 8 && (Date.now() - pd.startTime) < 500;

                if (star.dataset.starLetter && star.classList.contains("is-revealed")) {
                    if (isClick) { collectStarLetter(star); return; }
                }
                if (star.dataset.starLetter && pd.moved > 30 &&
                    !star.classList.contains("is-revealed") &&
                    !star.classList.contains("is-collected")) {
                    revealStarLetter(star);
                    return;
                }
            };
            star.addEventListener("pointerup", end);
            star.addEventListener("pointercancel", end);
        });

        resetBtn?.addEventListener("click", () => {
            positions.clear(); originals.clear();
            const withLetter = stars.filter(st => st.dataset.starLetter);
            const letters = withLetter.map(st => st.dataset.starLetter);
            for (let i = letters.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [letters[i], letters[j]] = [letters[j], letters[i]];
            }
            withLetter.forEach((st, i) => { st.dataset.starLetter = letters[i]; });
            stars.forEach(st => {
                st.classList.remove("is-collected", "is-revealed", "is-collecting", "is-discovering", "is-hiding");
                clearTimeout(st._hideTimer);
            });
            initPositions();
        });

        if (hint) {
            let stored = null;
            try { stored = localStorage.getItem(HINT_KEY); } catch (_) {}
            if (!stored) { hint.hidden = false; hintTimer = setTimeout(dismiss, 14000); }
            else hint.hidden = true;
            hintClose?.addEventListener("click", dismiss);
        }
        const boot = () => requestAnimationFrame(initPositions);
        if (document.readyState === "complete") boot();
        else window.addEventListener("load", boot);
    }

    window.Stars = { init };
})();