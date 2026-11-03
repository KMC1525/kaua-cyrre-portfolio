/* Portfólio Kauã Moraes Cyrre: galeria virtual */
(function () {
  "use strict";

  var track = document.getElementById("track");
  if (!track) return;

  var pieces = Array.prototype.slice.call(track.querySelectorAll(".piece"));
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".room-tab"));
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");

  var plaqueTitle = document.getElementById("plaque-title");
  var plaqueRoom = document.getElementById("plaque-room");
  var plaqueCount = document.getElementById("plaque-count");
  var plaqueVideo = document.getElementById("plaque-video");

  var viewer = document.getElementById("viewer");
  var viewerImg = document.getElementById("viewer-img");
  var viewerTitle = document.getElementById("viewer-title");
  var viewerCount = document.getElementById("viewer-count");
  var viewerVideo = document.getElementById("viewer-video");
  var viewerPrev = document.getElementById("viewer-prev");
  var viewerNext = document.getElementById("viewer-next");
  var viewerClose = document.getElementById("viewer-close");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var current = 0;      // índice dentro das peças visíveis
  var viewerIndex = 0;
  var ticking = false;

  function visible() {
    return pieces.filter(function (p) { return !p.hidden; });
  }

  function behavior() {
    return reduceMotion.matches ? "auto" : "smooth";
  }

  function centerLeft(piece) {
    return piece.offsetLeft - (track.clientWidth - piece.offsetWidth) / 2;
  }

  function goTo(index, instant) {
    var list = visible();
    if (!list.length) return;
    index = Math.max(0, Math.min(list.length - 1, index));
    track.scrollTo({ left: centerLeft(list[index]), behavior: instant ? "auto" : behavior() });
  }

  /* Profundidade: cada peça gira e encolhe conforme se afasta do centro */
  function update() {
    ticking = false;
    var list = visible();
    if (!list.length) return;

    var center = track.scrollLeft + track.clientWidth / 2;
    var best = 0;
    var bestDist = Infinity;

    list.forEach(function (piece, i) {
      var mid = piece.offsetLeft + piece.offsetWidth / 2;
      var d = (mid - center) / (piece.offsetWidth * 1.15);
      d = Math.max(-2.2, Math.min(2.2, d));
      piece.style.setProperty("--d", d.toFixed(3));
      piece.style.setProperty("--a", Math.abs(d).toFixed(3));
      var dist = Math.abs(mid - center);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });

    if (best !== current || !plaqueTitle.dataset.ready) {
      current = best;
      plaqueTitle.dataset.ready = "1";
      renderPlaque(list[current], list.length);
    }
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === list.length - 1;
  }

  function renderPlaque(piece, total) {
    plaqueTitle.textContent = piece.dataset.title;
    plaqueRoom.textContent = piece.dataset.roomName;
    plaqueCount.textContent = (current + 1) + " de " + total;
    if (piece.dataset.video) {
      plaqueVideo.href = piece.dataset.video;
      plaqueVideo.hidden = false;
    } else {
      plaqueVideo.hidden = true;
    }
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  track.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", function () { goTo(current, true); requestUpdate(); });

  prevBtn.addEventListener("click", function () { goTo(current - 1); });
  nextBtn.addEventListener("click", function () { goTo(current + 1); });

  /* Teclado na sala */
  track.addEventListener("keydown", function (e) {
    if (e.target !== track) return;
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(visible().length - 1); }
    else if (e.key === "Enter") { e.preventDefault(); openViewer(current); }
  });

  /* Arrastar com o mouse (toque já rola nativamente) */
  var drag = null;
  var moved = false;

  track.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft };
    moved = false;
  });
  window.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!moved && Math.abs(dx) > 5) {
      moved = true;
      track.classList.add("dragging");
    }
    if (moved) track.scrollLeft = drag.left - dx;
  });
  function endDrag() {
    if (!drag) return;
    drag = null;
    if (moved) {
      track.classList.remove("dragging");
      // volta a encaixar na peça mais próxima
      goTo(current);
    }
  }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  /* Clique em uma miniatura: leva ao centro; se já está no centro, abre */
  track.addEventListener("click", function (e) {
    if (moved) { moved = false; return; }
    var frame = e.target.closest(".frame");
    if (!frame) return;
    var list = visible();
    var idx = list.indexOf(frame.parentElement);
    if (idx === -1) return;
    if (idx === current) openViewer(idx);
    else goTo(idx);
  });

  /* Salas (filtros) */
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var filter = tab.dataset.filter;
      tabs.forEach(function (t) { t.setAttribute("aria-pressed", String(t === tab)); });
      pieces.forEach(function (p) {
        p.hidden = !(filter === "all" || p.dataset.room === filter);
      });
      current = 0;
      delete plaqueTitle.dataset.ready;
      goTo(0, true);
      requestUpdate();
    });
  });

  /* Visualizador */
  function fillViewer(index) {
    var list = visible();
    viewerIndex = (index + list.length) % list.length;
    var piece = list[viewerIndex];
    viewerImg.src = piece.dataset.full;
    viewerImg.alt = piece.querySelector("img").alt;
    viewerTitle.textContent = piece.dataset.title;
    viewerCount.textContent = (viewerIndex + 1) + " de " + list.length;
    if (piece.dataset.video) {
      viewerVideo.href = piece.dataset.video;
      viewerVideo.hidden = false;
    } else {
      viewerVideo.hidden = true;
    }
  }

  function openViewer(index) {
    fillViewer(index);
    if (typeof viewer.showModal === "function") {
      viewer.showModal();
      document.documentElement.style.overflow = "hidden";
    }
  }

  function closeViewer() {
    if (viewer.open) viewer.close();
  }

  viewer.addEventListener("close", function () {
    document.documentElement.style.overflow = "";
    goTo(viewerIndex, true);
  });
  viewerClose.addEventListener("click", closeViewer);
  viewerPrev.addEventListener("click", function () { fillViewer(viewerIndex - 1); });
  viewerNext.addEventListener("click", function () { fillViewer(viewerIndex + 1); });
  viewer.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); fillViewer(viewerIndex + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); fillViewer(viewerIndex - 1); }
  });
  // Clique fora da imagem fecha
  viewer.addEventListener("click", function (e) {
    var t = e.target;
    if (t === viewer || t.classList.contains("viewer-inner") || t.classList.contains("viewer-stage")) closeViewer();
  });

  // Gestos de toque no visualizador (deslizar para trocar)
  var touchX = null;
  viewer.addEventListener("touchstart", function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  viewer.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) fillViewer(viewerIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  update();
})();
