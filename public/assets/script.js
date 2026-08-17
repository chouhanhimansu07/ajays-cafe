/*==============================================================================
  AJAY'S CAFE — script.js
  Single modular file powering every page (index, menu, services, contact,
  watchlist). Each module below feature-detects the elements it needs, so
  it is safe to include this one file on all five pages.
==============================================================================*/

"use strict";

/*==============================================================================
  UTILITIES
==============================================================================*/
const Utils = (() => {
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const formatINR = (num) => `₹${Math.round(num).toLocaleString("en-IN")}`;

  const debounce = (fn, wait = 200) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (err) {
        console.warn("storage.get failed", err);
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.warn("storage.set failed", err);
      }
    },
  };

  /** Basic field validators shared across every form on the site */
  const validators = {
    name: (v) => v.trim().length >= 2,
    phone: (v) => /^[6-9]\d{9}$/.test(v.trim().replace(/\s+/g, "")),
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    required: (v) => v.trim().length > 0,
  };

  /** Marks a field valid/invalid and returns whether it passed */
  const validateField = (el, rule) => {
    if (!el) return true;
    const ok = rule(el.value || "");
    el.classList.toggle("field-invalid", !ok);
    el.classList.toggle("field-valid", ok);
    return ok;
  };

  return { qs, qsa, formatINR, debounce, storage, validators, validateField };
})();

/*==============================================================================
  ALERTS — reusable toast used on every page
==============================================================================*/
const Alerts = (() => {
  // Some pages use #alertBox, contact/services use different ids for the
  // message text node — we resolve whichever exists on the current page.
  const box = Utils.qs("#alertBox") || Utils.qs("#customAlert");
  const textNode = Utils.qs("#alertText");
  let hideTimer = null;

  const show = (message, type = "success") => {
    if (!box) return;
    if (textNode) {
      textNode.textContent = message;
    } else {
      // Rebuild the icon + message, keeping the icon element intact.
      const icon = box.querySelector("i");
      box.textContent = "";
      if (icon) box.appendChild(icon);
      box.appendChild(document.createTextNode(` ${message}`));
    }

    box.classList.toggle("error", type === "error");
    box.classList.add("show");

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => box.classList.remove("show"), 2800);
  };

  return { show };
})();

/*==============================================================================
  PRELOADER
==============================================================================*/
const Preloader = (() => {
  const init = () => {
    const loader = Utils.qs("#preloader");
    if (!loader) return;

    const hide = () => loader.classList.add("hidden");
    // Hide once everything has loaded, with a minimum flash time so the
    // brand moment always gets seen even on a fast connection.
    const minDelay = new Promise((res) => setTimeout(res, 900));
    const pageLoad = new Promise((res) => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", res, { once: true });
    });

    Promise.all([minDelay, pageLoad]).then(hide);
  };

  return { init };
})();

/*==============================================================================
  NAVBAR — sticky background, mobile menu, active link
==============================================================================*/
const Navbar = (() => {
  const init = () => {
    const nav = Utils.qs("nav.head");
    if (!nav) return;

    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 30);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Close the mobile collapse after a link is tapped
    const collapseEl = Utils.qs("#menu");
    if (collapseEl && window.bootstrap) {
      Utils.qsa(".nav-link", collapseEl).forEach((link) => {
        link.addEventListener("click", () => {
          if (window.innerWidth < 992) {
            const instance = window.bootstrap.Collapse.getOrCreateInstance(collapseEl);
            instance.hide();
          }
        });
      });
    }
  };

  return { init };
})();

/*==============================================================================
  HERO SLIDER — home page image crossfade
==============================================================================*/
const HeroSlider = (() => {
  const init = () => {
    const slides = Utils.qsa(".slider img");
    if (!slides.length) return;

    let i = 0;
    slides[0].classList.add("active");

    setInterval(() => {
      slides[i].classList.remove("active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("active");
    }, 4500);
  };

  return { init };
})();

/*==============================================================================
  SCROLL REVEAL — IntersectionObserver driven fade/slide/zoom-in
==============================================================================*/
const ScrollReveal = (() => {
  const init = () => {
    const targets = Utils.qsa(".reveal");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    targets.forEach((t) => observer.observe(t));
  };

  return { init };
})();

/*==============================================================================
  LAZY LOAD IMAGES — fades images in once loaded/visible
==============================================================================*/
const LazyImages = (() => {
  const reveal = (img) => {
    if (img.complete) img.classList.add("is-loaded");
    else img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
  };

  const init = () => {
    const heroImgs = new Set(Utils.qsa(".slider img"));
    const images = Utils.qsa("img").filter((img) => !heroImgs.has(img));

    images.forEach((img) => {
      img.classList.add("lazy-img");
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    });

    if (!("IntersectionObserver" in window)) {
      images.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "150px" }
    );

    images.forEach((img) => observer.observe(img));
  };

  return { init };
})();

/*==============================================================================
  COUNTER ANIMATION — visitor counter with a gentle count-up
==============================================================================*/
const VisitorCounter = (() => {
  const animateCount = (el, target, duration = 1400) => {
    const start = performance.now();
    const from = 0;
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (target - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const init = () => {
    const el = Utils.qs("#visitorCount");
    if (!el) return;

    // A believable "live" visitor number, persisted for the session so it
    // does not jump around between pages.
    let count = Utils.storage.get("cafe:visitors", null);
    if (!count) {
      count = 120 + Math.floor(Math.random() * 60);
      Utils.storage.set("cafe:visitors", count);
    }

    animateCount(el, count);

    // Small organic drift every few seconds to feel alive.
    setInterval(() => {
      count += Math.random() > 0.5 ? 1 : -1;
      count = Math.max(95, count);
      el.textContent = count;
      Utils.storage.set("cafe:visitors", count);
    }, 6000);
  };

  return { init };
})();

/*==============================================================================
  THEME TOGGLE — light / dark mode, persisted
==============================================================================*/
const ThemeToggle = (() => {
  const KEY = "cafe:theme";

  const applyIcon = (btn, theme) => {
    const icon = btn.querySelector("i");
    if (!icon) return;
    icon.className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
  };

  const init = () => {
    const btn = Utils.qs("#themeToggle");
    const root = document.documentElement;
    const saved = Utils.storage.get(KEY, "light");

    root.setAttribute("data-theme", saved);
    if (btn) applyIcon(btn, saved);

    if (!btn) return;

    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      Utils.storage.set(KEY, next);
      applyIcon(btn, next);
    });
  };

  return { init };
})();

/*==============================================================================
  RIPPLE BUTTON EFFECT — applies to every .btn-custom
==============================================================================*/
const RippleButtons = (() => {
  const init = () => {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-custom");
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);

      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  };

  return { init };
})();

/*==============================================================================
  BACK TO TOP — injected button, no HTML change required
==============================================================================*/
const BackToTop = (() => {
  const init = () => {
    const btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
    document.body.appendChild(btn);

    window.addEventListener(
      "scroll",
      () => btn.classList.toggle("show", window.scrollY > 480),
      { passive: true }
    );

    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  return { init };
})();

/*==============================================================================
  NEWSLETTER — injected into the first footer column
==============================================================================*/
const Newsletter = (() => {
  const init = () => {
    const col = Utils.qs(".cafe-footer .footer-col");
    if (!col || col.querySelector(".newsletter")) return;

    const wrap = document.createElement("form");
    wrap.className = "newsletter";
    wrap.innerHTML = `
      <input type="email" placeholder="Your email for offers" aria-label="Newsletter email" required />
      <button type="submit">Join</button>
    `;

    wrap.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = wrap.querySelector("input");
      if (!Utils.validators.email(input.value)) {
        input.classList.add("field-invalid");
        Alerts.show("Please enter a valid email", "error");
        return;
      }
      input.classList.remove("field-invalid");
      Alerts.show("Subscribed! Happy Wali offers incoming.");
      wrap.reset();
    });

    col.appendChild(wrap);
  };

  return { init };
})();

/*==============================================================================
  MAP PLACEHOLDER — injected on the contact page only
==============================================================================*/
const MapPlaceholder = (() => {
  const init = () => {
    const container = Utils.qs(".contact-container");
    if (!container) return;
    if (Utils.qs(".map-placeholder")) return; // real map already in the HTML — don't inject a duplicate

    const map = document.createElement("div");
    map.className = "map-placeholder reveal";
    map.innerHTML = `
      <div>
        <i class="bi bi-geo-alt-fill"></i>
        Find us on the map — Ahmedabad, Gujarat
      </div>
    `;
    container.insertAdjacentElement("afterend", map);
    ScrollReveal.init();
  };

  return { init };
})();

/*==============================================================================
  CART — shared across menu.html and watchlist.html via localStorage
==============================================================================*/
const Cart = (() => {
  const KEY = "cafe:cart";
  const DELIVERY_FEE = 40;
  const GST_RATE = 0.05;

  const get = () => Utils.storage.get(KEY, []);
  const save = (items) => Utils.storage.set(KEY, items);

  const totalCount = () => get().reduce((sum, item) => sum + item.qty, 0);

  const addItem = (name, price) => {
    const items = get();
    const existing = items.find((i) => i.name === name);
    if (existing) existing.qty += 1;
    else items.push({ name, price, qty: 1 });
    save(items);
    updateBadges();
  };

  const removeItem = (name) => {
    save(get().filter((i) => i.name !== name));
    updateBadges();
  };

  const changeQty = (name, delta) => {
    const items = get();
    const item = items.find((i) => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      save(items.filter((i) => i.name !== name));
    } else {
      save(items);
    }
    updateBadges();
  };

  const clear = () => save([]);

  const updateBadges = () => {
    const count = totalCount();
    Utils.qsa("#count, .cart-badge").forEach((el) => {
      el.textContent = count;
      el.classList.add("bump");
      setTimeout(() => el.classList.remove("bump"), 400);
    });
  };

  return { get, save, addItem, removeItem, changeQty, clear, totalCount, updateBadges, DELIVERY_FEE, GST_RATE };
})();

/*==============================================================================
  MENU PAGE — add to cart + live search
==============================================================================*/
const MenuPage = (() => {
  const init = () => {
    const grids = Utils.qsa(".menu-grid");
    if (!grids.length) return;

    Cart.updateBadges();

    // Expose add() globally because product buttons use inline onclick
    // handlers already present in the existing HTML markup.
    window.add = (name, price) => {
      Cart.addItem(name, price);
      Alerts.show(`${name} added to cart`);
    };

    const input = Utils.qs("#searchInput");
    if (!input) return;

    const cards = Utils.qsa(".menu-card");

    const runSearch = Utils.debounce(() => {
      const term = input.value.trim().toLowerCase();
      let anyVisible = false;

      cards.forEach((card) => {
        const name = (card.querySelector("h3")?.textContent || "").toLowerCase();
        const match = name.includes(term);
        card.style.display = match ? "" : "none";
        if (match) anyVisible = true;
      });

      // Hide/show category titles when every card under them is filtered out
      grids.forEach((grid) => {
        const visibleCards = Utils.qsa(".menu-card", grid).some((c) => c.style.display !== "none");
        const titleEl = grid.previousElementSibling;
        if (titleEl && titleEl.classList.contains("title")) {
          titleEl.style.display = visibleCards ? "" : "none";
        }
        grid.style.display = visibleCards ? "" : "none";
      });

      void anyVisible;
    }, 180);

    input.addEventListener("input", runSearch);
  };

  return { init };
})();

/*==============================================================================
  WATCHLIST PAGE — cart rendering, billing, checkout
==============================================================================*/
const WatchlistPage = (() => {
  const render = () => {
    const container = Utils.qs("#cartItems");
    if (!container) return;

    const items = Cart.get();
    container.innerHTML = "";

    if (!items.length) {
      container.innerHTML = `<div class="cart-empty">Your cart is empty. Add something delicious from the <a href="menu.html">menu</a>.</div>`;
    } else {
      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "cart-item";
        row.dataset.name = item.name;
        row.innerHTML = `
          <div class="cart-item-icon"><i class="bi bi-cup-hot-fill"></i></div>
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${Utils.formatINR(item.price)} × ${item.qty}</div>
          </div>
          <div class="qty-control">
            <button type="button" class="qty-minus" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="remove-item" aria-label="Remove item">
            <i class="bi bi-trash3-fill"></i>
          </button>
        `;
        container.appendChild(row);
      });
    }

    updateBilling();
  };

  const updateBilling = () => {
    const items = Cart.get();
    const itemTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const gst = itemTotal * Cart.GST_RATE;
    const delivery = items.length ? Cart.DELIVERY_FEE : 0;
    const finalTotal = itemTotal + gst + delivery;

    const set = (id, value) => {
      const el = Utils.qs(id);
      if (!el) return;
      el.textContent = Utils.formatINR(value);
      el.parentElement?.classList.add("price-pulse");
      setTimeout(() => el.parentElement?.classList.remove("price-pulse"), 500);
    };

    set("#itemTotal", itemTotal);
    set("#gst", gst);
    set("#finalTotal", finalTotal);

    const popupTotal = Utils.qs("#popupTotal");
    if (popupTotal) popupTotal.textContent = Utils.formatINR(finalTotal);

    Cart.updateBadges();
  };

  const bindCartEvents = () => {
    const container = Utils.qs("#cartItems");
    if (!container) return;

    container.addEventListener("click", (e) => {
      const row = e.target.closest(".cart-item");
      if (!row) return;
      const name = row.dataset.name;

      if (e.target.closest(".qty-plus")) {
        Cart.changeQty(name, 1);
        render();
      } else if (e.target.closest(".qty-minus")) {
        Cart.changeQty(name, -1);
        render();
      } else if (e.target.closest(".remove-item")) {
        row.classList.add("removing");
        row.addEventListener(
          "animationend",
          () => {
            Cart.removeItem(name);
            render();
          },
          { once: true }
        );
      }
    });
  };

  const init = () => {
    if (!Utils.qs("#cartItems")) return;

    render();
    bindCartEvents();

    // Suggestion cards use inline onclick="addMore(name, price)"
    window.addMore = (name, price) => {
      Cart.addItem(name, price);
      Alerts.show(`${name} added to cart`);
      render();
    };

    // "PLACE ORDER" button reveals the customer details form
    window.openForm = () => {
      const items = Cart.get();
      if (!items.length) {
        Alerts.show("Your cart is empty", "error");
        return;
      }
      const box = Utils.qs("#customerBox");
      if (box) {
        box.classList.add("open");
        box.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // "CONFIRM ORDER" validates and finalises the order
    window.confirmOrder = () => {
      const name = Utils.qs("#customerName");
      const phone = Utils.qs("#customerPhone");
      const address = Utils.qs("#customerAddress");
      const payment = Utils.qs("#paymentMethod");

      const validName = Utils.validateField(name, Utils.validators.name);
      const validPhone = Utils.validateField(phone, Utils.validators.phone);
      const validAddress = Utils.validateField(address, Utils.validators.required);
      const validPayment = Utils.validateField(payment, Utils.validators.required);

      if (!validName || !validPhone || !validAddress || !validPayment) {
        Alerts.show("Please fill all fields correctly", "error");
        return;
      }

      Alerts.show(`Thank you ${name.value.trim()}! Your order is confirmed.`);
      Cart.clear();
      render();

      [name, phone, address, payment].forEach((el) => {
        el.value = "";
        el.classList.remove("field-valid", "field-invalid");
      });

      const box = Utils.qs("#customerBox");
      if (box) box.classList.remove("open");
    };
  };

  return { init };
})();

/*==============================================================================
  CONTACT PAGE — form validation + submit
==============================================================================*/
const ContactPage = (() => {
  const init = () => {
    const form = Utils.qs(".contact-form form");
    if (!form) return;

    window.sendMessage = (event) => {
      event.preventDefault();

      const name = Utils.qs("#name");
      const email = Utils.qs("#email");
      const phone = Utils.qs("#phone");
      const message = Utils.qs("#message");

      const validName = Utils.validateField(name, Utils.validators.name);
      const validEmail = Utils.validateField(email, Utils.validators.email);
      const validPhone = Utils.validateField(phone, Utils.validators.phone);
      const validMessage = Utils.validateField(message, Utils.validators.required);

      if (!validName || !validEmail || !validPhone || !validMessage) {
        Alerts.show("Please check the highlighted fields", "error");
        return;
      }

      Alerts.show("Message sent! We'll get back to you soon.");
      form.reset();
      [name, email, phone, message].forEach((el) => el.classList.remove("field-valid"));
    };
  };

  return { init };
})();

/*==============================================================================
  SERVICES PAGE — table & venue booking validation
==============================================================================*/
const ServicesPage = (() => {
  const init = () => {
    const tableBox = Utils.qs("#table-booking");
    const venueBox = Utils.qs("#venue-booking");
    if (!tableBox && !venueBox) return;

    window.validateTableBooking = () => {
      const name = Utils.qs("#tableName");
      const phone = Utils.qs("#tablePhone");
      const date = Utils.qs("#tableDate");
      const time = Utils.qs("#tableTime");
      const guests = Utils.qs("#tableGuests");

      const checks = [
        Utils.validateField(name, Utils.validators.name),
        Utils.validateField(phone, Utils.validators.phone),
        Utils.validateField(date, Utils.validators.required),
        Utils.validateField(time, Utils.validators.required),
        Utils.validateField(guests, Utils.validators.required),
      ];

      if (checks.includes(false)) {
        Alerts.show("Please fill all booking details correctly", "error");
        return;
      }

      Alerts.show(`Table reserved for ${name.value.trim()} — see you soon!`);
      [name, phone, date, time, guests].forEach((el) => {
        el.value = "";
        el.classList.remove("field-valid");
      });
    };

    window.validateVenueBooking = () => {
      const name = Utils.qs("#venueName");
      const email = Utils.qs("#venueEmail");
      const date = Utils.qs("#venueDate");
      const guests = Utils.qs("#venueGuests");
      const type = Utils.qs("#eventType");
      const requirement = Utils.qs("#venueRequirement");

      const checks = [
        Utils.validateField(name, Utils.validators.name),
        Utils.validateField(email, Utils.validators.email),
        Utils.validateField(date, Utils.validators.required),
        Utils.validateField(guests, Utils.validators.required),
        Utils.validateField(type, Utils.validators.required),
      ];

      if (checks.includes(false)) {
        Alerts.show("Please fill all venue details correctly", "error");
        return;
      }

      Alerts.show(`Venue request received for ${name.value.trim()}!`);
      [name, email, date, guests, type, requirement].forEach((el) => {
        el.value = "";
        el.classList.remove("field-valid");
      });
    };
  };

  return { init };
})();

/*==============================================================================
  AJAY'S AI — assistant widget on the home page
==============================================================================*/
const AjayAI = (() => {
  const init = () => {
    const box = Utils.qs("#ajayAIBox");
    if (!box) return;

    const body = Utils.qs("#aiBody");

    window.toggleAjayAI = () => box.classList.toggle("open");

    const pushMessage = (html) => {
      const msg = document.createElement("div");
      msg.className = "ai-message";
      msg.innerHTML = html;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
    };

    window.showMenuOptions = () => {
      pushMessage(
        `<strong>Ajay's AI</strong><br><br>Great choice! Head to our <a href="menu.html">Menu page</a> to browse coffee, snacks and fast food.`
      );
    };

    window.showBookingOptions = () => {
      pushMessage(
        `<strong>Ajay's AI</strong><br><br>You can reserve a table or book our venue on the <a href="services.html">Services page</a>.`
      );
    };

    window.showHelpOptions = () => {
      pushMessage(
        `<strong>Ajay's AI</strong><br><br>Need help? Call us at +91 98765 43210 or visit the <a href="contact.html">Contact page</a> — we reply fast!`
      );
    };

    window.showCart = () => {
      const count = Cart.totalCount();
      pushMessage(
        count
          ? `<strong>Ajay's AI</strong><br><br>You have ${count} item(s) in your cart. <a href="watchlist.html">View cart</a>`
          : `<strong>Ajay's AI</strong><br><br>Your cart is empty right now. Explore the <a href="menu.html">Menu</a> to add something tasty!`
      );
    };

    window.checkout = () => {
      const count = Cart.totalCount();
      pushMessage(
        count
          ? `<strong>Ajay's AI</strong><br><br>Ready to checkout? Head to your <a href="watchlist.html">Orders page</a> to confirm.`
          : `<strong>Ajay's AI</strong><br><br>Add a few items first, then come back to checkout!`
      );
    };
  };

  return { init };
})();

/*==============================================================================
  INIT — bootstraps every module once the DOM is ready
==============================================================================*/
document.addEventListener("DOMContentLoaded", () => {
  Preloader.init();
  Navbar.init();
  HeroSlider.init();
  ThemeToggle.init();
  LazyImages.init();
  ScrollReveal.init();
  VisitorCounter.init();
  RippleButtons.init();
  BackToTop.init();
  Newsletter.init();
  MapPlaceholder.init();
  Cart.updateBadges();

  MenuPage.init();
  WatchlistPage.init();
  ContactPage.init();
  ServicesPage.init();
  AjayAI.init();
});