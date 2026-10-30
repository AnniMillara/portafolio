/* js/interactions.js
   Menú, filtros, modales, drag reveal, sticky, expandables, float letters. */
(function () {
    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ─── Tema ─── */
    function initTheme() {
        const root = document.documentElement;
        const toggle = document.querySelector(".theme-toggle");
        const saved = localStorage.getItem("theme");
        if (saved === "dark" || saved === "light") root.dataset.theme = saved;
        else if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.dataset.theme = "dark";
        toggle?.addEventListener("click", () => {
            const next = root.dataset.theme === "dark" ? "light" : "dark";
            root.dataset.theme = next;
            localStorage.setItem("theme", next);
        });
    }

    /* ─── Menú ─── */
    function initMenu() {
        const menuToggle = document.querySelector(".menu-toggle");
        const nav = document.getElementById("main-nav");
        if (!menuToggle || !nav) return;
        menuToggle.addEventListener("click", () => {
            const open = nav.classList.toggle("is-open");
            menuToggle.setAttribute("aria-expanded", String(open));
            menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
        });
        nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
            nav.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
        }));
        window.matchMedia("(min-width: 801px)").addEventListener("change", (e) => {
            if (e.matches) { nav.classList.remove("is-open"); menuToggle.setAttribute("aria-expanded", "false"); }
        });
    }

    /* ─── Filtros ─── */
    function initFilters() {
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
    }

    /* ─── Skill → proyecto ─── */
    function initSkillRelated() {
        const relatedMap = window.PORTFOLIO_RELATED;
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
    }

    /* ─── Frame flip ─── */
    function initFrameFlip() {
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
    }

    /* ─── Expandibles ─── */
    function initExpandables() {
        document.querySelectorAll("[data-expandable]").forEach(el => {
            el.addEventListener("click", () => {
                if (el.dataset.wasDragged === "true") return;
                el.setAttribute("aria-expanded", String(el.getAttribute("aria-expanded") !== "true"));
            });
        });
    }

    /* ─── Sticky note ─── */
    function initSticky() {
        const sticky = document.querySelector(".sticky-note");
        if (!sticky) return;
        const STORAGE_KEY = "sticky-note-pos-v3";
        let cx = 0, cy = 0, drag = null;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const pos = JSON.parse(saved);
                if (typeof pos.x === "number" && typeof pos.y === "number") {
                    cx = pos.x; cy = pos.y;
                    sticky.style.setProperty("--sticky-x", cx + "px");
                    sticky.style.setProperty("--sticky-y", cy + "px");
                }
            }
        } catch (_) {}
        sticky.addEventListener("pointerdown", (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            delete sticky.dataset.wasDragged;
            drag = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, baseX: cx, baseY: cy, moved: false };
            try { sticky.setPointerCapture(e.pointerId); } catch (_) {}
        });
        sticky.addEventListener("pointermove", (e) => {
            if (!drag || e.pointerId !== drag.pointerId) return;
            const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
            if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; sticky.classList.add("is-dragging"); }
            if (!drag.moved) return;
            e.preventDefault();
            cx = drag.baseX + dx; cy = drag.baseY + dy;
            sticky.style.setProperty("--sticky-x", cx + "px");
            sticky.style.setProperty("--sticky-y", cy + "px");
        });
        const endDrag = (e) => {
            if (!drag || e.pointerId !== drag.pointerId) return;
            try { sticky.releasePointerCapture(e.pointerId); } catch (_) {}
            if (drag.moved) {
                sticky.dataset.wasDragged = "true";
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: cx, y: cy })); } catch (_) {}
            }
            sticky.classList.remove("is-dragging");
            drag = null;
        };
        sticky.addEventListener("pointerup", endDrag);
        sticky.addEventListener("pointercancel", endDrag);
        window.__resetStickyNote = () => {
            cx = 0; cy = 0;
            sticky.style.setProperty("--sticky-x", "0px");
            sticky.style.setProperty("--sticky-y", "0px");
            try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        };
    }

    /* ─── Detalle de proyecto ─── */
    function initProjectDetails() {
        const detail = document.getElementById("detail");
        const content = document.getElementById("detail-content");
        let prevFocus = null, isOpen = false;

        function open(card) {
            if (!card || card.dataset.wasDragged === "true") return;
            prevFocus = document.activeElement;
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

            content.innerHTML = "";
            if (media) {
                const wrap = document.createElement("div");
                wrap.className = "detail-media";
                const clone = media.cloneNode(true);
                clone.setAttribute("aria-hidden", "true");
                clone.tabIndex = -1;
                wrap.appendChild(clone);
                content.appendChild(wrap);
                clone.querySelectorAll(".project-img, .project-bg").forEach(el => el.classList.add("is-loaded"));
                const imgInClone = clone.querySelector("img.project-img");
                const bgInClone = clone.querySelector(".project-bg");
                if (imgInClone && bgInClone) {
                    const src = imgInClone.currentSrc || imgInClone.src;
                    if (src) bgInClone.style.backgroundImage = `url("${src}")`;
                }
                clone.querySelectorAll("video").forEach(v => {
                    try { v.muted = true; v.play?.().catch(() => {}); } catch (_) {}
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
                    a.addEventListener("click", () => { if (!l.external) setTimeout(close, 150); });
                    wrap.appendChild(a);
                });
                info.appendChild(wrap);
            }
            content.appendChild(info);
            detail.classList.add("is-open");
            detail.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            isOpen = true;
            setTimeout(() => detail.querySelector(".detail-close")?.focus(), 80);
        }
        function close() {
            if (!isOpen) return;
            detail.classList.remove("is-open");
            detail.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
            isOpen = false;
            prevFocus?.focus?.();
            prevFocus = null;
        }

        document.querySelectorAll(".project-media").forEach(m => m.addEventListener("click", () => {
            const card = m.closest(".project-card");
            if (card?.dataset.wasDragged === "true") return;
            open(card);
        }));
        document.querySelectorAll("[data-close-detail]").forEach(el => el.addEventListener("click", close));
        document.addEventListener("keydown", (e) => {
            if (!isOpen) return;
            if (e.key === "Escape") { close(); return; }
        });
    }

    /* ─── Reveal ─── */
    function initReveal() {
        const items = document.querySelectorAll("[data-reveal]");
        if ("IntersectionObserver" in window && !reducedMotion) {
            const obs = new IntersectionObserver((entries, o) => {
                entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); o.unobserve(e.target); } });
            }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
            items.forEach(el => obs.observe(el));
        } else {
            items.forEach(el => el.classList.add("is-visible"));
        }
    }

    /* ─── Tilt ─── */
    function initTilt() {
        if (reducedMotion) return;
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
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

    /* ─── Video ─── */
    function initVideo() {
        const video = document.querySelector(".video-el");
        const placeholder = document.querySelector(".video-placeholder");
        if (!video || !placeholder) return;
        video.addEventListener("loadeddata", () => { video.classList.add("is-loaded"); placeholder.hidden = true; });
        video.addEventListener("error", () => { video.classList.remove("is-loaded"); placeholder.hidden = false; }, true);
        if (video.readyState >= 2) { video.classList.add("is-loaded"); placeholder.hidden = true; }
    }

    /* ─── Medios ─── */
    function initMedia() {
        function init(selector) {
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
                        try { bg.muted = true; bg.play?.().catch(() => {}); } catch (_) {}
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
                        try { bg.muted = true; bg.play?.().catch(() => {}); } catch (_) {}
                    }
                } else {
                    el.addEventListener("load", mark);
                    el.addEventListener("error", fail);
                    if (el.complete) { if (el.naturalWidth > 0) mark(); else fail(); }
                }
            });
        }
        init(".project-img");
        init(".hero-photo-img");
    }

    /* ─── Año ─── */
    function initYear() {
        document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
    }

    /* ─── Float letters (con pausa + atenuación) ─── */
    function initFloatLetters() {
        document.querySelectorAll(".float-letter[data-letter]").forEach(el => {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (el.classList.contains("is-taken") || el.classList.contains("is-collecting")) return;
                const letter = el.dataset.letter;
                if (!letter) return;

                // Encontrar el texto contenedor (título / párrafo / nav)
                const container = el.closest(
                    ".hero-title, .display, .hero-lead, .hero-hand, .kicker, .hero-quote p, " +
                    ".about-body p, .project-desc, .skill-body p, .timeline-body p, " +
                    ".contact-copy p, .site-footer p, .nav a"
                ) || el.parentElement;

                document.body.classList.add("is-pausing-for-letter");
                el.classList.add("is-collecting");
                if (container) container.classList.add("is-discovering-text");
                window.AudioManager.playLetterChime();

                setTimeout(() => {
                    el.classList.remove("is-collecting");
                    el.classList.add("is-taken");
                    el.setAttribute("aria-disabled", "true");
                    el.tabIndex = -1;
                    if (container) container.classList.remove("is-discovering-text");
                    window.__portfolioAddChip?.(letter, el);
                    window.__portfolioCheckWord?.();
                    setTimeout(() => {
                        document.body.classList.remove("is-pausing-for-letter");
                    }, 400);
                }, 500);
            });
        });

        // Botón letter--back (reverso del frame)
        document.querySelectorAll(".letter--back").forEach(letterBack => {
            letterBack.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (letterBack.classList.contains("is-taken")) return;
                letterBack.classList.add("is-taken");
                window.__portfolioAddChip?.(letterBack.dataset.letter, letterBack);
                window.__portfolioCheckWord?.();
            });
        });
    }

    /* ─── Drag reveal ─── */
    function initDragReveal() {
        document.querySelectorAll(".drag-wrap").forEach(wrap => {
            const obj = wrap.querySelector("[data-drag-reveal]");
            const letter = wrap.querySelector(".letter");
            if (!obj || !letter) return;
            letter.addEventListener("click", (e) => {
                e.preventDefault(); e.stopPropagation();
                if (letter.classList.contains("is-taken")) return;
                letter.classList.add("is-taken");
                window.__portfolioAddChip?.(letter.dataset.letter, letter);
                window.__portfolioCheckWord?.();
            });
            let dx = 0, dy = 0, active = false, moved = false, pointerId = null;
            let startX = 0, startY = 0, baseDx = 0, baseDy = 0, returnTimer = null;
            function onMove(e) {
                if (!active || e.pointerId !== pointerId) return;
                const rawX = baseDx + (e.clientX - startX);
                const rawY = baseDy + (e.clientY - startY);
                if (!moved && Math.hypot(rawX - baseDx, rawY - baseDy) < 10) return;
                if (!moved) {
                    moved = true;
                    obj.classList.add("is-dragging");
                    try { obj.setPointerCapture(e.pointerId); } catch (_) {}
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
            function onUp(e) {
                if (!active) return;
                if (e.pointerId !== undefined && e.pointerId !== pointerId) return;
                active = false;
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
                window.removeEventListener("pointercancel", onUp);
                if (moved) {
                    obj.classList.remove("is-dragging");
                    try { obj.releasePointerCapture(pointerId); } catch (_) {}
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
                if (document.body.classList.contains("is-swallowing")) return;
                if (e.target.closest("a, button, input, select, textarea")) {
                    if (!e.target.closest("summary")) return;
                }
                active = true; moved = false; pointerId = e.pointerId;
                startX = e.clientX; startY = e.clientY;
                baseDx = dx; baseDy = dy;
                window.addEventListener("pointermove", onMove, { passive: false });
                window.addEventListener("pointerup", onUp);
                window.addEventListener("pointercancel", onUp);
            });
            wrap.addEventListener("click", (e) => {
                if (wrap.dataset.wasDragged === "true") { e.stopPropagation(); e.preventDefault(); }
            }, true);
        });
    }

    /* ─── Generadores decorativos ─── */
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

    function generateFloatingCode() {
        const targets = [
            { sel: "#inicio, #start", count: 3 },
            { sel: "#habilidades, #skills", count: 2 },
            { sel: "#proyectos, #projects", count: 2 },
            { sel: "#proceso, #process", count: 2 }
        ];
        const symbols = ["{ }","</>","=>","<div>",".map()","if()","const","async","01",";","fn()","return","[]","()","<>","def","null","&&","||","===","<h1>","let","var","SELECT","{}","</>"];
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
                sym.style.left = edge === "right" ? (78 + Math.random() * 15) + "%" : (2 + Math.random() * 12) + "%";
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

    function init() {
        initTheme();
        initMenu();
        initFilters();
        initSkillRelated();
        initFrameFlip();
        initExpandables();
        initSticky();
        initProjectDetails();
        initReveal();
        initTilt();
        initVideo();
        initMedia();
        initYear();
        initFloatLetters();
        initDragReveal();
        generateSectionStars();
        generateFloatingCode();
        addProgrammingSymbols();
    }

    window.Interactions = { init };
})();