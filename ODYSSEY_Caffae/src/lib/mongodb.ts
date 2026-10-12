import dns from "node:dns";
import { MongoClient, type Db } from "mongodb";

// Fix Windows DNS SRV lookup refusal for mongodb+srv://
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignored if unable to set servers
}

const DEFAULT_URI =
  "mongodb+srv://bcetfalcon2025_db_user:hrms1234@caffe.vucnjvp.mongodb.net/odyssey_caffe?retryWrites=true&w=majority&appName=caffe";
const MONGODB_URI = process.env["MONGODB_URI"] || DEFAULT_URI;
const MONGODB_DB_NAME = process.env["MONGODB_DB_NAME"] || "odyssey_caffe";

let clientPromise: Promise<MongoClient> | null = null;
let isInitialized = false;

export async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const db = client.db(MONGODB_DB_NAME);
  if (!isInitialized) {
    isInitialized = true;
    await seedInitialData(db).catch((err) =>
      console.error("[MongoDB] Auto-seeding error:", err),
    );
  }
  return db;
}

const INITIAL_MENU_ITEMS = [
  {
    name: "Paneer Butter Masala Bowl",
    description: "Creamy paneer curry with jeera rice",
    price: 189,
    category: "Meals",
    image_url: null,
    is_available: true,
  },
  {
    name: "Chicken Biryani",
    description: "Hyderabadi style, served with raita",
    price: 229,
    category: "Meals",
    image_url: null,
    is_available: true,
  },
  {
    name: "Veg Hakka Noodles",
    description: "Wok tossed noodles with crunchy veggies",
    price: 149,
    category: "Meals",
    image_url: null,
    is_available: true,
  },
  {
    name: "Grilled Paneer Wrap",
    description: "Tandoori paneer, onions and mint mayo",
    price: 129,
    category: "Meals",
    image_url: null,
    is_available: true,
  },
  {
    name: "Masala Fries",
    description: "Crispy fries tossed in peri masala",
    price: 99,
    category: "Snacks",
    image_url: null,
    is_available: true,
  },
  {
    name: "Veg Sandwich",
    description: "Grilled triple-layer sandwich",
    price: 89,
    category: "Snacks",
    image_url: null,
    is_available: true,
  },
  {
    name: "Samosa (2 pcs)",
    description: "Hot potato samosas with chutney",
    price: 40,
    category: "Snacks",
    image_url: null,
    is_available: true,
  },
  {
    name: "Cheese Garlic Bread",
    description: "Baked with mozzarella and herb butter",
    price: 119,
    category: "Snacks",
    image_url: null,
    is_available: true,
  },
  {
    name: "Filter Coffee",
    description: "Strong south-indian filter coffee",
    price: 49,
    category: "Beverages",
    image_url: null,
    is_available: true,
  },
  {
    name: "Masala Chai",
    description: "Ginger cardamom tea",
    price: 30,
    category: "Beverages",
    image_url: null,
    is_available: true,
  },
  {
    name: "Cold Coffee",
    description: "Blended with ice cream",
    price: 99,
    category: "Beverages",
    image_url: null,
    is_available: true,
  },
  {
    name: "Lemon Iced Tea",
    description: "Chilled and refreshing",
    price: 69,
    category: "Beverages",
    image_url: null,
    is_available: true,
  },
  {
    name: "Energy Drink",
    description: "Chilled 250ml can, late-night fuel",
    price: 120,
    category: "Essentials",
    image_url: null,
    is_available: true,
  },
  {
    name: "Potato Chips",
    description: "Classic salted crisps",
    price: 20,
    category: "Essentials",
    image_url: null,
    is_available: true,
  },
  {
    name: "Dark Chocolate Bar",
    description: "55% cocoa, 40g",
    price: 60,
    category: "Essentials",
    image_url: null,
    is_available: true,
  },
  {
    name: "Mineral Water 1L",
    description: "Packaged drinking water",
    price: 20,
    category: "Essentials",
    image_url: null,
    is_available: true,
  },
  {
    name: "Butter Chicken Thali",
    description: "Restaurant-style butter chicken, dal makhani, naan, jeera rice and salad.",
    price: 349,
    category: "Meals",
    image_url: null,
    is_available: true,
  },
  {
    name: "Paneer Tikka Platter",
    description: "Tandoor-grilled paneer tikka with mint chutney and laccha onions.",
    price: 299,
    category: "Meals",
    image_url: null,
    is_available: true,
  },
  {
    name: "Hyderabadi Dum Biryani",
    description: "Slow-cooked dum biryani with raita and mirchi ka salan.",
    price: 379,
    category: "Meals",
    image_url: null,
    is_available: true,
  },
  {
    name: "Wood-fired Margherita Pizza",
    description: "Classic 10-inch pizza with fresh mozzarella and basil.",
    price: 329,
    category: "Meals",
    image_url: null,
    is_available: true,
  },
];

async function seedInitialData(db: Db) {
  const menuCol = db.collection("menu_items");
  const count = await menuCol.countDocuments();
  if (count === 0) {
    const now = new Date().toISOString();
    const items = INITIAL_MENU_ITEMS.map((item, idx) => ({
      ...item,
      id: `item_${Date.now()}_${idx}`,
      created_at: now,
    }));
    await menuCol.insertMany(items);
    console.log(`[MongoDB] Seeded ${items.length} initial menu items.`);
  }

  const settingsCol = db.collection("app_settings");
  const paymentSetting = await settingsCol.findOne({ key: "payment_enabled" });
  if (!paymentSetting) {
    await settingsCol.insertOne({
      key: "payment_enabled",
      bool_value: true,
      updated_at: new Date().toISOString(),
    });
  }

  const staffCol = db.collection("staff_users");
  const staffCount = await staffCol.countDocuments();
  if (staffCount === 0) {
    await staffCol.insertMany([
      {
        staffId: "bcetfalcon2025_db_user",
        password: "hrms1234",
        role: "admin",
        created_at: new Date().toISOString(),
      },
      {
        staffId: "8637205752",
        password: "admin",
        role: "admin",
        created_at: new Date().toISOString(),
      },
    ]);
    console.log("[MongoDB] Seeded initial staff admin users.");
  }
}
