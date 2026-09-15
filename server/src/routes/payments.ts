import { Router } from "express";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { prisma } from "../db.js";

export const paymentsRouter = Router();

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

const createSchema = z.object({ orderId: z.string() });

// Step 1 of checkout: turn our internal (pending) Order into a Razorpay
// order so the frontend can open the Razorpay Checkout modal against it.
paymentsRouter.post("/create-razorpay-order", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "orderId is required" });

  const razorpay = getRazorpay();
  if (!razorpay) {
    return res.status(503).json({
      error: "Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env (sign up free at https://dashboard.razorpay.com/ for test keys) and restart the server.",
    });
  }

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "pending") return res.status(409).json({ error: `Order is already ${order.status}` });

  const rpOrder = await razorpay.orders.create({
    amount: Math.round(order.total * 100), // paise
    currency: "INR",
    receipt: order.orderNumber,
    notes: { orderId: order.id },
  });

  await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rpOrder.id } });

  res.json({
    razorpayOrderId: rpOrder.id,
    amount: rpOrder.amount,
    currency: rpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
  });
});

const verifySchema = z.object({
  orderId: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Step 2: after the Checkout modal succeeds client-side, verify the HMAC
// signature server-side before trusting the payment -- never mark an order
// paid based on the client's word alone.
paymentsRouter.post("/verify", async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Missing verification fields" });
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(503).json({ error: "Razorpay is not configured" });

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: "Payment signature verification failed" });
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: "paid", razorpayPaymentId: razorpay_payment_id },
    include: { items: true },
  });

  res.json(order);
});
