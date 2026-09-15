import { Router } from "express";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

export const shippingRouter = Router();

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getShiprocketToken(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Shiprocket is not configured yet. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD to server/.env (create a free account at https://www.shiprocket.in/) and restart the server."
    );
  }
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Shiprocket login failed: ${res.status}`);
  const data = (await res.json()) as { token: string };
  // Shiprocket tokens are valid ~10 days; refresh daily to be safe.
  cachedToken = { token: data.token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
  return data.token;
}

// Creates a Shiprocket order/shipment for an already-paid internal order.
// Call this from the admin panel once an order is marked "paid".
shippingRouter.post("/orders/:orderId/create-shipment", requireAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { items: true } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "paid") return res.status(409).json({ error: "Only paid orders can be shipped" });

    const token = await getShiprocketToken();

    const payload = {
      order_id: order.orderNumber,
      order_date: order.createdAt.toISOString().slice(0, 10),
      pickup_location: "Primary",
      billing_customer_name: order.customerName,
      billing_last_name: "",
      billing_address: order.addressLine1,
      billing_address_2: order.addressLine2 ?? "",
      billing_city: order.city,
      billing_pincode: order.pincode,
      billing_state: order.state,
      billing_country: order.country,
      billing_email: order.email,
      billing_phone: order.phone,
      shipping_is_billing: true,
      order_items: order.items.map((i) => ({
        name: i.name,
        sku: i.productId ?? i.id,
        units: i.quantity,
        selling_price: i.price,
      })),
      payment_method: "Prepaid",
      sub_total: order.subtotal,
      length: 20,
      breadth: 15,
      height: 5,
      weight: 0.5,
    };

    const shipRes = await fetch(`${SHIPROCKET_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const shipData = (await shipRes.json()) as { order_id?: number; message?: string };
    if (!shipRes.ok) return res.status(502).json({ error: shipData.message ?? "Shiprocket order creation failed" });

    await prisma.order.update({
      where: { id: order.id },
      data: { shiprocketOrderId: String(shipData.order_id ?? ""), status: "shipped" },
    });

    res.json(shipData);
  } catch (err) {
    res.status(503).json({ error: err instanceof Error ? err.message : "Shipping integration error" });
  }
});
