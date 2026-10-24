(function () {
  "use strict";

  var S = window.SITE || {};
  // Скрипт Telegram нужен, только когда сайт открыт как приложение внутри Telegram.
  // Telegram передаёт это в адресе (tgWebAppData). В Instagram и браузере скрипт не грузим вовсе.
  var tg = null, inTg = false;
  var isMiniApp = /tgWebApp/.test(location.hash + location.search);

  var $ = function (id) { return document.getElementById(id); };
  // Лёгкая копия фото для ленты и размытое превью (создаёт tools/make-thumbs.py)
  var thumb = function (src) { return (window.THUMBS || {})[src] || null; };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var catTitle = function (id) {
    var c = (S.categories || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.title : "";
  };
  var haptic = function (kind) {
    try {
      if (!inTg || !tg.HapticFeedback) return;
      if (kind === "select") tg.HapticFeedback.selectionChanged();
      else tg.HapticFeedback.impactOccurred(kind || "light");
    } catch (e) {}
  };

  var ICONS = {
    tg: '<svg viewBox="0 0 24 24"><path d="M21 4.5L3 11.2l6.3 2.3M21 4.5l-3 15-8.7-6M21 4.5L9.3 13.5v5.3l3.2-3.3"/></svg>',
    ig: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M4 20l1.2-4A8.5 8.5 0 1 1 8.4 19z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9a5 5 0 0 1-2.3-2.3l.9-1-1-2z"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/></svg>',
    arrow: '<svg class="arrow" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  // Мягкие градиенты для заглушек, пока нет фото
  var PH = [
    "linear-gradient(160deg,#F0D3DA,#D3A0AC)",
    "linear-gradient(160deg,#F5E0E5,#DDB2BC)",
    "linear-gradient(160deg,#E8C9D0,#C08A96)",
    "linear-gradient(160deg,#F7E6EA,#E1BCC5)"
  ];
  var RATIOS = ["3 / 4", "4 / 5", "2 / 3", "1 / 1", "4 / 5", "3 / 4"];
  function placeholder(i, work) {
    return '<div class="ph" style="background:' + PH[i % PH.length] + ";aspect-ratio:" + RATIOS[i % RATIOS.length] + '">' +
      '<span class="ph-mark">' + esc(catTitle(work.category) || "Образ") + "</span>" +
      '<span class="ph-sub">фото скоро</span></div>';
  }

  // ---------- Шапка ----------
  document.title = (S.name ? S.name + " · " : "") + "визаж и причёски";
  // Имя по буквам: каждая буква проявляется с небольшой задержкой
  (function () {
    var i = 0;
    $("name").innerHTML = (S.name || "").split(" ").map(function (word) {
      return '<span class="w">' + word.split("").map(function (ch) {
        return '<span class="l" style="--i:' + (i++) + '">' + esc(ch) + "</span>";
      }).join("") + "</span>";
    }).join(" ");
    $("name").setAttribute("aria-label", S.name || "");
  })();
  $("role").textContent = [S.role, S.city].filter(Boolean).join(" · ");
  $("tagline").textContent = S.tagline || "";
  var initials = (S.name || "").split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2);
  $("avatar").textContent = initials;
  if (S.avatar) {
    var av = new Image();
    av.alt = S.name || "";
    av.fetchPriority = "high";
    av.onload = function () {
      var box = $("avatar");
      box.textContent = "";
      box.style.aspectRatio = av.naturalWidth + " / " + av.naturalHeight;
      box.appendChild(av);
    };
    av.src = (thumb(S.avatar) || {}).s || S.avatar;
  }
  $("stats").hidden = !(S.stats || []).length;
  $("stats").innerHTML = (S.stats || []).map(function (s) {
    return "<li><b>" + esc(s.value) + "</b><span>" + esc(s.label) + "</span></li>";
  }).join("");

  // ---------- Появление при прокрутке ----------
  var io = null;
  if ("IntersectionObserver" in window && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    document.documentElement.classList.add("reveal-on");
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  }
  function reveal(root) {
    var els = root.matches && root.matches("[data-reveal]") ? [root] : root.querySelectorAll("[data-reveal]");
    Array.prototype.forEach.call(els, function (el) {
      if (io) io.observe(el); else el.classList.add("is-in");
    });
  }

  // ---------- Портфолио ----------
  // Работа бывает одиночной (src или video) или блоком образа (media: [...] + note)
  var works = S.works || [];
  var filter = "all";
  var slides = []; // все кадры видимых работ подряд, для листания в просмотре

  // В блоке сначала фото, потом видео: пока смотрят фото, видео успевает загрузиться
  var itemsOf = function (w) {
    if (!(w.media && w.media.length)) return [w];
    if (!w._sorted) {
      w._sorted = w.media.filter(function (m) { return !m.video; }).concat(w.media.filter(function (m) { return m.video; }));
    }
    return w._sorted;
  };

  // Под заголовком «Мои работы»: кнопки перехода к разделам
  function renderFilters() {
    var used = (S.categories || []).filter(function (c) {
      return works.some(function (w) { return w.category === c.id; });
    });
    $("filters").hidden = used.length < 2;
    $("filters").innerHTML = used.map(function (c) {
      return '<a class="chip" href="#works-' + esc(c.id) + '">' + esc(c.title) + "</a>";
    }).join("");
  }

  var badge = function (m) {
    return '<span class="tile-badge"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5z"/></svg>' + esc(m.badge || "видео") + "</span>";
  };
  // Видео: оригинал (например .mov с iPhone) и запасной mp4 для телефонов, которые оригинал не играют
  function media(m, wi, inLightbox, alt) {
    if (m.video) {
      // В ленте лёгкая mp4-копия, оригинал (.mov) только при открытии на весь экран
      var srcs = m.fallback
        ? '<source src="' + esc(m.fallback) + '" type="video/mp4">'
        : m.fallback
        ? '<source src="' + esc(m.video) + '"' + (/\.mov$/i.test(m.video) ? ' type="video/quicktime"' : "") + '>' +
          '<source src="' + esc(m.fallback) + '" type="video/mp4">'
        : '<source src="' + esc(m.video) + '" type="video/mp4">';
      if (inLightbox) {
        return "<video" + (m.poster ? ' poster="' + esc(m.poster) + '"' : "") +
          ' muted loop playsinline autoplay preload="auto" controls>' + srcs + "</video>";
      }
      // В ленте: обложка сразу, видео играет без звука поверх неё, пока видно на экране
      return (m.poster ? lightImg(m.poster, "") : "") +
        '<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5z"/></svg></span>' +
        '<video muted loop playsinline preload="none" data-auto>' + srcs + "</video>";
    }
    if (m.src) {
      if (inLightbox) return '<img src="' + esc(m.src) + '" alt="' + esc(alt || "") + '" data-ph="' + wi + '">';
      return lightImg(m.src, alt, wi);
    }
    return placeholder(wi, works[wi]);
  }

  // Фото в ленте: лёгкая копия; если её нет или она не открылась, берём оригинал
  var eagerLeft = 0; // при открытии работ не видно, поэтому все фото грузятся по мере прокрутки
  function lightImg(src, alt, wi) {
    var t = thumb(src);
    var lazy = eagerLeft-- > 0 ? ' fetchpriority="high"' : ' loading="lazy"';
    return '<img src="' + esc(t ? t.s : src) + '" data-full="' + esc(src) + '" alt="' + esc(alt || "") + '"' +
      lazy + ' decoding="async"' + (wi != null ? ' data-ph="' + wi + '"' : "") + ">";
  }
  // Размытое превью под кадром видно сразу, ещё до загрузки фото
  function blurBg(m) {
    var t = thumb(m.src || m.poster);
    return t ? "background-image:url(" + t.q + ");" : "";
  }

  function renderGallery() {
    slides = [];
    var all = works.map(function (w, i) { return { w: w, i: i }; });

    // Отдельный раздел на каждую категорию, в порядке списка categories
    $("gallery").innerHTML = (S.categories || []).map(function (c) {
      var shown = all.filter(function (x) { return x.w.category === c.id; });
      if (!shown.length) return "";
      return '<div class="gal-group" id="works-' + esc(c.id) + '">' +
        '<div class="gal-head" data-reveal><h3>' + esc(c.title) + "</h3></div>" +
        '<div class="gal-grid">' + renderGroup(shown) + "</div></div>";
    }).join("");
    attachFallbacks($("gallery"));
    reveal($("gallery"));
    autoplay($("gallery"));
    bindDots($("gallery"));
    prefetch($("gallery"));
    fitLooks();
  }

  // Высота кадра по свободному месту: экран минус верхняя строка, заголовок блока и кнопка записи,
  // чтобы название и кадр целиком помещались на один экран
  function fitLooks() {
    var nav = ($("topnav") || {}).offsetHeight || 52; // в Telegram уже с отступом под его кнопки
    var cta = document.body.classList.contains("in-tg") ? 16 : 96;
    Array.prototype.forEach.call(document.querySelectorAll(".look"), function (look) {
      var head = look.querySelector(".look-head, .look-sep");
      var dots = look.querySelector(".look-dots");
      var free = window.innerHeight - nav - cta - (head ? head.offsetHeight + 18 : 0) - (dots ? dots.offsetHeight + 14 : 0) - 24;
      look.style.setProperty("--hmax", Math.max(240, free) + "px");
    });
  }
  window.addEventListener("resize", fitLooks);
  window.addEventListener("load", fitLooks);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLooks);

  // Фото ленты грузим заранее: за два экрана до появления, а после загрузки страницы и все остальные
  function prefetch(root) {
    var imgs = Array.prototype.slice.call(root.querySelectorAll('img[loading="lazy"]'));
    var go = function (img) { img.loading = "eager"; };
    if ("IntersectionObserver" in window) {
      var near = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { go(e.target); near.unobserve(e.target); } });
      }, { rootMargin: "200% 0px 200% 0px" });
      imgs.forEach(function (i) { near.observe(i); });
    }
    var all = function () { setTimeout(function () { imgs.forEach(go); }, 300); };
    if (document.readyState === "complete") all(); else window.addEventListener("load", all);
  }

  // Каждый образ отдельным блоком: название по центру, под ним кадры (несколько листаются вбок)
  function renderGroup(shown) {
    var prevTitle = null;
    return shown.map(function (x) {
      var w = x.w, items = itemsOf(w);
      // Работы подряд с одинаковым названием идут под одной надписью
      var cont = !!w.title && w.title === prevTitle && !items[0].caption;
      prevTitle = w.title;
      // Названия кадров лежат друг на друге в одной ячейке: место отведено по самому длинному,
      // поэтому при листании меняется только текст, а страница не сдвигается
      var caps = [];
      items.forEach(function (m) { var c = m.caption || w.title; if (caps.indexOf(c) < 0) caps.push(c); });
      var head0 = caps.map(function (c, k) {
        return '<span class="cap' + (k ? "" : " on") + '">' + titleWords(c) + "</span>";
      }).join(""), note0 = w.note;
      var frames = items.map(function (m) {
        var n = slides.push({ w: w, m: m, wi: x.i }) - 1;
        return '<button class="look-item' + (m.video ? " is-video" : "") + '" type="button" data-slide="' + n + '"' +
          ' data-capi="' + caps.indexOf(m.caption || w.title) + '"' +
          ' style="' + blurBg(m) + (m.ratio ? "aspect-ratio:" + esc(m.ratio) + ";--r:" + ratioNum(m.ratio) : "") + '">' +
          media(m, x.i, false, m.caption || w.title) + (m.video ? badge(m) : "") + "</button>";
      }).join("");
      var multi = items.length > 1;
      return '<article class="look' + (multi ? " look-multi" : "") + (cont ? " look-cont" : "") + '" data-reveal>' +
        (cont ? '<div class="look-sep"><span class="look-rule"><i></i><b>✦</b><i></i></span></div>' : '<header class="look-head"><h3>' + head0 + "</h3>" +
        '<span class="look-rule"><i></i><b>✦</b><i></i></span>' +
        '<p class="look-note"' + (note0 ? "" : " hidden") + ">" + esc(note0 || "") + "</p></header>") +
        '<div class="look-media">' + frames + "</div>" +
        (multi ? '<div class="look-dots">' + items.map(function (m, k) {
          return '<span class="' + (k ? "" : "on") + '"></span>';
        }).join("") + "</div>" : "") +
        "</article>";
    }).join("");
  }

  // "590 / 784" -> 0.7526 (ширина к высоте)
  function ratioNum(r) {
    var p = String(r).split("/");
    var v = parseFloat(p[0]) / parseFloat(p[1]);
    return isFinite(v) && v > 0 ? v.toFixed(4) : "0.75";
  }

  function titleWords(t) {
    return String(t || "").split(" ").map(function (word, k) {
      return '<span class="ln"><span style="--k:' + k + '">' + esc(word) + "</span></span>";
    }).join(" ");
  }

  // При листании точки показывают текущий кадр
  function bindDots(root) {
    Array.prototype.forEach.call(root.querySelectorAll(".look-multi"), function (look) {
      var row = look.querySelector(".look-media"), dots = look.querySelectorAll(".look-dots span");
      var frames = row.querySelectorAll(".look-item"), capEls = look.querySelectorAll(".look-head .cap");
      var cur = 0;
      // Первый кадр сразу ровно по центру
      var center = function () {
        var f = frames[0];
        if (f) row.scrollLeft = f.offsetLeft + f.offsetWidth / 2 - row.clientWidth / 2;
      };
      center();
      window.addEventListener("load", center);
      row.addEventListener("scroll", function () {
        var mid = row.scrollLeft + row.clientWidth / 2, k = 0, best = 1e9;
        Array.prototype.forEach.call(frames, function (f, j) {
          var dist = Math.abs(f.offsetLeft + f.offsetWidth / 2 - mid);
          if (dist < best) { best = dist; k = j; }
        });
        if (k === cur) return;
        Array.prototype.forEach.call(dots, function (d, j) { d.classList.toggle("on", j === k); });
        var ci = +frames[k].getAttribute("data-capi");
        Array.prototype.forEach.call(capEls, function (c, j) { c.classList.toggle("on", j === ci); });
        cur = k;
      }, { passive: true });
    });
  }

  // Видео в сетке играют без звука, только пока видны на экране: так не тратится мобильный трафик
  var vio = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      v.dataset.inView = e.isIntersecting ? "1" : "0";
      if (e.isIntersecting) { if (pageReady) tryPlay(v); }
      else v.pause();
    });
  }, { threshold: 0.25 }) : null;
  // Видео грузим только после того, как загрузилась страница с фотографиями,
  // и только то, что сейчас на экране: иначе видео забирают интернет у фото
  var pageReady = document.readyState === "complete";
  window.addEventListener("load", function () {
    pageReady = true;
    Array.prototype.forEach.call(document.querySelectorAll("video[data-auto]"), function (v) {
      if (v.dataset.inView === "1") tryPlay(v);
    });
  });
  function autoplay(root) {
    Array.prototype.forEach.call(root.querySelectorAll("video[data-auto]"), function (v) {
      v.muted = true; // iPhone запускает сам только беззвучное видео
      v.addEventListener("playing", function () { v.classList.add("is-playing"); v.parentNode.classList.add("playing"); });
      // если видео догрузилось, пока было на экране, запускаем ещё раз
      v.addEventListener("canplay", function () { if (v.dataset.inView === "1" && v.paused) tryPlay(v); });
      if (vio) vio.observe(v); else { v.autoplay = true; tryPlay(v); }
    });
  }
  function tryPlay(v) {
    v.preload = "auto";
    var pr = v.play();
    if (pr && pr.catch) pr.catch(function () {});
  }

  // Если файла ещё нет, ставим заглушку
  function attachFallbacks(root) {
    Array.prototype.forEach.call(root.querySelectorAll("img[data-full]"), function (img) {
      var shown = function () { img.classList.add("ld"); };
      if (img.complete && img.naturalWidth) shown(); else img.addEventListener("load", shown);
      img.addEventListener("error", function () {
        var full = img.getAttribute("data-full");
        if (full && img.getAttribute("src") !== full) img.setAttribute("src", full);
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll("img[data-ph]:not([data-full])"), function (img) {
      var swap = function () {
        var i = +img.getAttribute("data-ph");
        var tmp = document.createElement("div");
        tmp.innerHTML = placeholder(i, works[i]);
        if (img.parentNode) img.parentNode.replaceChild(tmp.firstChild, img);
      };
      if (img.complete && img.naturalWidth === 0) swap();
      else img.addEventListener("error", swap);
    });
  }

  function plural(n, f) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return f[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return f[1];
    return f[2];
  }

  $("filters").addEventListener("click", function (e) {
    var b = e.target.closest("[data-filter]");
    if (!b || b.getAttribute("data-filter") === filter) return;
    filter = b.getAttribute("data-filter");
    haptic("select");
    renderFilters();
    renderGallery();
  });

  // ---------- Просмотр фото и видео ----------
  var lbPos = -1;
  function openLightbox(pos) {
    lbPos = pos;
    var x = slides[pos];
    if (!x) return;
    var stage = $("lb-stage");
    stage.innerHTML = media(x.m, x.wi, true, x.w.title);
    // Открыли по нажатию, поэтому пробуем со звуком; если браузер запретит, играем без звука
    var v = stage.querySelector("video");
    if (v) {
      v.muted = false;
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () { v.muted = true; v.play(); });
    }
    attachFallbacks(stage);
    var items = itemsOf(x.w);
    $("lb-title").textContent = x.m.caption || x.w.title || catTitle(x.w.category);
    $("lb-counter").textContent = items.length > 1
      ? (items.indexOf(x.m) + 1) + " из " + items.length + " в образе"
      : (pos + 1) + " из " + slides.length;
    if ($("lightbox").hidden) {
      $("lightbox").hidden = false;
      document.body.style.overflow = "hidden";
      if (inTg) {
        tg.MainButton.hide();
        tg.BackButton.show();
      }
    }
  }
  function closeLightbox() {
    $("lightbox").hidden = true;
    $("lb-stage").innerHTML = "";
    document.body.style.overflow = "";
    lbPos = -1;
    if (inTg) {
      tg.BackButton.hide();
      updateCta();
    }
  }
  function stepLightbox(d) {
    if (!slides.length) return;
    haptic("select");
    openLightbox((lbPos + d + slides.length) % slides.length);
  }

  $("gallery").addEventListener("click", function (e) {
    var t = e.target.closest("[data-slide]");
    if (!t) return;
    haptic("light");
    openLightbox(+t.getAttribute("data-slide"));
  });
  $("lb-close").addEventListener("click", closeLightbox);
  $("lb-book").addEventListener("click", function () {
    var sl = slides[lbPos], w = sl && sl.w;
    var name = sl ? (sl.m.caption || w.title || catTitle(w.category)) : "";
    book(w ? "Здравствуйте! Понравилась ваша работа «" + name +
      "», хочу похожий образ. Подскажите, пожалуйста, свободные даты." : null, name);
  });
  (function swipe() {
    var sx = 0, sy = 0;
    var stage = $("lb-stage");
    stage.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) stepLightbox(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLightbox();
    });
    stage.addEventListener("click", function (e) {
      if (e.target === stage) closeLightbox();
    });
  })();
  document.addEventListener("keydown", function (e) {
    if ($("lightbox").hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") stepLightbox(1);
    if (e.key === "ArrowLeft") stepLightbox(-1);
  });

  // ---------- Услуги ----------
  var services = S.services || [];
  var selected = -1;

  function renderServices() {
    var byCat = (S.categories || []).map(function (c) {
      return {
        c: c,
        list: services.map(function (s, i) { return { s: s, i: i }; })
          .filter(function (x) { return x.s.category === c.id; })
      };
    });
    // Заголовки групп нужны, только если хоть в одной группе больше одной услуги
    var showHeads = byCat.some(function (g) { return g.list.length > 1; });
    var groups = byCat.map(function (g) {
      var c = g.c, list = g.list;
      if (!list.length) return "";
      return '<div class="svc-group">' + (showHeads ? "<h3>" + esc(c.title) + "</h3>" : "") + list.map(function (x) {
        var s = x.s, on = x.i === selected;
        return '<button class="svc' + (on ? " is-selected" : "") + '" type="button" data-svc="' + x.i + '" aria-pressed="' + on + '">' +
          '<span class="svc-row"><span class="svc-title">' + esc(s.title) + '</span><span class="svc-dots"></span>' +
          '<span class="svc-price">' + esc(s.price) + "</span></span>" +
          '<span class="svc-sub"><span>' + esc([s.description, s.duration].filter(Boolean).join(" · ")) + "</span>" +
          '<span class="svc-pick">' + (on ? ICONS.check + "выбрано" : "выбрать") + "</span></span>" +
          "</button>";
      }).join("") + "</div>";
    }).join("");
    $("services").innerHTML = groups;
    $("notes").innerHTML = (S.notes || []).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("");
    $("notes").hidden = !(S.notes || []).length;
  }

  $("services").addEventListener("click", function (e) {
    var b = e.target.closest("[data-svc]");
    if (!b) return;
    var i = +b.getAttribute("data-svc");
    selected = selected === i ? -1 : i;
    haptic("select");
    renderServices();
    updateCta();
  });

  // ---------- Обо мне ----------
  function tgLink(text) {
    return "https://t.me/" + encodeURIComponent(S.telegram) + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function waLink(text) {
    return "https://wa.me/" + String(S.whatsapp).replace(/\D/g, "") + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function contactRow(href, icon, title, sub, attrs) {
    return '<a class="contact" href="' + esc(href) + '" ' + (attrs || "") + ">" + icon +
      "<span>" + esc(title) + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>" + ICONS.arrow + "</a>";
  }

  function renderAbout() {
    $("about").textContent = S.about || "";
    $("steps").innerHTML = (S.steps || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    var rows = [];
    if (S.telegram) rows.push(contactRow(tgLink(), ICONS.tg, "Telegram", "@" + S.telegram, 'data-tg="1" target="_blank" rel="noopener"'));
    if (S.instagram) rows.push(contactRow("https://instagram.com/" + S.instagram, ICONS.ig, "Instagram", "@" + S.instagram, 'target="_blank" rel="noopener"'));
    if (S.whatsapp) rows.push(contactRow(waLink(), ICONS.wa, "WhatsApp", S.whatsapp, 'target="_blank" rel="noopener"'));
    if (S.phone) rows.push(contactRow("tel:" + S.phone.replace(/[^\d+]/g, ""), ICONS.phone, "Позвонить", S.phone));
    $("contacts").innerHTML = rows.join("");
    $("address").textContent = S.address || "";
  }

  // Внутри Telegram ссылки t.me открываем его методом, иначе приложение может открыть их во встроенном браузере
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href^='https://t.me/']");
    if (!a || !inTg) return;
    e.preventDefault();
    tg.openTelegramLink(a.href);
  });

  // ---------- Запись ----------
  function defaultMessage() {
    if (selected >= 0) {
      var s = services[selected];
      return "Здравствуйте! Хочу записаться на «" + s.title + "» (" + s.price + "). Подскажите, пожалуйста, свободные даты.";
    }
    return "Здравствуйте! Хочу записаться. Подскажите, пожалуйста, свободные даты.";
  }

  function copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(function () { legacyCopy(text); });
        return;
      }
    } catch (e) {}
    legacyCopy(text);
  }
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2200);
  }

  function book(message, label) {
    var text = message || defaultMessage();
    haptic("medium");
    if (inTg && S.telegram) {
      tg.openTelegramLink(tgLink(text));
      return;
    }
    // Instagram, Safari, Chrome: даём выбрать мессенджер, текст копируем заранее
    copy(text);
    var rows = [];
    if (S.telegram) rows.push(contactRow(tgLink(text), ICONS.tg, "Написать в Telegram", "сообщение подставится само", 'target="_blank" rel="noopener"'));
    if (S.whatsapp) rows.push(contactRow(waLink(text), ICONS.wa, "Написать в WhatsApp", "сообщение подставится само", 'target="_blank" rel="noopener"'));
    if (S.instagram) rows.push(contactRow("https://ig.me/m/" + S.instagram, ICONS.ig, "Написать в Direct", "вставьте скопированный текст", 'target="_blank" rel="noopener"'));
    if (S.phone) rows.push(contactRow("tel:" + S.phone.replace(/[^\d+]/g, ""), ICONS.phone, "Позвонить", S.phone));
    $("sheet-actions").innerHTML = rows.join("");
    var svc = label || (selected >= 0 ? services[selected].title + " · " + services[selected].price : "");
    $("sheet-service").textContent = svc;
    $("sheet-service").hidden = !svc;
    $("sheet").hidden = false;
  }

  $("sheet").addEventListener("click", function (e) {
    if (e.target.closest("[data-close]") || e.target.closest(".contact")) $("sheet").hidden = true;
  });

  function ctaText() {
    return selected >= 0 ? "Записаться · " + services[selected].title : "Записаться";
  }
  function updateCta() {
    $("cta").textContent = ctaText();
    if (inTg && $("lightbox").hidden) {
      tg.MainButton.setParams({ text: ctaText(), color: "#2E2125", text_color: "#FFF8F9", is_visible: true });
    }
  }
  $("cta").addEventListener("click", function () { book(); });

  // ---------- Шапка: цены, бегущая строка, подвал ----------
  $("hero-prices").innerHTML = (S.services || []).map(function (s) {
    return "<span>" + esc(s.title) + "<b>" + esc(s.price) + "</b></span>";
  }).join("");
  (function () {
    var words = (S.categories || []).map(function (c) { return c.title; }).concat(S.city ? [S.city] : []);
    var row = words.map(function (w) { return "<span>" + esc(w) + "</span>"; }).join("");
    $("marquee").innerHTML = row + row + row + row; // дважды по два, чтобы лента шла без шва
  })();
  $("foot").textContent = "© " + new Date().getFullYear() + " " + (S.name || "") + (S.city ? " · " + S.city : "");
  $("hero-book").addEventListener("click", function () { book(); });

  // Плавающая кнопка появляется, когда кнопка в шапке ушла с экрана
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      $("cta-wrap").classList.toggle("is-shown", !es[0].isIntersecting && es[0].boundingClientRect.top < 0);
    }).observe($("hero-book"));
  } else {
    $("cta-wrap").classList.add("is-shown");
  }

  // ---------- Верхняя строка ----------
  $("topnav-name").innerHTML = '<span class="mono">' + esc(initials) + '</span><span class="nm">' + esc(S.name || "") + "</span>";
  // Тень под строкой, когда страница прокручена
  var onScroll = function () { $("topnav").classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Telegram ----------
  function initTelegram() {
    tg = window.Telegram && window.Telegram.WebApp;
    inTg = !!(tg && tg.platform && tg.platform !== "unknown");
    if (!inTg) return;
    document.body.classList.add("in-tg");
    try {
      tg.ready();
      tg.expand();
      if (tg.isVersionAtLeast("6.1")) {
        tg.setHeaderColor("#F9E5EA");
        tg.setBackgroundColor("#F9E5EA");
      }
      if (tg.isVersionAtLeast("7.10")) tg.setBottomBarColor("#F9E5EA");
      if (tg.isVersionAtLeast("7.7")) tg.disableVerticalSwipes();
    } catch (e) {}
    tg.MainButton.onClick(function () { book(); });
    tg.BackButton.onClick(closeLightbox);
    updateCta();
    // Отступы под кнопки Telegram приходят чуть позже и меняются при повороте: пересчитываем кадры
    ["safeAreaChanged", "contentSafeAreaChanged", "fullscreenChanged", "viewportChanged"].forEach(function (ev) {
      try { tg.onEvent(ev, fitLooks); } catch (e) {}
    });
    setTimeout(fitLooks, 300);
  }
  if (isMiniApp) {
    var tgs = document.createElement("script");
    tgs.src = "https://telegram.org/js/telegram-web-app.js";
    tgs.onload = initTelegram;
    document.head.appendChild(tgs);
  }

  reveal(document);
  renderFilters();
  renderGallery();
  renderServices();
  renderAbout();
  updateCta();
})();
