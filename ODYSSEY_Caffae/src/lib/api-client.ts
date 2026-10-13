// Client-side API library communicating with MongoDB endpoints

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "Snacks" | "Cold Drinks" | "Ice Creams" | string;
  image_url: string | null;
  is_available: boolean;
  created_at?: string;
};

export type OrderItem = {
  id: string;
  order_id?: string;
  menu_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
};

export type Order = {
  id: string;
  code: string;
  customer_name: string;
  table_number: string;
  status: "Placed" | "Preparing" | "Out for Delivery" | "Delivered";
  total: number;
  delivery_charge: number;
  payment_method: string | null;
  transaction_id?: string | null;
  created_at: string;
  order_items: OrderItem[];
};

export type UserSession = {
  user: {
    id: string;
    staffId: string;
    role: "admin";
  };
  token: string;
};

const SESSION_STORAGE_KEY = "odyssey_staff_session";
type AuthListener = (session: UserSession | null) => void;
const authListeners = new Set<AuthListener>();
const API_BASE = "/food/api";

export const api = {
  menu: {
    async list(category?: string): Promise<MenuItem[]> {
      const url = category ? `${API_BASE}/menu?category=${encodeURIComponent(category)}` : `${API_BASE}/menu`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch menu items");
      return res.json();
    },
    async save(item: {
      id?: string | undefined;
      name: string;
      description?: string | undefined;
      price: number;
      category: string;
      image_url?: string | null | undefined;
      is_available?: boolean | undefined;
    }): Promise<MenuItem> {
      const res = await fetch(`${API_BASE}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error("Failed to save menu item");
      return res.json();
    },
    async toggleAvailability(id: string, is_available: boolean): Promise<void> {
      const res = await fetch(`${API_BASE}/menu/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_available }),
      });
      if (!res.ok) throw new Error("Failed to update availability");
    },
    async delete(id: string): Promise<void> {
      const res = await fetch(`${API_BASE}/menu?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete menu item");
    },
  },

  orders: {
    async list(): Promise<Order[]> {
      const res = await fetch(`${API_BASE}/orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    async getByCode(code: string): Promise<Order[]> {
      const res = await fetch(`${API_BASE}/orders?code=${encodeURIComponent(code.trim().toUpperCase())}`);
      if (!res.ok) throw new Error("Failed to track order");
      return res.json();
    },
    async getByCustomerAndTable(customer_name: string, table_number: string): Promise<Order[]> {
      const res = await fetch(
        `${API_BASE}/orders?customer_name=${encodeURIComponent(customer_name)}&table_number=${encodeURIComponent(table_number)}`,
      );
      if (!res.ok) throw new Error("Failed to track order");
      return res.json();
    },
    async create(payload: {
      customer_name: string;
      table_number: string;
      total: number;
      delivery_charge?: number;
      payment_method?: string | null;
      transaction_id?: string | null;
      items: Array<{
        menu_item_id?: string;
        item_name: string;
        quantity: number;
        unit_price: number;
      }>;
    }): Promise<{ id: string; code: string }> {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to place order");
      return res.json();
    },
    async updateStatus(id: string, status: string): Promise<void> {
      const res = await fetch(`${API_BASE}/orders/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
    },
    async delete(id: string): Promise<void> {
      const res = await fetch(`${API_BASE}/orders?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete order");
    },
  },

  settings: {
    async get(key: string): Promise<boolean> {
      const res = await fetch(`${API_BASE}/settings?key=${encodeURIComponent(key)}`);
      if (!res.ok) return true;
      const data = await res.json();
      return data?.bool_value ?? true;
    },
    async set(key: string, bool_value: boolean): Promise<void> {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, bool_value }),
      });
      if (!res.ok) throw new Error("Failed to update setting");
    },
  },

  summary: {
    async get(): Promise<{
      totalOrders: number;
      delivered: number;
      revenue: number;
      averageOrder: number;
      top: [string, number][];
    }> {
      const res = await fetch(`${API_BASE}/summary`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  },

  auth: {
    async login(staffId: string, password: string): Promise<UserSession> {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Wrong staff ID or password");
      }
      const data = await res.json();
      const session = data.session as UserSession;
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
      authListeners.forEach((l) => l(session));
      return session;
    },

    getSession(): UserSession | null {
      if (typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as UserSession) : null;
      } catch {
        return null;
      }
    },

    logout(): void {
      if (typeof window !== "undefined") {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      authListeners.forEach((l) => l(null));
    },

    onAuthStateChange(listener: AuthListener): () => void {
      authListeners.add(listener);
      // Immediately trigger with current session
      listener(api.auth.getSession());
      return () => {
        authListeners.delete(listener);
      };
    },
  },
};
