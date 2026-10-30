/* js/effects-extra.js
   Toggles visuales reactivos a data-effect para CÓDIGO y BINARIO. */
(function () {
    "use strict";

    let codeActive = false;
    let binarioActive = false;

    function currentEffects() {
        return (document.body.dataset.effect || "").split(/\s+/).filter(Boolean);
    }

    function syncCodeMode(active) {
        if (active === codeActive) return;
        codeActive = active;
        if (active) activateCode(); else deactivateCode();
    }
    function syncBinarioMode(active) {
        if (active === binarioActive) return;
        binarioActive = active;
        if (active) activateBinario(); else deactivateBinario();
    }

    function getPositionedContainer(el) {
        const candidate = el.closest(".project-media, .hero-photo, .video-inner, .video-frame");
        if (candidate) return candidate;
        return el.parentElement;
    }

    function ensurePositioned(container) {
        if (!container) return;
        const cs = window.getComputedStyle(container);
        if (cs.position === "static") {
            container.style.position = "relative";
            container.dataset.codePositionAdded = "1";
        }
    }

    function makePlaceholder(text) {
        const placeholder = document.createElement("span");
        placeholder.className = "code-img-placeholder";
        placeholder.textContent = text;
        return placeholder;
    }

    function activateCode() {
        document.body.classList.add("is-code-mode");

        const tagSel = "h1,h2,h3,h4,h5,h6,p,li,summary,dd,dt,cite,blockquote";
        document.querySelectorAll(tagSel).forEach(el => {
            if (el.dataset.codeTag) return;
            if (el.closest(".code-mode-header")) return;
            if (el.closest(".code-img-placeholder")) return;
            el.dataset.codeTag = el.tagName.toLowerCase();
        });

        document.querySelectorAll("a[href]:not(.skip-link)").forEach(el => {
            if (el.dataset.codeTag) return;
            if (el.closest(".float-letter")) return;
            if (el.closest(".code-mode-header")) return;
            el.dataset.codeTag = "a";
        });

        document.querySelectorAll("img").forEach(img => {
            if (img.dataset.codeTag) return;
            if (img.closest(".code-mode-header")) return;
            if (img.closest(".code-img-placeholder")) return;
            if (img.classList.contains("project-bg")) return;

            let src = (img.getAttribute("src") || "").split("/").pop();
            const alt = img.getAttribute("alt") || "";
            const text = alt
                ? `<img src="${src}" alt="${alt}">`
                : `<img src="${src}">`;
            const placeholder = makePlaceholder(text);

            const container = getPositionedContainer(img);
            if (!container) return;
            ensurePositioned(container);
            container.appendChild(placeholder);

            img.dataset.codeTag = "img";
            img.dataset.codeSrc = src;
            img.dataset.codeAlt = alt;
            img._codePlaceholder = placeholder;
            img.style.display = "none";
        });

        document.querySelectorAll("video").forEach(vid => {
            if (vid.dataset.codeTag) return;
            if (vid.closest(".code-mode-header")) return;
            if (vid.closest(".super-band")) return;
            if (vid.classList.contains("project-bg")) return;

            let src = vid.getAttribute("src") || "";
            if (!src) {
                const srcEl = vid.querySelector("source");
                if (srcEl) src = srcEl.getAttribute("src") || "";
            }
            src = src.split("/").pop();
            const placeholder = makePlaceholder(`<video src="${src}">`);

            const container = getPositionedContainer(vid);
            if (!container) return;
            ensurePositioned(container);
            container.appendChild(placeholder);

            vid.dataset.codeTag = "video";
            vid.dataset.codeSrc = src;
            vid._codePlaceholder = placeholder;
            vid.style.display = "none";
        });

        if (!document.getElementById("code-mode-header")) {
            const hdr = document.createElement("div");
            hdr.id = "code-mode-header";
            hdr.className = "code-mode-header";
            hdr.setAttribute("aria-hidden", "true");
            hdr.innerHTML = '<span class="cmd">~/portafolio $</span> <span class="cmd-arg">cat index.html</span>';
            document.body.appendChild(hdr);
        }
    }

    function deactivateCode() {
        document.body.classList.remove("is-code-mode");
        document.querySelectorAll("[data-code-tag]").forEach(el => {
            if (el._codePlaceholder && el._codePlaceholder.parentNode) {
                el._codePlaceholder.remove();
            }
            delete el._codePlaceholder;
            if (el.tagName === "IMG" || el.tagName === "VIDEO") {
                el.style.display = "";
            }
            delete el.dataset.codeTag;
            delete el.dataset.codeSrc;
            delete el.dataset.codeAlt;
            el.classList.remove("code-as-text");
        });
        document.querySelectorAll(".code-img-placeholder").forEach(p => p.remove());
        document.querySelectorAll("[data-code-position-added]").forEach(el => {
            el.style.position = "";
            delete el.dataset.codePositionAdded;
        });
        const hdr = document.getElementById("code-mode-header");
        if (hdr) hdr.remove();
    }

    function activateBinario() {
        document.body.classList.add("is-binario-cmd");
        if (!document.getElementById("binario-cmd-header")) {
            const hdr = document.createElement("div");
            hdr.id = "binario-cmd-header";
            hdr.className = "binario-cmd-header";
            hdr.setAttribute("aria-hidden", "true");
            hdr.innerHTML = [
                '<div class="cmd-line">',
                '  <span class="cmd-prompt">C:\\PORTAFOLIO&gt;</span>',
                '  <span class="cmd-text">initializing binary mode...</span>',
                '  <span class="cmd-cursor"></span>',
                '</div>',
                '<div class="cmd-line cmd-status">',
                '  <span>STATUS: OK</span>',
                '  <span>ENCODING: UTF-8 → BIN</span>',
                '  <span>PROCESSING...</span>',
                '</div>'
            ].join("");
            document.body.appendChild(hdr);
        }
    }
    function deactivateBinario() {
        document.body.classList.remove("is-binario-cmd");
        const hdr = document.getElementById("binario-cmd-header");
        if (hdr) hdr.remove();
    }

    function init() {
        const observer = new MutationObserver(() => {
            const effects = currentEffects();
            syncCodeMode(effects.includes("codigo"));
            syncBinarioMode(effects.includes("binario"));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ["data-effect"] });
        const initEffects = currentEffects();
        if (initEffects.includes("codigo")) syncCodeMode(true);
        if (initEffects.includes("binario")) syncBinarioMode(true);
    }

    window.EffectsExtra = { init };
})();