import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { signCustomerToken, requireCustomer, requireAdmin, type AuthedRequest } from "../middleware/auth.js";

export const customersRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().default(""),
  password: z.string().min(6),
});

customersRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid details" });
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "An account with this email already exists. Please log in instead." });

  const passwordHash = await bcrypt.hash(password, 10);
  const customer = await prisma.customer.create({ data: { name, email, phone, passwordHash } });
  const token = signCustomerToken(customer.id);
  res.status(201).json({ token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

customersRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Email and password required" });

  const customer = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
  if (!customer) return res.status(401).json({ error: "Incorrect email or password" });

  const valid = await bcrypt.compare(parsed.data.password, customer.passwordHash);
  if (!valid) return res.status(401).json({ error: "Incorrect email or password" });

  const token = signCustomerToken(customer.id);
  res.json({ token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
});

customersRouter.get("/me", requireCustomer, async (req: AuthedRequest, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.customerId } });
  if (!customer) return res.status(404).json({ error: "Not found" });
  res.json({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
});

customersRouter.get("/me/orders", requireCustomer, async (req: AuthedRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { customerId: req.customerId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// Admin-only: full customer list with order counts, so every registered
// shopper's details are visible in Admin > Customers.
customersRouter.get("/", requireAdmin, async (_req, res) => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, wishlist: true } } },
  });
  res.json(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt,
      orderCount: c._count.orders,
      wishlistCount: c._count.wishlist,
    }))
  );
});
