/*==============================================================================
  AJAY'S AI — SELECTION-ONLY CHATBOT
  ------------------------------------------------------------------------------
  • No typing
  • No text input
  • No send button
  • User communicates only by selecting buttons
  • Custom AI image
  • Uses existing cafe cart
  • Frontend only
==============================================================================*/

(function () {
  "use strict";

  /*==========================================================================
    CONFIGURATION
  ==========================================================================*/

  var AI_IMAGE = "img/logo2.jpg" 
  var CART_KEY = "cafe:cart";


  /*==========================================================================
    MENU DATA
  ==========================================================================*/

  var MENU = {

    coffee: {
      label: "Coffee",
      emoji: "☕",

      items: [
        {
          name: "Espresso",
          cartName: "Espresso",
          desc: "Strong coffee shot",
          price: 40
        },
        {
          name: "Cappuccino",
          cartName: "Cappuccino",
          desc: "Creamy foam coffee",
          price: 45
        },
        {
          name: "Cafe Latte",
          cartName: "Latte",
          desc: "Milk coffee blend",
          price: 60
        },
        {
          name: "Americano",
          cartName: "Americano",
          desc: "Premium Americano",
          price: 50
        }
      ]
    },

    snacks: {
      label: "Snacks & Desserts",
      emoji: "🍰",

      items: [
        {
          name: "Samosa (2 pcs)",
          cartName: "Samosa",
          desc: "Classic samosa",
          price: 50
        },
        {
          name: "Dhokla",
          cartName: "Dhokla",
          desc: "Fresh Gujarati dhokla",
          price: 70
        },
        {
          name: "Puff (2 pcs)",
          cartName: "Puff",
          desc: "Crispy veg puff",
          price: 50
        },
        {
          name: "Vada Pav (2 pcs)",
          cartName: "Vada Pav",
          desc: "Mumbai style vada pav",
          price: 50
        },
        {
          name: "Brownie",
          cartName: "Brownie",
          desc: "Chocolate dessert",
          price: 100
        },
        {
          name: "Ice Cream (2 scoops)",
          cartName: "Ice Cream",
          desc: "Delight ice cream",
          price: 20
        },
        {
          name: "Red Velvet Cake",
          cartName: "Cake",
          desc: "Soft creamy cake",
          price: 220
        }
      ]
    },

    fastfood: {
      label: "Fast Food",
      emoji: "🍔",

      items: [
        {
          name: "Pizza",
          cartName: "Pizza",
          desc: "Cheese loaded pizza",
          price: 299
        },
        {
          name: "Veg Sandwich (2 pcs)",
          cartName: "Sandwich",
          desc: "Fresh sandwich",
          price: 150
        },
        {
          name: "Burger",
          cartName: "Burger",
          desc: "Juicy burger",
          price: 45
        },
        {
          name: "Pasta",
          cartName: "Pasta",
          desc: "Creamy pasta",
          price: 90
        },
        {
          name: "Masala Dosa",
          cartName: "Masala Dosa",
          desc: "South Indian masala dosa",
          price: 130
        },
        {
          name: "Garlic Bread",
          cartName: "Garlic Bread",
          desc: "Fresh garlic bread",
          price: 120
        },
        {
          name: "Pav Bhaji",
          cartName: "Pav Bhaji",
          desc: "Pav bhaji special",
          price: 100
        },
        {
          name: "Chole Bhature",
          cartName: "Chole Bhature",
          desc: "Authentic chole bhature",
          price: 90
        }
      ]
    }
  };


  /*==========================================================================
    CAFE INFORMATION
  ==========================================================================*/

  var CAFE = {
    address: "Ajay's Cafe, Ahmedabad, Gujarat, India",
    phone: "+91 98765 43210",
    email: "coffeecafe@gmail.com",
    hours: "Monday – Sunday, 9:00 AM – 11:00 PM",
    rating: "4.8 / 5"
  };


  /*==========================================================================
    DOM REFERENCES
  ==========================================================================*/

  var fab = null;
  var fabBadge = null;
  var panel = null;
  var body = null;
  var crumbEl = null;
  var footerNav = null;


  /*
    Navigation stack
  */

  var stack = [];


  /*==========================================================================
    SAFE HTML
  ==========================================================================*/

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  /*==========================================================================
    CART
  ==========================================================================*/

  function getCart() {
    try {
      var cart = JSON.parse(
        localStorage.getItem(CART_KEY)
      );

      return Array.isArray(cart) ? cart : [];

    } catch (error) {
      return [];
    }
  }


  function saveCart(items) {
    try {
      localStorage.setItem(
        CART_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error(
        "Ajay's AI: Could not save cart.",
        error
      );
    }
  }


  function cartCount() {
    return getCart().reduce(
      function (total, item) {
        return total + Number(item.qty || 0);
      },
      0
    );
  }


  function cartTotal() {
    return getCart().reduce(
      function (total, item) {
        return total +
          Number(item.price || 0) *
          Number(item.qty || 0);
      },
      0
    );
  }


  function addToCart(cartName, price) {
    var items = getCart();

    var existing = items.find(
      function (item) {
        return item.name === cartName;
      }
    );

    if (existing) {
      existing.qty =
        Number(existing.qty || 0) + 1;
    } else {
      items.push({
        name: cartName,
        price: Number(price),
        qty: 1
      });
    }

    saveCart(items);
    refreshBadges();
  }


  /*==========================================================================
    CART BADGES
  ==========================================================================*/

  function refreshBadges() {
    var count = cartCount();

    var nodes = document.querySelectorAll(
      "#count, .cart-badge"
    );

    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = count;
    }

    if (fabBadge) {
      fabBadge.textContent = count;

      fabBadge.classList.toggle(
        "show",
        count > 0
      );
    }
  }


  /*==========================================================================
    CREATE ELEMENT
  ==========================================================================*/

  function createElement(html) {
    var container =
      document.createElement("div");

    container.innerHTML = html.trim();

    return container.firstElementChild;
  }


  /*==========================================================================
    BUILD WIDGET
  ==========================================================================*/

  function buildWidget() {

    /* Prevent duplicate chatbot */

    if (
      document.querySelector(".ajai-fab") ||
      document.querySelector(".ajai-panel")
    ) {
      return;
    }


    /*----------------------------------------------------------------------
      FLOATING AI BUTTON
    ----------------------------------------------------------------------*/

    fab = document.createElement("button");

    fab.type = "button";

    fab.className = "ajai-fab";

    fab.setAttribute(
      "aria-label",
      "Open Ajay's AI assistant"
    );

    fab.innerHTML =
      '<span class="ajai-fab-ai">AI</span>' +
      '<span class="ajai-fab-badge" id="ajaiFabBadge">0</span>';

    document.body.appendChild(fab);


    /* IMPORTANT FIX:
       Assign badge after creating FAB
    */

    fabBadge =
      fab.querySelector("#ajaiFabBadge");


    /*----------------------------------------------------------------------
      CHAT PANEL
    ----------------------------------------------------------------------*/

    panel =
      document.createElement("div");

    panel.className = "ajai-panel";

    panel.setAttribute(
      "role",
      "dialog"
    );

    panel.setAttribute(
      "aria-label",
      "Ajay's AI assistant"
    );


    panel.innerHTML =

      /* HEADER */

      '<div class="ajai-header">' +

      '<div class="ajai-avatar">' +

      '<img src="' +
      AI_IMAGE +
      '" alt="Ajay\'s AI">' +

      "</div>" +

      '<div class="ajai-header-text">' +

      '<div class="name">Ajay\'s AI</div>' +

      '<div class="status">Online</div>' +

      "</div>" +

      '<div class="ajai-header-btns">' +

      '<button ' +
      'type="button" ' +
      'class="ajai-icon-btn" ' +
      'id="ajaiClose" ' +
      'aria-label="Close assistant">' +

      "✕" +

      "</button>" +

      "</div>" +

      "</div>" +


      /* BREADCRUMB */

      '<div class="ajai-crumb" id="ajaiCrumb">' +
      "Home" +
      "</div>" +


      /* BODY */

      '<div class="ajai-body" id="ajaiBody"></div>' +


      /* FOOTER */

      '<div class="ajai-footer-nav" id="ajaiFooterNav"></div>';


    document.body.appendChild(panel);


    body =
      panel.querySelector("#ajaiBody");

    crumbEl =
      panel.querySelector("#ajaiCrumb");

    footerNav =
      panel.querySelector("#ajaiFooterNav");


    /*----------------------------------------------------------------------
      EVENTS
    ----------------------------------------------------------------------*/

    fab.addEventListener(
      "click",
      openPanel
    );


    panel
      .querySelector("#ajaiClose")
      .addEventListener(
        "click",
        closePanel
      );


    window.addEventListener(
      "storage",
      refreshBadges
    );


    refreshBadges();
  }


  /*==========================================================================
    OPEN PANEL
  ==========================================================================*/

  function openPanel() {

    if (!panel) {
      return;
    }

    panel.classList.add("open");

    fab.classList.add("open");


    if (!stack.length) {
      goTo(
        "main",
        null,
        true
      );
    }


    setTimeout(
      scrollToBottom,
      50
    );
  }


  /*==========================================================================
    CLOSE PANEL
  ==========================================================================*/

  function closePanel() {

    if (!panel) {
      return;
    }

    panel.classList.remove("open");

    if (fab) {
      fab.classList.remove("open");
    }
  }


  /*==========================================================================
    SCROLL
  ==========================================================================*/

  function scrollToBottom() {

    if (!body) {
      return;
    }

    body.scrollTop =
      body.scrollHeight;
  }


  /*==========================================================================
    NAVIGATION
  ==========================================================================*/

  function goTo(
    screen,
    data,
    replace
  ) {

    var entry = {
      screen: screen,
      data: data || null
    };

    if (replace) {
      stack = [entry];
    } else {
      stack.push(entry);
    }

    render();
  }


  function goBack() {

    if (stack.length > 1) {
      stack.pop();
    }

    render();
  }


  function goHome() {

    stack = [
      {
        screen: "main",
        data: null
      }
    ];

    render();
  }


  /*==========================================================================
    AI MESSAGE
  ==========================================================================*/

  function say(html) {

    if (!body) {
      return;
    }

    var message =
      createElement(
        '<div class="ajai-msg"></div>'
      );

    message.innerHTML = html;

    body.appendChild(message);

    scrollToBottom();
  }


  /*==========================================================================
    USER MESSAGE
  ==========================================================================*/

  function userSay(text) {

    if (!body) {
      return;
    }

    var message =
      createElement(
        '<div class="ajai-user-msg"></div>'
      );

    message.textContent = text;

    body.appendChild(message);

    scrollToBottom();
  }


  /*==========================================================================
    OPTION BUTTONS
  ==========================================================================*/

  function optionsList(options) {

    var wrap =
      createElement(
        '<div class="ajai-options"></div>'
      );


    options.forEach(
      function (option) {

        var button =
          createElement(

            '<button ' +
            'type="button" ' +
            'class="ajai-option">' +

            '<span class="emoji">' +
            escapeHTML(
              option.emoji || "›"
            ) +
            "</span>" +

            '<span class="opt-text">' +

            '<span class="opt-title">' +
            escapeHTML(
              option.title
            ) +
            "</span>" +

            (
              option.sub
                ?
                '<span class="opt-sub">' +
                escapeHTML(option.sub) +
                "</span>"
                :
                ""
            ) +

            "</span>" +

            '<span class="chev">›</span>' +

            "</button>"
          );


        button.addEventListener(
          "click",
          function () {

            userSay(
              option.title
            );


            if (
              typeof option.onClick ===
              "function"
            ) {
              option.onClick();
            }

          }
        );


        wrap.appendChild(button);

      }
    );


    body.appendChild(wrap);

    scrollToBottom();
  }


  /*==========================================================================
    FOOTER NAVIGATION
  ==========================================================================*/

  function setFooterNav(
    showBack,
    showHome
  ) {

    footerNav.innerHTML = "";


    if (showBack) {

      var backButton =
        createElement(
          '<button type="button" class="ajai-nav-btn">' +
          "⬅️ Back" +
          "</button>"
        );


      backButton.addEventListener(
        "click",
        goBack
      );


      footerNav.appendChild(
        backButton
      );
    }


    if (showHome) {

      var homeButton =
        createElement(
          '<button type="button" class="ajai-nav-btn primary">' +
          "🏠 Main Menu" +
          "</button>"
        );


      homeButton.addEventListener(
        "click",
        goHome
      );


      footerNav.appendChild(
        homeButton
      );
    }
  }


  /*==========================================================================
    BREADCRUMB
  ==========================================================================*/

  function crumbLabel(entry) {

    if (entry.screen === "main") {
      return "Home";
    }

    if (entry.screen === "categories") {
      return "Menu";
    }

    if (entry.screen === "category") {

      return MENU[entry.data]
        ? MENU[entry.data].label
        : "Menu";
    }

    if (entry.screen === "cart") {
      return "My Cart";
    }

    if (entry.screen === "table") {
      return "Table Booking";
    }

    if (entry.screen === "venue") {
      return "Venue Booking";
    }

    if (entry.screen === "info") {
      return "Cafe Info";
    }

    if (entry.screen === "contact") {
      return "Contact";
    }

    return "";
  }


  /*==========================================================================
    MAIN RENDERER
  ==========================================================================*/

  function render() {

    if (!body) {
      return;
    }


    body.innerHTML = "";


    var current =
      stack[stack.length - 1];


    if (!current) {
      return;
    }


    var crumbs =
      stack
        .map(crumbLabel)
        .join(" → ");


    crumbEl.textContent =
      crumbs || "Home";


    setFooterNav(
      stack.length > 1,
      stack.length > 1
    );


    switch (current.screen) {

      case "main":
        renderMain();
        break;

      case "categories":
        renderCategories();
        break;

      case "category":
        renderCategory(current.data);
        break;

      case "cart":
        renderCart();
        break;

      case "table":
        renderTable();
        break;

      case "venue":
        renderVenue();
        break;

      case "info":
        renderInfo();
        break;

      case "contact":
        renderContact();
        break;

      default:
        goHome();
        break;
    }


    setTimeout(
      scrollToBottom,
      30
    );
  }


  /*==========================================================================
    MAIN MENU
  ==========================================================================*/

  function renderMain() {

    say(
      "Hi! 👋 Welcome to <strong>Ajay's Cafe</strong>.<br>" +
      "I'm Ajay's AI. What would you like to explore?"
    );


    optionsList([

      {
        emoji: "☕",
        title: "Explore Menu",
        sub: "Coffee, snacks & fast food",

        onClick: function () {
          goTo("categories");
        }
      },


      {
        emoji: "🛒",
        title: "My Cart",
        sub: cartCount() + " item(s)",

        onClick: function () {
          goTo("cart");
        }
      },


      {
        emoji: "📅",
        title: "Book a Table",
        sub: "Reserve your table",

        onClick: function () {
          goTo("table");
        }
      },


      {
        emoji: "🎉",
        title: "Book a Venue",
        sub: "Birthdays, parties & more",

        onClick: function () {
          goTo("venue");
        }
      },


      {
        emoji: "📍",
        title: "Cafe Information",
        sub: "Location, hours & rating",

        onClick: function () {
          goTo("info");
        }
      },


      {
        emoji: "📞",
        title: "Contact Us",
        sub: "Phone & email",

        onClick: function () {
          goTo("contact");
        }
      }

    ]);
  }


  /*==========================================================================
    CATEGORIES
  ==========================================================================*/

  function renderCategories() {

    say(
      "Sure! ☕ What would you like to explore?"
    );


    var options =
      Object.keys(MENU)
        .map(
          function (key) {

            var category =
              MENU[key];


            return {

              emoji:
                category.emoji,

              title:
                category.label,

              sub:
                category.items.length +
                " items available",

              onClick:
                function () {

                  goTo(
                    "category",
                    key
                  );

                }
            };
          }
        );


    optionsList(options);
  }


  /*==========================================================================
    CATEGORY ITEMS
  ==========================================================================*/

  function renderCategory(
    categoryKey
  ) {

    var category =
      MENU[categoryKey];


    if (!category) {
      goHome();
      return;
    }


    say(
      "Great choice! " +
      category.emoji +
      "<br>" +
      "Here are our <strong>" +
      escapeHTML(
        category.label.toLowerCase()
      ) +
      "</strong> options:"
    );


    var wrap =
      createElement(
        '<div class="ajai-options ajai-item-list"></div>'
      );


    category.items.forEach(
      function (item) {

        var card =
          createElement(

            '<div class="ajai-item-card">' +

            '<div class="item-info">' +

            '<div class="item-name">' +
            escapeHTML(item.name) +
            "</div>" +

            '<div class="item-desc">' +
            escapeHTML(item.desc) +
            "</div>" +

            '<div class="item-price">' +
            "₹" +
            Number(item.price) +
            "</div>" +

            "</div>" +

            '<button ' +
            'type="button" ' +
            'class="ajai-add-btn">' +

            "🛒 Add" +

            "</button>" +

            "</div>"
          );


        var addButton =
          card.querySelector(
            ".ajai-add-btn"
          );


        addButton.addEventListener(
          "click",
          function (event) {

            event.stopPropagation();


            addToCart(
              item.cartName,
              item.price
            );


            addButton.textContent =
              "✓ Added";


            addButton.classList.add(
              "added"
            );


            say(
              "Added <strong>" +
              escapeHTML(item.name) +
              "</strong> to your cart. 🛒"
            );


            optionsList([

              {
                emoji: "🛒",
                title: "View My Cart",

                onClick:
                  function () {
                    goTo("cart");
                  }
              },


              {
                emoji: "➕",
                title: "Add More Items",

                onClick:
                  function () {
                    goTo(
                      "category",
                      categoryKey
                    );
                  }
              }

            ]);


            setTimeout(
              function () {

                addButton.textContent =
                  "🛒 Add";

                addButton.classList.remove(
                  "added"
                );

              },
              1200
            );
          }
        );


        wrap.appendChild(card);
      }
    );


    body.appendChild(wrap);

    scrollToBottom();
  }


  /*==========================================================================
    CART SCREEN
  ==========================================================================*/

  function renderCart() {

    var items =
      getCart();


    if (!items.length) {

      say(
        "Your cart is currently empty. 🛒<br>" +
        "Would you like to explore our menu?"
      );


      optionsList([

        {
          emoji: "☕",
          title: "Explore Menu",

          onClick:
            function () {
              goTo("categories");
            }
        }

      ]);

      return;
    }


    var subtotal =
      cartTotal();

    var gst =
      subtotal * 0.05;

    var delivery =
      40;

    var finalTotal =
      subtotal +
      gst +
      delivery;


    var message =
      createElement(
        '<div class="ajai-msg ajai-cart-message"></div>'
      );


    var rows =
      items
        .map(
          function (item) {

            var quantity =
              Number(item.qty || 0);

            var lineTotal =
              Number(item.price || 0) *
              quantity;


            return (

              '<div class="ajai-cart-row">' +

              "<span>" +
              escapeHTML(item.name) +
              " × " +
              quantity +
              "</span>" +

              "<span>₹" +
              lineTotal +
              "</span>" +

              "</div>"
            );
          }
        )
        .join("");


    message.innerHTML =

      "<strong>🛒 Your Cart</strong><br><br>" +

      rows +

      '<div class="ajai-cart-row">' +
      "<span>Subtotal</span>" +
      "<span>₹" +
      Math.round(subtotal) +
      "</span>" +
      "</div>" +

      '<div class="ajai-cart-row">' +
      "<span>GST (5%)</span>" +
      "<span>₹" +
      Math.round(gst) +
      "</span>" +
      "</div>" +

      '<div class="ajai-cart-row">' +
      "<span>Delivery</span>" +
      "<span>₹" +
      delivery +
      "</span>" +
      "</div>" +

      '<div class="ajai-cart-row total">' +
      "<span>Total</span>" +
      "<span>₹" +
      Math.round(finalTotal) +
      "</span>" +
      "</div>";


    body.appendChild(message);


    optionsList([

      {
        emoji: "➕",
        title: "Add More Items",

        onClick:
          function () {
            goTo("categories");
          }
      },


      {
        emoji: "🧾",
        title: "Open Full Cart",

        onClick:
          function () {
            window.location.href =
              "watchlist.html";
          }
      }

    ]);
  }


  /*==========================================================================
    TABLE BOOKING
  ==========================================================================*/

  function renderTable() {

    say(
      "Of course! 📅<br>" +
      "You can reserve a table through our " +
      "<strong>Table Booking</strong> section."
    );


    optionsList([

      {
        emoji: "📅",
        title: "Book a Table Now",

        onClick:
          function () {
            window.location.href =
              "services.html#table-booking";
          }
      }

    ]);
  }


  /*==========================================================================
    VENUE BOOKING
  ==========================================================================*/

  function renderVenue() {

    say(
      "Planning a birthday, party, or event? 🎉<br>" +
      "You can check our venue booking section."
    );


    optionsList([

      {
        emoji: "🎉",
        title: "Book the Venue Now",

        onClick:
          function () {
            window.location.href =
              "services.html#venue-booking";
          }
      }

    ]);
  }


  /*==========================================================================
    CAFE INFORMATION
  ==========================================================================*/

  function renderInfo() {

    say(
      "Here is some information about " +
      "<strong>Ajay's Cafe</strong> ☕"
    );


    optionsList([

      {
        emoji: "📍",
        title: "Location",
        sub: CAFE.address,

        onClick:
          function () {

            say(
              "📍 <strong>Our Location</strong><br>" +
              escapeHTML(CAFE.address)
            );

          }
      },


      {
        emoji: "🕒",
        title: "Opening Hours",
        sub: CAFE.hours,

        onClick:
          function () {

            say(
              "🕒 <strong>Opening Hours</strong><br>" +
              escapeHTML(CAFE.hours)
            );

          }
      },


      {
        emoji: "⭐",
        title: "Cafe Rating",
        sub: CAFE.rating,

        onClick:
          function () {

            say(
              "⭐ <strong>Customer Rating</strong><br>" +
              escapeHTML(CAFE.rating)
            );

          }
      },


      {
        emoji: "📞",
        title: "Phone",
        sub: CAFE.phone,

        onClick:
          function () {

            say(
              "📞 <strong>Phone</strong><br>" +
              escapeHTML(CAFE.phone)
            );

          }
      }

    ]);
  }


  /*==========================================================================
    CONTACT
  ==========================================================================*/

  function renderContact() {

    say(
      "Sure! 📞 Here are the available ways " +
      "to contact Ajay's Cafe."
    );


    optionsList([

      {
        emoji: "📞",
        title: "Call Us",
        sub: CAFE.phone,

        onClick:
          function () {

            window.location.href =
              "tel:" +
              CAFE.phone.replace(
                /\s+/g,
                ""
              );

          }
      },


      {
        emoji: "📧",
        title: "Email Us",
        sub: CAFE.email,

        onClick:
          function () {

            window.location.href =
              "mailto:" +
              CAFE.email;

          }
      },


      {
        emoji: "📍",
        title: "Contact Page",
        sub: "Open contact page",

        onClick:
          function () {

            window.location.href =
              "contact.html";

          }
      }

    ]);
  }


  /*==========================================================================
    INITIALIZE
  ==========================================================================*/

  function init() {

    if (
      document.querySelector(".ajai-fab")
    ) {
      return;
    }

    buildWidget();
  }


  /*==========================================================================
    DOM READY
  ==========================================================================*/

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }

})();