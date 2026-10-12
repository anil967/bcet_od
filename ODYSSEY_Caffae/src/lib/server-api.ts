import { ObjectId, type Document } from "mongodb";
import { getDb } from "./mongodb";

function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

type MenuItemDoc = Document & {
  _id?: ObjectId;
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string | null;
  is_available?: boolean;
  created_at?: string;
};

type OrderItemDoc = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
};

type OrderDoc = Document & {
  _id?: ObjectId;
  id: string;
  code: string;
  customer_name: string;
  table_number: string;
  status: string;
  total: number;
  delivery_charge: number;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItemDoc[];
};

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  let pathname = url.pathname;
  if (pathname.startsWith("/food/api/")) {
    pathname = pathname.slice(5);
  }

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  try {
    const db = await getDb();

    // 1. Health check
    if (pathname === "/api/health") {
      return jsonResponse({ ok: true, database: "mongodb", timestamp: new Date().toISOString() });
    }

    // 2. Menu Items
    if (pathname === "/api/menu") {
      const menuCol = db.collection<MenuItemDoc>("menu_items");

      if (request.method === "GET") {
        const category = url.searchParams.get("category");
        const filter = category ? { category } : {};
        const items = await menuCol.find(filter).toArray();
        const formatted = items.map((doc) => ({
          id: doc["id"] || (doc._id ? doc._id.toString() : ""),
          name: doc["name"] || "",
          description: doc["description"] || "",
          price: Number(doc["price"] || 0),
          category: doc["category"] || "",
          image_url: doc["image_url"] || null,
          is_available: doc["is_available"] !== false,
          created_at: doc["created_at"] || new Date().toISOString(),
        }));
        return jsonResponse(formatted);
      }

      if (request.method === "POST") {
        const body = (await request.json()) as {
          id?: string;
          name: string;
          description?: string;
          price: number;
          category: string;
          image_url?: string | null;
          is_available?: boolean;
        };

        const payload = {
          name: body.name.trim(),
          description: (body.description || "").trim(),
          price: Number(body.price),
          category: body.category,
          image_url: body.image_url ? body.image_url.trim() : null,
          is_available: body.is_available !== false,
          updated_at: new Date().toISOString(),
        };

        if (body.id) {
          const filter: Record<string, unknown>[] = [{ id: body.id }];
          if (ObjectId.isValid(body.id)) {
            filter.push({ _id: new ObjectId(body.id) });
          }
          await menuCol.updateOne(
            { $or: filter },
            { $set: payload },
          );
          return jsonResponse({ success: true, id: body.id, ...payload });
        } else {
          const newId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const doc: MenuItemDoc = {
            id: newId,
            ...payload,
            created_at: new Date().toISOString(),
          };
          await menuCol.insertOne(doc);
          return jsonResponse({ success: true, ...doc });
        }
      }

      if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return jsonResponse({ error: "Missing id parameter" }, 400);

        const filter: Record<string, unknown>[] = [{ id }];
        if (ObjectId.isValid(id)) filter.push({ _id: new ObjectId(id) });

        await menuCol.deleteOne({ $or: filter });
        return jsonResponse({ success: true, deleted: id });
      }
    }

    // Menu Availability toggle
    if (pathname === "/api/menu/availability" && request.method === "POST") {
      const body = (await request.json()) as { id: string; is_available: boolean };
      const menuCol = db.collection<MenuItemDoc>("menu_items");
      const filter: Record<string, unknown>[] = [{ id: body.id }];
      if (ObjectId.isValid(body.id)) filter.push({ _id: new ObjectId(body.id) });

      await menuCol.updateOne(
        { $or: filter },
        { $set: { is_available: Boolean(body.is_available), updated_at: new Date().toISOString() } },
      );
      return jsonResponse({ success: true });
    }

    // 3. Orders
    if (pathname === "/api/orders") {
      const ordersCol = db.collection<OrderDoc>("orders");

      if (request.method === "GET") {
        const code = url.searchParams.get("code");
        const customerName = url.searchParams.get("customer_name");
        const tableNumber = url.searchParams.get("table_number");

        if (code) {
          const order = await ordersCol.findOne({ code: code.trim().toUpperCase() });
          return jsonResponse(order ? [formatOrder(order)] : []);
        }

        if (customerName && tableNumber) {
          const filter = {
            customer_name: { $regex: new RegExp(`^${customerName.trim()}$`, "i") },
            table_number: tableNumber.trim(),
          };
          const list = await ordersCol.find(filter).sort({ created_at: -1 }).toArray();
          return jsonResponse(list.map(formatOrder));
        }

        // Admin: fetch all orders
        const list = await ordersCol.find({}).sort({ created_at: -1 }).toArray();
        return jsonResponse(list.map(formatOrder));
      }

      if (request.method === "POST") {
        const body = (await request.json()) as {
          customer_name: string;
          table_number: string;
          total: number;
          delivery_charge?: number;
          payment_method?: string | null;
          items: Array<{
            menu_item_id?: string;
            item_name: string;
            quantity: number;
            unit_price: number;
          }>;
        };

        const code = generateOrderCode();
        const id = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();

        const orderDoc: OrderDoc = {
          id,
          code,
          customer_name: body.customer_name.trim(),
          table_number: body.table_number.trim(),
          status: "Placed",
          total: Number(body.total),
          delivery_charge: Number(body.delivery_charge || 0),
          payment_method: body.payment_method || null,
          created_at: now,
          updated_at: now,
          order_items: (body.items || []).map((item, idx) => ({
            id: `item_${id}_${idx}`,
            order_id: id,
            menu_item_id: item.menu_item_id || null,
            item_name: item.item_name,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
          })),
        };

        await ordersCol.insertOne(orderDoc);
        return jsonResponse({ success: true, ...orderDoc });
      }
    }

    // Order status update
    if (pathname === "/api/orders/status" && request.method === "POST") {
      const body = (await request.json()) as { id: string; status: string };
      const ordersCol = db.collection<OrderDoc>("orders");
      const filter: Record<string, unknown>[] = [{ id: body.id }];
      if (ObjectId.isValid(body.id)) filter.push({ _id: new ObjectId(body.id) });

      await ordersCol.updateOne(
        { $or: filter },
        { $set: { status: body.status, updated_at: new Date().toISOString() } },
      );
      return jsonResponse({ success: true });
    }

    // 4. App Settings
    if (pathname === "/api/settings") {
      const settingsCol = db.collection("app_settings");

      if (request.method === "GET") {
        const key = url.searchParams.get("key");
        if (key) {
          const setting = await settingsCol.findOne({ key });
          return jsonResponse({ key, bool_value: setting ? setting["bool_value"] : true });
        }
        const all = await settingsCol.find({}).toArray();
        return jsonResponse(all);
      }

      if (request.method === "POST") {
        const body = (await request.json()) as { key: string; bool_value: boolean };
        await settingsCol.updateOne(
          { key: body.key },
          { $set: { bool_value: Boolean(body.bool_value), updated_at: new Date().toISOString() } },
          { upsert: true },
        );
        return jsonResponse({ success: true, key: body.key, bool_value: body.bool_value });
      }
    }

    // 5. Staff Auth
    if (pathname === "/api/auth/login" && request.method === "POST") {
      const body = (await request.json()) as { staffId: string; password: string };
      const rawId = (body.staffId || "").trim();
      const rawPassword = (body.password || "").trim();

      // Normalize staff ID (strip domain if entered as email)
      const cleanId = rawId.includes("@") ? (rawId.split("@")[0] || rawId) : rawId;

      const staffCol = db.collection("staff_users");
      const user = await staffCol.findOne({
        $or: [
          { staffId: rawId },
          { staffId: cleanId },
          { staffId: `${cleanId}@quickbite.staff` },
        ],
      });

      // Valid if user in DB matches password, or fallback defaults
      const isValid =
        (user && user["password"] === rawPassword) ||
        (cleanId === "bcetfalcon2025_db_user" && rawPassword === "hrms1234") ||
        (cleanId === "8637205752" && (rawPassword === "admin" || rawPassword === "hrms1234"));

      if (!isValid) {
        return jsonResponse({ error: "Wrong staff ID or password" }, 401);
      }

      return jsonResponse({
        success: true,
        session: {
          user: {
            id: user?._id?.toString() || cleanId,
            staffId: cleanId,
            role: "admin",
          },
          token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        },
      });
    }

    // 6. Summary / Analytics
    if (pathname === "/api/summary" && request.method === "GET") {
      const ordersCol = db.collection<OrderDoc>("orders");
      const orders = await ordersCol.find({}).toArray();

      const totalOrders = orders.length;
      const delivered = orders.filter((o) => o["status"] === "Delivered").length;
      const revenue = orders.reduce((sum, o) => sum + Number(o["total"] || 0), 0);
      const averageOrder = totalOrders > 0 ? revenue / totalOrders : 0;

      const counts = new Map<string, number>();
      for (const order of orders) {
        const orderItems = order["order_items"] || [];
        for (const item of orderItems) {
          const name = item.item_name || "Item";
          counts.set(name, (counts.get(name) ?? 0) + Number(item.quantity || 1));
        }
      }

      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

      return jsonResponse({
        totalOrders,
        delivered,
        revenue,
        averageOrder,
        top,
      });
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  } catch (error) {
    console.error("[API Error]", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal Server Error" }, 500);
  }
}

function formatOrder(doc: OrderDoc) {
  return {
    id: doc["id"] || (doc._id ? doc._id.toString() : ""),
    code: doc["code"] || "",
    customer_name: doc["customer_name"] || "",
    table_number: doc["table_number"] || "",
    status: doc["status"] || "Placed",
    total: Number(doc["total"] || 0),
    delivery_charge: Number(doc["delivery_charge"] || 0),
    payment_method: doc["payment_method"] || null,
    created_at: doc["created_at"] || new Date().toISOString(),
    order_items: doc["order_items"] || [],
  };
}
