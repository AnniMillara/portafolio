/* js/black-hole.js
   Atrae y restaura los elementos + activa el fondo espacial. */
(function () {
    "use strict";

    const SWALLOW_SELECTOR = [
        ".hero-copy > *", ".hero-figure", ".hero-quote", ".hero-quote *", ".hero-scroll",
        ".stars-controls > *", ".section-marker", ".section-marker *", ".display",
        ".about-body > *", ".about-facts > *", ".about-aside > *",
        ".skill-card", ".project-card", ".formation-feature", ".module-card",
        ".timeline-item", ".cert-card", ".video-copy > *", ".video-frame",
        ".contact-copy > *", ".contact-list li", ".contact-sign",
        ".site-header", ".site-header *", ".site-footer", ".site-footer *",
        ".section-stars", ".code-symbols", ".hero-code-bug", ".photo-corner-deco",
        ".tape", ".sticky-note", ".hero-caption"
    ].join(", ");

    let swallowTimeouts = [];

    function ensureSpace() {
        let space = document.querySelector(".fx-space");
        if (!space) {
            space = document.createElement("div");
            space.className = "fx fx-space";
            space.setAttribute("aria-hidden", "true");
            const agujero = document.querySelector(".fx-agujero");
            if (agujero && agujero.parentNode) {
                agujero.parentNode.insertBefore(space, agujero);
            } else {
                document.body.appendChild(space);
            }
        }
        return space;
    }

    function applySwallow() {
        ensureSpace();
        const vcx = window.innerWidth / 2;
        const vcy = window.innerHeight / 2;
        const targets = document.querySelectorAll(SWALLOW_SELECTOR);
        const maxDist = Math.hypot(vcx, vcy);
        targets.forEach(el => {
            if (!el || el.hasAttribute("data-swallow")) return;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return;
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const dx = vcx - cx;
            const dy = vcy - cy;
            const dist = Math.hypot(dx, dy);
            const rel = dist / maxDist;
            el.style.setProperty("--swallow-tx", dx.toFixed(0) + "px");
            el.style.setProperty("--swallow-ty", dy.toFixed(0) + "px");
            el.style.setProperty("--swallow-scale", Math.max(0.02, 0.15 - rel * 0.1).toFixed(3));
            el.style.setProperty("--swallow-rotate", ((Math.random() - 0.5) * 360).toFixed(0) + "deg");
            el.style.setProperty("--swallow-delay", (rel * 0.8 + Math.random() * 0.3).toFixed(2) + "s");
            el.style.setProperty("--swallow-dur", (2.5 + Math.random() * 0.8).toFixed(2) + "s");
            el.setAttribute("data-swallow", "");
        });
        document.body.classList.add("is-swallowing");
    }

    function restoreSwallow() {
        document.body.classList.remove("is-swallowing");
        const targets = document.querySelectorAll("[data-swallow]");
        targets.forEach(el => {
            el.style.transition = "transform 1.6s cubic-bezier(.2,.8,.2,1), opacity 1.4s ease";
            el.style.transform = "none";
            el.style.opacity = "1";
        });
        swallowTimeouts.forEach(t => clearTimeout(t));
        swallowTimeouts = [];
        const t = setTimeout(() => {
            targets.forEach(el => {
                el.removeAttribute("data-swallow");
                el.style.removeProperty("--swallow-tx");
                el.style.removeProperty("--swallow-ty");
                el.style.removeProperty("--swallow-scale");
                el.style.removeProperty("--swallow-rotate");
                el.style.removeProperty("--swallow-delay");
                el.style.removeProperty("--swallow-dur");
                el.style.removeProperty("transform");
                el.style.removeProperty("opacity");
                el.style.removeProperty("transition");
            });
        }, 1700);
        swallowTimeouts.push(t);
    }

    function cleanupSpace() {
        const space = document.querySelector(".fx-space");
        if (space) space.remove();
    }

    window.BlackHole = { applySwallow, restoreSwallow, ensureSpace, cleanupSpace };
})();