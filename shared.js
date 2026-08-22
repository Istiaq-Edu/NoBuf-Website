/* ============================================================
   NoBuf website — shared enhancements (progressive only)
   Everything here is optional: with JS disabled the site is
   fully readable. Effects respect prefers-reduced-motion and
   degrade on coarse pointers / narrow viewports.
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  // Motion preference: user toggle (localStorage) overrides the OS signal.
  // Windows "Animation effects: off" makes browsers report reduce-motion even
  // when users just want a fast PC — so the site decides for itself unless told.
  var MOTION_KEY = "nobuf-motion";
  var osReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(pointer: fine)");
  var stored = null;
  try { stored = localStorage.getItem(MOTION_KEY); } catch (e) {}
  if (stored === "off") document.documentElement.classList.add("motion-off");
  // default: animations ON regardless of OS signal (site decision), unless user chose otherwise
  var reduceMotion = {
    matches: stored === "off",
    media: "(custom)",
    addEventListener: function () {},
    removeEventListener: function () {}
  };


  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* ---------- Hero entrance ---------- */
  onReady(function () {
    // Double rAF so initial styles are committed before transitioning in.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.add("loaded");
      });
    });
  });

  /* ---------- Tips banner ---------- */
  onReady(function () {
    var wrap = document.querySelector("[data-banner]");
    if (!wrap) return;
    var tips = wrap.querySelectorAll(".banner-tip");
    var dismiss = wrap.querySelector(".banner-dismiss");
    var KEY = "nobuf-banner-dismissed";
    var idx = 0;
    var timer = null;

    function show(i) {
      tips.forEach(function (t, j) { t.classList.toggle("fading", j !== i); });
    }
    function startRotate() {
      if (reduceMotion.matches || tips.length < 2) return;
      timer = setInterval(function () {
        tips[idx].classList.add("fading");
        idx = (idx + 1) % tips.length;
        // swap content after fade-out, then fade back
        setTimeout(function () {
          tips.forEach(function (t, j) { t.hidden = j !== idx; });
          tips[idx].classList.remove("fading");
        }, 400);
      }, 7000);
    }

    try {
      if (localStorage.getItem(KEY) === "1") {
        wrap.classList.add("dismissed");
        return;
      }
    } catch (e) { /* storage unavailable — banner stays */ }

    // only the first tip is visible in markup; reveal machinery for the rest
    tips.forEach(function (t, j) { if (j > 0) t.hidden = true; });
    startRotate();

    if (dismiss) {
      dismiss.addEventListener("click", function () {
        wrap.classList.add("dismissed");
        if (timer) clearInterval(timer);
        try { localStorage.setItem(KEY, "1"); } catch (e) {}
      });
    }
  });

  /* ---------- Mobile nav ---------- */
  onReady(function () {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // close on navigation
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) links.classList.remove("open");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") links.classList.remove("open");
    });
  });

  /* ---------- Version + download links (GitHub releases API) ---------- */
  onReady(function () {
    var versionSlots = document.querySelectorAll("[data-version-slot]");
    var dlLinks = document.querySelectorAll("[data-dl]");
    if (!versionSlots.length && !dlLinks.length) return;
    var API = "https://api.github.com/repos/Istiaq-Edu/NoBuf/releases/latest";

    // Static fallback is baked into markup (v1.0.0). Only enhance on success.
    fetch(API, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (rel) {
        var tag = rel.tag_name || "";
        if (!/^v?\d/.test(tag)) return;
        var pretty = tag.charAt(0) === "v" ? tag : "v" + tag;
        versionSlots.forEach(function (el) { el.textContent = pretty; });

        var assets = {};
        (rel.assets || []).forEach(function (a) { assets[a.name] = a.browser_download_url; });
        function pick(re) {
          var names = Object.keys(assets);
          var hit = names.find(re);
          return hit ? assets[hit] : null;
        }
        var map = {
          "win-exe":  pick(function (n) { return /x64-setup\.exe$/i.test(n); }),
          "win-msi": pick(function (n) { return /\.msi$/i.test(n); }),
          "mac-as":   pick(function (n) { return /aarch64\.app\.tar\.gz$/i.test(n) || /aarch64\.dmg$/i.test(n); }),
          "mac-intel":pick(function (n) { return /x64\.app\.tar\.gz$/i.test(n) || /x64\.dmg$/i.test(n); }),
          "lin-app":  pick(function (n) { return /\.AppImage$/i.test(n); }),
          "lin-deb":  pick(function (n) { return /\.deb$/i.test(n); }),
          "lin-rpm":  pick(function (n) { return /\.rpm$/i.test(n); })
        };
        dlLinks.forEach(function (a) {
          var key = a.getAttribute("data-dl");
          if (map[key]) {
            a.href = map[key];
            var host = a.closest(".dl-card");
            if (host) {
              var slot = host.querySelector(".dl-version-slot");
              if (slot) slot.textContent = pretty;
            }
          }
        });
      })
      .catch(function () { /* fallback text/links already in place */ });

    // Highlight visitor OS (best effort)
    try {
      var ua = navigator.userAgent;
      var os = /Mac/i.test(ua) ? "mac" : /Linux|X11/i.test(ua) && !/Android/i.test(ua) ? "linux" : /Win/i.test(ua) ? "win" : null;
      if (os) {
        document.querySelectorAll(".dl-card[data-os='" + os + "']").forEach(function (c) {
          c.classList.add("is-your-os");
          var badge = c.querySelector(".dl-os-tag");
          if (badge && badge.textContent.trim() === "Available") badge.textContent = "Your platform";
        });
      }
    } catch (e) {}
  });

  /* ---------- Scroll: reveals, scrollspy, progress, parallax ---------- */
  onReady(function () {
    var revealables = document.querySelectorAll(".reveal");
    // index stagger
    var grids = document.querySelectorAll("[data-stagger]");
    grids.forEach(function (g) {
      g.querySelectorAll(".reveal").forEach(function (el, i) {
        el.style.setProperty("--i", i);
      });
    });

    if ("IntersectionObserver" in window && !reduceMotion.matches) {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            ro.unobserve(en.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
      revealables.forEach(function (el) { ro.observe(el); });
    } else {
      revealables.forEach(function (el) { el.classList.add("in"); });
    }

    // Scrollspy
    var spyLinks = document.querySelectorAll(".nav-link[data-spy]");
    if (spyLinks.length && "IntersectionObserver" in window) {
      var map = {};
      spyLinks.forEach(function (l) {
        var id = l.getAttribute("data-spy");
        var sec = document.getElementById(id);
        if (sec) map[id] = l;
      });
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var link = map[en.target.id];
          if (!link) return;
          if (en.isIntersecting) {
            spyLinks.forEach(function (l) { l.classList.remove("active"); });
            link.classList.add("active");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(map).forEach(function (id) {
        var sec = document.getElementById(id);
        so.observe(sec);
      });
    }

    // Progress bar + parallax in one rAF loop
    var bar = document.querySelector(".progress span");
    var frame = document.querySelector("[data-parallax-frame]");
    var glow = document.querySelector("[data-parallax-glow]");
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var y = window.scrollY || doc.scrollTop;
        if (bar && max > 0) {
          bar.style.setProperty("--progress", String(Math.min(1, Math.max(0, y / max))));
        }
        if (!reduceMotion.matches && finePointer.matches && window.innerWidth > 768) {
          if (frame) frame.style.transform = "translateY(" + clampP(y * -0.06) + "px)";
          if (glow) glow.style.transform = "translateY(" + clampP(y * 0.03) + "px)";
        }
        ticking = false;
      });
    }
    function clampP(v) { return Math.max(-40, Math.min(40, v)); }
    if (bar || frame || glow) {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  });

  /* ---------- Pointer effects: ambient glow + card spotlight ---------- */
  onReady(function () {
    if (reduceMotion.matches || !finePointer.matches) return;

    // Hero ambient: static ellipse, opacity breathes toward pointer side (≤0.05)
    var hero = document.querySelector("[data-hero-ambient]");
    if (hero) {
      var ambient = document.createElement("div");
      ambient.className = "hero-ambient";
      hero.appendChild(ambient);
      var target = 0, current = 0, raf = null;
      function tick() {
        current += (target - current) * 0.08;
        ambient.style.opacity = current.toFixed(3);
        if (Math.abs(target - current) > 0.002) raf = requestAnimationFrame(tick);
        else raf = null;
      }
      hero.addEventListener("pointerenter", function () { target = 0.5; if (!raf) raf = requestAnimationFrame(tick); });
      hero.addEventListener("pointerleave", function () { target = 0; if (!raf) raf = requestAnimationFrame(tick); });
    }

    // Per-card spotlight
    document.querySelectorAll("[data-spot]").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    });
  });

  /* ---------- Seek-bar anatomy: legend hover highlights layer ---------- */
  onReady(function () {
    var box = document.querySelector(".anatomy");
    if (!box || box.dataset.anatInit) return;
    box.dataset.anatInit = "1";
    var items = box.querySelectorAll(".legend-item");
    function focus(layer) {
      if (layer) box.setAttribute("data-focus", layer);
      else box.removeAttribute("data-focus");
    }
    items.forEach(function (item) {
      item.addEventListener("mouseenter", function () { focus(item.getAttribute("data-layer")); });
      item.addEventListener("mouseleave", function () { focus(null); });
      // touch: tap toggles
      item.addEventListener("click", function () {
        var l = item.getAttribute("data-layer");
        focus(box.getAttribute("data-focus") === l ? null : l);
      });
    });
  });

  /* ---------- Seek-bar anatomy demo: playable ---------- */
  onReady(function () {
    document.querySelectorAll("[data-sbdemo]").forEach(function (box) {
      if (box.dataset.sbInit) return;
      box.dataset.sbInit = "1";
      var track = box.querySelector(".sbd-track");
      var head = box.querySelector(".sbd-head");
      var buffers = box.querySelector(".sbd-buffers");
      var cache = box.querySelector(".sbd-cache");
      var thumbs = box.querySelector(".sbd-thumbs");
      var preview = box.querySelector(".sbd-preview");
      var thumbState = box.querySelector(".sbd-state");
      var timeEl = box.querySelector(".sbd-time");
      var TOTAL = 2*3600 + 13*60 + 42;
      var pct = 30, dragging = false;

      function fmt(s) {
        var h = Math.floor(s/3600), m = Math.floor((s%3600)/60), x = Math.floor(s%60);
        return (h ? h+":"+String(m).padStart(2,"0") : m) + ":" + String(x).padStart(2,"0");
      }
      var INIT_CACHE = 30;   // percent
      function paint() {
        // --pct stays a FRACTION: CSS computes calc(var(--pct) * 1%)
        track.style.setProperty("--pct", pct.toFixed(4));
        track.setAttribute("aria-valuenow", String(Math.round(pct*100)));
        track.setAttribute("aria-valuetext", fmt(pct*TOTAL));
        timeEl.textContent = fmt(pct*TOTAL);
        // white memory ranges hug the playhead (clamped inside the track)
        var memW = 14;
        var left = Math.max(0, Math.min(100 - memW, pct*100 - memW*0.6));
        buffers.style.left = left.toFixed(2) + "%";
        buffers.style.width = memW + "%";
        // green disk cache grows toward the playhead, never shrinks below start
        var cachePct = Math.min(100, Math.max(INIT_CACHE, pct*100));
        cache.style.width = cachePct.toFixed(2) + "%";
        // yellow previews cover a leading portion of cached range
        thumbs.style.width = (cachePct * 0.62).toFixed(2) + "%";
      }
      function fracFrom(e) {
        var r = track.getBoundingClientRect();
        return Math.max(0, Math.min(1, (e.clientX - r.left)/r.width));
      }
      function seekTo(frac, viaKeys) {
        pct = frac;
        if (!viaKeys) {
          thumbState.textContent = "instant seek";
          preview.classList.add("on");
          clearTimeout(box._pt);
          box._pt = setTimeout(function(){ preview.classList.remove("on"); }, 900);
        }
        paint();
      }
      track.addEventListener("pointerdown", function (e) {
        dragging = true;
        try { track.setPointerCapture(e.pointerId); } catch(err){}
        seekTo(fracFrom(e));
        e.preventDefault();
      });
      track.addEventListener("pointermove", function (e) {
        var f = fracFrom(e);
        // preview follows the cursor like the app's hover scrub
        var r = track.getBoundingClientRect();
        var pf = Math.max(12, Math.min(88, f*100));  /* keep 228px card on-screen */
        preview.style.left = pf.toFixed(2) + "%";
        timeEl.textContent = fmt(f*TOTAL);
        thumbState.textContent = f <= (parseFloat(cache.style.width)||30)/100 ? "from cache · instant" : "fetching…";
        if (dragging) seekTo(f);
        else preview.classList.add("on");
      });
      ["pointerup","pointercancel"].forEach(function(ev){
        track.addEventListener(ev, function(){ dragging = false; });
      });
      track.addEventListener("mouseleave", function () {
        preview.classList.remove("on");
        timeEl.textContent = fmt(pct*TOTAL);
      });
      track.addEventListener("keydown", function (e) {
        var step = e.shiftKey ? 0.10 : 0.02;
        var k = e.key;
        if (k==="ArrowRight"||k==="ArrowUp") { e.preventDefault(); seekTo(Math.min(1,pct+step), true); }
        else if (k==="ArrowLeft"||k==="ArrowDown") { e.preventDefault(); seekTo(Math.max(0,pct-step), true); }
        else if (k==="Home") { e.preventDefault(); seekTo(0, true); }
        else if (k==="End") { e.preventDefault(); seekTo(1, true); }
        else if (k==="PageUp") { e.preventDefault(); seekTo(Math.min(1,pct+0.25), true); }
        else if (k==="PageDown") { e.preventDefault(); seekTo(Math.max(0,pct-0.25), true); }
      });
      paint();
    });
  });

  /* ---------- Kinetic hero: wrap words in masks ---------- */
  onReady(function () {
    var targets = document.querySelectorAll("[data-kinetic]");
    if (!targets.length) return;
    targets.forEach(function (el) {
      if (el.dataset.kineticDone) return;
      el.dataset.kineticDone = "1";
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      var accentFrom = parseInt(el.getAttribute("data-accent-from") || "999", 10);
      words.forEach(function (word, i) {
        var w = document.createElement("span");
        w.className = "w";
        var inner = document.createElement("span");
        inner.style.setProperty("--wi", String(i));
        if (i >= accentFrom) inner.className = "accent-span";
        inner.textContent = word;
        w.appendChild(inner);
        el.appendChild(w);
        el.appendChild(document.createTextNode(" "));
      });
    });
  });

  /* ---------- Interactive seek demo ---------- */
  onReady(function () {
    document.querySelectorAll("[data-seekdemo]").forEach(function (demo) {
      var track = demo.querySelector(".sd-track");
      if (!track || track.dataset.sdInit) return;
      track.dataset.sdInit = "1";
      var fill = demo.querySelector(".sd-fill");
      var rangeEl = demo.querySelector(".sd-range");
      var head = demo.querySelector(".sd-head");
      var flash = demo.querySelector(".sd-flash");
      var timeEl = demo.querySelector(".sd-time");
      var pctEl = demo.querySelector(".sd-pct");
      var TOTAL = 2 * 3600 + 13 * 60 + 42; // demo: 2:13:42
      var cached = 0.18, dragging = false;

      function fmt(s) {
        var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
        return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(sec).padStart(2, "0");
      }
      function render(frac, animateTo) {
        frac = Math.max(0, Math.min(1, frac));
        // instant cache to the grabbed point (the product promise)
        var newEnd = Math.max(cached, frac);
        fill.style.width = (newEnd * 100).toFixed(2) + "%";
        rangeEl.style.width = (newEnd * 100).toFixed(2) + "%";
        head.style.left = "calc(" + (frac * 100).toFixed(3) + "% - 1px)";
        timeEl.textContent = fmt(frac * TOTAL) + " / " + fmt(TOTAL);
        pctEl.textContent = Math.round(newEnd * 100) + "% cached";
        track.setAttribute("aria-valuenow", String(Math.round(frac * 100)));
        track.setAttribute("aria-valuetext", fmt(frac * TOTAL) + ", " + Math.round(newEnd * 100) + "% cached");
        if (flash && animateTo !== undefined) {
          var mid = ((frac + animateTo) / 2) * 100;
          flash.style.left = "calc(" + mid.toFixed(2) + "% - 30px)";
          flash.classList.remove("on");
          void flash.offsetWidth;
          flash.classList.add("on");
        }
        cached = newEnd;
      }
      function fracFromEvent(e) {
        var r = track.getBoundingClientRect();
        return (e.clientX - r.left) / r.width;
      }
      // keyboard access for role=slider
      track.setAttribute("aria-orientation", "horizontal");
      track.addEventListener("keydown", function (e) {
        var step = e.shiftKey ? 0.10 : 0.02;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); render(Math.min(1, cached + step), cached); }
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); render(Math.max(0, cached - step), cached); }
        else if (e.key === "Home") { e.preventDefault(); render(0, cached); }
        else if (e.key === "End") { e.preventDefault(); render(1, cached); }
        else if (e.key === "PageUp") { e.preventDefault(); render(Math.min(1, cached + 0.25), cached); }
        else if (e.key === "PageDown") { e.preventDefault(); render(Math.max(0, cached - 0.25), cached); }
      });
      track.addEventListener("pointerdown", function (e) {
        dragging = true;
        track.setPointerCapture(e.pointerId);
        var from = cached;
        render(fracFromEvent(e), from);
      });
      track.addEventListener("pointermove", function (e) {
        if (dragging) render(fracFromEvent(e));
      });
      ["pointerup", "pointercancel"].forEach(function (ev) {
        track.addEventListener(ev, function () { dragging = false; });
      });
      render(cached);
    });
  });

  /* ---------- Code copy buttons ---------- */
  onReady(function () {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var block = btn.closest(".codeblock");
        var pre = block && block.querySelector("pre");
        if (!pre) return;
        var text = pre.textContent || "";
        function done() {
          btn.classList.add("copied");
          var label = btn.querySelector("span");
          var old = label ? label.textContent : "";
          if (label) label.textContent = "copied ✓";
          setTimeout(function () {
            btn.classList.remove("copied");
            if (label) label.textContent = old;
          }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        }
      });
    });
  });
})();
