/* ============================================================
   Progressive enhancement only.

   Every piece of content on this page is in the HTML already —
   nothing here is required to read the site, follow a link, or
   send an email. This file adds four things and nothing else:

     1. the pipeline rule draw-in
     2. a scroll-spy that marks the current section in the rail
     3. the small-screen section menu
     4. copy-to-clipboard on the email address

   Anchor navigation and smooth scrolling are handled natively by
   CSS `scroll-behavior`, which respects prefers-reduced-motion
   without any JavaScript.
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ 1. pipeline rule */

  var layers = document.getElementById('layers');
  if (layers) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      layers.classList.add('is-drawn');
    } else {
      var drawObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            layers.classList.add('is-drawn');
            obs.disconnect();
          });
        },
        { threshold: 0.3 }
      );
      drawObserver.observe(layers);
    }
  }

  /* --------------------------------------------------- 2. scroll spy */
  /* Sections are observed against a narrow band near the top of the
     viewport, and the topmost section intersecting that band wins. The
     previous build compared scrollY against offsetTop for every section
     on every scroll event, which highlighted the section above the one
     you were actually reading. */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var sections = navLinks
    .map(function (a) {
      return document.getElementById(a.getAttribute('data-nav'));
    })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var intersecting = Object.create(null);
    var currentId = null;

    var mark = function (id) {
      if (id === currentId) return;
      currentId = id;
      navLinks.forEach(function (a) {
        if (a.getAttribute('data-nav') === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          intersecting[entry.target.id] = entry.isIntersecting;
        });

        for (var i = 0; i < sections.length; i++) {
          if (intersecting[sections[i].id]) {
            mark(sections[i].id);
            return;
          }
        }
        // Nothing in the band (between sections, or at the very bottom) —
        // keep the last known section rather than clearing the rail.
      },
      { rootMargin: '-12% 0px -70% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      spy.observe(section);
    });
  }

  /* ------------------------------------------------ 3. section menu */

  var toggle = document.getElementById('rail-toggle');
  var nav = document.getElementById('rail-nav');

  if (toggle && nav) {
    var isOpen = function () {
      return toggle.getAttribute('aria-expanded') === 'true';
    };

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !isOpen()) return;
      setOpen(false);
      toggle.focus();
    });

    document.addEventListener('click', function (event) {
      if (!isOpen()) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    // Reset if the viewport grows past the breakpoint while the menu is open,
    // so the desktop rail never inherits a stale open state.
    var wide = window.matchMedia('(min-width: 60rem)');
    var onWide = function (event) {
      if (event.matches) setOpen(false);
    };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* -------------------------------------------------- 4. copy email */
  /* The button ships hidden and is revealed only where the clipboard API
     actually exists, so it is never a control that does nothing. */

  var copy = document.getElementById('copy-email');
  if (copy && navigator.clipboard && window.isSecureContext) {
    var label = copy.querySelector('.copy-label');
    var resetTimer;

    label.setAttribute('aria-live', 'polite');
    copy.hidden = false;

    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(copy.getAttribute('data-email')).then(
        function () {
          copy.setAttribute('data-copied', 'true');
          label.textContent = 'Copied';
        },
        function () {
          label.textContent = 'Copy failed';
        }
      );

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(function () {
        copy.removeAttribute('data-copied');
        label.textContent = 'Copy';
      }, 2400);
    });
  }
})();
