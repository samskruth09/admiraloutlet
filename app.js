/* Admiral Outlet — ordering page logic.
   Reads the menu from menu.js. Nothing here needs editing to change the menu. */

(function () {
  "use strict";

  var MAX_LAYERS = 6;
  var LAST_ORDER_KEY = "ao-last-order";
  var LAST_ORDER_HOURS = 4;

  var state = {
    category: null,
    picks: {},   // stepId -> optionId (single) | [optionIds] (multi)
    name: "",
    sending: false,
    // live controls from the order-log Sheet; open until told otherwise
    status: { accepting: true, message: "", soldOut: {} }
  };

  var el = {
    plates: document.getElementById("plates"),
    workbench: document.getElementById("workbench"),
    builder: document.getElementById("builder"),
    passLines: document.getElementById("pass-lines"),
    passTotal: document.getElementById("pass-total"),
    passSerial: document.getElementById("pass-serial"),
    cupLayers: document.getElementById("cup-layers"),
    cupEmpty: document.getElementById("cup-empty"),
    warn: document.getElementById("handoff-warn"),
    pay: document.getElementById("pay"),
    payLabel: document.getElementById("pay-label"),
    hours: document.getElementById("outlet-hours"),
    footHours: document.getElementById("foot-hours"),
    pickup: document.getElementById("foot-pickup"),
    closed: document.getElementById("closed-banner"),
    lastOrder: document.getElementById("last-order"),
    lastOrderNo: document.getElementById("last-order-no"),
    lastOrderDetail: document.getElementById("last-order-detail"),
    lastOrderDismiss: document.getElementById("last-order-dismiss"),
    toast: document.getElementById("toast")
  };

  /* ---------- helpers ---------- */

  function money(n) {
    return "$" + n.toFixed(2);
  }

  function slug(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function key(label) {
    return String(label).trim().toLowerCase();
  }

  /* Give every step and option an id so menu.js only needs labels.
     Builds copies, because menu.js shares step lists between drinks. */
  function normalizeMenu() {
    MENU.categories = MENU.categories.map(function (cat) {
      var seen = {};
      var steps = cat.steps.map(function (step) {
        var id = step.id || slug(step.label);
        while (seen[id]) id += "-2";
        seen[id] = true;
        return Object.assign({}, step, {
          id: id,
          type: step.type || "single",
          options: step.options.map(function (opt) {
            return Object.assign({}, opt, { id: opt.id || slug(opt.label) });
          })
        });
      });
      return Object.assign({}, cat, { steps: steps });
    });
  }

  function optionById(step, id) {
    return step.options.filter(function (o) { return o.id === id; })[0] || null;
  }

  function selectedIds(step) {
    var v = state.picks[step.id];
    if (v == null) return [];
    return Array.isArray(v) ? v.slice() : [v];
  }

  function isSoldOut(label) {
    return Boolean(state.status.soldOut[key(label)]);
  }

  /* A drink is out if it's listed, or if a required step has nothing left. */
  function drinkAvailable(cat) {
    if (isSoldOut(cat.name)) return false;
    return cat.steps.every(function (s) {
      return !s.required || s.options.some(function (o) { return !isSoldOut(o.label); });
    });
  }

  function isClosed() {
    return Boolean(MENU.outlet.closed) || !state.status.accepting;
  }

  function closedMessage() {
    return state.status.message || MENU.outlet.closedMessage || "Online ordering is paused right now.";
  }

  /* Everything still blocking payment, in the order the student meets it. */
  function missingItems() {
    if (!state.category) return [];
    var missing = state.category.steps
      .filter(function (s) { return s.required && selectedIds(s).length === 0; })
      .map(function (s) { return s.label.toLowerCase(); });
    if (!state.name.trim()) missing.push("your name");
    return missing;
  }

  function total() {
    if (!state.category) return 0;
    var sum = state.category.price || 0;
    state.category.steps.forEach(function (step) {
      selectedIds(step).forEach(function (id) {
        var opt = optionById(step, id);
        if (opt) sum += opt.price || 0;
      });
    });
    return sum;
  }

  /* The Givebacks link for exactly this total, or "" if none is set up. */
  function payLinkFor(amount) {
    var link = (MENU.payLinks || {})[amount.toFixed(2)] || "";
    return /^https?:\/\//.test(link) ? link : "";
  }

  function logUrl() {
    var url = MENU.orderLogUrl || "";
    return /^https:\/\//.test(url) ? url : "";
  }

  /* fetch with a deadline, so a stalled network never leaves a student stuck. */
  function fetchWithin(url, options, ms) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = window.setTimeout(function () { if (controller) controller.abort(); }, ms);
    return fetch(url, Object.assign({}, options, controller ? { signal: controller.signal } : {}))
      .finally(function () { window.clearTimeout(timer); });
  }

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("toast--up");
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(function () {
      el.toast.classList.remove("toast--up");
    }, 4200);
  }

  /* ---------- hours ---------- */

  function renderHours() {
    var days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    var today = (MENU.outlet.schedule || {})[days[new Date().getDay()]];
    el.hours.textContent = today ? "Today: " + today : "Closed today";
    el.footHours.textContent = MENU.outlet.hoursSummary || "";
  }

  /* ---------- live controls from the Sheet ---------- */

  function loadStatus() {
    var url = logUrl();
    if (!url) return;
    fetchWithin(url + "?action=status", {}, 8000)
      .then(function (r) { return r.json(); })
      .then(function (s) {
        if (!s || s.ok !== true) return;
        state.status.accepting = s.accepting !== false;
        state.status.message = String(s.message || "");
        state.status.soldOut = {};
        (s.soldOut || []).forEach(function (x) { state.status.soldOut[key(x)] = true; });
        applyStatus();
      })
      .catch(function () { /* offline or an older script: stay open */ });
  }

  function applyStatus() {
    el.closed.hidden = !isClosed();
    el.closed.textContent = isClosed() ? closedMessage() : "";

    // drop any pick that has since sold out
    if (state.category) {
      state.category.steps.forEach(function (step) {
        selectedIds(step).forEach(function (id) {
          var o = optionById(step, id);
          if (o && isSoldOut(o.label)) toggle(step, o, true);
        });
      });
    }

    var chosen = state.category && state.category.id;
    renderPlates();
    if (chosen) markChosenPlate(chosen);
    renderBuilder();
    renderPass();
  }

  /* ---------- drink plates ---------- */

  function renderPlates() {
    el.plates.innerHTML = "";

    // group drinks by section, keeping menu.js order
    var groups = [];
    var bySection = {};
    MENU.categories.forEach(function (cat) {
      var name = cat.section || "Menu";
      if (!bySection[name]) {
        bySection[name] = { name: name, items: [] };
        groups.push(bySection[name]);
      }
      bySection[name].items.push(cat);
    });

    groups.forEach(function (group) {
      var wrap = document.createElement("section");
      wrap.className = "plate-group";

      var head = document.createElement("h2");
      head.className = "plate-group__head";
      head.textContent = group.name;
      wrap.appendChild(head);

      var grid = document.createElement("div");
      grid.className = "plates";
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", group.name);

      group.items.forEach(function (cat) {
        var available = drinkAvailable(cat);
        var b = document.createElement("button");
        b.type = "button";
        b.className = "plate";
        b.setAttribute("aria-pressed", "false");
        b.dataset.id = cat.id;
        b.disabled = !available;

        b.innerHTML =
          '<span class="plate__serial"></span>' +
          '<span class="plate__name"></span>' +
          '<span class="plate__blurb"></span>' +
          '<span class="plate__from"></span>';

        b.querySelector(".plate__serial").textContent = cat.serial || "";
        b.querySelector(".plate__name").textContent = cat.name;
        b.querySelector(".plate__blurb").textContent = cat.blurb || "";
        b.querySelector(".plate__from").textContent = available ? "from " + money(cat.price || 0) : "Sold out today";

        b.addEventListener("click", function () { chooseCategory(cat.id); });
        grid.appendChild(b);
      });

      wrap.appendChild(grid);
      el.plates.appendChild(wrap);
    });
  }

  function markChosenPlate(id) {
    Array.prototype.forEach.call(el.plates.querySelectorAll(".plate"), function (node) {
      node.setAttribute("aria-pressed", String(node.dataset.id === id));
    });
  }

  function chooseCategory(id) {
    var cat = MENU.categories.filter(function (c) { return c.id === id; })[0];
    if (!cat || !drinkAvailable(cat)) return;

    state.category = cat;
    state.picks = {};
    // the name carries over between drinks — it's the same student

    markChosenPlate(id);

    el.workbench.hidden = false;
    el.workbench.classList.remove("workbench--issued");
    void el.workbench.offsetWidth;          // restart the issue animation
    el.workbench.classList.add("workbench--issued");

    renderBuilder();
    renderPass();

    document.getElementById("builder-section").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
  }

  /* ---------- builder ---------- */

  function renderBuilder() {
    el.builder.innerHTML = "";
    if (!state.category) return;

    state.category.steps.forEach(function (step) {
      el.builder.appendChild(buildStep(step));
    });

    el.builder.appendChild(buildNameField());
  }

  function requiredFlag(done) {
    var flag = document.createElement("span");
    flag.className = "step__req" + (done ? " step__req--done" : "");
    flag.textContent = done ? "Set" : "Required";
    return flag;
  }

  function buildStep(step) {
    var wrap = document.createElement("section");
    wrap.className = "step";

    var top = document.createElement("div");
    top.className = "step__top";

    var h = document.createElement("h3");
    h.className = "step__label";
    h.textContent = step.label;
    top.appendChild(h);

    if (step.required) top.appendChild(requiredFlag(selectedIds(step).length > 0));

    wrap.appendChild(top);

    if (step.note) {
      var note = document.createElement("p");
      note.className = "step__note";
      note.textContent = step.note;
      wrap.appendChild(note);
    }

    var chips = document.createElement("div");
    chips.className = "chips";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", step.label);

    var chosen = selectedIds(step);
    var atMax = step.type === "multi" && step.max && chosen.length >= step.max;

    step.options.forEach(function (opt) {
      var on = chosen.indexOf(opt.id) !== -1;
      var out = isSoldOut(opt.label);
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.setAttribute("aria-pressed", String(on));
      if (out || (atMax && !on)) chip.disabled = true;

      var label = document.createElement("span");
      label.textContent = opt.label;
      chip.appendChild(label);

      if (out) {
        var so = document.createElement("span");
        so.className = "chip__soldout";
        so.textContent = "Sold out";
        chip.appendChild(so);
      } else if (opt.price) {
        var price = document.createElement("span");
        price.className = "chip__price";
        price.textContent = "+" + money(opt.price);
        chip.appendChild(price);
      }

      chip.addEventListener("click", function () { toggle(step, opt); });
      chips.appendChild(chip);
    });

    wrap.appendChild(chips);
    return wrap;
  }

  function buildNameField() {
    var wrap = document.createElement("section");
    wrap.className = "step";

    var top = document.createElement("div");
    top.className = "step__top";
    var h = document.createElement("label");
    h.className = "step__label";
    h.htmlFor = "cup-name";
    h.textContent = "Name for the cup";
    top.appendChild(h);
    var flag = requiredFlag(Boolean(state.name.trim()));
    top.appendChild(flag);
    wrap.appendChild(top);

    var field = document.createElement("div");
    field.className = "namefield";
    var input = document.createElement("input");
    input.id = "cup-name";
    input.type = "text";
    input.maxLength = 30;
    input.autocomplete = "given-name";
    input.placeholder = "First name";
    input.value = state.name;
    input.addEventListener("input", function () {
      state.name = input.value;
      var done = Boolean(state.name.trim());
      flag.className = "step__req" + (done ? " step__req--done" : "");
      flag.textContent = done ? "Set" : "Required";
      renderPass();
    });
    field.appendChild(input);
    wrap.appendChild(field);
    return wrap;
  }

  function toggle(step, opt, quiet) {
    if (step.type === "multi") {
      var list = selectedIds(step);
      var at = list.indexOf(opt.id);
      if (at === -1) {
        if (step.max && list.length >= step.max) return;
        list.push(opt.id);
      } else {
        list.splice(at, 1);
      }
      state.picks[step.id] = list;
    } else {
      state.picks[step.id] = state.picks[step.id] === opt.id ? null : opt.id;
      if (!state.picks[step.id]) delete state.picks[step.id];
    }

    if (quiet) return;
    renderBuilder();
    renderPass();
  }

  /* ---------- the pass ---------- */

  /* Every picked option as { step, choice, price }, in menu order. */
  function choiceList() {
    var list = [];
    if (!state.category) return list;
    state.category.steps.forEach(function (step) {
      selectedIds(step).forEach(function (id) {
        var o = optionById(step, id);
        if (o) list.push({ step: step.label, choice: o.label, price: o.price || 0 });
      });
    });
    return list;
  }

  function passRows() {
    var rows = [];
    if (!state.category) return rows;

    rows.push({ key: "Drink", value: state.category.name });

    state.category.steps.forEach(function (step) {
      var ids = selectedIds(step);
      if (!ids.length) return;
      var labels = ids.map(function (id) {
        var o = optionById(step, id);
        return o ? o.label : id;
      });
      rows.push({ key: step.label, value: labels.join(", ") });
    });

    if (state.name.trim()) rows.push({ key: "Name", value: state.name.trim() });
    return rows;
  }

  function renderPass() {
    var rows = passRows();

    el.passLines.innerHTML = "";
    if (!rows.length) {
      var p = document.createElement("p");
      p.className = "pass__placeholder";
      p.textContent = "Nothing on the pass yet.";
      el.passLines.appendChild(p);
    } else {
      rows.forEach(function (row) {
        var line = document.createElement("div");
        line.className = "pass__line";
        var dt = document.createElement("dt");
        dt.textContent = row.key;
        var dd = document.createElement("dd");
        dd.textContent = row.value;
        line.appendChild(dt);
        line.appendChild(dd);
        el.passLines.appendChild(line);
      });
    }

    el.passTotal.textContent = state.category ? money(total()) : "—";
    if (!state.sending) {
      el.passSerial.textContent = state.category
        ? state.category.serial + " · order number comes when you pay"
        : "— — — —";
    }

    renderCup();
    renderHandoff();
  }

  function renderCup() {
    var colors = [];
    if (state.category) {
      if (state.category.layer) colors.push(state.category.layer);
      state.category.steps.forEach(function (step) {
        selectedIds(step).forEach(function (id) {
          var o = optionById(step, id);
          if (o && o.layer) colors.push(o.layer);
        });
      });
    }
    colors = colors.slice(0, MAX_LAYERS);

    el.cupLayers.innerHTML = "";
    el.cupEmpty.hidden = colors.length > 0;

    var topY = 30, bottomY = 180;
    var h = (bottomY - topY) / (colors.length || 1);

    colors.forEach(function (color, i) {
      var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("class", "cup__layer");
      rect.setAttribute("x", "0");
      rect.setAttribute("width", "120");
      rect.setAttribute("y", String(bottomY - (i + 1) * h));
      rect.setAttribute("height", String(h + 0.5));
      rect.setAttribute("fill", color);
      el.cupLayers.appendChild(rect);
    });
  }

  function renderHandoff() {
    if (state.sending) return;   // the Sending… state owns the button

    var missing = missingItems();
    var ready = Boolean(state.category) && missing.length === 0 && !isClosed();

    el.pay.disabled = !ready;

    if (isClosed()) {
      el.warn.textContent = closedMessage();
      el.warn.className = "handoff__warn";
    } else if (!state.category) {
      el.warn.textContent = "Pick a drink to start.";
      el.warn.className = "handoff__warn";
    } else if (missing.length) {
      el.warn.textContent = "Still needed: " + missing.join(", ") + ".";
      el.warn.className = "handoff__warn";
    } else {
      el.warn.textContent = "Ready. Tap to pay on Givebacks.";
      el.warn.className = "handoff__warn handoff__warn--ok";
    }

    el.payLabel.textContent = state.category ? "Pay " + money(total()) + " on Givebacks" : "Pay on Givebacks";
  }

  /* ---------- paying ---------- */

  function setSending(on, label) {
    state.sending = on;
    if (on) {
      el.pay.disabled = true;
      el.payLabel.textContent = label;
      el.warn.textContent = "Don't close this page.";
      el.warn.className = "handoff__warn handoff__warn--ok";
    } else {
      renderPass();
    }
  }

  /* The order is logged first; the student only goes to Givebacks once the
     Sheet confirms it has the order, so no payment ever arrives without one. */
  function pay() {
    if (state.sending || el.pay.disabled || !state.category) return;
    var amount = total();
    var link = payLinkFor(amount);

    if (!link) {
      toast("Online pay for " + money(amount) + " isn't set up yet. Order at the counter.");
      return;
    }

    var url = logUrl();
    if (!url) { window.location.href = link; return; }   // logging turned off

    var cat = state.category;
    var name = state.name.trim();
    setSending(true, "Sending your order…");

    fetchWithin(url, {
      method: "POST",
      // a plain string body keeps this a "simple" request Google accepts cross-site
      body: JSON.stringify({ name: name, drink: cat.name, total: Number(amount.toFixed(2)), choices: choiceList() })
    }, 15000)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok) {
          var no = res.orderNo != null ? String(res.orderNo) : String(1000 + Math.floor(Math.random() * 9000));
          rememberOrder({ no: no, drink: cat.name, total: amount, name: name });
          el.passSerial.textContent = cat.serial + " · Order #" + no;
          el.payLabel.textContent = "Order #" + no + " sent. Opening Givebacks…";
          window.setTimeout(function () { window.location.href = link; }, 900);
          return;
        }
        if (res && res.error === "closed") {
          state.status.accepting = false;
          state.status.message = String(res.message || "");
          setSending(false);
          applyStatus();
          toast(closedMessage());
          return;
        }
        if (res && res.error === "soldout") {
          (res.items || []).forEach(function (x) { state.status.soldOut[key(x)] = true; });
          setSending(false);
          applyStatus();
          toast("Sorry, " + (res.items || []).join(", ") + " just sold out. Pick something else.");
          return;
        }
        setSending(false);
        toast("Couldn't send your order. Please try again.");
      })
      .catch(function () {
        setSending(false);
        toast("Couldn't reach the Outlet. Check your connection and try again.");
      });
  }

  /* ---------- the student's last order ---------- */

  function rememberOrder(order) {
    try {
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(Object.assign({ at: Date.now() }, order)));
    } catch (e) { /* private mode: the pass still showed the number */ }
  }

  function showLastOrder() {
    var order = null;
    try { order = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || "null"); } catch (e) { order = null; }
    var fresh = order && order.at &&
      Date.now() - order.at < LAST_ORDER_HOURS * 3600 * 1000 &&
      new Date(order.at).toDateString() === new Date().toDateString();
    if (!fresh) { el.lastOrder.hidden = true; return; }

    el.lastOrderNo.textContent = "#" + order.no;
    el.lastOrderDetail.textContent = order.drink + " · " + money(Number(order.total) || 0) + " · under " + (order.name || "your name");
    el.lastOrder.hidden = false;
  }

  function dismissLastOrder() {
    try { localStorage.removeItem(LAST_ORDER_KEY); } catch (e) { /* nothing to clear */ }
    el.lastOrder.hidden = true;
  }

  /* ---------- boot ---------- */

  function boot() {
    el.pickup.textContent = MENU.outlet.pickup || "";
    document.title = MENU.outlet.name + " — Order Online";

    normalizeMenu();
    renderHours();
    renderPlates();
    renderPass();
    applyStatus();
    showLastOrder();
    loadStatus();

    el.pay.addEventListener("click", pay);
    el.lastOrderDismiss.addEventListener("click", dismissLastOrder);

    // Coming back from Givebacks with the Back button restores the old page;
    // clear the Sending… state and show the order number again.
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      setSending(false);
      showLastOrder();
    });
  }

  boot();
})();
