/**
 * Admiral Outlet — order log.
 *
 * Paste this whole file into Extensions > Apps Script of a blank Google Sheet,
 * run `setup` once, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). The ordering page posts each order here.
 *
 * Two tabs:
 *   Orders  — one row per order (time, order #, name, drink, total, all choices)
 *   Choices — one row per option picked, for pivot tables ("most popular syrup")
 *
 * @OnlyCurrentDoc
 */

var ORDERS = 'Orders';
var CHOICES = 'Choices';
var ORDER_HEADERS = ['Time', 'Order #', 'Name', 'Drink', 'Total', 'Choices'];
var CHOICE_HEADERS = ['Time', 'Order #', 'Drink', 'Option', 'Choice', 'Price'];
var TIME_ZONE = 'America/New_York';

function doPost(e) {
  var order = parseOrder_(e);
  if (!order) return reply_({ ok: false, error: 'bad order' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var orders = sheet_(ss, ORDERS, ORDER_HEADERS);
    var choices = sheet_(ss, CHOICES, CHOICE_HEADERS);
    var now = new Date();

    var summary = order.choices.map(function (c) { return c.step + ': ' + c.choice; }).join(' · ');
    orders.appendRow([now, order.orderNo, order.name, order.drink, order.total, summary]);

    if (order.choices.length) {
      var rows = order.choices.map(function (c) {
        return [now, order.orderNo, order.drink, c.step, c.choice, c.price];
      });
      choices.getRange(choices.getLastRow() + 1, 1, rows.length, CHOICE_HEADERS.length).setValues(rows);
    }
  } finally {
    lock.releaseLock();
  }
  return reply_({ ok: true });
}

// Visiting the web app URL in a browser confirms it's deployed.
function doGet() {
  return ContentService.createTextOutput('Admiral Outlet order log is running.');
}

// Optional: creates both tabs right away instead of on the first order.
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  sheet_(ss, ORDERS, ORDER_HEADERS);
  sheet_(ss, CHOICES, CHOICE_HEADERS);
}

/* ---------- helpers ---------- */

function sheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    // first order ever: do what `setup` would have done
    if (ss.getSpreadsheetTimeZone() !== TIME_ZONE) ss.setSpreadsheetTimeZone(TIME_ZONE);
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('ddd m/d h:mm am/pm');
    var priceCol = headers.indexOf(name === ORDERS ? 'Total' : 'Price') + 1;
    sh.getRange(1, priceCol, sh.getMaxRows(), 1).setNumberFormat('$0.00');
    sh.getRange(1, 1, 1, headers.length).setNumberFormat('@');
    var blank = ss.getSheetByName('Sheet1');
    if (blank && blank.getLastRow() === 0) ss.deleteSheet(blank);
  }
  return sh;
}

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
    return {
      orderNo: text_(d.orderNo, 8),
      name: text_(d.name, 30),
      drink: drink,
      total: total,
      choices: choices
    };
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
