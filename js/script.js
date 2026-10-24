// ═══════════════════════════════════════════
//  PORTAFOLIO — Annerill Anabalón
//  script.js — completo
// ═══════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    /* ─── 1. Tema ─── */
    const root = document.documentElement;
    const themeToggle = document.querySelector(".theme-toggle");
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") root.dataset.theme = savedTheme;
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.dataset.theme = "dark";
    themeToggle?.addEventListener("click", () => {
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        localStorage.setItem("theme", next);
    });

    /* ─── 2. Menú ─── */
    const menuToggle = document.querySelector(".menu-toggle");
    const nav = document.getElementById("main-nav");
    if (menuToggle && nav) {
        menuToggle.addEventListener("click", () => {
            const open = nav.classList.toggle("is-open");
            menuToggle.setAttribute("aria-expanded", String(open));
            menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
        });
        nav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                nav.classList.remove("is-open");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    /* ─── 3. Filtros ─── */
    const filters = document.querySelectorAll(".filter");
    const projects = document.querySelectorAll(".project-card");
    filters.forEach((btn) => {
        btn.addEventListener("click", () => {
            const category = btn.dataset.filter;
            filters.forEach((b) => {
                const isActive = b === btn;
                b.classList.toggle("is-active", isActive);
                b.setAttribute("aria-pressed", String(isActive));
            });
            projects.forEach((card) => {
                const cats = (card.dataset.category || "").split(/\s+/);
                card.hidden = !(category === "all" || cats.includes(category));
            });
        });
    });

    /* ─── 4. Skill → proyecto ─── */
    const relatedMap = {
        "HTML": ["querido-diario", "cinepedia"],
        "CSS": ["querido-diario", "cinepedia", "apps-bd"],
        "JavaScript": ["querido-diario", "cinepedia"],
        "Python": ["politicore", "apps-bd"],
        "Flask": ["politicore"],
        "Jinja2": ["politicore"],
        "SQL": ["politicore", "apps-bd"],
        "Redes LAN": ["laboratorio"],
        "Soporte técnico": ["laboratorio"]
    };
    const skillCards = document.querySelectorAll(".skill-card");
    function handleRelatedClick(e) {
        e.preventDefault();
        const slug = e.currentTarget.dataset.relatedLink;
        const projectCard = document.querySelector(`.project-card[data-project-id="${slug}"]`);
        if (!projectCard) return;
        document.querySelector('.filter[data-filter="all"]')?.click();
        const skill = e.currentTarget.closest(".skill-card");
        if (skill) skill.open = false;
        setTimeout(() => {
            const y = projectCard.getBoundingClientRect().top + window.scrollY - 120;
            window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" });
            projectCard.classList.add("is-highlighted");
            setTimeout(() => projectCard.classList.remove("is-highlighted"), 2200);
        }, 120);
    }
    skillCards.forEach((card) => {
        card.addEventListener("toggle", () => {
            if (card.open) {
                skillCards.forEach((other) => { if (other !== card) other.open = false; });
                const name = card.querySelector(".skill-name")?.textContent.trim() || "";
                const related = relatedMap[name] || [];
                let relatedEl = card.querySelector(".skill-related");
                if (!relatedEl && related.length) {
                    relatedEl = document.createElement("div");
                    relatedEl.className = "skill-related";
                    const label = document.createElement("span");
                    label.className = "skill-related-label";
                    label.textContent = "aparece en";
                    relatedEl.appendChild(label);
                    related.forEach((slug) => {
                        const proj = document.querySelector(`.project-card[data-project-id="${slug}"]`);
                        if (!proj) return;
                        const a = document.createElement("a");
                        a.href = "#";
                        a.textContent = proj.querySelector("h3").textContent.trim();
                        a.dataset.relatedLink = slug;
                        a.addEventListener("click", handleRelatedClick);
                        relatedEl.appendChild(a);
                    });
                    card.querySelector(".skill-body").appendChild(relatedEl);
                }
            }
        });
    });

    /* ─── 5. Frames y expandibles ─── */
    document.querySelectorAll(".frame").forEach((frame) => {
        frame.addEventListener("click", () => {
            frame.setAttribute("aria-pressed", String(frame.getAttribute("aria-pressed") !== "true"));
        });
    });
    document.querySelectorAll("[data-expandable]").forEach((el) => {
        el.addEventListener("click", () => {
            // Si el elemento acaba de ser arrastrado, no expandir
            if (el.dataset.wasDragged === "true") return;
            el.setAttribute("aria-expanded", String(el.getAttribute("aria-expanded") !== "true"));
        });
    });

    /* ─── 5.b STICKY NOTE ARRASTRABLE ─── */
    (function initStickyDrag() {
        const sticky = document.querySelector(".sticky-note");
        if (!sticky) return;

        const STORAGE_KEY = "sticky-note-pos";
        let currentX = 0;
        let currentY = 0;
        let drag = null;

        // Restaurar posición guardada
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const pos = JSON.parse(saved);
                if (typeof pos.x === "number" && typeof pos.y === "number") {
                    currentX = pos.x;
                    currentY = pos.y;
                    sticky.style.setProperty("--sticky-x", currentX + "px");
                    sticky.style.setProperty("--sticky-y", currentY + "px");
                }
            }
        } catch (_) { }

        sticky.addEventListener("pointerdown", (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            delete sticky.dataset.wasDragged;

            drag = {
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                baseX: currentX,
                baseY: currentY,
                moved: false
            };

            try { sticky.setPointerCapture(e.pointerId); } catch (_) { }
        });

        sticky.addEventListener("pointermove", (e) => {
            if (!drag || e.pointerId !== drag.pointerId) return;

            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;

            if (!drag.moved && Math.hypot(dx, dy) > 6) {
                drag.moved = true;
                sticky.classList.add("is-dragging");
            }

            if (!drag.moved) return;
            e.preventDefault();

            currentX = drag.baseX + dx;
            currentY = drag.baseY + dy;
            sticky.style.setProperty("--sticky-x", currentX + "px");
            sticky.style.setProperty("--sticky-y", currentY + "px");
        });

        const endDrag = (e) => {
            if (!drag || e.pointerId !== drag.pointerId) return;
            try { sticky.releasePointerCapture(e.pointerId); } catch (_) { }

            if (drag.moved) {
                sticky.dataset.wasDragged = "true";
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        x: currentX,
                        y: currentY
                    }));
                } catch (_) { }
            }

            sticky.classList.remove("is-dragging");
            drag = null;
        };

        sticky.addEventListener("pointerup", endDrag);
        sticky.addEventListener("pointercancel", endDrag);

        // Función global de reset — la usa el botón ⟲ de la bandeja
        window.__resetStickyNote = () => {
            currentX = 0;
            currentY = 0;
            sticky.style.setProperty("--sticky-x", "0px");
            sticky.style.setProperty("--sticky-y", "0px");
            try { localStorage.removeItem(STORAGE_KEY); } catch (_) { }
        };
    })();

    /* ─── 6. Detalle de proyecto ─── */
    const detail = document.getElementById("detail");
    const detailContent = document.getElementById("detail-content");
    let previousFocus = null;
    let detailOpen = false;

    function openDetail(card) {
        previousFocus = document.activeElement;
        const media = card.querySelector(".project-media");
        const title = card.querySelector("h3")?.textContent.trim() || "";
        const type = card.querySelector(".project-type")?.textContent.trim() || "";
        const desc = card.querySelector(".project-desc")?.textContent.trim() || "";
        const tech = Array.from(card.querySelectorAll(".project-tech li")).map(li => li.textContent.trim());
        const links = Array.from(card.querySelectorAll(".project-links a")).map(a => ({
            href: a.getAttribute("href"), text: a.textContent.trim(),
            external: a.getAttribute("target") === "_blank"
        }));

        detailContent.innerHTML = "";
        if (media) {
            const wrap = document.createElement("div");
            wrap.className = "detail-media";
            const clone = media.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            clone.tabIndex = -1;
            wrap.appendChild(clone);
            detailContent.appendChild(wrap);
        }
        const info = document.createElement("div");
        info.className = "detail-info";
        info.innerHTML = `
            <p class="detail-type">${type}</p>
            <h2 class="detail-title" id="detail-title">${title}</h2>
            <p class="detail-desc">${desc}</p>
        `;
        if (tech.length) {
            const ul = document.createElement("ul");
            ul.className = "detail-tech";
            tech.forEach(t => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
            info.appendChild(ul);
        }
        if (links.length) {
            const wrap = document.createElement("div");
            wrap.className = "detail-links";
            links.forEach(l => {
                const a = document.createElement("a");
                a.href = l.href || "#";
                a.textContent = l.text;
                if (l.external) { a.target = "_blank"; a.rel = "noopener"; }
                a.addEventListener("click", () => { if (!l.external) setTimeout(closeDetail, 150); });
                wrap.appendChild(a);
            });
            info.appendChild(wrap);
        }
        detailContent.appendChild(info);
        detail.classList.add("is-open");
        detail.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        detailOpen = true;
        setTimeout(() => detail.querySelector(".detail-close")?.focus(), 80);
    }
    function closeDetail() {
        if (!detailOpen) return;
        detail.classList.remove("is-open");
        detail.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        detailOpen = false;
        previousFocus?.focus?.();
        previousFocus = null;
    }
    document.querySelectorAll(".project-media").forEach(m => m.addEventListener("click", () => openDetail(m.closest(".project-card"))));
    document.querySelectorAll("[data-close-detail]").forEach(el => el.addEventListener("click", closeDetail));
    document.addEventListener("keydown", (e) => {
        if (!detailOpen) return;
        if (e.key === "Escape") { closeDetail(); return; }
        if (e.key === "Tab") {
            const f = detail.querySelectorAll('a[href], button:not([disabled])');
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    /* ─── 7. Reveal ─── */
    const revealItems = document.querySelectorAll("[data-reveal]");
    if ("IntersectionObserver" in window && !reducedMotion) {
        const obs = new IntersectionObserver((entries, o) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); o.unobserve(e.target); } });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        revealItems.forEach(el => obs.observe(el));
    } else {
        revealItems.forEach(el => el.classList.add("is-visible"));
    }

    /* ─── 8. Tilt ─── */
    if (hoverCapable && !reducedMotion) {
        document.querySelectorAll(".project-card").forEach(card => {
            const media = card.querySelector(".project-media");
            if (!media) return;
            let raf = null;
            card.addEventListener("mousemove", e => {
                if (raf) return;
                raf = requestAnimationFrame(() => {
                    const r = card.getBoundingClientRect();
                    const x = (e.clientX - r.left) / r.width - 0.5;
                    const y = (e.clientY - r.top) / r.height - 0.5;
                    media.style.setProperty("--rx", `${(y * -4).toFixed(2)}deg`);
                    media.style.setProperty("--ry", `${(x * 4).toFixed(2)}deg`);
                    raf = null;
                });
            });
            card.addEventListener("mouseleave", () => {
                media.style.setProperty("--rx", "0deg");
                media.style.setProperty("--ry", "0deg");
            });
        });
    }

    /* ─── 9. Video ─── */
    const video = document.querySelector(".video-el");
    const videoPlaceholder = document.querySelector(".video-placeholder");
    if (video && videoPlaceholder) {
        video.addEventListener("loadeddata", () => { video.classList.add("is-loaded"); videoPlaceholder.hidden = true; });
        video.addEventListener("error", () => { video.classList.remove("is-loaded"); videoPlaceholder.hidden = false; }, true);
        if (video.readyState >= 2) { video.classList.add("is-loaded"); videoPlaceholder.hidden = true; }
    }

    /* ─── 10. Año ─── */
    document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

    /* ─── 11. Cerrar menú en desktop ─── */
    window.matchMedia("(min-width: 801px)").addEventListener("change", (e) => {
        if (e.matches && nav) { nav.classList.remove("is-open"); menuToggle?.setAttribute("aria-expanded", "false"); }
    });

    /* ═══════════════════════════════════════════
       12. ESTRELLAS
       ═══════════════════════════════════════════ */
    const starAPI = (function initStars() {
        const field = document.querySelector(".stars-field");
        if (!field) return null;
        const svg = field.querySelector(".star-lines");
        const constellationSvg = field.querySelector(".constellation-lines");
        const stars = Array.from(field.querySelectorAll(".star"));
        const resetBtn = document.querySelector(".stars-reset");
        const hint = document.querySelector(".stars-hint");
        const hintClose = document.querySelector(".stars-hint-close");
        if (!stars.length) return null;

        const positions = new Map();
        const originals = new Map();
        const returnTimers = new Map();
        const DIST = 140;
        const HINT_KEY = "stars-hint-v5";
        let hintTimer = null;

        const constellation = { selected: null, edges: new Set(), uids: new Set() };
        const checkBtn = document.querySelector(".constellation-check");
        const clearBtn = document.querySelector(".constellation-clear");

        stars.forEach((st, i) => { if (!st.dataset.uid) st.dataset.uid = "star-" + i; });

        const dismiss = () => { if (!hint || hint.hidden) return; hint.hidden = true; localStorage.setItem(HINT_KEY, "1"); clearTimeout(hintTimer); };
        const size = () => stars[0].offsetWidth || 44;
        const clampPos = (x, y) => {
            const r = field.getBoundingClientRect();
            const w = size();
            return { x: Math.max(0, Math.min(x, r.width - w)), y: Math.max(0, Math.min(y, r.height - w)) };
        };
        const setPos = (s, x, y) => { s.style.left = x + "px"; s.style.top = y + "px"; };

        function updateProximityLines() {
            if (!svg) return;
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            const s = size();
            const centers = stars.map(st => { const p = positions.get(st); return { x: p.x + s / 2, y: p.y + s / 2 }; });
            for (let i = 0; i < stars.length; i++) {
                for (let j = i + 1; j < stars.length; j++) {
                    const dx = centers[i].x - centers[j].x, dy = centers[i].y - centers[j].y;
                    const d = Math.hypot(dx, dy);
                    if (d < DIST) {
                        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line.setAttribute("x1", centers[i].x.toFixed(1)); line.setAttribute("y1", centers[i].y.toFixed(1));
                        line.setAttribute("x2", centers[j].x.toFixed(1)); line.setAttribute("y2", centers[j].y.toFixed(1));
                        line.setAttribute("stroke", "currentColor");
                        line.setAttribute("stroke-width", "1");
                        line.setAttribute("stroke-dasharray", "2 6");
                        line.setAttribute("stroke-linecap", "round");
                        line.setAttribute("opacity", ((1 - d / DIST) * 0.5).toFixed(2));
                        svg.appendChild(line);
                    }
                }
            }
        }

        function updateConstellationLines() {
            if (!constellationSvg) return;
            while (constellationSvg.firstChild) constellationSvg.removeChild(constellationSvg.firstChild);
            const s = size();
            constellation.edges.forEach(edgeKey => {
                const [a, b] = edgeKey.split("|");
                const ea = stars.find(x => x.dataset.uid === a);
                const eb = stars.find(x => x.dataset.uid === b);
                if (!ea || !eb) return;
                const pa = positions.get(ea), pb = positions.get(eb);
                if (!pa || !pb) return;
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", (pa.x + s / 2).toFixed(1)); line.setAttribute("y1", (pa.y + s / 2).toFixed(1));
                line.setAttribute("x2", (pb.x + s / 2).toFixed(1)); line.setAttribute("y2", (pb.y + s / 2).toFixed(1));
                line.setAttribute("stroke", "currentColor");
                line.setAttribute("stroke-width", "2.2");
                line.setAttribute("stroke-linecap", "round");
                line.setAttribute("opacity", "0.8");
                constellationSvg.appendChild(line);
            });
        }

        function refreshConstellationUI() {
            if (checkBtn) checkBtn.hidden = constellation.edges.size < 2;
            if (clearBtn) clearBtn.hidden = constellation.edges.size === 0;
            stars.forEach(st => st.classList.toggle("is-in-constellation", constellation.uids.has(st.dataset.uid)));
        }

        function clearConstellation() {
            constellation.edges.clear();
            constellation.uids.clear();
            if (constellation.selected) {
                constellation.selected.classList.remove("is-constellation-selected");
                constellation.selected = null;
            }
            updateConstellationLines();
            refreshConstellationUI();
        }

        function selectStar(star) {
            if (constellation.selected === star) {
                star.classList.remove("is-constellation-selected");
                constellation.selected = null;
                return;
            }
            if (constellation.selected) {
                const a = constellation.selected, b = star;
                const uidA = a.dataset.uid, uidB = b.dataset.uid;
                if (uidA !== uidB) {
                    const key = [uidA, uidB].sort().join("|");
                    if (!constellation.edges.has(key)) {
                        constellation.edges.add(key);
                        constellation.uids.add(uidA);
                        constellation.uids.add(uidB);
                    }
                }
                a.classList.remove("is-constellation-selected");
                constellation.selected = null;
                updateConstellationLines();
                refreshConstellationUI();
            } else {
                constellation.selected = star;
                star.classList.add("is-constellation-selected");
            }
        }

        function isConnected(star) {
            const my = positions.get(star);
            if (!my) return false;
            for (const other of stars) {
                if (other === star) continue;
                const o = positions.get(other);
                if (!o) continue;
                if (Math.hypot(my.x - o.x, my.y - o.y) < DIST) return true;
            }
            return false;
        }

        function scheduleReturn(star) {
            clearTimeout(returnTimers.get(star));
            returnTimers.set(star, setTimeout(() => {
                if (star.classList.contains("is-dragging")) return;
                if (isConnected(star)) return;
                if (constellation.uids.has(star.dataset.uid)) return;
                const orig = originals.get(star);
                if (!orig) return;
                positions.set(star, { ...orig });
                setPos(star, orig.x, orig.y);
                updateProximityLines();
                updateConstellationLines();
            }, 10000));
        }

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
            updateProximityLines();
        }

        function resetPositions() {
            returnTimers.forEach(t => clearTimeout(t));
            returnTimers.clear();
            stars.forEach(st => {
                const p = originals.get(st);
                if (!p) return;
                positions.set(st, { ...p });
                setPos(st, p.x, p.y);
            });
            clearConstellation();
            updateProximityLines();
        }

        stars.forEach(star => {
            let drag = null, rafId = null, pending = null;
            let pointerDown = null;

            const apply = () => {
                if (pending) {
                    setPos(star, pending.x, pending.y);
                    updateProximityLines();
                    updateConstellationLines();
                    pending = null;
                }
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
                try { star.setPointerCapture(e.pointerId); } catch (_) { }
                clearTimeout(returnTimers.get(star));
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
                drag = null;
                pointerDown = null;
                star.classList.remove("is-dragging");
                try { star.releasePointerCapture(e.pointerId); } catch (_) { }
                updateProximityLines();
                updateConstellationLines();
                scheduleReturn(star);

                if (!pd) return;
                const isClick = pd.moved < 8 && (Date.now() - pd.startTime) < 500;

                if (star.dataset.starLetter && star.classList.contains("is-revealed")) {
                    if (isClick) {
                        if (typeof window.__portfolioAddChip === "function") {
                            window.__portfolioAddChip(star.dataset.starLetter, null);
                            window.__portfolioCheckWord?.();
                            star.classList.add("is-collected");
                            star.classList.remove("is-revealed");
                            window.__portfolioShowToast?.(`letra ${star.dataset.starLetter} recogida`);
                        }
                        return;
                    }
                }

                if (star.dataset.starLetter && pd.moved > 30 && !star.classList.contains("is-revealed") && !star.classList.contains("is-collected")) {
                    star.classList.add("is-revealed");
                    const timer = setTimeout(() => {
                        if (!star.classList.contains("is-collected")) star.classList.remove("is-revealed");
                    }, 8000);
                    star._revealTimer = timer;
                    return;
                }

                if (isClick) selectStar(star);
            };
            star.addEventListener("pointerup", end);
            star.addEventListener("pointercancel", end);

            star.addEventListener("keydown", e => {
                const step = e.shiftKey ? 20 : 5;
                const p = positions.get(star);
                let x = p.x, y = p.y, moved = false;
                if (e.key === "ArrowLeft") { x -= step; moved = true; }
                else if (e.key === "ArrowRight") { x += step; moved = true; }
                else if (e.key === "ArrowUp") { y -= step; moved = true; }
                else if (e.key === "ArrowDown") { y += step; moved = true; }
                if (moved) {
                    e.preventDefault();
                    const c = clampPos(x, y);
                    positions.set(star, c);
                    setPos(star, c.x, c.y);
                    updateProximityLines();
                    updateConstellationLines();
                    scheduleReturn(star);
                    dismiss();
                    return;
                }
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectStar(star);
                }
            });
        });

        checkBtn?.addEventListener("click", () => {
            if (constellation.edges.size < 2) return;
            const letter = matchConstellationLetter(stars, positions, size, constellation.uids);
            if (letter) {
                if (typeof window.__portfolioAddChip === "function") {
                    window.__portfolioAddChip(letter, null);
                    window.__portfolioCheckWord?.();
                }
                stars.forEach(st => {
                    if (constellation.uids.has(st.dataset.uid)) {
                        st.classList.add("constellation-success");
                        setTimeout(() => st.classList.remove("constellation-success"), 900);
                    }
                });
                window.__portfolioShowToast?.(`¡letra ${letter} descubierta!`);
                clearConstellation();
            } else {
                window.__portfolioShowToast?.("esa forma no es una letra reconocible");
            }
        });
        clearBtn?.addEventListener("click", () => {
            clearConstellation();
            window.__portfolioShowToast?.("conexiones borradas");
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".star")) {
                if (constellation.selected) {
                    constellation.selected.classList.remove("is-constellation-selected");
                    constellation.selected = null;
                }
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && (constellation.selected || constellation.edges.size)) clearConstellation();
        });

        resetBtn?.addEventListener("click", resetPositions);

        if (hint) {
            if (!localStorage.getItem(HINT_KEY)) { hint.hidden = false; hintTimer = setTimeout(dismiss, 12000); }
            else hint.hidden = true;
            hintClose?.addEventListener("click", dismiss);
        }

        const boot = () => requestAnimationFrame(initPositions);
        if (document.readyState === "complete") boot();
        else window.addEventListener("load", boot);

        let rt = null;
        window.addEventListener("resize", () => {
            clearTimeout(rt);
            rt = setTimeout(() => {
                stars.forEach(st => {
                    const p = positions.get(st);
                    if (!p) return;
                    const c = clampPos(p.x, p.y);
                    positions.set(st, c);
                    setPos(st, c.x, c.y);
                });
                updateProximityLines();
                updateConstellationLines();
            }, 150);
        });

        return { positions, size, stars, clearConstellation };
    })();

    /* ═══════════════════════════════════════════
       13. VOCABULARIO, BANDEJA Y EFECTOS
       ═══════════════════════════════════════════ */
    const VOCABULARY = {
        NUBE: { category: "naturaleza", label: "Nube", hint: "Algo que flota y a veces tapa el sol.", effect: "nube" },
        LLUVIA: { category: "naturaleza", label: "Lluvia", hint: "Cae del cielo cuando las nubes se cansan.", effect: "lluvia" },
        TORMENTA: { category: "naturaleza", label: "Tormenta", hint: "Lluvia con enojo y viento.", effect: "lluvia" },
        TRUENO: { category: "naturaleza", label: "Trueno", hint: "El sonido que acompaña al rayo.", effect: "tornado" },
        TORNADO: { category: "naturaleza", label: "Tornado", hint: "Gira y se lleva todo a su paso.", effect: "tornado" },
        VIENTO: { category: "naturaleza", label: "Viento", hint: "No se ve pero mueve las hojas.", effect: "viento" },
        BOSQUE: { category: "naturaleza", label: "Bosque", hint: "Muchos árboles juntos, verde por todos lados.", effect: "nube" },
        FLOR: { category: "naturaleza", label: "Flor", hint: "Nace, crece y decora.", effect: "nube" },
        OCEANO: { category: "naturaleza", label: "Océano", hint: "Inmenso, azul y salado.", effect: "lluvia" },
        ARCOIRIS: { category: "naturaleza", label: "Arcoíris", hint: "Aparece cuando la lluvia se va.", effect: "lluvia" },
        MAR: { category: "naturaleza", label: "Mar", hint: "El azul que rodea todo.", effect: "lluvia" },
        CIELO: { category: "naturaleza", label: "Cielo", hint: "Lo que ves cuando mirás arriba.", effect: "nube" },
        PIEDRA: { category: "naturaleza", label: "Piedra", hint: "Pesa y cae.", effect: "gravedad" },

        LUNA: { category: "universo", label: "Luna", hint: "Nos alumbra de noche.", effect: "estrellas" },
        SOL: { category: "universo", label: "Sol", hint: "La estrella más cercana.", effect: "estrellas" },
        ESTRELLA: { category: "universo", label: "Estrella", hint: "Un punto brillante en la noche.", effect: "estrellas" },
        GALAXIA: { category: "universo", label: "Galaxia", hint: "Una ciudad de estrellas.", effect: "estrellas" },
        COMETA: { category: "universo", label: "Cometa", hint: "Una estrella con cola que viaja.", effect: "estrellas" },
        PLANETA: { category: "universo", label: "Planeta", hint: "Gira alrededor de una estrella.", effect: "estrellas" },
        ECLIPSE: { category: "universo", label: "Eclipse", hint: "Un astro tapa a otro.", effect: "estrellas" },
        NEBULOSA: { category: "universo", label: "Nebulosa", hint: "Una nube de gas y polvo en el espacio.", effect: "estrellas" },
        CONSTELACION: { category: "universo", label: "Constelación", hint: "Estrellas conectadas formando figuras.", effect: "estrellas" },
        INFINITO: { category: "universo", label: "Infinito", hint: "No tiene fin.", effect: "estrellas" },
        HIPERESPACIO: { category: "universo", label: "Hiperespacio", hint: "Viajar más rápido que la luz.", effect: "estrellas" },
        AGUJERO: { category: "universo", label: "Agujero negro", hint: "Absorbe todo, incluso la luz.", effect: "estrellas" },

        CODIGO: { category: "tecnologia", label: "Código", hint: "Lo que escribís para hablarle a la máquina.", effect: "codigo" },
        PIXEL: { category: "tecnologia", label: "Píxel", hint: "El punto más pequeño de una imagen.", effect: "codigo" },
        ROBOT: { category: "tecnologia", label: "Robot", hint: "Una máquina que puede hacer tareas.", effect: "codigo" },
        DATOS: { category: "tecnologia", label: "Datos", hint: "Información que se guarda y procesa.", effect: "codigo" },
        WEB: { category: "tecnologia", label: "Web", hint: "La red de páginas que navegás.", effect: "codigo" },
        PYTHON: { category: "tecnologia", label: "Python", hint: "Un lenguaje con nombre de serpiente.", effect: "codigo" },
        JAVASCRIPT: { category: "tecnologia", label: "JavaScript", hint: "El lenguaje que da vida a las páginas.", effect: "codigo" },
        FLASK: { category: "tecnologia", label: "Flask", hint: "Un framework pequeño para Python.", effect: "codigo" },
        HTML: { category: "tecnologia", label: "HTML", hint: "El esqueleto de toda página.", effect: "codigo" },
        CSS: { category: "tecnologia", label: "CSS", hint: "Lo que viste a HTML de colores.", effect: "codigo" },
        INTERNET: { category: "tecnologia", label: "Internet", hint: "Conecta computadoras de todo el mundo.", effect: "codigo" },
        ALGORITMO: { category: "tecnologia", label: "Algoritmo", hint: "Una receta paso a paso para resolver algo.", effect: "codigo" },
        BINARIO: { category: "tecnologia", label: "Binario", hint: "Solo ceros y unos.", effect: "codigo" },

        GATO: { category: "animales", label: "Gato", hint: "Duerme mucho y hace miau.", effect: "gato" },
        GATOS: { category: "animales", label: "Gatos", hint: "Más de uno del anterior.", effect: "gato" },
        ZORRO: { category: "animales", label: "Zorro", hint: "Astuto, naranja y con cola larga.", effect: "gato" },
        CUERVO: { category: "animales", label: "Cuervo", hint: "Negro, inteligente, observa todo.", effect: "gato" },
        MAPACHE: { category: "animales", label: "Mapache", hint: "Travieso y con antifaz natural.", effect: "gato" },
        BUHO: { category: "animales", label: "Búho", hint: "Ave nocturna que ve en la oscuridad.", effect: "gato" },
        MARIPOSA: { category: "animales", label: "Mariposa", hint: "Nació oruga y tiene alas de colores.", effect: "gato" },
        DRAGON: { category: "animales", label: "Dragón", hint: "Animal mitológico que escupe fuego.", effect: "gato" },

        ARTE: { category: "magia", label: "Arte", hint: "Expresión que no se mide en fórmulas.", effect: "caos" },
        MAGIA: { category: "magia", label: "Magia", hint: "Lo que parece imposible pero sucede.", effect: "caos" },
        SECRETO: { category: "magia", label: "Secreto", hint: "Lo que no todos saben.", effect: "caos" },
        SUEÑO: { category: "magia", label: "Sueño", hint: "Pasa cuando dormís.", effect: "caos" },
        CAOS: { category: "magia", label: "Caos", hint: "Todo desordenado a la vez.", effect: "caos" },
        IMAGINACION: { category: "magia", label: "Imaginación", hint: "Crear cosas que no existen.", effect: "caos" },
        DESCUBRIR: { category: "magia", label: "Descubrir", hint: "Encontrar algo que estaba escondido.", effect: "caos" },
        LABERINTO: { category: "magia", label: "Laberinto", hint: "Un camino con muchas vueltas.", effect: "caos" },
        MISTERIO: { category: "magia", label: "Misterio", hint: "Algo que todavía no tiene explicación.", effect: "caos" },
        ABRACADABRA: { category: "magia", label: "Abracadabra", hint: "Palabra de mago.", effect: "caos" },
        SONRISA: { category: "magia", label: "Sonrisa", hint: "Gestos que se contagian.", effect: "caos" },
        CATEDRAL: { category: "magia", label: "Catedral", hint: "Grande, antigua y con vidrieras.", effect: "caos" },

        SUPERCALIFRAGILISTICOESPIALIDOSO: {
            category: "especial", label: "¡Supersorpresa!",
            hint: "Una palabra larguísima de una canción.",
            effect: "super", reward: "Activación mágica máxima"
        },
        GRAVEDAD: { category: "especial", label: "Gravedad", hint: "Lo que hace caer las cosas al piso.", effect: "gravedad" },
        PASTEL: { category: "especial", label: "Pastel", hint: "Un color suave, rosado y dulce.", effect: "pastel" },
        ESPEJO: { category: "especial", label: "Espejo", hint: "Refleja lo que tenés enfrente.", effect: "caos" },
        ANUBIS: { category: "especial", label: "Anubis", hint: "El nombre de alguien muy especial.", effect: "caos" }
    };

    const normalize = (s) =>
        s.toUpperCase()
            .replace(/Á/g, "A").replace(/É/g, "E").replace(/Í/g, "I")
            .replace(/Ó/g, "O").replace(/Ú/g, "U").replace(/Ü/g, "U")
            .replace(/Ñ/g, "N")
            .replace(/[^A-Z]/g, "");

    const SECRETS_KEY = "portfolio-secrets-v1";

    function loadProgress() {
        try {
            const raw = localStorage.getItem(SECRETS_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === "object") ? parsed : {};
        } catch (_) { return {}; }
    }
    function saveProgress(p) {
        try { localStorage.setItem(SECRETS_KEY, JSON.stringify(p)); } catch (_) { }
    }

    let progress = loadProgress();

    function markDiscovered(word) {
        const key = normalize(word);
        if (!VOCABULARY[key]) return;
        if (!progress[key] || progress[key].status !== "discovered") {
            progress[key] = { status: "discovered", at: Date.now(), letters: key.length };
            saveProgress(progress);
            updateSecretsUI();
        }
    }

    const tray = document.getElementById("word-tray");
    const trayInner = document.getElementById("word-tray-inner");
    const trayAdd = document.getElementById("word-tray-add");
    const trayReset = document.getElementById("word-tray-reset");
    const trayClear = document.getElementById("word-tray-clear");
    const toast = document.getElementById("word-toast");

    const LETTER_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const LETTER_WEIGHTS = {
        A: 8, B: 1, C: 2, D: 3, E: 8, F: 1, G: 1, H: 1, I: 6, J: 1,
        K: 1, L: 4, M: 2, N: 6, O: 7, P: 2, Q: 1, R: 5, S: 5, T: 5,
        U: 3, V: 1, W: 1, X: 1, Y: 1, Z: 1
    };
    const TOTAL_WEIGHT = Object.values(LETTER_WEIGHTS).reduce((a, b) => a + b, 0);
    function pickRandomLetter() {
        let r = Math.random() * TOTAL_WEIGHT;
        for (const l of LETTER_POOL) { r -= LETTER_WEIGHTS[l]; if (r <= 0) return l; }
        return "A";
    }

    let activeEffects = [];
    let toastTimer = null;
    let spawnCount = 0;

    function restoreOrigin(originEl) {
        if (!originEl) return;
        originEl.classList.remove("is-taken");
        if (originEl.classList.contains("float-letter")) {
            originEl.removeAttribute("aria-disabled");
            originEl.tabIndex = 0;
        }
    }

    function addChip(letter, originEl) {
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
        restoreOrigin(chip._originEl);
        chip.remove();
        if (trayInner.children.length === 0) tray.classList.remove("is-visible");
        checkWord();
    }

    function clearAll() {
        Array.from(trayInner.children).forEach(chip => {
            restoreOrigin(chip._originEl);
            chip.remove();
        });
        tray.classList.remove("is-visible");
        applyEffects([], true);
    }

    function checkWord() {
        const word = normalize(Array.from(trayInner.children).map(c => c.dataset.letter).join(""));
        if (!word) return;
        const entry = VOCABULARY[word];
        if (!entry) return;

        addEffect(entry.effect, word, entry.label);
        markDiscovered(word);
        showToast(`encontraste ${entry.label.toUpperCase()}`);
        setTimeout(() => {
            Array.from(trayInner.children).forEach(chip => {
                restoreOrigin(chip._originEl);
                chip.remove();
            });
            if (trayInner.children.length === 0) tray.classList.remove("is-visible");
        }, 300);
    }

    function addEffect(effectKey) {
        if (effectKey === "super") { activeEffects = ["super"]; }
        else {
            if (activeEffects.includes(effectKey)) return;
            activeEffects.push(effectKey);
            if (activeEffects.length > 3) activeEffects.shift();
        }
        applyEffects(activeEffects);
    }

    function applyEffects(list, clear = false) {
        if (clear) list = [];
        activeEffects = list;
        if (!list.length) delete document.body.dataset.effect;
        else document.body.dataset.effect = list.join(" ");
    }

    function showToast(text) {
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    window.__portfolioAddChip = addChip;
    window.__portfolioCheckWord = checkWord;
    window.__portfolioShowToast = showToast;

    /* ═══════════════════════════════════════════
       13.B — ARCHIVO DE SECRETOS
       ═══════════════════════════════════════════ */
    const secretsModal = document.getElementById("secrets-modal");
    const secretsGrid = document.getElementById("secrets-grid");
    const secretsBtn = document.getElementById("secrets-btn");
    const secretsCount = document.getElementById("secrets-count");
    const secretsFoundEl = document.getElementById("secrets-found");
    const secretsTotalEl = document.getElementById("secrets-total");
    const secretsPendingEl = document.getElementById("secrets-pending");
    const secretsProgressFill = document.getElementById("secrets-progress-fill");
    const secretsReset = document.getElementById("secrets-reset");
    const secretsFilters = document.querySelectorAll(".secrets-filter");

    let activeFilter = "all";

    function getStatus(wordKey) {
        const p = progress[wordKey];
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
        if (status === "discovered") {
            nameEl.textContent = wordKey;
        } else {
            nameEl.textContent = wordKey.split("").map((ch, i) => i === 0 ? ch : "·").join(" ");
        }

        const statusEl = document.createElement("span");
        statusEl.className = "secret-card-status";
        statusEl.textContent = status === "discovered" ? "✓ descubierta" : "pendiente";

        const head = document.createElement("div");
        head.className = "secret-card-head";
        head.appendChild(nameEl);
        head.appendChild(statusEl);

        const categoryEl = document.createElement("span");
        categoryEl.className = "secret-card-category";
        categoryEl.textContent = entry.category;

        const hintEl = document.createElement("p");
        hintEl.className = "secret-card-hint";
        if (status === "discovered") {
            hintEl.textContent = entry.reward ? `Desbloquea: ${entry.reward}` : `Desbloquea el efecto «${entry.label}».`;
        } else {
            hintEl.textContent = entry.hint;
        }

        card.appendChild(head);
        card.appendChild(categoryEl);
        card.appendChild(hintEl);
        return card;
    }

    function renderSecretsGrid() {
        if (!secretsGrid) return;
        secretsGrid.innerHTML = "";
        Object.keys(VOCABULARY).forEach(wordKey => {
            const entry = VOCABULARY[wordKey];
            if (activeFilter !== "all" && entry.category !== activeFilter) return;
            secretsGrid.appendChild(renderSecretCard(wordKey));
        });
    }

    function updateSecretsUI() {
        const all = Object.keys(VOCABULARY);
        const total = all.length;
        const found = all.filter(k => getStatus(k) === "discovered").length;
        const pending = total - found;

        if (secretsCount) secretsCount.textContent = `${found}/${total}`;
        if (secretsFoundEl) secretsFoundEl.textContent = found;
        if (secretsTotalEl) secretsTotalEl.textContent = total;
        if (secretsPendingEl) secretsPendingEl.textContent = pending;
        if (secretsProgressFill) {
            const pct = total === 0 ? 0 : Math.round((found / total) * 100);
            secretsProgressFill.style.width = pct + "%";
        }
        renderSecretsGrid();
    }

    function openSecrets() {
        if (!secretsModal) return;
        updateSecretsUI();
        secretsModal.classList.add("is-open");
        secretsModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        setTimeout(() => secretsModal.querySelector(".secrets-close")?.focus(), 80);
    }

    function closeSecrets() {
        if (!secretsModal) return;
        secretsModal.classList.remove("is-open");
        secretsModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    secretsBtn?.addEventListener("click", openSecrets);
    document.querySelectorAll("[data-close-secrets]").forEach(el => el.addEventListener("click", closeSecrets));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && secretsModal?.classList.contains("is-open")) closeSecrets();
    });
    secretsFilters.forEach(btn => {
        btn.addEventListener("click", () => {
            activeFilter = btn.dataset.cat;
            secretsFilters.forEach(b => b.classList.toggle("is-active", b === btn));
            renderSecretsGrid();
        });
    });
    secretsReset?.addEventListener("click", () => {
        if (!confirm("¿Reiniciar todo el progreso de secretos?")) return;
        progress = {};
        saveProgress(progress);
        updateSecretsUI();
        showToast("Progreso reiniciado");
    });

    updateSecretsUI();

    /* ═══════════════════════════════════════════
       14.A — LETRAS EN EL TEXTO
       ═══════════════════════════════════════════ */
    const floatLetters = document.querySelectorAll(".float-letter:not(.float-letter--deco)");
    floatLetters.forEach((el) => {
        const collect = () => {
            if (el.classList.contains("is-taken")) return;
            const letter = el.dataset.letter;
            const rect = el.getBoundingClientRect();
            const fly = document.createElement("div");
            fly.className = "float-letter-fly";
            fly.textContent = letter;
            fly.style.left = rect.left + "px";
            fly.style.top = rect.top + "px";
            fly.style.fontSize = getComputedStyle(el).fontSize;
            fly.style.color = getComputedStyle(el).color;
            document.body.appendChild(fly);
            const trayRect = trayInner.getBoundingClientRect();
            requestAnimationFrame(() => {
                fly.style.left = (trayRect.left + 20) + "px";
                fly.style.top = (trayRect.top + 12) + "px";
                fly.style.transform = "scale(.6)";
                fly.style.opacity = "0";
            });
            setTimeout(() => fly.remove(), 700);

            el.classList.add("is-taken");
            el.setAttribute("aria-disabled", "true");
            el.tabIndex = -1;

            addChip(letter, el);
            checkWord();
        };

        el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); collect(); });
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); collect(); }
        });
    });

    /* ═══════════════════════════════════════════
       14.C — LETRA I DETRÁS DEL RETRATO
       ═══════════════════════════════════════════ */
    const letterBack = document.querySelector(".letter--back");
    if (letterBack) {
        const collect = () => {
            if (letterBack.classList.contains("is-taken")) return;
            letterBack.classList.add("is-taken");
            addChip(letterBack.dataset.letter, letterBack);
            checkWord();
        };
        letterBack.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); collect(); });
        letterBack.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); collect(); }
        });
    }

    /* ═══════════════════════════════════════════
       14.C bis — TARJETA ARRASTRABLE (PolitiCore)
       ═══════════════════════════════════════════ */
    document.querySelectorAll(".reveal-object-wrap").forEach((wrap) => {
        const obj = wrap.querySelector("[data-reveal-drag]");
        const letter = wrap.querySelector(".letter");
        if (!obj || !letter) return;

        letter.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation();
            if (letter.classList.contains("is-taken")) return;
            letter.classList.add("is-taken");
            addChip(letter.dataset.letter, letter);
            checkWord();
        });

        let dx = 0, dy = 0, active = false, moved = false;
        let startX = 0, startY = 0, baseDx = 0, baseDy = 0;
        let returnTimer = null;

        wrap.addEventListener("click", (e) => {
            if (wrap.dataset.wasDragged === "true") { e.stopPropagation(); e.preventDefault(); }
        }, true);

        obj.addEventListener("pointerdown", (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            active = true; moved = false;
            startX = e.clientX; startY = e.clientY;
            baseDx = dx; baseDy = dy;
            obj.classList.add("is-dragging");
            obj.setPointerCapture?.(e.pointerId);
            clearTimeout(returnTimer);
        });
        obj.addEventListener("pointermove", (e) => {
            if (!active) return;
            dx = baseDx + (e.clientX - startX);
            dy = baseDy + (e.clientY - startY);
            if (Math.hypot(dx, dy) > 6) {
                moved = true;
                e.preventDefault();
                obj.style.setProperty("--rdx", dx + "px");
                obj.style.setProperty("--rdy", dy + "px");
                wrap.classList.toggle("is-revealed", Math.hypot(dx, dy) > 20);
            }
        });
        const end = (e) => {
            if (!active) return;
            active = false;
            obj.classList.remove("is-dragging");
            obj.releasePointerCapture?.(e.pointerId);
            if (moved) {
                wrap.dataset.wasDragged = "true";
                setTimeout(() => { wrap.dataset.wasDragged = "false"; }, 60);
                clearTimeout(returnTimer);
                returnTimer = setTimeout(() => {
                    if (active) return;
                    dx = 0; dy = 0;
                    obj.style.setProperty("--rdx", "0px");
                    obj.style.setProperty("--rdy", "0px");
                    wrap.classList.remove("is-revealed");
                }, 10000);
            }
        };
        obj.addEventListener("pointerup", end);
        obj.addEventListener("pointercancel", end);
    });

    /* ═══════════════════════════════════════════
       14.D — PISTA POR COLOR
       ═══════════════════════════════════════════ */
    const colorTarget = document.querySelector(".color-target");
    const colorReveal = document.querySelector(".color-reveal");
    if (colorTarget && colorReveal) {
        colorTarget.addEventListener("click", () => {
            if (colorReveal.dataset.collected === "true") return;
            colorReveal.classList.add("is-revealed");
            const letter = colorReveal.querySelector(".letter");
            if (!letter) return;
            letter.style.opacity = "1";
            setTimeout(() => {
                const rect = letter.getBoundingClientRect();
                const fly = document.createElement("div");
                fly.className = "float-letter-fly";
                fly.textContent = letter.dataset.letter;
                fly.style.left = rect.left + "px";
                fly.style.top = rect.top + "px";
                fly.style.fontSize = "1.4rem";
                fly.style.color = getComputedStyle(letter).color;
                document.body.appendChild(fly);
                const trayRect = trayInner.getBoundingClientRect();
                requestAnimationFrame(() => {
                    fly.style.left = (trayRect.left + 20) + "px";
                    fly.style.top = (trayRect.top + 12) + "px";
                    fly.style.transform = "scale(.6)";
                    fly.style.opacity = "0";
                });
                setTimeout(() => fly.remove(), 700);

                addChip(letter.dataset.letter, letter);
                checkWord();
                letter.classList.add("is-taken");
                colorReveal.dataset.collected = "true";
            }, 350);
        });
    }

    /* ── Botones de la bandeja ── */
    trayClear?.addEventListener("click", clearAll);
    trayAdd?.addEventListener("click", () => {
        if (spawnCount >= 40) { showToast("Muchas letras ya · limpiá para seguir"); return; }
        const letter = pickRandomLetter();
        addChip(letter, null);
        spawnCount++;
        checkWord();
    });
    trayReset?.addEventListener("click", () => {
        clearAll();
        activeEffects = [];
        applyEffects([]);
        floatLetters.forEach(el => {
            el.classList.remove("is-taken");
            el.removeAttribute("aria-disabled");
            el.tabIndex = 0;
        });
        if (letterBack) letterBack.classList.remove("is-taken");
        document.querySelectorAll(".reveal-object-wrap").forEach(w => {
            w.classList.remove("is-revealed");
            const o = w.querySelector("[data-reveal-drag]");
            if (o) {
                o.style.setProperty("--rdx", "0px");
                o.style.setProperty("--rdy", "0px");
            }
        });
        if (colorReveal) {
            delete colorReveal.dataset.collected;
            colorReveal.classList.remove("is-revealed");
            const l = colorReveal.querySelector(".letter");
            if (l) l.classList.remove("is-taken");
        }
        document.querySelectorAll(".star[data-star-letter]").forEach(s => {
            s.classList.remove("is-revealed", "is-collected");
            clearTimeout(s._revealTimer);
        });
        if (starAPI) starAPI.clearConstellation();

        // ✅ Reset del sticky note
        window.__resetStickyNote?.();

        spawnCount = 0;
        showToast("Todo en su lugar ✦");
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && activeEffects.length) {
            applyEffects([]);
            showToast("Efecto cerrado");
        }
    });

    /* ═══════════════════════════════════════════
       14.E — RECONOCIMIENTO DE LETRAS POR CONSTELACIÓN
       ═══════════════════════════════════════════ */
    const LETTER_TEMPLATES = {
        V: [{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0 }],
        L: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
        T: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0.5, y: 1 }],
        A: [{ x: 0, y: 1 }, { x: 0.5, y: 0 }, { x: 1, y: 1 }],
        I: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }],
        N: [{ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 0 }],
        O: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
        X: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
        H: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
        E: [{ x: 0, y: 0 }, { x: 0, y: 0.5 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 1, y: 0.5 }, { x: 1, y: 1 }]
    };

    function matchConstellationLetter(stars, positions, size, uids) {
        const connectedStars = stars.filter(st => uids.has(st.dataset.uid));
        if (connectedStars.length < 2) return null;

        const pts = connectedStars.map(st => {
            const p = positions.get(st);
            return { x: p.x + size() / 2, y: p.y + size() / 2 };
        });

        const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const w = maxX - minX || 1, h = maxY - minY || 1;
        const norm = pts.map(p => ({ x: (p.x - minX) / w, y: (p.y - minY) / h }));

        let bestLetter = null, bestScore = Infinity;
        for (const [letter, template] of Object.entries(LETTER_TEMPLATES)) {
            if (template.length !== norm.length) continue;
            const used = new Set();
            let score = 0;
            for (const tp of template) {
                let minD = Infinity, minI = -1;
                for (let i = 0; i < norm.length; i++) {
                    if (used.has(i)) continue;
                    const d = (norm[i].x - tp.x) ** 2 + (norm[i].y - tp.y) ** 2;
                    if (d < minD) { minD = d; minI = i; }
                }
                if (minI >= 0) used.add(minI);
                score += minD;
            }
            score /= template.length;
            if (score < bestScore) { bestScore = score; bestLetter = letter; }
        }
        if (bestLetter && bestScore < 0.055) return bestLetter;
        return null;
    }
});