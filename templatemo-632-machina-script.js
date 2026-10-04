/*
  Machina Template
  https://templatemo.com/tm-632-machina
*/

(function() {
    'use strict';

    /* ---------------------------------------------------------- */
    /* SHARED STATE                                                */
    /* ---------------------------------------------------------- */

    var mqMobile = window.matchMedia('(max-width: 900px)');
    var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
    var BLOCKS = 4;

    var vh = window.innerHeight;
    var maxScroll = (BLOCKS - 1) * vh;

    var target = 0;
    var current = 0;
    var engineOn = false;

    var hudBar = document.getElementById('hud-bar');
    var hudPct = document.getElementById('hud-pct');
    var hudBlock = document.getElementById('hud-block');
    var hudHint = document.getElementById('hud-hint');
    var arrowUp = document.getElementById('arrow-up');
    var arrowDown = document.getElementById('arrow-down');
    var hintGone = false;

    function dismissHint() {
        if (hintGone || !hudHint) {
            return;
        }
        hintGone = true;
        hudHint.classList.add('hide');
    }

    function clamp(v, a, b) {
        return Math.min(b, Math.max(a, v));
    }

    function pad(n, w) {
        var s = String(n);
        while (s.length < w) {
            s = '0' + s;
        }
        return s;
    }

    /* ---------------------------------------------------------- */
    /* VIRTUAL SCROLL ENGINE - inverse twin tracks with lerp       */
    /* ---------------------------------------------------------- */

    function applyTransforms() {
        var i, p, idx, y;
        for (i = 0; i < panels.length; i++) {
            p = panels[i];
            idx = parseInt(p.getAttribute('data-i'), 10);
            if (p.classList.contains('t-left')) {
                y = idx * vh - current; /* left track travels up on scroll down */
            } else {
                y = current - idx * vh; /* right track travels down on scroll down */
            }
            p.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
        }
    }

    function updateHud(ratio) {
        var pct = Math.round(clamp(ratio, 0, 1) * 100);
        if (hudPct) {
            hudPct.textContent = pad(pct, 3) + '%';
        }
        if (hudBar) {
            hudBar.style.transform = 'scaleX(' + (pct / 100) + ')';
        }
        if (hudBlock) {
            var blk = clamp(Math.round(ratio * (BLOCKS - 1)), 0, BLOCKS - 1) + 1;
            hudBlock.textContent = pad(blk, 2);
        }
        if (arrowUp) {
            arrowUp.disabled = target < vh * 0.5;
        }
        if (arrowDown) {
            arrowDown.disabled = target > maxScroll - vh * 0.5;
        }
    }

    function engineLoop() {
        if (!engineOn) {
            return;
        }
        var ease = mqReduce.matches ? 1 : 0.085; /* heavy buttery lerp, instant if reduced */
        current += (target - current) * ease;
        if (Math.abs(target - current) < 0.05) {
            current = target;
        }
        applyTransforms();
        updateHud(maxScroll > 0 ? current / maxScroll : 0);
        window.requestAnimationFrame(engineLoop);
    }

    function onWheel(e) {
        if (!engineOn) {
            return;
        }
        e.preventDefault();
        dismissHint();
        var d = e.deltaY;
        if (e.deltaMode === 1) {
            d *= 16;
        }
        if (e.deltaMode === 2) {
            d *= vh;
        }
        target = clamp(target + d, 0, maxScroll);
    }

    var touchY = null;

    function onTouchStart(e) {
        if (!engineOn) {
            return;
        }
        touchY = e.touches[0].clientY;
    }

    function onTouchMove(e) {
        if (!engineOn || touchY === null || c3dDragging) {
            return;
        }
        e.preventDefault();
        dismissHint();
        var y = e.touches[0].clientY;
        target = clamp(target + (touchY - y) * 1.7, 0, maxScroll);
        touchY = y;
    }

    function onTouchEnd() {
        touchY = null;
    }

    function snapTo(block) {
        target = clamp(block, 0, BLOCKS - 1) * vh;
    }

    function arrowStep(dir) {
        if (!engineOn) {
            return;
        }
        dismissHint();
        snapTo(Math.round(target / vh) + dir);
    }

    if (arrowUp) {
        arrowUp.addEventListener('click', function() {
            arrowStep(-1);
        });
    }
    if (arrowDown) {
        arrowDown.addEventListener('click', function() {
            arrowStep(1);
        });
    }

    function onKey(e) {
        if (!engineOn) {
            return;
        }
        var navKeys = ['ArrowDown', 'PageDown', ' ', 'ArrowUp', 'PageUp', 'Home', 'End'];
        if (navKeys.indexOf(e.key) !== -1) {
            dismissHint();
        }
        var blk = Math.round(target / vh);
        switch (e.key) {
            case 'ArrowDown':
            case 'PageDown':
            case ' ':
                e.preventDefault();
                snapTo(blk + 1);
                break;
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                snapTo(blk - 1);
                break;
            case 'Home':
                e.preventDefault();
                snapTo(0);
                break;
            case 'End':
                e.preventDefault();
                snapTo(BLOCKS - 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                c3dStepRot(1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                c3dStepRot(-1);
                break;
        }
    }

    function startEngine() {
        if (engineOn) {
            return;
        }
        engineOn = true;
        vh = window.innerHeight;
        maxScroll = (BLOCKS - 1) * vh;
        target = clamp(target, 0, maxScroll);
        current = target;
        applyTransforms();
        window.requestAnimationFrame(engineLoop);
    }

    function stopEngine() {
        engineOn = false;
        var i;
        for (i = 0; i < panels.length; i++) {
            panels[i].style.transform = '';
        }
    }

    function setMode() {
        if (mqMobile.matches) {
            stopEngine();
        } else {
            startEngine();
        }
    }

    window.addEventListener('wheel', onWheel, {
        passive: false
    });
    window.addEventListener('touchstart', onTouchStart, {
        passive: true
    });
    window.addEventListener('touchmove', onTouchMove, {
        passive: false
    });
    window.addEventListener('touchend', onTouchEnd, {
        passive: true
    });
    window.addEventListener('keydown', onKey);

    window.addEventListener('resize', function() {
        vh = window.innerHeight;
        maxScroll = (BLOCKS - 1) * vh;
        target = clamp(target, 0, maxScroll);
        if (engineOn) {
            applyTransforms();
        }
        setMode();
    });

    if (mqMobile.addEventListener) {
        mqMobile.addEventListener('change', setMode);
    }
    setMode();

    /* ---------------------------------------------------------- */
    /* LIVE TELEMETRY CLOCK - hours minutes seconds milliseconds   */
    /* ---------------------------------------------------------- */

    var clockEl = document.getElementById('live-clock');

    function tickClock() {
        if (clockEl) {
            var d = new Date();
            clockEl.innerHTML = pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' +
                pad(d.getSeconds(), 2) + '<span class="ms">.' + pad(d.getMilliseconds(), 3) + '</span>';
        }
        window.requestAnimationFrame(tickClock);
    }

    window.requestAnimationFrame(tickClock);

    /* ---------------------------------------------------------- */
    /* BLUEPRINT ACCORDION - drives the photo panel opposite       */
    /* ---------------------------------------------------------- */

    var accItems = Array.prototype.slice.call(document.querySelectorAll('.acc-item'));
    var bpImgs = Array.prototype.slice.call(document.querySelectorAll('.bp-img'));
    var bpChip = document.getElementById('bp-chip');
    var bpData = document.getElementById('bp-data');
    var bpMarker = document.getElementById('bp-marker');
    var blipTimer = null;

    /* one state per accordion item: label, figure, marker position in percent */
    var bpStates = [{
        chip: 'A-01 // AERODYNAMICS',
        data: 'CD 0.27 // DF 980 KG',
        x: 22,
        y: 26
    }, {
        chip: 'A-02 // NEURAL CORE',
        data: '512 TOPS // 2,000 HZ',
        x: 48,
        y: 50
    }, {
        chip: 'A-03 // BATTERY ARRAY',
        data: '118 KWH // CG 410 MM',
        x: 28,
        y: 72
    }];

    function setBlueprint(i) {
        var st = bpStates[i];
        if (!st) {
            return;
        }
        bpImgs.forEach(function(img, k) {
            img.classList.toggle('active', k === i);
        });
        if (bpChip) {
            bpChip.textContent = st.chip;
        }
        if (bpData) {
            bpData.textContent = st.data;
        }
        if (bpMarker) {
            bpMarker.style.left = st.x + '%';
            bpMarker.style.top = st.y + '%';
            if (!mqReduce.matches) {
                bpMarker.classList.add('blip');
                if (blipTimer) {
                    window.clearTimeout(blipTimer);
                }
                blipTimer = window.setTimeout(function() {
                    bpMarker.classList.remove('blip');
                }, 300);
            }
        }
    }

    function setAccHeights() {
        accItems.forEach(function(item) {
            var body = item.querySelector('.acc-body');
            body.style.maxHeight = item.classList.contains('open') ? body.scrollHeight + 'px' : '0px';
        });
    }

    accItems.forEach(function(item, idx) {
        var head = item.querySelector('.acc-head');
        head.addEventListener('click', function() {
            var wasOpen = item.classList.contains('open');
            accItems.forEach(function(other) {
                other.classList.remove('open');
                other.querySelector('.acc-head').setAttribute('aria-expanded', 'false');
            });
            if (!wasOpen) {
                item.classList.add('open');
                head.setAttribute('aria-expanded', 'true');
                setBlueprint(idx);
            }
            setAccHeights();
        });
    });

    setAccHeights();
    setBlueprint(0);
    window.addEventListener('resize', setAccHeights);

    /* ---------------------------------------------------------- */
    /* 3D KINETIC CAROUSEL - drag, snap, controls, depth cueing    */
    /* ---------------------------------------------------------- */

    var c3d = document.getElementById('c3d');
    var c3dStage = document.getElementById('c3d-stage');
    var c3dStatus = document.getElementById('c3d-status');
    var c3dPrev = document.getElementById('c3d-prev');
    var c3dNext = document.getElementById('c3d-next');
    var c3dPlay = document.getElementById('c3d-play');
    var modBtns = Array.prototype.slice.call(document.querySelectorAll('.mod-btn'));
    var cards = c3d ? Array.prototype.slice.call(c3d.querySelectorAll('.c3d-card')) : [];

    var RADIUS = 200;
    var STEP = 360 / (cards.length || 1);
    var angle = 0;
    var targetAngle = 0;
    var autoPlay = !mqReduce.matches;
    var hovered = false;
    var c3dDragging = false;
    var dragX = 0;
    var dragDist = 0;
    var frontIdx = -1;

    var modNames = cards.map(function(card) {
        var el = card.querySelector('.c-name');
        return el ? el.textContent.toUpperCase() : '';
    });

    cards.forEach(function(card, i) {
        card.style.transform = 'rotateY(' + (i * STEP) + 'deg) translateZ(' + RADIUS + 'px)';
    });

    function setPlayUI() {
        if (!c3dPlay) {
            return;
        }
        c3dPlay.classList.toggle('playing', autoPlay);
        c3dPlay.setAttribute('aria-pressed', autoPlay ? 'true' : 'false');
        c3dPlay.setAttribute('aria-label', autoPlay ? 'Pause rotation' : 'Resume rotation');
    }

    function pauseAuto() {
        if (!autoPlay) {
            return;
        }
        autoPlay = false;
        setPlayUI();
    }

    function snapAngle() {
        targetAngle = Math.round(targetAngle / STEP) * STEP;
    }

    function currentFront(a) {
        var n = cards.length;
        return ((Math.round(-a / STEP) % n) + n) % n;
    }

    function updateDeck(a) {
        var idx = currentFront(a);
        if (idx === frontIdx) {
            return;
        }
        frontIdx = idx;
        if (c3dStatus) {
            c3dStatus.innerHTML = 'MOD ' + pad(idx + 1, 2) + ' <b>//</b> ' + modNames[idx];
        }
        modBtns.forEach(function(b, k) {
            b.classList.toggle('active', k === idx);
        });
    }

    function focusModule(k) {
        pauseAuto();
        var desired = -k * STEP;
        var turns = Math.round((targetAngle - desired) / 360) * 360;
        targetAngle = turns + desired;
    }

    function c3dStepRot(dir) {
        if (!c3d) {
            return;
        }
        pauseAuto();
        snapAngle();
        targetAngle += dir * STEP;
    }

    function applyDepth() {
        var i, rad, d, t;
        for (i = 0; i < cards.length; i++) {
            rad = (i * STEP + angle) * Math.PI / 180;
            d = (Math.cos(rad) + 1) / 2; /* 1 facing viewer, 0 facing away */
            t = 0.38 + 0.62 * d;
            cards[i].style.opacity = t.toFixed(3);
            cards[i].style.filter = 'brightness(' + (0.6 + 0.4 * d).toFixed(3) + ')';
        }
    }

    function spinLoop() {
        if (c3d) {
            if (autoPlay && !hovered && !c3dDragging && !mqReduce.matches) {
                targetAngle -= 0.30; /* ambient rotation speed */
                angle = targetAngle;
            } else {
                var ease = mqReduce.matches ? 1 : 0.09;
                angle += (targetAngle - angle) * ease;
                if (Math.abs(targetAngle - angle) < 0.01) {
                    angle = targetAngle;
                }
            }
            c3d.style.transform = 'rotateY(' + angle.toFixed(2) + 'deg)';
            applyDepth();
            updateDeck(angle);
        }
        window.requestAnimationFrame(spinLoop);
    }

    if (c3dStage) {
        c3dStage.addEventListener('mouseenter', function() {
            hovered = true;
        });
        c3dStage.addEventListener('mouseleave', function() {
            hovered = false;
        });

        /* pointer drag with snap on release */
        c3dStage.addEventListener('pointerdown', function(e) {
            c3dDragging = true;
            dragX = e.clientX;
            dragDist = 0;
            c3dStage.classList.add('dragging');
            pauseAuto();
            if (c3dStage.setPointerCapture) {
                c3dStage.setPointerCapture(e.pointerId);
            }
        });

        c3dStage.addEventListener('pointermove', function(e) {
            if (!c3dDragging) {
                return;
            }
            var dx = e.clientX - dragX;
            dragX = e.clientX;
            dragDist += Math.abs(dx);
            targetAngle += dx * 0.38;
            angle = targetAngle;
        });

        function endDrag() {
            if (!c3dDragging) {
                return;
            }
            c3dDragging = false;
            c3dStage.classList.remove('dragging');
            snapAngle();
        }

        c3dStage.addEventListener('pointerup', endDrag);
        c3dStage.addEventListener('pointercancel', endDrag);

        /* click a card to bring it to the front, ignored after a real drag */
        cards.forEach(function(card, i) {
            card.addEventListener('click', function() {
                if (dragDist > 6) {
                    return;
                }
                focusModule(i);
            });
        });

        window.requestAnimationFrame(spinLoop);
    }

    if (c3dPrev) {
        c3dPrev.addEventListener('click', function() {
            c3dStepRot(1);
        });
    }
    if (c3dNext) {
        c3dNext.addEventListener('click', function() {
            c3dStepRot(-1);
        });
    }

    if (c3dPlay) {
        c3dPlay.addEventListener('click', function() {
            autoPlay = !autoPlay;
            if (!autoPlay) {
                snapAngle();
            }
            setPlayUI();
        });
    }

    modBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            focusModule(parseInt(btn.getAttribute('data-mod'), 10));
        });
    });

    setPlayUI();

    /* ---------------------------------------------------------- */
    /* SYSTEM TABS - instant swap, laser red active state          */
    /* ---------------------------------------------------------- */

    var tabData = {
        performance: {
            label: 'CHANNEL // PERFORMANCE',
            value: '0-60<br>1.9 SEC',
            sub: '<b>TRI MOTOR</b> TORQUE VECTORING',
            copy: 'Launch control pre-loads all three motors against the brakes, then releases 1,480 hp through a surface scanning traction model.',
            chips: ['LAUNCH CTRL', '3X VECTORING', 'CARBON BRAKES']
        },
        range: {
            label: 'CHANNEL // RANGE',
            value: '812 KM<br>WLTP',
            sub: '<b>SOLID STATE</b> CELL ARRAY',
            copy: 'In cruise mode the active aero collapses flat and the rear axle decouples, stretching the 118 kWh pack across 812 certified kilometers.',
            chips: ['118 KWH', 'CD 0.27', 'AXLE DECOUPLE']
        },
        charging: {
            label: 'CHANNEL // CHARGING',
            value: '10-80%<br>9 MIN',
            sub: '<b>MEGAWATT</b> DC LINK',
            copy: 'A megawatt class DC link and immersion cooled cells recover 70 percent of capacity in the time it takes to pour a coffee.',
            chips: ['1.0 MW PEAK', 'IMMERSION COOL', '900V BUS']
        }
    };

    var tabBtns = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
    var kLabel = document.getElementById('kinetic-label');
    var kValue = document.getElementById('kinetic-value');
    var kSub = document.getElementById('kinetic-sub');
    var tabCopy = document.getElementById('tab-copy-text');
    var tabMeta = document.getElementById('tab-meta');

    function renderTab(key) {
        var d = tabData[key];
        if (!d) {
            return;
        }
        kLabel.textContent = d.label;
        kSub.innerHTML = d.sub;
        tabCopy.textContent = d.copy;
        tabMeta.innerHTML = d.chips.map(function(c) {
            return '<span class="tab-chip">' + c + '</span>';
        }).join('');
        if (mqReduce.matches) {
            kValue.innerHTML = d.value;
            return;
        }
        kValue.classList.add('swap');
        window.setTimeout(function() {
            kValue.innerHTML = d.value;
            kValue.classList.remove('swap');
        }, 180);
    }

    tabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (btn.classList.contains('active')) {
                return;
            }
            tabBtns.forEach(function(b) {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            renderTab(btn.getAttribute('data-tab'));
        });
    });

    /* ---------------------------------------------------------- */
    /* SCROLL REVEALS - IntersectionObserver with 3s fallback      */
    /* ---------------------------------------------------------- */

    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('on');
                    io.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12
        });
        reveals.forEach(function(el) {
            io.observe(el);
        });
    }

    /* fallback for iframe previews and edge cases */
    window.setTimeout(function() {
        reveals.forEach(function(el) {
            el.classList.add('on');
        });
    }, 3000);

})();
