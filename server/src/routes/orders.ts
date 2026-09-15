import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin, optionalCustomer, type AuthedRequest } from "../middleware/auth.js";

export const ordersRouter = Router();

const FREE_SHIPPING_THRESHOLD = 2999;
const FLAT_SHIPPING_FEE = 99;

const createOrderSchema = z.object({
  customerName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(4),
  country: z.string().default("India"),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
});

function makeOrderNumber() {
  return `KGBK-${Date.now().toString(36).toUpperCase()}`;
}

// Creates a pending order. Prices are always looked up server-side from the
// current product record -- never trust a price sent by the client.
ordersRouter.post("/", optionalCustomer, async (req: AuthedRequest, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid order" });
  const data = parsed.data;

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, include: { images: true } });
  if (products.length !== new Set(productIds).size) {
    return res.status(400).json({ error: "One or more items in your cart are no longer available" });
  }

  const lineItems = data.items.map((i) => {
    const product = products.find((p) => p.id === i.productId)!;
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: i.quantity,
      image: product.images[0]?.src ?? null,
    };
  });

  const subtotal = lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const total = subtotal + shippingFee;

  const order = await prisma.order.create({
    data: {
      orderNumber: makeOrderNumber(),
      customerId: req.customerId ?? null,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      country: data.country,
      subtotal,
      shippingFee,
      total,
      status: "pending",
      items: { create: lineItems },
    },
    include: { items: true },
  });

  res.status(201).json(order);
});

const lookupSchema = z.object({ orderNumber: z.string().min(1), email: z.string().email() });

// Public order tracking: requires both the order number AND the email used
// at checkout, so an order ID can't be guessed/enumerated to see someone
// else's shipping details.
ordersRouter.get("/lookup", async (req, res) => {
  const parsed = lookupSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "orderNumber and email are required" });
  const order = await prisma.order.findFirst({
    where: { orderNumber: parsed.data.orderNumber, email: { equals: parsed.data.email } },
    include: { items: true },
  });
  if (!order) return res.status(404).json({ error: "No order found with that order number and email" });
  res.json(order);
});

ordersRouter.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

ordersRouter.get("/", requireAdmin, async (_req, res) => {
  const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
  res.json(orders);
});

ordersRouter.patch("/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body as { status?: string };
  const allowed = ["pending", "paid", "shipped", "delivered", "cancelled"];
  if (!status || !allowed.includes(status)) return res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
  res.json(order);
});
