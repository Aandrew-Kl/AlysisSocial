/* ==========================================================================
   AlysisAI — Digital contact card
   - URL QR code (scan to open this card in a browser)
   - Web Share API with clipboard fallback
   - Toast feedback
   ========================================================================== */

(function () {
  'use strict';

  /* ----- Configuration -------------------------------------------------- */
  // Public URL of this card — used by the Share button and as a local-preview
  // fallback. Auto-detected from window.location when served from a real
  // domain; this constant only kicks in for file:// or localhost previews.
  var CARD_URL    = 'https://aandrew-kl.github.io/AlysisSocial/';
  var SHARE_TITLE = 'AlysisAI';
  var SHARE_TEXT  = 'AlysisAI — AI, technology and digital presence';

  /* ----- Helpers -------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }

  // Canonical URL of this card — used by both the QR and the Share button.
  // When opened locally (file:// or localhost) we fall back to CARD_URL so
  // the QR still points somewhere useful while previewing.
  function getCardURL() {
    var href = window.location.href.split('#')[0];
    if (/^file:|^https?:\/\/(localhost|127\.|0\.0\.0\.0)/i.test(href)) {
      return CARD_URL;
    }
    return href;
  }

  function prettyURL(url) {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  /* ----- QR code -------------------------------------------------------- */
  function renderQR() {
    var el = $('qrcode');
    if (!el) return;

    var target  = getCardURL();
    var display = prettyURL(target);
    var label   = 'QR code linking to ' + display;

    // Keep the visible URL caption and the QR's accessible label in sync
    // with whatever the QR actually encodes.
    var urlEl = $('qr-url');
    if (urlEl) urlEl.textContent = display;
    el.setAttribute('aria-label', label);

    if (typeof QRCode === 'undefined') {
      el.innerHTML =
        '<a href="' + target + '" style="color:#0a0a14;font-size:13px;' +
        'font-weight:600;text-decoration:none">Open ' + display + '</a>';
      return;
    }

    /* eslint-disable no-new */
    new QRCode(el, {
      text: target,
      width: 200,
      height: 200,
      colorDark:  '#0a0a14',
      colorLight: '#ffffff',
      // URL fits comfortably with high correction — crisper, more forgiving
      // to bad camera angles and screen glare.
      correctLevel: QRCode.CorrectLevel.H
    });

    requestAnimationFrame(function () {
      var img = el.querySelector('img');
      if (img) {
        img.setAttribute('alt', label);
        img.setAttribute('draggable', 'false');
      }
    });
  }

  /* ----- Share button --------------------------------------------------- */
  function setupShare() {
    var btn = $('share-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var shareData = {
        title: SHARE_TITLE,
        text:  SHARE_TEXT,
        url:   getCardURL()
      };

      var canUseShare =
        typeof navigator.share === 'function' &&
        (!navigator.canShare || navigator.canShare(shareData));

      if (canUseShare) {
        navigator.share(shareData).catch(function (err) {
          // AbortError = user dismissed the sheet — silent
          if (err && err.name !== 'AbortError') copyLink();
        });
      } else {
        copyLink();
      }
    });
  }

  function copyLink() {
    var url = getCardURL();

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(
        function () { showToast('Link copied to clipboard'); },
        function () { legacyCopy(url); }
      );
    } else {
      legacyCopy(url);
    }
  }

  function legacyCopy(text) {
    try {
      var input = document.createElement('input');
      input.value = text;
      input.setAttribute('readonly', '');
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, text.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(input);
      showToast(ok ? 'Link copied to clipboard' : 'Press ⌘/Ctrl + C to copy');
    } catch (e) {
      showToast('Could not copy link');
    }
  }

  /* ----- Toast ---------------------------------------------------------- */
  var toastTimer = null;
  function showToast(message) {
    var toast = $('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  /* ----- Footer year ---------------------------------------------------- */
  function setYear() {
    var y = $('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ----- Init ----------------------------------------------------------- */
  function init() {
    renderQR();
    setupShare();
    setYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
