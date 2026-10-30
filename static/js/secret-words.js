/* js/secret-words.js
   Bandeja, chips, checkWord, panel de secretos, globals compartidos. */
(function () {
    "use strict";

    const VOCABULARY = window.PORTFOLIO_VOCABULARY;
    const normalize = window.PORTFOLIO_NORMALIZE;
    const SECRETS_KEY = "portfolio-secrets-v3";

    const SPAWN_MAX = 250;
    const SPAWN_BATCH = 5;
    const PREFIX_HELP_MIN = 5;

    let progress = loadProgress();
    let toastTimer = null;
    let spawnCount = 0;
    let activeFilter = "all";
    let secretsOpen = false;
    let secretsPrevFocus = null;

    function loadProgress() {
        try {
            const raw = localStorage.getItem(SECRETS_KEY);
            if (!raw) {
                const prev = localStorage.getItem("portfolio-secrets-v2");
                if (prev) {
                    const parsed = JSON.parse(prev);
                    if (parsed && typeof parsed === "object") {
                        localStorage.setItem(SECRETS_KEY, JSON.stringify(parsed));
                        return parsed;
                    }
                }
                return {};
            }
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === "object") ? parsed : {};
        } catch (_) { return {}; }
    }
    function saveProgress(p) {
        try { localStorage.setItem(SECRETS_KEY, JSON.stringify(p)); } catch (_) {}
    }

    function pickRandomLetter() {
        const weights = window.PORTFOLIO_LETTER_WEIGHTS;
        const pool = Object.keys(weights);
        const total = pool.reduce((a, k) => a + weights[k], 0);
        let r = Math.random() * total;
        for (const l of pool) { r -= weights[l]; if (r <= 0) return l; }
        return "A";
    }

    function wordForms(key) {
        return [key, ...(VOCABULARY[key].aliases || [])];
    }

    function nextLetterForPrefix(currentWord) {
        if (!currentWord || currentWord.length < PREFIX_HELP_MIN) return null;
        for (const k of Object.keys(VOCABULARY)) {
            for (const form of wordForms(k)) {
                const nk = normalize(form);
                if (nk.length > currentWord.length && nk.startsWith(currentWord)) {
                    return nk[currentWord.length];
                }
            }
        }
        return null;
    }

    function showToast(text) {
        const toast = document.getElementById("word-toast");
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3800);
    }

    function restoreOrigin(originEl) {
        if (!originEl) return;
        originEl.classList.remove("is-taken");
        if (originEl.classList.contains("float-letter")) {
            originEl.removeAttribute("aria-disabled");
            originEl.tabIndex = 0;
        }
    }

    function addChip(letter, originEl) {
        const trayInner = document.getElementById("word-tray-inner");
        const tray = document.getElementById("word-tray");
        if (!trayInner || !tray) return null;
        if (originEl) {
            const dup = Array.from(trayInner.children).find(c => c._originEl === originEl);
            if (dup) return dup;
        }
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.dataset.letter = letter;
        chip.textContent = letter;
        chip.setAttribute("aria-label", `Letra ${letter}. Arrastrá para reordenar, click para devolver`);
        if (originEl) chip._originEl = originEl;
        trayInner.appendChild(chip);
        attachChipDrag(chip);
        tray.classList.add("is-visible");
        return chip;
    }

    function attachChipDrag(chip) {
        const trayInner = document.getElementById("word-tray-inner");
        let st = null;
        chip.addEventListener("pointerdown", (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            st = { sx: e.clientX, id: e.pointerId, moved: false };
            window.addEventListener("pointermove", onMove, { passive: false });
            window.addEventListener("pointerup", onUp);
        });
        function onMove(e) {
            if (!st || e.pointerId !== st.id) return;
            if (!st.moved && Math.abs(e.clientX - st.sx) > 6) {
                st.moved = true;
                chip.classList.add("is-dragging");
                chip.setPointerCapture?.(e.pointerId);
            }
            if (!st.moved) return;
            e.preventDefault();
            const x = e.clientX;
            const siblings = Array.from(trayInner.children).filter(c => c !== chip);
            let target = null;
            for (const o of siblings) {
                const r = o.getBoundingClientRect();
                if (x < r.left + r.width / 2) { target = o; break; }
            }
            if (target) trayInner.insertBefore(chip, target);
            else trayInner.appendChild(chip);
        }
        function onUp(e) {
            if (!st || e.pointerId !== st.id) return;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            chip.classList.remove("is-dragging");
            chip.releasePointerCapture?.(e.pointerId);
            if (!st.moved) removeChip(chip);
            else checkWord();
            st = null;
        }
    }

    function removeChip(chip) {
        const tray = document.getElementById("word-tray");
        const trayInner = document.getElementById("word-tray-inner");
        restoreOrigin(chip._originEl);
        chip.remove();
        if (trayInner.children.length === 0) tray.classList.remove("is-visible");
        checkWord();
    }

    function clearAll() {
        const tray = document.getElementById("word-tray");
        const trayInner = document.getElementById("word-tray-inner");
        Array.from(trayInner.children).forEach(chip => {
            restoreOrigin(chip._originEl);
            chip.remove();
        });
        tray.classList.remove("is-visible");
        window.EffectsManager.applyEffects([]);
        spawnCount = 0;
    }

    function currentTrayWord() {
        const trayInner = document.getElementById("word-tray-inner");
        return normalize(Array.from(trayInner.children).map(c => c.dataset.letter).join(""));
    }

    function checkWord() {
        const trayInner = document.getElementById("word-tray-inner");
        const tray = document.getElementById("word-tray");
        const word = currentTrayWord();
        if (!word) return;

        const key = Object.keys(VOCABULARY).find(k => {
            return wordForms(k).some(form => normalize(form) === word);
        });
        if (!key) return;

        const eff = VOCABULARY[key].effect;
        const active = window.EffectsManager.getActiveEffects();
        const updated = active.filter(e => e !== eff);
        updated.push(eff);
        window.EffectsManager.applyEffects(updated);
        markDiscovered(key);
        showToast(`Encontraste ${VOCABULARY[key].label.toUpperCase()}`);
        setTimeout(() => {
            Array.from(trayInner.children).forEach(chip => {
                restoreOrigin(chip._originEl);
                chip.remove();
            });
            if (trayInner.children.length === 0) tray.classList.remove("is-visible");
        }, 300);
    }

    function markDiscovered(word) {
        const key = normalize(word);
        if (!VOCABULARY[key]) return;
        if (!progress[key] || progress[key].status !== "discovered") {
            progress[key] = { status: "discovered", at: Date.now(), letters: key.length };
            saveProgress(progress);
            updateSecretsUI();
        }
    }

    function getStatus(k) {
        const p = progress[k];
        return (p && p.status === "discovered") ? "discovered" : "undiscovered";
    }

    function renderSecretCard(wordKey) {
        const entry = VOCABULARY[wordKey];
        const status = getStatus(wordKey);
        const card = document.createElement("div");
        card.className = "secret-card";
        card.dataset.status = status;
        card.dataset.category = entry.category;
        const nameEl = document.createElement("h3");
        nameEl.className = "secret-card-name";
        nameEl.textContent = status === "discovered"
            ? entry.label.toUpperCase()
            : wordKey.split("").map((ch, i) => i === 0 ? ch : "·").join(" ");
        const statusEl = document.createElement("span");
        statusEl.className = "secret-card-status";
        statusEl.textContent = status === "discovered" ? "descubierta" : "pendiente";
        const head = document.createElement("div");
        head.className = "secret-card-head";
        head.appendChild(nameEl);
        head.appendChild(statusEl);
        const cat = document.createElement("span");
        cat.className = "secret-card-category";
        cat.textContent = entry.category;
        const hint = document.createElement("p");
        hint.className = "secret-card-hint";
        hint.textContent = status === "discovered"
            ? `Desbloquea el efecto "${entry.label}".`
            : entry.hint;
        card.appendChild(head);
        card.appendChild(cat);
        card.appendChild(hint);
        return card;
    }

    function renderSecretsGrid() {
        const grid = document.getElementById("secrets-grid");
        if (!grid) return;
        grid.innerHTML = "";
        Object.keys(VOCABULARY).forEach(k => {
            if (activeFilter !== "all" && VOCABULARY[k].category !== activeFilter) return;
            grid.appendChild(renderSecretCard(k));
        });
    }

    function updateSecretsUI() {
        const all = Object.keys(VOCABULARY);
        const total = all.length;
        const found = all.filter(k => getStatus(k) === "discovered").length;
        const pending = total - found;
        const countEl = document.getElementById("secrets-count");
        const foundEl = document.getElementById("secrets-found");
        const totalEl = document.getElementById("secrets-total");
        const pendingEl = document.getElementById("secrets-pending");
        const fill = document.getElementById("secrets-progress-fill");
        const ann = document.getElementById("secrets-announcer");
        if (countEl) countEl.textContent = `${found}/${total}`;
        if (foundEl) foundEl.textContent = found;
        if (totalEl) totalEl.textContent = total;
        if (pendingEl) pendingEl.textContent = pending;
        if (fill) fill.style.width = (total === 0 ? 0 : Math.round((found / total) * 100)) + "%";
        if (ann) ann.textContent = `${found} de ${total} secretos descubiertos`;
        renderSecretsGrid();
    }

    function openSecrets() {
        const modal = document.getElementById("secrets-modal");
        if (!modal) return;
        updateSecretsUI();
        secretsPrevFocus = document.activeElement;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        secretsOpen = true;
        setTimeout(() => modal.querySelector(".secrets-close")?.focus(), 80);
    }

    function closeSecrets() {
        const modal = document.getElementById("secrets-modal");
        if (!modal) return;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        secretsOpen = false;
        secretsPrevFocus?.focus?.();
        secretsPrevFocus = null;
    }

    function init() {
        const trayAdd = document.getElementById("word-tray-add");
        const trayReset = document.getElementById("word-tray-reset");
        const trayClear = document.getElementById("word-tray-clear");
        const secretsBtn = document.getElementById("secrets-btn");
        const secretsReset = document.getElementById("secrets-reset");
        const secretsFilters = document.querySelectorAll(".secrets-filter");

        trayClear?.addEventListener("click", clearAll);

        trayAdd?.addEventListener("click", () => {
            if (spawnCount >= SPAWN_MAX) {
                showToast("Bandeja llena");
                return;
            }

            const prefixNow = currentTrayWord();
            const canGuide = nextLetterForPrefix(prefixNow) !== null;
            const useGuided = canGuide && Math.random() < 0.5;

            for (let i = 0; i < SPAWN_BATCH && spawnCount < SPAWN_MAX; i++) {
                let letter;
                if (useGuided) {
                    const w = currentTrayWord();
                    const next = nextLetterForPrefix(w);
                    letter = next || pickRandomLetter();
                } else {
                    letter = pickRandomLetter();
                }
                addChip(letter, null);
                spawnCount++;
            }
            checkWord();
        });

        trayReset?.addEventListener("click", () => {
            clearAll();
            document.querySelectorAll(".float-letter").forEach(el => {
                el.classList.remove("is-taken");
                el.removeAttribute("aria-disabled");
                el.tabIndex = 0;
            });
            document.querySelectorAll(".letter--back").forEach(el => el.classList.remove("is-taken"));
            document.querySelectorAll(".drag-wrap").forEach(w => {
                w.classList.remove("is-revealed");
                const o = w.querySelector("[data-drag-reveal]");
                if (o) { o.style.setProperty("--rdx", "0px"); o.style.setProperty("--rdy", "0px"); }
                const l = w.querySelector(".letter--hidden");
                if (l && !l.classList.contains("is-taken")) l.setAttribute("inert", "");
            });
            document.querySelectorAll(".star[data-star-letter]").forEach(s => {
                s.classList.remove("is-revealed", "is-collected", "is-collecting", "is-discovering");
                clearTimeout(s._revealTimer);
            });
            window.__resetStickyNote?.();
            spawnCount = 0;
        });

        secretsBtn?.addEventListener("click", openSecrets);
        document.querySelectorAll("[data-close-secrets]").forEach(el =>
            el.addEventListener("click", closeSecrets)
        );
        document.addEventListener("keydown", (e) => {
            if (!secretsOpen) return;
            if (e.key === "Escape") { closeSecrets(); return; }
        });
        secretsFilters.forEach(btn => {
            btn.addEventListener("click", () => {
                activeFilter = btn.dataset.cat;
                secretsFilters.forEach(b => b.classList.toggle("is-active", b === btn));
                renderSecretsGrid();
            });
        });
        secretsReset?.addEventListener("click", () => {
            if (!confirm("Reiniciar todo el progreso de secretos?")) return;
            progress = {};
            saveProgress(progress);
            updateSecretsUI();
        });
        updateSecretsUI();

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && window.EffectsManager.getActiveEffects().length) {
                window.EffectsManager.applyEffects([]);
            }
        });

        window.__portfolioAddChip = addChip;
        window.__portfolioCheckWord = checkWord;
        window.__portfolioShowToast = showToast;
    }

    window.SecretWords = { init, addChip, checkWord, showToast, updateSecretsUI };
})();