/**
 * Admiral Outlet — order log (version 2).
 *
 * Lives in Extensions > Apps Script of the "Admiral Outlet Orders" Sheet.
 * After pasting a new version: Save, then Deploy > Manage deployments >
 * pencil > Version: New version > Deploy. The URL stays the same.
 *
 * Tabs (each is created automatically the first time it's needed):
 *   Orders   — one row per order: order #, name, drink, total, choices,
 *              plus Paid / Made checkboxes and Notes for the counter.
 *   Choices  — one row per option picked, for pivot tables ("most popular syrup").
 *   Controls — the online-ordering on/off switch, the message students see
 *              when it's off, and the sold-out list. The website reads this.
 *
 * @OnlyCurrentDoc
 */

var ORDERS = 'Orders';
var CHOICES = 'Choices';
var CONTROLS = 'Controls';
var ORDER_HEADERS = ['Time', 'Order #', 'Name', 'Drink', 'Total', 'Choices', 'Paid', 'Made', 'Notes'];
var CHOICE_HEADERS = ['Time', 'Order #', 'Drink', 'Option', 'Choice', 'Price'];
var PAID_COL = 7;   // G
var MADE_COL = 8;   // H
var TIME_ZONE = 'America/New_York';

/* ---------- web endpoints ---------- */

// The website posts each order here and waits for { ok, orderNo } before
// sending the student to Givebacks.
function doPost(e) {
  var order = parseOrder_(e);
  if (!order) return reply_({ ok: false, error: 'bad order' });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lock = LockService.getScriptLock();
  var locked = lock.tryLock(30000);
  try {
    var controls = readControls_(ss);
    if (!controls.accepting) return reply_({ ok: false, error: 'closed', message: controls.message });

    // Re-check sold-out now, in case the student's page loaded before it ran out.
    var out = {};
    controls.soldOut.forEach(function (s) { out[s.toLowerCase()] = s; });
    var gone = [order.drink].concat(order.choices.map(function (c) { return c.choice; }))
      .filter(function (label) { return out[String(label).toLowerCase()]; });
    if (gone.length) return reply_({ ok: false, error: 'soldout', items: gone });

    var orders = ordersSheet_(ss);
    var choices = sheet_(ss, CHOICES, CHOICE_HEADERS, [6]);
    var now = new Date();
    var orderNo = locked ? nextOrderNo_(orders, now) : 'X' + Utilities.formatDate(now, TIME_ZONE, 'HHmmss');

    var summary = order.choices.map(function (c) { return c.step + ': ' + c.choice; }).join(' · ');
    orders.appendRow([now, orderNo, order.name, order.drink, order.total, summary, false, false, '']);
    orders.getRange(orders.getLastRow(), PAID_COL, 1, 2).insertCheckboxes();

    var rows = order.choices.map(function (c) { return [now, orderNo, order.drink, c.step, c.choice, c.price]; });
    if (rows.length && locked) {
      choices.getRange(choices.getLastRow() + 1, 1, rows.length, CHOICE_HEADERS.length).setValues(rows);
    } else {
      rows.forEach(function (r) { choices.appendRow(r); });   // no lock: appendRow can't collide
    }

    return reply_({ ok: true, orderNo: orderNo });
  } finally {
    if (locked) lock.releaseLock();
  }
}

// ?action=status → the Controls tab as JSON, read by the website on load.
// Anything else → a plain "running" message, to confirm the deployment.
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'status') {
    return reply_(readControls_(SpreadsheetApp.getActiveSpreadsheet()));
  }
  return ContentService.createTextOutput('Admiral Outlet order log is running.');
}

// Optional: creates every tab right away instead of on first use.
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ordersSheet_(ss);
  sheet_(ss, CHOICES, CHOICE_HEADERS, [6]);
  controlsSheet_(ss);
}

/* ---------- order numbers ---------- */

// Today's orders count up from 1, like a deli ticket. Runs inside the lock.
function nextOrderNo_(orders, now) {
  var today = Utilities.formatDate(now, TIME_ZONE, 'yyyy-MM-dd');
  var last = orders.getLastRow();
  if (last < 2) return 1;
  var start = Math.max(2, last - 499);
  var rows = orders.getRange(start, 1, last - start + 1, 2).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    var t = rows[i][0];
    if (!(t instanceof Date)) continue;
    if (Utilities.formatDate(t, TIME_ZONE, 'yyyy-MM-dd') !== today) break;
    var n = Number(rows[i][1]);
    if (n > 0) return n + 1;
  }
  return 1;
}

/* ---------- controls ---------- */

function readControls_(ss) {
  var sh = controlsSheet_(ss);
  var accepting = sh.getRange('B1').getValue() === true;
  var message = String(sh.getRange('B2').getValue() || '').trim();
  var soldOut = sh.getRange('A6:A60').getValues()
    .map(function (r) { return String(r[0] || '').trim(); })
    .filter(function (s) { return s; });
  return { ok: true, accepting: accepting, message: message, soldOut: soldOut };
}

function controlsSheet_(ss) {
  var sh = ss.getSheetByName(CONTROLS);
  if (sh) return sh;
  sh = ss.insertSheet(CONTROLS);
  sh.getRange('A1:A2').setValues([['Online ordering on'], ['Message when off']]).setFontWeight('bold');
  sh.getRange('B1').insertCheckboxes().setValue(true);
  sh.getRange('B2').setValue('Online ordering is paused right now. Order at the counter!');
  sh.getRange('A4').setValue('Sold out — type a drink name or an option exactly as it appears on the site, one per row:').setFontWeight('bold');
  sh.getRange('A5').setValue('(examples: Harbor Hot Cocoa · Pumpkin Spice · Oat Milk)').setFontStyle('italic').setFontColor('#6b7280');
  sh.setColumnWidth(1, 360);
  sh.setColumnWidth(2, 380);
  return sh;
}

/* ---------- sheets ---------- */

function ordersSheet_(ss) {
  var sh = sheet_(ss, ORDERS, ORDER_HEADERS, [5]);
  // Upgrade an Orders tab made by version 1 (six columns, no checkboxes).
  if (sh.getRange(1, PAID_COL).getValue() !== 'Paid') {
    sh.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]).setFontWeight('bold');
  }
  if (!sh.getConditionalFormatRules().length) {
    var all = sh.getRange('A2:I');
    sh.setConditionalFormatRules([
      // made and handed over: fade out
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$H2=TRUE')
        .setFontColor('#9ca3af').setRanges([all]).build(),
      // paid, still to make: green
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($G2=TRUE,$H2<>TRUE)')
        .setBackground('#dcfce7').setRanges([all]).build()
    ]);
  }
  return sh;
}

// Creates a tab with bold, frozen headers the first time it's needed.
function sheet_(ss, name, headers, moneyCols) {
  var sh = ss.getSheetByName(name);
  if (sh) return sh;
  if (ss.getSpreadsheetTimeZone() !== TIME_ZONE) ss.setSpreadsheetTimeZone(TIME_ZONE);
  sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('A2:A').setNumberFormat('ddd m/d h:mm am/pm');
  (moneyCols || []).forEach(function (c) { sh.getRange(2, c, sh.getMaxRows() - 1, 1).setNumberFormat('$0.00'); });
  var blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0) ss.deleteSheet(blank);
  return sh;
}

/* ---------- input ---------- */

// Accepts only the shape the ordering page sends; anything else is dropped.
function parseOrder_(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var total = Number(d.total);
    if (!(total >= 0 && total <= 100)) return null;
    var drink = text_(d.drink, 60);
    if (!drink) return null;
    var choices = (Array.isArray(d.choices) ? d.choices : []).slice(0, 20).map(function (c) {
      return {
        step: text_(c && c.step, 40),
        choice: text_(c && c.choice, 60),
        price: Math.max(0, Math.min(20, Number(c && c.price) || 0))
      };
    }).filter(function (c) { return c.step && c.choice; });
    return { name: text_(d.name, 30), drink: drink, total: total, choices: choices };
  } catch (err) {
    return null;
  }
}

// Trims, caps length, and stops text being read as a spreadsheet formula.
function text_(value, max) {
  var s = String(value == null ? '' : value).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
