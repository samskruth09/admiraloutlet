/* ===========================================================================
   ADMIRAL OUTLET — MENU DATA
   ---------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU NEED TO EDIT to change the menu.
   No coding knowledge required — just edit the text between the quotes.

   This menu mirrors the Admiral Outlet store on Givebacks: same drinks, same
   option names, same order, same prices. Keep it that way — students match
   what they build here against the Givebacks screen.

   PRICING:
     - Each drink has a  price  : the Givebacks base price.
     - Every option's  price  is ADDED on top. price: 0 means free.

   SHARED LISTS:
     - Option lists used by more than one drink (cold foam, sizes, etc.) are
       defined once right below. Edit a shared list and every drink using it
       updates. If one drink ever needs something different, give that drink
       its own list instead.

   LAYER COLORS (optional):
     - layer: "#hexcolor" draws that choice in the cup preview. Purely visual.

   PAYING (see PAY LINKS and ORDER LOG at the bottom of this file):
     - Students pay on Givebacks through one private item per possible total.
     - Every order is also logged to the Outlet's Google Sheet.
   =========================================================================== */

/* ---------- shared option lists ---------- */

const SIZE_16_20 = {
  label: "Coffee Size",
  required: true,
  options: [
    { label: "16 oz", price: 0 },
    { label: "20 oz", price: 1.5 },
  ],
};

const TEMPERATURE = {
  label: "Temperature",
  required: true,
  options: [
    { label: "Hot", price: 0 },
    { label: "Cold", price: 0 },
  ],
};

const FALL_COLD_FOAM = {
  label: "Fall Cold Foam",
  required: true,
  options: [
    { label: "White Chocolate Pumpkin", price: 0.75, layer: "#f1d7b3" },
    { label: "Pumpkin Spice", price: 0.75, layer: "#e3b27f" },
    { label: "Blueberry", price: 0.75, layer: "#c9c7e8" },
    { label: "Salted Honey", price: 0.75, layer: "#f1dca8" },
    { label: "Apple", price: 0.75, layer: "#e8e0b0" },
    { label: "Salted Caramel", price: 0.75, layer: "#e6c79c" },
    { label: "Vanilla", price: 0.75, layer: "#f4ecdc" },
    { label: "Caramel", price: 0.75, layer: "#e8c89a" },
    { label: "White Chocolate", price: 0.75, layer: "#f5ecd9" },
    { label: "Chocolate", price: 0.75, layer: "#c9a58a" },
    { label: "Butter Toffee", price: 0.75, layer: "#e5c797" },
    { label: "Hazelnut", price: 0.75, layer: "#dcc3a3" },
    { label: "Honey", price: 0.75, layer: "#f1dca8" },
    { label: "None", price: 0 },
  ],
};

const EXTRA_COFFEE_SYRUP = {
  label: "Extra Coffee Syrup",
  options: [
    { label: "Brown Sugar", price: 0.25, layer: "#a0692f" },
    { label: "Caramel", price: 0.25, layer: "#c58a3a" },
    { label: "Chocolate", price: 0.25, layer: "#4a2a1c" },
    { label: "White Chocolate", price: 0.25, layer: "#efe6d2" },
    { label: "Vanilla", price: 0.25, layer: "#eadfc4" },
    { label: "None", price: 0 },
  ],
};

const ADD_A_SHOT = {
  label: "Add a Shot",
  options: [
    { label: "Shot", price: 0.75, layer: "#2e1b12" },
  ],
};

const OAT_MILK = {
  label: "Substitution",
  options: [
    { label: "Oat Milk", price: 0.75, layer: "#efe3cb" },
  ],
};

const ADDITIONAL_CREAMER = {
  label: "Additional Creamer",
  options: [
    { label: "Vanilla Creamer", price: 0, layer: "#f4ecdc" },
    { label: "Half and Half", price: 0, layer: "#f6f1e4" },
    { label: "Coconut Creamer", price: 0, layer: "#f5efe2" },
  ],
};

const SODA_SYRUPS = [
  { label: "Blueberry", price: 0, layer: "#4f5aa8" },
  { label: "Blue Raspberry", price: 0, layer: "#2f8fd8" },
  { label: "Cherry", price: 0, layer: "#b3203a" },
  { label: "Coconut", price: 0, layer: "#f0ead6" },
  { label: "Cupcake", price: 0, layer: "#f0b7c8" },
  { label: "Lime", price: 0, layer: "#8fbf5a" },
  { label: "Pineapple", price: 0, layer: "#f2cf4a" },
  { label: "Peach", price: 0, layer: "#e8a06a" },
  { label: "Raspberry", price: 0, layer: "#b3325a" },
  { label: "Sour Apple", price: 0, layer: "#9ccf4a" },
  { label: "Strawberry", price: 0, layer: "#c8434f" },
  { label: "Vanilla", price: 0, layer: "#eadfc4" },
  { label: "Watermelon", price: 0, layer: "#e8536a" },
];

/* ---------- the menu ---------- */

const MENU = {
  outlet: {
    name: "Admiral Outlet",
    // Today's hours show under the wordmark. Days left out count as closed.
    schedule: {
      mon: "7:30–8:20 AM · closed at lunch",
      tue: "7:30–8:20 AM · all lunches",
      wed: "7:30–8:40 AM · all lunches",
      thu: "7:30–8:20 AM · all lunches",
      fri: "7:30–8:20 AM · all lunches",
    },
    // The full week, shown at the bottom of the page.
    hoursSummary: "Mornings 7:30–8:20 AM (Wednesdays until 8:40) and all lunches. Closed Monday lunch.",
    pickup: "Pick up at the Admiral Outlet counter.",
    // Emergency stop that needs a code push. For day-to-day pausing, use the
    // "Online ordering on" checkbox in the Controls tab of the order-log Sheet.
    closed: false,
    closedMessage: "Online ordering is paused right now. Order at the counter!",
  },

  /* Drinks show on the page grouped by  section , in this order. */
  categories: [
    /* ======================= COFFEE BAR ======================= */
    {
      id: "latte",
      section: "Coffee bar",
      name: "Anchors Away Latte",
      serial: "C-01",
      blurb: "Vienna Coffee espresso, hot or iced.",
      price: 4.75,
      layer: "#b98a5e",
      steps: [
        {
          label: "Primary Syrup",
          required: true,
          options: [
            { label: "White Chocolate", price: 0, layer: "#efe6d2" },
            { label: "Caramel", price: 0, layer: "#c58a3a" },
            { label: "Toasted Marshmallow", price: 0, layer: "#e9dcc3" },
            { label: "Butter Toffee", price: 0, layer: "#b7813f" },
            { label: "Brown Sugar", price: 0, layer: "#a0692f" },
            { label: "Chocolate", price: 0, layer: "#4a2a1c" },
            { label: "Cupcake", price: 0, layer: "#f0b7c8" },
            { label: "Honey", price: 0, layer: "#e0a93a" },
            { label: "Vanilla", price: 0, layer: "#eadfc4" },
          ],
        },
        SIZE_16_20,
        TEMPERATURE,
        FALL_COLD_FOAM,
        EXTRA_COFFEE_SYRUP,
        ADD_A_SHOT,
        OAT_MILK,
      ],
    },

    {
      id: "chai",
      section: "Coffee bar",
      name: "Chartered Chai",
      serial: "C-02",
      blurb: "Vanilla or spiced chai, hot or iced.",
      price: 4.75,
      steps: [
        {
          label: "Primary Syrup",
          required: true,
          options: [
            { label: "White Chocolate", price: 0, layer: "#efe6d2" },
            { label: "Caramel", price: 0, layer: "#c58a3a" },
            { label: "Toasted Marshmallow", price: 0, layer: "#e9dcc3" },
            { label: "Butter Toffee", price: 0, layer: "#b7813f" },
            { label: "Brown Sugar", price: 0, layer: "#a0692f" },
            { label: "Chocolate", price: 0, layer: "#4a2a1c" },
            { label: "Cupcake", price: 0, layer: "#f0b7c8" },
            { label: "Lavender", price: 0, layer: "#b9a3d6" },
            { label: "Vanilla", price: 0, layer: "#eadfc4" },
          ],
        },
        {
          label: "Type of Chai",
          required: true,
          options: [
            { label: "Vanilla", price: 0, layer: "#d7b48a" },
            { label: "Spiced", price: 0, layer: "#b07a4a" },
          ],
        },
        SIZE_16_20,
        TEMPERATURE,
        FALL_COLD_FOAM,
        ADD_A_SHOT,
        OAT_MILK,
      ],
    },

    {
      id: "matcha",
      section: "Coffee bar",
      name: "Man Overboard Matcha",
      serial: "C-03",
      blurb: "Matcha, hot or iced.",
      price: 4.75,
      layer: "#8fae5a",
      steps: [
        {
          label: "Primary Syrup",
          required: true,
          options: [
            { label: "White Chocolate", price: 0, layer: "#efe6d2" },
            { label: "Caramel", price: 0, layer: "#c58a3a" },
            { label: "Toasted Marshmallow", price: 0, layer: "#e9dcc3" },
            { label: "Butter Toffee", price: 0, layer: "#b7813f" },
            { label: "Brown Sugar", price: 0, layer: "#a0692f" },
            { label: "Chocolate", price: 0, layer: "#4a2a1c" },
            { label: "Cupcake", price: 0, layer: "#f0b7c8" },
            { label: "Lavender", price: 0, layer: "#b9a3d6" },
            { label: "Vanilla", price: 0, layer: "#eadfc4" },
            { label: "None", price: 0 },
          ],
        },
        SIZE_16_20,
        TEMPERATURE,
        FALL_COLD_FOAM,
        EXTRA_COFFEE_SYRUP,
        OAT_MILK,
      ],
    },

    {
      id: "americano",
      section: "Coffee bar",
      name: "Admiral's Americano",
      serial: "C-04",
      blurb: "Espresso and hot water. Served hot only.",
      price: 3.5,
      layer: "#2e1b12",
      steps: [
        EXTRA_COFFEE_SYRUP,
        {
          label: "Americano Size",
          required: true,
          options: [
            { label: "16 oz", price: 0 },
            { label: "20 oz", price: 1.0 },
          ],
        },
        ADDITIONAL_CREAMER,
      ],
    },

    {
      id: "cocoa",
      section: "Coffee bar",
      name: "Harbor Hot Cocoa",
      serial: "C-05",
      blurb: "Hot chocolate.",
      price: 3.0,
      layer: "#5c3423",
      steps: [
        OAT_MILK,
        {
          label: "Seasonal Coffee Syrups",
          options: [
            { label: "Blueberry Cobbler", price: 0.25, layer: "#5b5fa8" },
            { label: "Caramel Creme Cheesecake", price: 0.25, layer: "#d9b27c" },
            { label: "Gingerbread", price: 0.25, layer: "#9c5b2e" },
            { label: "Lavender", price: 0.25, layer: "#b9a3d6" },
            { label: "Maple Bourbon Pecan", price: 0.25, layer: "#8a4f22" },
            { label: "Pumpkin Caramel", price: 0.25, layer: "#c9772f" },
            { label: "Pumpkin Spice", price: 0.25, layer: "#c4702c" },
            { label: "Sea Salt Honey", price: 0.25, layer: "#e0a93a" },
            { label: "Vanilla Almond", price: 0.25, layer: "#e6d6b8" },
            { label: "White Chocolate Pumpkin", price: 0.25, layer: "#e8b784" },
            { label: "None", price: 0 },
          ],
        },
      ],
    },

    /* ======================= DIRTY SODAS ======================= */
    {
      id: "seaside",
      section: "Dirty sodas",
      name: "Seaside Soda",
      serial: "D-01",
      blurb: "Seven house dirty soda combos.",
      price: 4.0,
      steps: [
        {
          label: "Seaside Soda",
          required: true,
          // PLACEHOLDER: what's in each combo is still to come from the Outlet team.
          // Cup colors below are a visual guess from each name — adjust freely.
          options: [
            { label: "High tide", price: 0, layer: "#4fb3c4" },
            { label: "Ocean Blast", price: 0, layer: "#2f7fd1" },
            { label: "Compass Cola", price: 0, layer: "#5a3320" },
            { label: "Island Colada", price: 0, layer: "#f1e6c8" },
            { label: "Blue Lagoon", price: 0, layer: "#3aa0d8" },
            { label: "Palm Springs", price: 0, layer: "#e98aa6" },
            { label: "Red Riptide", price: 0, layer: "#c8323f" },
          ],
        },
      ],
    },

    {
      id: "byo-soda",
      section: "Dirty sodas",
      name: "Build Your Own",
      serial: "D-02",
      blurb: "Your soda, two syrups, and a creamer.",
      price: 4.0,
      steps: [
        {
          label: "Soda Base",
          required: true,
          options: [
            { label: "Dr. Pepper Zero", price: 0, layer: "#6b2f2a" },
            { label: "Lemon Lime", price: 0, layer: "#d8ebc0" },
            { label: "Diet Coke", price: 0, layer: "#4a2c1d" },
            { label: "Coke Zero", price: 0, layer: "#3f241a" },
            { label: "Mt. Dew", price: 0, layer: "#c9e04a" },
          ],
        },
        { label: "Primary Syrup", required: true, options: SODA_SYRUPS },
        { label: "Secondary Syrup", required: true, options: SODA_SYRUPS },
        ADDITIONAL_CREAMER,
      ],
    },

    /* ======================= LEMONADE ======================= */
    {
      id: "lemonade",
      section: "Lemonade",
      name: "Lemonade",
      serial: "L-01",
      blurb: "Classic or flavored.",
      price: 3.0,
      layer: "#f1e38a",
      steps: [
        {
          label: "Lemonade Syrups",
          required: true,
          options: [
            { label: "Peach", price: 0, layer: "#e8a06a" },
            { label: "Watermelon", price: 0, layer: "#e8536a" },
            { label: "Raspberry", price: 0, layer: "#b3325a" },
            { label: "Cherry", price: 0, layer: "#b3203a" },
            { label: "Blueberry", price: 0, layer: "#4f5aa8" },
            { label: "Pineapple", price: 0, layer: "#f2cf4a" },
            { label: "Blue Raspberry", price: 0, layer: "#2f8fd8" },
            { label: "None", price: 0 },
          ],
        },
        {
          label: "Lemonade size",
          required: true,
          options: [
            { label: "20 oz", price: 0 },
            { label: "24 oz", price: 0.75 },
          ],
        },
      ],
    },
  ],

  /* ======================= PAY LINKS =======================
     One private Givebacks item per possible order total.
     In Givebacks, create an item priced EXACTLY at each amount below
     (suggested name: "Online Order – $5.50"), set it to a private listing,
     and paste its link between the quotes.

     These are every total the menu above can add up to. If you change a
     price, a total may appear that isn't listed here; the page then tells
     the student to order at the counter instead of sending them anywhere
     wrong. Ask Claude to recalculate this list after any price change. */
  payLinks: {
    "3.00": "",
    "3.25": "",
    "3.50": "",
    "3.75": "",
    "4.00": "",
    "4.50": "",
    "4.75": "",
    "5.00": "",
    "5.50": "",
    "5.75": "",
    "6.25": "",
    "6.50": "",
    "7.00": "",
    "7.25": "",
    "7.75": "",
    "8.00": "",
    "8.50": "",
    "8.75": "",
  },

  /* ======================= ORDER LOG =======================
     The Google Apps Script web app URL (ends in /exec). Every order is
     sent here when the student taps Pay. Leave it empty to turn logging off. */
  orderLogUrl: "https://script.google.com/macros/s/AKfycbxz7vbp8ZsSA8KMuL9yXDB_QWT56TOxVWgCrBQbCw33wL0q2jFaF7hFoYZG4Kh0o1I/exec",
};
