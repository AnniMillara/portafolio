/* js/bug.js
   Minijuego del bug. Ahora la animación de las patas y el cuerpo están
   sincronizadas con la duración real del viaje (--leg-speed). */
(function () {
    "use strict";

    const SVG_NS = "http://www.w3.org/2000/svg";

    const BUG_SVG = `
        <svg viewBox="0 0 16 16" width="100%" height="100%" fill="none"
             stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
            <g class="bug-antennas">
                <path d="M8 6v-1M6.4 3.2 5 2M9.6 3.2 11 2"/>
            </g>
            <ellipse class="bug-body" cx="8" cy="9" rx="3.2" ry="3.8"/>
            <circle class="bug-head" cx="8" cy="4.6" r="1.6"/>
            <g class="bug-leg bug-leg-l1"><path d="M6 7.6 3 6.8"/></g>
            <g class="bug-leg bug-leg-l2"><path d="M5.8 9.5H2"/></g>
            <g class="bug-leg bug-leg-l3"><path d="M6 11.4 3 12.2"/></g>
            <g class="bug-leg bug-leg-r1"><path d="M10 7.6 13 6.8"/></g>
            <g class="bug-leg bug-leg-r2"><path d="M10.2 9.5H14"/></g>
            <g class="bug-leg bug-leg-r3"><path d="M10 11.4 13 12.2"/></g>
        </svg>
    `;

    function init() {
        const bug = document.querySelector(".hero-code-bug");
        if (!bug) return;
        const img = document.querySelector(".hero-photo-img");
        const photo = document.querySelector(".hero-photo");
        if (!img || !photo) return;

        // Reconstruir SVG con clases para animar patas
        bug.innerHTML = BUG_SVG;
        bug.classList.add("bug-ready");

        let svg = photo.querySelector(".hero-photo-mask");
        if (!svg) {
            svg = document.createElementNS(SVG_NS, "svg");
            svg.setAttribute("class", "hero-photo-mask");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
            photo.appendChild(svg);
        }

        let bites = [], busy = false, eaten = false, imgReady = false;
        let W = 1, H = 1;

        function setupMask() {
            const rect = photo.getBoundingClientRect();
            W = Math.max(1, rect.width); H = Math.max(1, rect.height);
            svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
            const src = img.currentSrc || img.src;
            svg.innerHTML = `
                <defs>
                    <mask id="hero-photo-mordida" maskUnits="userSpaceOnUse"
                          x="0" y="0" width="${W}" height="${H}">
                        <rect x="0" y="0" width="${W}" height="${H}" fill="white"/>
                        <g id="hero-photo-bites" fill="black"></g>
                    </mask>
                </defs>
                <image href="${src}" x="0" y="0" width="${W}" height="${H}"
                       preserveAspectRatio="xMidYMid slice"
                       mask="url(#hero-photo-mordida)"
                       style="pointer-events:none;"/>
            `;
            img.style.opacity = "0";
        }

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
                pts.push({ x: cx + Math.cos(a) * rr * dent, y: cy + Math.sin(a) * rr * dent });
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
            const path = document.createElementNS(SVG_NS, "path");
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

        function biteRadius() {
            const area = W * H;
            const targetBites = 10 + Math.floor(Math.random() * 3);
            const r = Math.sqrt(area / (targetBites * Math.PI)) * 1.35;
            return r * (0.8 + Math.random() * 0.4);
        }

        const GRID_COLS = 32, GRID_ROWS = 40;
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
            const cellW = W / GRID_COLS, cellH = H / GRID_ROWS;
            bites.forEach(b => {
                const rCellsX = b.r / cellW, rCellsY = b.r / cellH;
                const gx = b.cx / cellW, gy = b.cy / cellH;
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
            const cellW = W / GRID_COLS, cellH = H / GRID_ROWS;
            const gx = px / cellW, gy = py / cellH;
            let best = null, bestD = Infinity;
            for (let y = 0; y < GRID_ROWS; y++) {
                for (let x = 0; x < GRID_COLS; x++) {
                    if (!grid[y][x]) continue;
                    const dx = (x + 0.5) - gx, dy = (y + 0.5) - gy;
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
            return {
                x: br.left + br.width / 2 - pr.left,
                y: br.top + br.height / 2 - pr.top
            };
        }
        function pickNextBite() {
            const live = countLive();
            const bp = bugPos();
            const cellW = W / GRID_COLS, cellH = H / GRID_ROWS;
            if (live < 12) {
                const t = nearestLive(bp.x, bp.y);
                if (t) return t;
            }
            if (Math.random() < 0.25) {
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

        const bugHome = {
            left: getComputedStyle(bug).left,
            top: getComputedStyle(bug).top,
            right: getComputedStyle(bug).right
        };

        /* --- Mover el bug a un punto, ajustando velocidad de patas --- */
        function moveBugTo(xPct, yPct, durMs, angleDeg) {
            const bs = bug.offsetWidth || 32;
            // Ciclo de las patas: cuanto más rápido, más corto.
            // rango: caminar lento 0.55s, correr rápido 0.20s
            const legSpeed = Math.max(0.20, Math.min(0.55, 0.55 - (2000 - Math.min(durMs, 2000)) / 2000 * 0.35));
            bug.style.setProperty("--leg-speed", legSpeed.toFixed(2) + "s");
            bug.style.setProperty("--body-bob", Math.max(1, 2 - durMs / 800).toFixed(1) + "px");
            bug.style.transition =
                `left ${durMs}ms cubic-bezier(.45,.05,.55,.95), top ${durMs}ms cubic-bezier(.45,.05,.55,.95)`;
            bug.style.left = `calc(${(xPct * 100).toFixed(2)}% - ${bs / 2}px)`;
            bug.style.top = `calc(${(yPct * 100).toFixed(2)}% - ${bs / 2}px)`;
            bug.style.right = "auto";
            bug.style.setProperty("--bug-angle", (angleDeg + 90).toFixed(1) + "deg");
            bug.classList.add("is-walking");
            clearTimeout(bug._walkTimer);
            bug._walkTimer = setTimeout(() => {
                bug.classList.remove("is-walking");
                bug.style.removeProperty("--bug-angle");
                bug.style.setProperty("--leg-speed", "0.55s");
            }, durMs);
        }

        function returnBugHome() {
            const dur = 1400;
            const legSpeed = 0.40;
            bug.style.setProperty("--leg-speed", legSpeed + "s");
            bug.style.setProperty("--body-bob", "1.5px");
            bug.style.transition =
                `left ${dur}ms cubic-bezier(.45,.05,.55,.95), top ${dur}ms cubic-bezier(.45,.05,.55,.95)`;
            bug.style.left = bugHome.left;
            bug.style.top = bugHome.top;
            bug.style.right = bugHome.right;
            bug.style.removeProperty("--bug-angle");
            bug.classList.add("is-walking");
            clearTimeout(bug._walkTimer);
            bug._walkTimer = setTimeout(() => {
                bug.classList.remove("is-walking");
                bug.style.setProperty("--leg-speed", "0.55s");
            }, dur);
        }

        function doBite(target) {
            const r = biteRadius();
            const bite = {
                cx: target.cx, cy: target.cy, r,
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
                setTimeout(vomitAll, 900);
                return;
            }
            const cur = bugPos();
            const dx = target.cx - cur.x;
            const dy = target.cy - cur.y;
            const dist = Math.hypot(dx, dy);
            const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
            // Más lejos = más rápido; dur crece sublinealmente con la distancia
            const dur = Math.min(1800, Math.max(400, 300 + dist * 1.2));
            moveBugTo(target.cx / W, target.cy / H, dur, angleDeg);
            setTimeout(() => {
                doBite(target);
                const live = countLive(), total = GRID_COLS * GRID_ROWS;
                if (live === 0 || live / total < 0.04) {
                    eaten = true; busy = true;
                    setTimeout(vomitAll, 900);
                }
            }, dur);
        }

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
            fctx.drawImage(img,
                (bite.cx - half) / W * img.naturalWidth,
                (bite.cy - half) / H * img.naturalHeight,
                size / W * img.naturalWidth,
                size / H * img.naturalHeight,
                0, 0, size * 2, size * 2);
            fctx.restore();
            const destX = photoRect.left + bite.cx - half;
            const destY = photoRect.top + bite.cy - half;
            frag.style.left = (mouthX - half) + "px";
            frag.style.top = (mouthY - half) + "px";
            frag.style.transform = "scale(.35) rotate(" + (Math.random() * 60 - 30) + "deg)";
            document.body.appendChild(frag);
            requestAnimationFrame(() => {
                frag.style.transition =
                    "left .55s cubic-bezier(.2,.8,.2,1), top .55s cubic-bezier(.2,.8,.2,1), " +
                    "transform .55s cubic-bezier(.2,.8,.2,1), opacity .3s ease .35s";
                frag.style.left = destX + "px";
                frag.style.top = destY + "px";
                frag.style.transform = "scale(1) rotate(0deg)";
                frag.style.opacity = "0.9";
            });
            setTimeout(() => {
                const idx = bites.indexOf(bite);
                if (idx >= 0) { bites.splice(idx, 1); redrawBites(); rebuildGrid(); }
                frag.style.opacity = "0";
                setTimeout(() => frag.remove(), 300);
            }, 600);
        }

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

    window.Bug = { init };
})();