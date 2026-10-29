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
        nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
            nav.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
        }));
    }

    /* ─── 3. Filtros ─── */
    const filters = document.querySelectorAll(".filter");
    const projects = document.querySelectorAll(".project-card");
    filters.forEach(btn => {
        btn.addEventListener("click", () => {
            const category = btn.dataset.filter;
            filters.forEach(b => {
                const isActive = b === btn;
                b.classList.toggle("is-active", isActive);
                b.setAttribute("aria-pressed", String(isActive));
            });
            projects.forEach(card => {
                const cats = (card.dataset.category || "").split(/\s+/);
                card.hidden = !(category === "all" || cats.includes(category));
            });
        });
    });

    /* ─── 4. Skill → proyecto ─── */
    const relatedMap = {
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
            const y = Math.max(0, projectCard.getBoundingClientRect().top + window.scrollY - 120);
            window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" });
            projectCard.classList.add("is-highlighted");
            setTimeout(() => projectCard.classList.remove("is-highlighted"), 2200);
        }, 120);
    }
    skillCards.forEach(card => {
        card.addEventListener("toggle", () => {
            if (!card.open) return;
            skillCards.forEach(other => { if (other !== card) other.open = false; });
            const name = card.querySelector(".skill-name")?.textContent.trim() || "";
            const related = relatedMap[name] || [];
            let relatedEl = card.querySelector(".skill-related");
            if (!relatedEl && related.length) {
                const body = card.querySelector(".skill-body");
                if (!body) return;
                relatedEl = document.createElement("div");
                relatedEl.className = "skill-related";
                const label = document.createElement("span");
                label.className = "skill-related-label";
                label.textContent = "aparece en";
                relatedEl.appendChild(label);
                related.forEach(slug => {
                    const proj = document.querySelector(`.project-card[data-project-id="${slug}"]`);
                    if (!proj) return;
                    const a = document.createElement("a");
                    a.href = "#";
                    a.textContent = proj.querySelector("h3").textContent.trim();
                    a.dataset.relatedLink = slug;
                    a.addEventListener("click", handleRelatedClick);
                    relatedEl.appendChild(a);
                });
                body.appendChild(relatedEl);
            }
        });
    });

    /* ─── 5. Frame flip ─── */
    document.querySelectorAll(".frame-flip-trigger").forEach(trigger => {
        trigger.addEventListener("click", () => {
            const frame = trigger.closest(".frame");
            if (!frame) return;
            const next = frame.dataset.flipped !== "true";
            frame.dataset.flipped = String(next);
            trigger.setAttribute("aria-pressed", String(next));
            frame.querySelectorAll(".letter--hidden").forEach(el => {
                if (next) el.removeAttribute("inert");
                else if (!el.classList.contains("is-taken")) el.setAttribute("inert", "");
            });
        });
    });

    /* ─── 5b. Expandibles ─── */
    document.querySelectorAll("[data-expandable]").forEach(el => {
        el.addEventListener("click", () => {
            if (el.dataset.wasDragged === "true") return;
            el.setAttribute("aria-expanded", String(el.getAttribute("aria-expanded") !== "true"));
        });
    });

    /* ─── 5c. Sticky note ─── */
    (function initStickyDrag() {
        const sticky = document.querySelector(".sticky-note");
        if (!sticky) return;
        const STORAGE_KEY = "sticky-note-pos-v3";
        let currentX = 0, currentY = 0, drag = null;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const pos = JSON.parse(saved);
                if (typeof pos.x === "number" && typeof pos.y === "number") {
                    currentX = pos.x; currentY = pos.y;
                    sticky.style.setProperty("--sticky-x", currentX + "px");
                    sticky.style.setProperty("--sticky-y", currentY + "px");
                }
            }
        } catch (_) { }
        sticky.addEventListener("pointerdown", (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            delete sticky.dataset.wasDragged;
            drag = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, baseX: currentX, baseY: currentY, moved: false };
            try { sticky.setPointerCapture(e.pointerId); } catch (_) { }
        });
        sticky.addEventListener("pointermove", (e) => {
            if (!drag || e.pointerId !== drag.pointerId) return;
            const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
            if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; sticky.classList.add("is-dragging"); }
            if (!drag.moved) return;
            e.preventDefault();
            currentX = drag.baseX + dx; currentY = drag.baseY + dy;
            sticky.style.setProperty("--sticky-x", currentX + "px");
            sticky.style.setProperty("--sticky-y", currentY + "px");
        });
        const endDrag = (e) => {
            if (!drag || e.pointerId !== drag.pointerId) return;
            try { sticky.releasePointerCapture(e.pointerId); } catch (_) { }
            if (drag.moved) {
                sticky.dataset.wasDragged = "true";
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: currentX, y: currentY })); } catch (_) { }
            }
            sticky.classList.remove("is-dragging");
            drag = null;
        };
        sticky.addEventListener("pointerup", endDrag);
        sticky.addEventListener("pointercancel", endDrag);
        window.__resetStickyNote = () => {
            currentX = 0; currentY = 0;
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
        if (!card) return;
        if (card.dataset.wasDragged === "true") return;
        previousFocus = document.activeElement;
        const media = card.querySelector(".project-media");
        const title = card.querySelector("h3")?.textContent.trim() || "";
        const type = card.querySelector(".project-type")?.textContent.trim() || "";
        const shortDesc = card.querySelector(".project-desc")?.textContent.trim() || "";
        const desc = card.dataset.modalDesc || shortDesc;
        const features = (card.dataset.modalFeatures || "").split("|").map(s => s.trim()).filter(Boolean);
        const tech = Array.from(card.querySelectorAll(".project-tech li")).map(li => li.textContent.trim()).filter(t => t && t !== "—");
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
            clone.querySelectorAll(".project-img, .project-bg").forEach(el => el.classList.add("is-loaded"));
            const imgInClone = clone.querySelector("img.project-img");
            const bgInClone = clone.querySelector(".project-bg");
            if (imgInClone && bgInClone) {
                const src = imgInClone.currentSrc || imgInClone.src;
                if (src) bgInClone.style.backgroundImage = `url("${src}")`;
            }
            clone.querySelectorAll("video").forEach(v => {
                try { v.muted = true; v.play?.().catch(() => {}); } catch (_) { }
            });
        }
        const info = document.createElement("div");
        info.className = "detail-info";
        info.innerHTML = `<p class="detail-type">${type}</p><h2 class="detail-title" id="detail-title">${title}</h2><p class="detail-desc">${desc}</p>`;
        if (features.length) {
            const ul = document.createElement("ul");
            ul.className = "detail-features";
            features.forEach(f => { const li = document.createElement("li"); li.textContent = f; ul.appendChild(li); });
            info.appendChild(ul);
        }
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
    document.querySelectorAll(".project-media").forEach(m => m.addEventListener("click", () => {
        const card = m.closest(".project-card");
        if (card?.dataset.wasDragged === "true") return;
        openDetail(card);
    }));
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

    /* ─── 9. Video principal ─── */
    const video = document.querySelector(".video-el");
    const videoPlaceholder = document.querySelector(".video-placeholder");
    if (video && videoPlaceholder) {
        video.addEventListener("loadeddata", () => { video.classList.add("is-loaded"); videoPlaceholder.hidden = true; });
        video.addEventListener("error", () => { video.classList.remove("is-loaded"); videoPlaceholder.hidden = false; }, true);
        if (video.readyState >= 2) { video.classList.add("is-loaded"); videoPlaceholder.hidden = true; }
    }

    /* ─── 10. Medios: fondo borroso + fallback ─── */
    function initMedia(selector) {
        document.querySelectorAll(selector).forEach(el => {
            const wrap = el.closest(".project-media");
            const bg = wrap ? wrap.querySelector(".project-bg") : null;
            const mark = () => {
                el.classList.add("is-loaded");
                if (bg && el.tagName === "IMG") {
                    const src = el.currentSrc || el.src;
                    if (src) bg.style.backgroundImage = `url("${src}")`;
                    bg.classList.add("is-loaded");
                }
                if (bg && el.tagName === "VIDEO" && bg.tagName === "VIDEO") {
                    try { bg.muted = true; bg.play?.().catch(() => {}); } catch (_) { }
                    bg.classList.add("is-loaded");
                }
            };
            const fail = () => el.remove();
            if (el.tagName === "VIDEO") {
                el.addEventListener("loadeddata", mark);
                el.addEventListener("error", fail, true);
                if (el.readyState >= 2) mark();
                if (bg && bg.tagName === "VIDEO") {
                    bg.addEventListener("loadeddata", () => bg.classList.add("is-loaded"));
                    try { bg.muted = true; bg.play?.().catch(() => {}); } catch (_) { }
                }
            } else {
                el.addEventListener("load", mark);
                el.addEventListener("error", fail);
                if (el.complete) { if (el.naturalWidth > 0) mark(); else fail(); }
            }
        });
    }
    initMedia(".project-img");
    initMedia(".hero-photo-img");

    /* ─── 11. Año ─── */
    document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

    /* ─── 12. Cerrar menú desktop ─── */
    window.matchMedia("(min-width: 801px)").addEventListener("change", (e) => {
        if (e.matches && nav) { nav.classList.remove("is-open"); menuToggle?.setAttribute("aria-expanded", "false"); }
    });

    /* ═══════════════════════════════════════════
       13. ESTRELLAS DECORATIVAS
       ═══════════════════════════════════════════ */
    function generateSectionStars() {
        const areas = document.querySelectorAll(".hero, .section, .site-footer");
        const symbols = ["✦", "✧", "⋆", "✶", "✳", "·"];
        const sizes = [8, 10, 12, 14, 18, 22, 28];
        const anims = ["floaty-deco", "drift-deco", "rotate-deco", "breathe-deco"];
        const colors = ["accent", "accent-soft", "caramel", "olive", "sage"];

        areas.forEach((area) => {
            if (area.querySelector(":scope > .section-stars")) return;
            const container = document.createElement("div");
            container.className = "section-stars";
            container.setAttribute("aria-hidden", "true");
            area.insertBefore(container, area.firstChild);

            const rect = area.getBoundingClientRect();
            const h = rect.height || 800;
            const count = Math.max(10, Math.min(22, Math.floor(h / 100)));
            for (let i = 0; i < count; i++) {
                const star = document.createElement("span");
                star.className = "deco-star";
                star.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                star.style.left = (3 + Math.random() * 94) + "%";
                star.style.top = (4 + Math.random() * 92) + "%";
                star.style.fontSize = sizes[Math.floor(Math.random() * sizes.length)] + "px";
                star.style.setProperty("--deco-op", (0.10 + Math.random() * 0.28).toFixed(2));
                star.style.animationName = anims[Math.floor(Math.random() * anims.length)];
                star.style.animationDuration = (7 + Math.random() * 14).toFixed(1) + "s";
                star.style.animationDelay = (-Math.random() * 15).toFixed(1) + "s";
                star.style.color = `var(--${colors[Math.floor(Math.random() * colors.length)]})`;
                container.appendChild(star);
            }
        });
    }

    /* ═══════════════════════════════════════════
       13.b SÍMBOLOS DE CÓDIGO — pocos y temáticos
       ═══════════════════════════════════════════ */
    function generateFloatingCode() {
        const targets = [
            { sel: "#inicio", count: 3 },
            { sel: "#habilidades", count: 2 },
            { sel: "#proyectos", count: 2 },
            { sel: "#proceso", count: 2 }
        ];
        const symbols = [
            "{ }", "</>", "=>", "<div>", ".map()", "if()", "const", "async",
            "01", ";", "fn()", "return", "[]", "()", "<>", "def", "null",
            "&&", "||", "===", "<h1>", "let", "var", "SELECT", "{}", "</>"
        ];
        const sizes = [28, 34, 42, 52, 64];
        const anims = ["code-float", "code-drift", "code-sway", "code-pulse"];
        const colors = ["accent", "accent-soft", "caramel", "olive", "sage"];

        targets.forEach(({ sel, count }) => {
            const area = document.querySelector(sel);
            if (!area) return;
            let container = area.querySelector(":scope > .code-symbols");
            if (!container) {
                container = document.createElement("div");
                container.className = "code-symbols";
                container.setAttribute("aria-hidden", "true");
                area.insertBefore(container, area.firstChild);
            }
            if (container.querySelector(".code-symbol")) return;

            for (let i = 0; i < count; i++) {
                const sym = document.createElement("span");
                sym.className = "code-symbol";
                sym.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                const edge = Math.random() > 0.5 ? "right" : "left";
                sym.style.left = edge === "right"
                    ? (78 + Math.random() * 15) + "%"
                    : (2 + Math.random() * 12) + "%";
                sym.style.top = (10 + Math.random() * 80) + "%";
                sym.style.fontSize = sizes[Math.floor(Math.random() * sizes.length)] + "px";
                sym.style.setProperty("--cs-op", (0.16 + Math.random() * 0.18).toFixed(2));
                sym.style.animationName = anims[Math.floor(Math.random() * anims.length)];
                sym.style.animationDuration = (12 + Math.random() * 16).toFixed(1) + "s";
                sym.style.animationDelay = (-Math.random() * 20).toFixed(1) + "s";
                sym.style.color = `var(--${colors[Math.floor(Math.random() * colors.length)]})`;
                container.appendChild(sym);
            }
        });
    }

    /* ═══════════════════════════════════════════
       14. SÍMBOLOS DE PROGRAMACIÓN AMBIENTALES
       ═══════════════════════════════════════════ */
    function addProgrammingSymbols() {
        const heroFigure = document.querySelector(".hero-figure");
        if (heroFigure && !heroFigure.querySelector(".hero-code-bug")) {
            const bug = document.createElement("span");
            bug.className = "hero-code-bug";
            bug.setAttribute("role", "button");
            bug.setAttribute("tabindex", "0");
            bug.setAttribute("aria-label", "Bug interactivo · comé la foto");
            bug.setAttribute("title", "Tocame · el bug se come la foto");
            bug.innerHTML = `<svg viewBox="0 0 16 16" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><ellipse cx="8" cy="9" rx="3.2" ry="3.8"/><circle cx="8" cy="4.6" r="1.6"/><path d="M8 6v-1M6.4 3.2 5 2M9.6 3.2 11 2"/><path d="M4.8 7.6 2.8 6.8M4.8 9.5 2 9.5M4.8 11.4 2.8 12.2"/><path d="M11.2 7.6l2-.8M11.2 9.5H14M11.2 11.4l2 .8"/></svg>`;
            heroFigure.appendChild(bug);
        }
        document.querySelectorAll(".section-marker").forEach((marker, i) => {
            if (marker.querySelector(".marker-code")) return;
            const code = document.createElement("span");
            code.className = "marker-code";
            code.setAttribute("aria-hidden", "true");
            code.textContent = ["</>", "{ }", "()", ";", "01"][i % 5];
            marker.appendChild(code);
        });
        document.querySelectorAll(".project-media").forEach((media, i) => {
            if (media.querySelector(".card-code")) return;
            const code = document.createElement("span");
            code.className = "card-code";
            code.setAttribute("aria-hidden", "true");
            code.textContent = ["{}", "[]", "()", "<>"][i % 4];
            media.appendChild(code);
        });
    }

    /* ═══════════════════════════════════════════
       15. BUG QUE COME LA FOTO — SOLO IMAGEN + MÁSCARA SVG
       ═══════════════════════════════════════════ */
    function initPhotoBug() {
        const bug = document.querySelector(".hero-code-bug");
        const img = document.querySelector(".hero-photo-img");
        const photo = document.querySelector(".hero-photo");
        if (!bug || !img || !photo) return;

        // ─── SVG de máscara encima de la imagen ───
        const NS = "http://www.w3.org/2000/svg";
        let svg = photo.querySelector(".hero-photo-mask");
        if (!svg) {
            svg = document.createElementNS(NS, "svg");
            svg.setAttribute("class", "hero-photo-mask");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("preserveAspectRatio", "none");
            photo.appendChild(svg);
        }

        // ─── Estado ───
        let bites = [];              // { cx, cy, r, seed, angle }
        let busy = false;
        let eaten = false;
        let imgReady = false;
        let W = 1, H = 1;            // viewBox

        // ─── Máscara base ───
        function setupMask() {
            const rect = photo.getBoundingClientRect();
            W = Math.max(1, rect.width);
            H = Math.max(1, rect.height);
            svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
            svg.innerHTML = `
                <defs>
                    <mask id="hero-photo-mordida" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
                        <rect x="0" y="0" width="${W}" height="${H}" fill="white"/>
                        <g id="hero-photo-bites" fill="black"></g>
                    </mask>
                </defs>
                <rect x="0" y="0" width="${W}" height="${H}" fill="white"
                      mask="url(#hero-photo-mordida)"
                      style="pointer-events:none;"/>
            `;
            img.style.webkitMask = `url(#hero-photo-mordida)`;
            img.style.mask = `url(#hero-photo-mordida)`;
            img.style.webkitMaskUnits = "userSpaceOnUse";
            img.style.maskUnits = "userSpaceOnUse";
        }

        // ─── Dibujar un mordisco irregular ───
        function drawBite(b) {
            const g = svg.querySelector("#hero-photo-bites");
            if (!g) return;
            const { cx, cy, r, seed, angle } = b;
            const lobes = 9 + Math.floor(seed * 3) % 4;
            const pts = [];
            for (let i = 0; i < lobes; i++) {
                const a = (i / lobes) * Math.PI * 2 + angle;
                const rr = r * (0.55 + 0.65 * Math.abs(Math.sin(seed * 7 + i * 2.3)));
                const dent = (i % 3 === 0) ? 0.85 : 1;
                pts.push({
                    x: cx + Math.cos(a) * rr * dent,
                    y: cy + Math.sin(a) * rr * dent
                });
            }
            const mid = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
            let prev = pts[pts.length - 1];
            let start = mid(prev, pts[0]);
            let d = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`;
            for (let i = 0; i < pts.length; i++) {
                const cur = pts[i];
                const next = pts[(i + 1) % pts.length];
                const m = mid(cur, next);
                d += ` Q ${cur.x.toFixed(1)} ${cur.y.toFixed(1)} ${m.x.toFixed(1)} ${m.y.toFixed(1)}`;
            }
            d += " Z";
            const path = document.createElementNS(NS, "path");
            path.setAttribute("d", d);
            path.setAttribute("fill", "black");
            g.appendChild(path);
        }

        function redrawBites() {
            const g = svg.querySelector("#hero-photo-bites");
            if (!g) return;
            g.innerHTML = "";
            bites.forEach(drawBite);
        }

        // ─── Radio para ~10–12 mordiscos ───
        function biteRadius() {
            const area = W * H;
            const targetBites = 10 + Math.floor(Math.random() * 3);
            const r = Math.sqrt(area / (targetBites * Math.PI)) * 1.35;
            return r * (0.8 + Math.random() * 0.4);
        }

        // ─── Grilla de ocupación ───
        const GRID_COLS = 32;
        const GRID_ROWS = 40;
        let grid = [];
        function resetGrid() {
            grid = [];
            for (let y = 0; y < GRID_ROWS; y++) {
                const row = [];
                for (let x = 0; x < GRID_COLS; x++) row.push(1);
                grid.push(row);
            }
        }
        function rebuildGrid() {
            resetGrid();
            const cellW = W / GRID_COLS;
            const cellH = H / GRID_ROWS;
            bites.forEach(b => {
                const rCellsX = b.r / cellW;
                const rCellsY = b.r / cellH;
                const gx = b.cx / cellW;
                const gy = b.cy / cellH;
                const x0 = Math.max(0, Math.floor(gx - rCellsX));
                const x1 = Math.min(GRID_COLS - 1, Math.ceil(gx + rCellsX));
                const y0 = Math.max(0, Math.floor(gy - rCellsY));
                const y1 = Math.min(GRID_ROWS - 1, Math.ceil(gy + rCellsY));
                for (let y = y0; y <= y1; y++) {
                    for (let x = x0; x <= x1; x++) {
                        const dx = (x + 0.5) * cellW - b.cx;
                        const dy = (y + 0.5) * cellH - b.cy;
                        if (dx * dx + dy * dy < (b.r * 1.05) ** 2) grid[y][x] = 0;
                    }
                }
            });
        }
        function countLive() {
            let n = 0;
            for (let y = 0; y < GRID_ROWS; y++)
                for (let x = 0; x < GRID_COLS; x++)
                    if (grid[y][x]) n++;
            return n;
        }
        function nearestLive(px, py) {
            const cellW = W / GRID_COLS;
            const cellH = H / GRID_ROWS;
            const gx = px / cellW, gy = py / cellH;
            let best = null, bestD = Infinity;
            for (let y = 0; y < GRID_ROWS; y++) {
                for (let x = 0; x < GRID_COLS; x++) {
                    if (!grid[y][x]) continue;
                    const dx = (x + 0.5) - gx;
                    const dy = (y + 0.5) - gy;
                    const d = dx * dx + dy * dy;
                    if (d < bestD) { bestD = d; best = { x, y }; }
                }
            }
            if (!best) return null;
            return { cx: (best.x + 0.5) * cellW, cy: (best.y + 0.5) * cellH };
        }
        function frontier() {
            const list = [];
            for (let y = 0; y < GRID_ROWS; y++) {
                for (let x = 0; x < GRID_COLS; x++) {
                    if (!grid[y][x]) continue;
                    const up = y > 0 && !grid[y - 1][x];
                    const down = y < GRID_ROWS - 1 && !grid[y + 1][x];
                    const left = x > 0 && !grid[y][x - 1];
                    const right = x < GRID_COLS - 1 && !grid[y][x + 1];
                    if (up || down || left || right) list.push({ x, y });
                }
            }
            return list;
        }

        function bugPos() {
            const pr = photo.getBoundingClientRect();
            const br = bug.getBoundingClientRect();
            return { x: br.left + br.width / 2 - pr.left, y: br.top + br.height / 2 - pr.top };
        }

        function pickNextBite() {
            const live = countLive();
            const bp = bugPos();
            const cellW = W / GRID_COLS, cellH = H / GRID_ROWS;

            if (live < 12) {
                const t = nearestLive(bp.x, bp.y);
                if (t) return t;
            }

            const rnd = Math.random();
            if (rnd < 0.25) {
                const interior = [];
                for (let y = 1; y < GRID_ROWS - 1; y++) {
                    for (let x = 1; x < GRID_COLS - 1; x++) {
                        if (!grid[y][x]) continue;
                        if (grid[y - 1][x] && grid[y + 1][x] && grid[y][x - 1] && grid[y][x + 1])
                            interior.push({ x, y });
                    }
                }
                if (interior.length) {
                    const p = interior[Math.floor(Math.random() * interior.length)];
                    return { cx: (p.x + 0.5) * cellW, cy: (p.y + 0.5) * cellH };
                }
            }

            const fr = frontier();
            if (fr.length) {
                const withD = fr.map(c => {
                    const dx = (c.x + 0.5) * cellW - bp.x;
                    const dy = (c.y + 0.5) * cellH - bp.y;
                    return { c, d: dx * dx + dy * dy };
                }).sort((a, b) => a.d - b.d);
                const topN = Math.min(withD.length, Math.max(4, Math.floor(withD.length * 0.5)));
                const pick = withD[Math.floor(Math.random() * topN)].c;
                return { cx: (pick.x + 0.5) * cellW, cy: (pick.y + 0.5) * cellH };
            }

            return nearestLive(bp.x, bp.y);
        }

        // ─── Bug se mueve ───
        const bugHome = {
            left: getComputedStyle(bug).left,
            top: getComputedStyle(bug).top,
            right: getComputedStyle(bug).right,
            transform: bug.style.transform || ""
        };
        function moveBugTo(xPct, yPct, dur) {
            const bs = bug.offsetWidth || 32;
            bug.style.transition = `left ${dur}ms cubic-bezier(.5,.05,.3,1), top ${dur}ms cubic-bezier(.5,.05,.3,1), transform .3s`;
            bug.style.left = `calc(${(xPct * 100).toFixed(2)}% - ${bs / 2}px)`;
            bug.style.top = `calc(${(yPct * 100).toFixed(2)}% - ${bs / 2}px)`;
            bug.style.right = "auto";
            bug.style.transform = "rotate(-12deg) scale(1.05)";
        }
        function returnBugHome() {
            bug.style.transition = "left .8s cubic-bezier(.4,0,.2,1), top .8s cubic-bezier(.4,0,.2,1), transform .4s";
            bug.style.left = bugHome.left;
            bug.style.top = bugHome.top;
            bug.style.right = bugHome.right;
            bug.style.transform = bugHome.transform;
        }

        // ─── Mordisco ───
        function doBite(target) {
            const r = biteRadius();
            const bite = {
                cx: target.cx,
                cy: target.cy,
                r,
                seed: Math.random() * 10,
                angle: Math.random() * Math.PI * 2
            };
            bites.push(bite);
            drawBite(bite);
            rebuildGrid();
            bug.classList.add("is-munching");
            setTimeout(() => bug.classList.remove("is-munching"), 380);
        }

        function eatNext(e) {
            if (e) { e.stopPropagation(); e.preventDefault(); }
            if (busy || eaten || !imgReady) return;
            const target = pickNextBite();
            if (!target) {
                eaten = true; busy = true;
                bug.style.transform = "rotate(-8deg) scale(1.12)";
                setTimeout(vomitAll, 900);
                return;
            }
            const dur = 380 + Math.random() * 320;
            const wander = Math.random() < 0.25;
            if (wander) {
                const wx = target.cx + (Math.random() - 0.5) * W * 0.12;
                const wy = target.cy + (Math.random() - 0.5) * H * 0.12;
                moveBugTo(wx / W, wy / H, dur * 0.55);
                setTimeout(() => {
                    moveBugTo(target.cx / W, target.cy / H, dur * 0.55);
                    setTimeout(() => { doBite(target); checkEnd(); }, dur * 0.55);
                }, dur * 0.55);
            } else {
                moveBugTo(target.cx / W, target.cy / H, dur);
                setTimeout(() => { doBite(target); checkEnd(); }, dur);
            }
        }

        function checkEnd() {
            const live = countLive();
            const total = GRID_COLS * GRID_ROWS;
            if (live === 0 || live / total < 0.04) {
                eaten = true; busy = true;
                bug.style.transform = "rotate(-8deg) scale(1.12)";
                setTimeout(vomitAll, 900);
            }
        }

        // ─── Vómito: fragmentos vuelan y se integran ───
        function vomitAll() {
            const order = bites.slice().reverse();
            const pr = photo.getBoundingClientRect();
            const br = bug.getBoundingClientRect();
            const mouthX = br.left + br.width / 2;
            const mouthY = br.top + br.height / 2;
            let i = 0;
            function step() {
                if (i >= order.length) {
                    bites = [];
                    redrawBites();
                    rebuildGrid();
                    returnBugHome();
                    setTimeout(() => { eaten = false; busy = false; }, 800);
                    return;
                }
                spawnFragment(order[i], mouthX, mouthY, pr);
                i++;
                setTimeout(step, 240);
            }
            step();
        }

        function spawnFragment(bite, mouthX, mouthY, photoRect) {
            const size = Math.max(56, bite.r * 2);
            const half = size / 2;
            const frag = document.createElement("canvas");
            frag.className = "photo-fragment";
            frag.width = Math.round(size * 2);
            frag.height = Math.round(size * 2);
            frag.style.width = size + "px";
            frag.style.height = size + "px";

            const fctx = frag.getContext("2d");
            fctx.save();
            fctx.beginPath();
            const lobes = 9 + Math.floor(bite.seed * 3) % 4;
            const pts = [];
            for (let k = 0; k < lobes; k++) {
                const a = (k / lobes) * Math.PI * 2 + bite.angle;
                const rr = half * (0.55 + 0.65 * Math.abs(Math.sin(bite.seed * 7 + k * 2.3)));
                pts.push({ x: half + Math.cos(a) * rr, y: half + Math.sin(a) * rr });
            }
            const mid = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
            let prev = pts[pts.length - 1];
            let start = mid(prev, pts[0]);
            fctx.moveTo(start.x, start.y);
            for (let k = 0; k < pts.length; k++) {
                const cur = pts[k];
                const next = pts[(k + 1) % pts.length];
                const m = mid(cur, next);
                fctx.quadraticCurveTo(cur.x, cur.y, m.x, m.y);
            }
            fctx.closePath();
            fctx.clip();
            fctx.drawImage(
                img,
                (bite.cx - half) / W * img.naturalWidth,
                (bite.cy - half) / H * img.naturalHeight,
                size / W * img.naturalWidth,
                size / H * img.naturalHeight,
                0, 0, size * 2, size * 2
            );
            fctx.restore();

            const destX = photoRect.left + bite.cx - half;
            const destY = photoRect.top + bite.cy - half;

            frag.style.left = (mouthX - half) + "px";
            frag.style.top = (mouthY - half) + "px";
            frag.style.transform = "scale(.35) rotate(" + (Math.random() * 60 - 30) + "deg)";
            document.body.appendChild(frag);

            requestAnimationFrame(() => {
                frag.style.transition = "left .55s cubic-bezier(.2,.8,.2,1), top .55s cubic-bezier(.2,.8,.2,1), transform .55s cubic-bezier(.2,.8,.2,1), opacity .3s ease .35s";
                frag.style.left = destX + "px";
                frag.style.top = destY + "px";
                frag.style.transform = "scale(1) rotate(0deg)";
                frag.style.opacity = "0.9";
            });

            setTimeout(() => {
                const idx = bites.indexOf(bite);
                if (idx >= 0) {
                    bites.splice(idx, 1);
                    redrawBites();
                    rebuildGrid();
                }
                frag.style.opacity = "0";
                setTimeout(() => frag.remove(), 300);
            }, 600);
        }

        // ─── Eventos y resize ───
        bug.setAttribute("role", "button");
        bug.setAttribute("tabindex", "0");
        bug.addEventListener("click", eatNext);
        bug.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); eatNext(e); }
        });

        let resizeT = null;
        window.addEventListener("resize", () => {
            clearTimeout(resizeT);
            resizeT = setTimeout(() => {
                const oldW = W, oldH = H;
                setupMask();
                if (oldW && oldH) {
                    bites.forEach(b => {
                        b.cx = (b.cx / oldW) * W;
                        b.cy = (b.cy / oldH) * H;
                        b.r = (b.r / Math.min(oldW, oldH)) * Math.min(W, H);
                    });
                    redrawBites();
                    rebuildGrid();
                }
            }, 150);
        });

        // ─── Boot ───
        const waitImg = () => {
            if (img.complete && img.naturalWidth > 0) {
                imgReady = true;
                setupMask();
                resetGrid();
            } else {
                img.addEventListener("load", () => {
                    imgReady = true;
                    setupMask();
                    resetGrid();
                }, { once: true });
            }
        };
        waitImg();
        requestAnimationFrame(() => { if (imgReady) setupMask(); });
    }

    /* ═══════════════════════════════════════════
       16. PARTÍCULAS DE CLIMA
       ═══════════════════════════════════════════ */
    function generateWeatherParticles() {
        const configs = [
            { sel: ".fx-primavera", count: 24, mk: () => ({ x: Math.random() * 100, d: 8 + Math.random() * 6, delay: -Math.random() * 8, size: 4 + Math.random() * 6, hue: Math.random() > 0.5 ? "rose" : "green" }) },
            { sel: ".fx-invierno", count: 30, mk: () => ({ x: Math.random() * 100, d: 6 + Math.random() * 8, delay: -Math.random() * 8, size: 3 + Math.random() * 5 }) },
            { sel: ".fx-otono", count: 22, mk: () => ({ x: Math.random() * 100, d: 8 + Math.random() * 6, delay: -Math.random() * 8, size: 6 + Math.random() * 6, rot: Math.random() * 360 }) },
            { sel: ".fx-verano", count: 26, mk: () => ({ x: Math.random() * 100, y: Math.random() * 100, d: 3 + Math.random() * 4, delay: -Math.random() * 6, size: 6 + Math.random() * 8 }) }
        ];
        configs.forEach(cfg => {
            const cont = document.querySelector(cfg.sel);
            if (!cont || cont.children.length) return;
            for (let i = 0; i < cfg.count; i++) {
                const p = cfg.mk(i);
                const span = document.createElement("span");
                span.style.setProperty("--x", p.x + "%");
                if (p.y != null) span.style.setProperty("--y", p.y + "%");
                span.style.setProperty("--d", p.d.toFixed(1) + "s");
                span.style.setProperty("--delay", p.delay.toFixed(1) + "s");
                span.style.setProperty("--size", p.size.toFixed(0) + "px");
                if (p.rot != null) span.style.setProperty("--rot", p.rot.toFixed(0) + "deg");
                if (p.hue === "rose") span.style.setProperty("--hue", "350");
                else if (p.hue === "green") span.style.setProperty("--hue", "130");
                span.style.background = (() => {
                    if (cfg.sel.includes("primavera")) return p.hue === "rose"
                        ? "radial-gradient(circle, rgba(201,107,138,.8), rgba(201,107,138,.2))"
                        : "radial-gradient(circle, rgba(122,154,114,.75), rgba(122,154,114,.15))";
                    if (cfg.sel.includes("invierno")) return "radial-gradient(circle, #ffffff, rgba(220,235,245,.4))";
                    if (cfg.sel.includes("otono")) return "linear-gradient(135deg, #b85c2a, #d47a4a)";
                    return "radial-gradient(circle, #ffe082, rgba(255,224,130,0))";
                })();
                if (cfg.sel.includes("otono")) {
                    span.style.borderRadius = "2px 60% 2px 60%";
                    span.style.transform = `rotate(${p.rot}deg)`;
                }
                if (cfg.sel.includes("verano")) {
                    span.style.boxShadow = "0 0 8px 2px rgba(255,224,130,.6)";
                }
                cont.appendChild(span);
            }
        });
    }

    /* ═══════════════════════════════════════════
       17. ESTRELLAS INTERACTIVAS (constelaciones)
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
        const HINT_KEY = "stars-hint-v7";
        let hintTimer = null;

        const constellation = { selected: null, edges: new Set(), uids: new Set() };
        const checkBtn = document.querySelector(".constellation-check");
        const clearBtn = document.querySelector(".constellation-clear");

        stars.forEach((st, i) => { if (!st.dataset.uid) st.dataset.uid = "star-" + i; });

        const dismiss = () => {
            if (!hint || hint.hidden) return;
            hint.hidden = true;
            try { localStorage.setItem(HINT_KEY, "1"); } catch (_) { }
            clearTimeout(hintTimer);
        };
        const size = () => stars[0].offsetWidth || 44;
        const clampPos = (x, y) => {
            const r = field.getBoundingClientRect();
            const w = size();
            return { x: Math.max(0, Math.min(x, r.width - w)), y: Math.max(0, Math.min(y, r.height - w)) };
        };
        const setPos = (s, x, y) => { s.style.left = x + "px"; s.style.top = y + "px"; };

        function drawProximityLines() {
            if (!svg) return;
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            const s = size();
            const centers = stars.map(st => { const p = positions.get(st); return { x: p.x + s / 2, y: p.y + s / 2 }; });
            for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) {
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
        function drawConstellationLines() {
            if (!constellationSvg) return;
            while (constellationSvg.firstChild) constellationSvg.removeChild(constellationSvg.firstChild);
            const s = size();
            constellation.edges.forEach(key => {
                const [a, b] = key.split("|");
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
            if (checkBtn) checkBtn.hidden = constellation.edges.size < 1;
            if (clearBtn) clearBtn.hidden = constellation.edges.size === 0;
            stars.forEach(st => st.classList.toggle("is-in-constellation", constellation.uids.has(st.dataset.uid)));
        }
        function clearConstellation() {
            constellation.edges.clear();
            constellation.uids.clear();
            if (constellation.selected) { constellation.selected.classList.remove("is-constellation-selected"); constellation.selected = null; }
            drawConstellationLines();
            refreshConstellationUI();
        }
        function selectStar(star) {
            if (constellation.selected === star) { star.classList.remove("is-constellation-selected"); constellation.selected = null; return; }
            if (constellation.selected) {
                const a = constellation.selected, b = star;
                const uidA = a.dataset.uid, uidB = b.dataset.uid;
                if (uidA !== uidB) {
                    const key = [uidA, uidB].sort().join("|");
                    if (!constellation.edges.has(key)) { constellation.edges.add(key); constellation.uids.add(uidA); constellation.uids.add(uidB); }
                }
                a.classList.remove("is-constellation-selected");
                constellation.selected = null;
                drawConstellationLines();
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
                drawProximityLines();
                drawConstellationLines();
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
            drawProximityLines();
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
            drawProximityLines();
        }

        stars.forEach(star => {
            let drag = null, rafId = null, pending = null, pointerDown = null;
            const apply = () => {
                if (pending) { setPos(star, pending.x, pending.y); drawProximityLines(); drawConstellationLines(); pending = null; }
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
                drag = null; pointerDown = null;
                star.classList.remove("is-dragging");
                try { star.releasePointerCapture(e.pointerId); } catch (_) { }
                drawProximityLines();
                drawConstellationLines();
                scheduleReturn(star);
                if (!pd) return;
                const isClick = pd.moved < 8 && (Date.now() - pd.startTime) < 500;
                if (star.dataset.starLetter && star.classList.contains("is-revealed")) {
                    if (isClick) {
                        window.__portfolioAddChip?.(star.dataset.starLetter, null);
                        star.classList.add("is-collected");
                        star.classList.remove("is-revealed");
                        window.__portfolioShowToast?.(`letra ${star.dataset.starLetter} recogida`);
                        return;
                    }
                }
                if (star.dataset.starLetter && pd.moved > 30 && !star.classList.contains("is-revealed") && !star.classList.contains("is-collected")) {
                    star.classList.add("is-revealed");
                    star._revealTimer = setTimeout(() => { if (!star.classList.contains("is-collected")) star.classList.remove("is-revealed"); }, 8000);
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
                    drawProximityLines();
                    drawConstellationLines();
                    scheduleReturn(star);
                    dismiss();
                    return;
                }
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectStar(star); }
            });
        });

        checkBtn?.addEventListener("click", () => {
            if (constellation.edges.size < 1) return;
            const letter = matchConstellationLetter(stars, positions, size, constellation.uids);
            if (letter) {
                window.__portfolioAddChip?.(letter, null);
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
            if (!e.target.closest(".star") && constellation.selected) {
                constellation.selected.classList.remove("is-constellation-selected");
                constellation.selected = null;
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && (constellation.selected || constellation.edges.size)) clearConstellation();
        });
        resetBtn?.addEventListener("click", resetPositions);
        if (hint) {
            let stored = null;
            try { stored = localStorage.getItem(HINT_KEY); } catch (_) { }
            if (!stored) { hint.hidden = false; hintTimer = setTimeout(dismiss, 12000); }
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
                    const o = originals.get(st);
                    if (!p) return;
                    const c = clampPos(p.x, p.y);
                    const co = o ? clampPos(o.x, o.y) : c;
                    positions.set(st, c);
                    originals.set(st, co);
                    setPos(st, c.x, c.y);
                });
                drawProximityLines();
                drawConstellationLines();
            }, 150);
        });
        return { positions, size, stars, clearConstellation };
    })();

    /* ═══════════════════════════════════════════
       18. VOCABULARIO (16 palabras)
       ═══════════════════════════════════════════ */
    const VOCABULARY = {
        CODIGO: { category: "tecnologia", label: "Código", hint: "Lo que escribís para hablarle a la máquina.", effect: "codigo" },
        BINARIO: { category: "tecnologia", label: "Binario", hint: "Solo ceros y unos.", effect: "binario" },
        CIELO: { category: "naturaleza", label: "Cielo", hint: "Lo que ves cuando mirás arriba.", effect: "cielo" },
        TORNADO: { category: "naturaleza", label: "Tornado", hint: "Gira y se lleva todo a su paso.", effect: "tornado" },
        LLUVIA: { category: "naturaleza", label: "Lluvia", hint: "Cae del cielo cuando las nubes se cansan.", effect: "lluvia" },
        MAPACHE: { category: "animales", label: "Mapache", hint: "Travieso y con antifaz natural.", effect: "mapache" },
        CUERVO: { category: "animales", label: "Cuervo", hint: "Negro, inteligente, observa todo.", effect: "cuervo" },
        ZORRO: { category: "animales", label: "Zorro", hint: "Astuto, naranja y con cola larga.", effect: "zorro" },
        PRIMAVERA: { category: "estaciones", label: "Primavera", hint: "Flores, verde y días que se alargan.", effect: "primavera" },
        INVIERNO: { category: "estaciones", label: "Invierno", hint: "Frío, silencio y nieve.", effect: "invierno" },
        OTONO: { category: "estaciones", label: "Otoño", hint: "Hojas que caen en tonos ocres.", effect: "otono" },
        VERANO: { category: "estaciones", label: "Verano", hint: "Calor, luz y días largos.", effect: "verano" },
        GALAXIA: { category: "universo", label: "Galaxia", hint: "Una ciudad de estrellas.", effect: "galaxia" },
        AGUJERONEGRO: { category: "universo", label: "Agujero negro", hint: "Absorbe todo, incluso la luz.", effect: "agujero" },
        SUPERCALIFARSTILISTICOESPALIDOSO: { category: "especial", label: "¡Supersorpresa!", hint: "Una palabra larguísima de una canción.", effect: "super" },
        BOSQUEJO: { category: "especial", label: "Bosquejo", hint: "Un dibujo a lápiz, en proceso.", effect: "bosquejo" }
    };

    const normalize = (s) => s.toUpperCase()
        .replace(/[ÁÀÄÂ]/g, "A").replace(/[ÉÈËÊ]/g, "E").replace(/[ÍÌÏÎ]/g, "I")
        .replace(/[ÓÒÖÔ]/g, "O").replace(/[ÚÙÜÛ]/g, "U").replace(/Ñ/g, "N")
        .replace(/[^A-Z]/g, "");

    const SECRETS_KEY = "portfolio-secrets-v3";

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
    function saveProgress(p) { try { localStorage.setItem(SECRETS_KEY, JSON.stringify(p)); } catch (_) { } }

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
    const LETTER_WEIGHTS = { A: 9, B: 1, C: 3, D: 3, E: 9, F: 1, G: 2, H: 1, I: 6, J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 5, T: 5, U: 4, V: 2, W: 1, X: 1, Y: 1, Z: 1 };
    const TOTAL_WEIGHT = Object.values(LETTER_WEIGHTS).reduce((a, b) => a + b, 0);
    function pickRandomLetter() {
        let r = Math.random() * TOTAL_WEIGHT;
        for (const l of LETTER_POOL) { r -= LETTER_WEIGHTS[l]; if (r <= 0) return l; }
        return "A";
    }

    const PALETTE_EFFECTS = ["cielo", "lluvia", "primavera", "invierno", "otono", "verano", "galaxia", "codigo", "binario", "bosquejo"];
    let activeEffects = [];
    let toastTimer = null;
    let spawnCount = 0;

    /* ─── 19. TORNADO ─── */
    let tornadoTimer = null;
    let tornadoActiveTargets = [];
    const tornadoResetBtn = document.getElementById("tornado-reset");
    const TORNADO_DURATION = 30000;
    const TORNADO_SELECTOR = ".project-card, .skill-card, .cert-card, .note-card, .hero-frame, .module-card, .timeline-item, .formation-feature, .video-frame";

    function spawnOrbitParticles() {
        const container = document.querySelector(".fx-tornado");
        if (!container) return;
        clearOrbitParticles();
        const count = reducedMotion ? 0 : 7;
        for (let i = 0; i < count; i++) {
            const span = document.createElement("span");
            span.className = "tornado-orbit-particle";
            const r = 80 + Math.random() * 280;
            const d = 2.5 + Math.random() * 3.5;
            const delay = -Math.random() * 5;
            const size = 20 + Math.random() * 50;
            span.style.setProperty("--orbit-r", r + "px");
            span.style.setProperty("--orbit-d", d + "s");
            span.style.setProperty("--orbit-delay", delay + "s");
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
        shuffled.slice(0, looseCount).forEach(el => { el.classList.add("is-loose"); attachLooseCardDrag(el); });
        if (tornadoResetBtn) tornadoResetBtn.hidden = false;
        showToast("El tornado terminó · arrastrá las tarjetas sueltas para reordenar, o restablecé el orden");
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
            el.style.removeProperty("--tx");
            el.style.removeProperty("--ty");
            el.style.removeProperty("--rot");
            el.style.removeProperty("transform");
            el.style.removeProperty("animation");
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
    tornadoResetBtn?.addEventListener("click", () => removeEffect("tornado"));

    /* ─── 20. AGUJERO NEGRO ─── */
    function syncAgujero(list) {
        const active = list.includes("agujero");
        const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        document.querySelectorAll(".project-card, .hero-frame, .cert-card, .note-card, .timeline-item, .formation-feature, .module-card, .skill-card").forEach(el => {
            if (active && !el._pullSet) {
                const rect = el.getBoundingClientRect();
                const dx = center.x - (rect.left + rect.width / 2);
                const dy = center.y - (rect.top + rect.height / 2);
                const dist = Math.hypot(dx, dy) || 1;
                const pull = Math.min(36, dist * 0.09);
                el.style.setProperty("--pull-x", (dx / dist * pull).toFixed(1) + "px");
                el.style.setProperty("--pull-y", (dy / dist * pull).toFixed(1) + "px");
                el.style.setProperty("--pull-r", ((Math.random() - 0.5) * 5).toFixed(1) + "deg");
                el._pullSet = true;
            } else if (!active && el._pullSet) {
                el.style.removeProperty("--pull-x");
                el.style.removeProperty("--pull-y");
                el.style.removeProperty("--pull-r");
                el._pullSet = false;
            }
        });
    }

    /* ─── 21. BINARIO ─── */
    function toBinary(str) {
        return [...str].map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
    }
    function syncBinario(list) {
        const active = list.includes("binario");
        document.querySelectorAll("[data-binary]").forEach(el => {
            if (active && !el._binarioActive) {
                el._binarioActive = true;
                el._binarioOriginal = el.textContent;
                el.style.transition = "opacity .6s";
                el.style.opacity = "0";
                setTimeout(() => {
                    if (!el._binarioActive) return;
                    el.textContent = toBinary(el._binarioOriginal);
                    el.style.opacity = "1";
                }, 600);
            } else if (!active && el._binarioActive) {
                el._binarioActive = false;
                el.style.opacity = "0";
                setTimeout(() => {
                    if (el._binarioActive) return;
                    el.textContent = el._binarioOriginal;
                    el.style.opacity = "1";
                    setTimeout(() => el.style.transition = "", 600);
                }, 600);
            }
        });
    }

    /* ─── 22. SUPER ─── */
    const specialMusic = document.getElementById("special-music");
    const musicToggle = document.getElementById("music-toggle");
    let musicPlaying = false;
    let superTimer = null;
    function syncSuper(list) {
        const active = list.includes("super");
        clearTimeout(superTimer);
        if (active) {
            if (specialMusic && musicToggle) {
                specialMusic.currentTime = 0;
                const p = specialMusic.play();
                if (p && p.catch) p.then(() => { musicPlaying = true; musicToggle.hidden = true; })
                    .catch(() => { musicToggle.hidden = false; musicToggle.textContent = "♪ Activar música"; });
            }
            superTimer = setTimeout(() => removeEffect("super"), 20000);
        } else {
            if (specialMusic) { try { specialMusic.pause(); } catch (_) { } }
            musicPlaying = false;
            if (musicToggle) musicToggle.hidden = true;
        }
    }
    musicToggle?.addEventListener("click", () => {
        if (!specialMusic) return;
        if (musicPlaying) { specialMusic.pause(); musicPlaying = false; musicToggle.textContent = "♪ Reanudar música"; }
        else specialMusic.play().then(() => { musicPlaying = true; musicToggle.textContent = "⏸ Pausar música"; })
            .catch(() => { musicToggle.textContent = "♪ Activar música"; });
    });

    /* ─── 23. ANIMALES (shimeji) ─── */
    const animals = {
        cuervo: { el: document.querySelector('.shimeji[data-animal="cuervo"]'), x: window.innerWidth - 120, y: window.innerHeight - 140, vx: -0.4, vy: 0, frame: 0, states: ["assets/cuervo/cuervo_parado.png", "assets/cuervo/cuervo_alas_abiertas.png", "assets/cuervo/cuervo_alas_cerradas.png"] },
        zorro: { el: document.querySelector('.shimeji[data-animal="zorro"]'), x: 60, y: window.innerHeight - 140, vx: 0.6, vy: 0, frame: 0, states: ["assets/zorro/zorro_parado.png", "assets/zorro/zorro_caminando_1.png", "assets/zorro/zorro_caminando_2.png"] },
        mapache: { el: document.querySelector('.shimeji[data-animal="mapache"]'), x: window.innerWidth / 2, y: window.innerHeight - 140, vx: -0.5, vy: 0, frame: 0, states: ["assets/raccoon/raccoon_stay.png", "assets/raccoon/walk_raccoon_1.png", "assets/raccoon/walk_raccoon_2.png"] }
    };
    Object.values(animals).forEach(a => {
        if (!a.el) return;
        const img = a.el.querySelector(".shimeji-sprite");
        if (!img) return;
        img.addEventListener("load", () => a.el.classList.remove("is-missing"));
        img.addEventListener("error", () => a.el.classList.add("is-missing"));
        if (img.complete) { if (img.naturalWidth > 0) a.el.classList.remove("is-missing"); else a.el.classList.add("is-missing"); }
        a.el.addEventListener("click", () => { a.vx = (Math.random() - 0.5) * 4; a.vy = -2; });
    });
    let lastAnimTime = performance.now(), mouseX = -1, mouseY = -1;
    document.addEventListener("pointermove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });
    function animateAnimals(now) {
        const dt = Math.min(50, now - lastAnimTime) / 16;
        lastAnimTime = now;
        Object.values(animals).forEach(a => {
            if (!a.el || a.el.hidden) return;
            a.x += a.vx * dt; a.y += a.vy * dt; a.vy += 0.15 * dt;
            const floor = window.innerHeight - 110;
            if (a.y > floor) { a.y = floor; a.vy = 0; }
            if (a.x < 10) { a.x = 10; a.vx = Math.abs(a.vx); }
            if (a.x > window.innerWidth - 80) { a.x = window.innerWidth - 80; a.vx = -Math.abs(a.vx); }
            if (Math.random() < 0.005) a.vx = (Math.random() - 0.5) * 2;
            if (a.el.dataset.animal === "cuervo" && mouseX > 0) a.el.classList.toggle("is-flipped", mouseX < a.x + 32);
            else a.el.classList.toggle("is-flipped", a.vx < 0);
            a.frame = Math.floor(now / 300) % 3;
            const img = a.el.querySelector(".shimeji-sprite");
            if (img && a.states[a.frame] && img.src !== a.states[a.frame]) img.src = a.states[a.frame];
            a.el.style.transform = `translate(${a.x - 32}px, ${a.y - 80}px)`;
        });
        requestAnimationFrame(animateAnimals);
    }
    requestAnimationFrame(animateAnimals);
    function syncAnimals(list) {
        if (animals.cuervo?.el) animals.cuervo.el.hidden = !list.includes("cuervo");
        if (animals.zorro?.el) animals.zorro.el.hidden = !list.includes("zorro");
        if (animals.mapache?.el) animals.mapache.el.hidden = !list.includes("mapache");
    }

    /* ─── 24. GESTIÓN DE EFECTOS ─── */
    function applyEffects(list) {
        list = list.slice();
        const paletteIn = list.filter(e => PALETTE_EFFECTS.includes(e));
        if (paletteIn.length > 1) {
            const keep = paletteIn[paletteIn.length - 1];
            list = list.filter(e => !PALETTE_EFFECTS.includes(e) || e === keep);
        }
        if (list.includes("super")) list = ["super"];
        if (list.includes("tornado") && list.includes("agujero")) list = list.filter(e => e !== "tornado");
        if (list.length > 4) list = list.slice(-4);

        activeEffects = list;
        if (!list.length) delete document.body.dataset.effect;
        else document.body.dataset.effect = list.join(" ");

        const willTornado = list.includes("tornado");
        const wasTornado = document.body.classList.contains("tornado-active") || document.body.classList.contains("tornado-settled");
        if (willTornado && !wasTornado) startTornado();
        else if (!willTornado && wasTornado) stopTornado();

        syncAgujero(list);
        syncBinario(list);
        syncSuper(list);
        syncAnimals(list);

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

    function restoreOrigin(originEl) {
        if (!originEl) return;
        originEl.classList.remove("is-taken");
        if (originEl.classList.contains("float-letter")) {
            originEl.removeAttribute("aria-disabled");
            originEl.tabIndex = 0;
        }
    }
    function addChip(letter, originEl) {
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
        let st = null;
        chip.addEventListener("pointerdown", (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            st = { sx: e.clientX, id: e.pointerId, moved: false };
            window.addEventListener("pointermove", onMove, { passive: false });
            window.addEventListener("pointerup", onUp);
        });
        function onMove(e) {
            if (!st || e.pointerId !== st.id) return;
            if (!st.moved && Math.abs(e.clientX - st.sx) > 6) { st.moved = true; chip.classList.add("is-dragging"); chip.setPointerCapture?.(e.pointerId); }
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
            if (!st.moved) removeChip(chip); else checkWord();
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
        Array.from(trayInner.children).forEach(chip => { restoreOrigin(chip._originEl); chip.remove(); });
        tray.classList.remove("is-visible");
        applyEffects([]);
        spawnCount = 0;
    }
    function checkWord() {
        const word = normalize(Array.from(trayInner.children).map(c => c.dataset.letter).join(""));
        if (!word) return;
        const key = Object.keys(VOCABULARY).find(k => normalize(k) === word);
        if (!key) return;
        const eff = VOCABULARY[key].effect;
        activeEffects = activeEffects.filter(e => e !== eff);
        activeEffects.push(eff);
        applyEffects(activeEffects);
        markDiscovered(key);
        showToast(`encontraste ${VOCABULARY[key].label.toUpperCase()}`);
        setTimeout(() => {
            Array.from(trayInner.children).forEach(chip => { restoreOrigin(chip._originEl); chip.remove(); });
            if (trayInner.children.length === 0) tray.classList.remove("is-visible");
        }, 300);
    }
    function addEffect(key) {
        activeEffects = activeEffects.filter(e => e !== key);
        activeEffects.push(key);
        applyEffects(activeEffects);
    }
    function removeEffect(key) {
        activeEffects = activeEffects.filter(e => e !== key);
        applyEffects(activeEffects);
    }
    function showToast(text) {
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3800);
    }
    window.__portfolioAddChip = addChip;
    window.__portfolioCheckWord = checkWord;
    window.__portfolioShowToast = showToast;

    /* ─── 25. SECRETOS ─── */
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
    const secretsAnnouncer = document.getElementById("secrets-announcer");
    let activeFilter = "all", secretsOpen = false, secretsPrevFocus = null;

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
        nameEl.textContent = status === "discovered" ? entry.label.toUpperCase() : wordKey.split("").map((ch, i) => i === 0 ? ch : "·").join(" ");
        const statusEl = document.createElement("span");
        statusEl.className = "secret-card-status";
        statusEl.textContent = status === "discovered" ? "✓ descubierta" : "pendiente";
        const head = document.createElement("div");
        head.className = "secret-card-head";
        head.appendChild(nameEl); head.appendChild(statusEl);
        const cat = document.createElement("span");
        cat.className = "secret-card-category";
        cat.textContent = entry.category;
        const hint = document.createElement("p");
        hint.className = "secret-card-hint";
        hint.textContent = status === "discovered" ? `Desbloquea el efecto «${entry.label}».` : entry.hint;
        card.appendChild(head); card.appendChild(cat); card.appendChild(hint);
        return card;
    }
    function renderSecretsGrid() {
        if (!secretsGrid) return;
        secretsGrid.innerHTML = "";
        Object.keys(VOCABULARY).forEach(k => {
            if (activeFilter !== "all" && VOCABULARY[k].category !== activeFilter) return;
            secretsGrid.appendChild(renderSecretCard(k));
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
        if (secretsProgressFill) secretsProgressFill.style.width = (total === 0 ? 0 : Math.round((found / total) * 100)) + "%";
        if (secretsAnnouncer) secretsAnnouncer.textContent = `${found} de ${total} secretos descubiertos`;
        renderSecretsGrid();
    }
    function openSecrets() {
        if (!secretsModal) return;
        updateSecretsUI();
        secretsPrevFocus = document.activeElement;
        secretsModal.classList.add("is-open");
        secretsModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        secretsOpen = true;
        setTimeout(() => secretsModal.querySelector(".secrets-close")?.focus(), 80);
    }
    function closeSecrets() {
        if (!secretsModal) return;
        secretsModal.classList.remove("is-open");
        secretsModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        secretsOpen = false;
        secretsPrevFocus?.focus?.();
        secretsPrevFocus = null;
    }
    secretsBtn?.addEventListener("click", openSecrets);
    document.querySelectorAll("[data-close-secrets]").forEach(el => el.addEventListener("click", closeSecrets));
    document.addEventListener("keydown", (e) => {
        if (!secretsOpen) return;
        if (e.key === "Escape") { closeSecrets(); return; }
        if (e.key === "Tab") {
            const f = secretsModal.querySelectorAll('a[href], button:not([disabled])');
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
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

    /* ─── 26. LETRAS FLOTANTES ─── */
    const floatLetters = document.querySelectorAll(".float-letter");
    floatLetters.forEach(el => {
        const collect = () => {
            if (el.classList.contains("is-taken")) return;
            const letter = el.dataset.letter;
            if (!letter) return;
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

    /* ─── 27. DRAG REVEAL ─── */
    document.querySelectorAll(".drag-wrap").forEach(wrap => {
        const obj = wrap.querySelector("[data-drag-reveal]");
        const letter = wrap.querySelector(".letter");
        if (!obj || !letter) return;
        letter.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation();
            if (letter.classList.contains("is-taken")) return;
            letter.classList.add("is-taken");
            addChip(letter.dataset.letter, letter);
            checkWord();
        });
        let dx = 0, dy = 0, active = false, moved = false, pointerId = null;
        let startX = 0, startY = 0, baseDx = 0, baseDy = 0, returnTimer = null;
        function onDragMove(e) {
            if (!active || e.pointerId !== pointerId) return;
            const rawX = baseDx + (e.clientX - startX);
            const rawY = baseDy + (e.clientY - startY);
            if (!moved && Math.hypot(rawX - baseDx, rawY - baseDy) < 10) return;
            if (!moved) {
                moved = true;
                obj.classList.add("is-dragging");
                try { obj.setPointerCapture(e.pointerId); } catch (_) { }
                clearTimeout(returnTimer);
            }
            e.preventDefault();
            dx = Math.max(-120, Math.min(120, rawX));
            dy = Math.max(-120, Math.min(120, rawY));
            obj.style.setProperty("--rdx", dx + "px");
            obj.style.setProperty("--rdy", dy + "px");
            const isRevealed = Math.hypot(dx, dy) > 20;
            wrap.classList.toggle("is-revealed", isRevealed);
            if (isRevealed) letter.removeAttribute("inert");
            else if (!letter.classList.contains("is-taken")) letter.setAttribute("inert", "");
        }
        function onDragEnd(e) {
            if (!active) return;
            if (e.pointerId !== undefined && e.pointerId !== pointerId) return;
            active = false;
            window.removeEventListener("pointermove", onDragMove);
            window.removeEventListener("pointerup", onDragEnd);
            window.removeEventListener("pointercancel", onDragEnd);
            if (moved) {
                obj.classList.remove("is-dragging");
                try { obj.releasePointerCapture(pointerId); } catch (_) { }
                wrap.dataset.wasDragged = "true";
                setTimeout(() => { wrap.dataset.wasDragged = "false"; }, 100);
                clearTimeout(returnTimer);
                returnTimer = setTimeout(() => {
                    dx = 0; dy = 0;
                    obj.style.setProperty("--rdx", "0px");
                    obj.style.setProperty("--rdy", "0px");
                    wrap.classList.remove("is-revealed");
                    if (!letter.classList.contains("is-taken")) letter.setAttribute("inert", "");
                }, 8000);
            }
            pointerId = null;
        }
        obj.addEventListener("pointerdown", (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            if (document.body.classList.contains("tornado-active") || document.body.classList.contains("tornado-settled")) return;
            if (e.target.closest("a, button, input, select, textarea")) { if (!e.target.closest("summary")) return; }
            active = true; moved = false; pointerId = e.pointerId;
            startX = e.clientX; startY = e.clientY;
            baseDx = dx; baseDy = dy;
            window.addEventListener("pointermove", onDragMove, { passive: false });
            window.addEventListener("pointerup", onDragEnd);
            window.addEventListener("pointercancel", onDragEnd);
        });
        wrap.addEventListener("click", (e) => {
            if (wrap.dataset.wasDragged === "true") { e.stopPropagation(); e.preventDefault(); }
        }, true);
    });

    /* ─── 28. BANDEJA ─── */
    trayClear?.addEventListener("click", clearAll);
    trayAdd?.addEventListener("click", () => {
        if (spawnCount >= 40) { showToast("Muchas letras ya · limpiá para seguir"); return; }
        addChip(pickRandomLetter(), null);
        spawnCount++;
        checkWord();
    });
    trayReset?.addEventListener("click", () => {
        clearAll();
        floatLetters.forEach(el => { el.classList.remove("is-taken"); el.removeAttribute("aria-disabled"); el.tabIndex = 0; });
        if (letterBack) letterBack.classList.remove("is-taken");
        document.querySelectorAll(".drag-wrap").forEach(w => {
            w.classList.remove("is-revealed");
            const o = w.querySelector("[data-drag-reveal]");
            if (o) { o.style.setProperty("--rdx", "0px"); o.style.setProperty("--rdy", "0px"); }
            const l = w.querySelector(".letter--hidden");
            if (l && !l.classList.contains("is-taken")) l.setAttribute("inert", "");
        });
        document.querySelectorAll(".star[data-star-letter]").forEach(s => { s.classList.remove("is-revealed", "is-collected"); clearTimeout(s._revealTimer); });
        document.querySelectorAll(".hero-frame .letter--hidden").forEach(el => { if (!el.classList.contains("is-taken")) el.setAttribute("inert", ""); });
        if (starAPI) starAPI.clearConstellation();
        window.__resetStickyNote?.();
        spawnCount = 0;
        showToast("Todo en su lugar ✦");
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && activeEffects.length) {
            applyEffects([]);
            showToast("Efectos cerrados");
        }
    });

    /* ─── 29. CONSTELACIÓN → LETRA ─── */
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
        const connected = stars.filter(st => uids.has(st.dataset.uid));
        if (connected.length < 2) return null;
        const pts = connected.map(st => { const p = positions.get(st); return { x: p.x + size() / 2, y: p.y + size() / 2 }; });
        const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const w = maxX - minX || 1, h = maxY - minY || 1;
        const norm = pts.map(p => ({ x: (p.x - minX) / w, y: (p.y - minY) / h }));
        let best = null, bestScore = Infinity;
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
            if (score < bestScore) { bestScore = score; best = letter; }
        }
        return (best && bestScore < 0.055) ? best : null;
    }

    /* ─── BOOT ─── */
    generateSectionStars();
    generateFloatingCode();
    addProgrammingSymbols();
    initPhotoBug();
    generateWeatherParticles();
});