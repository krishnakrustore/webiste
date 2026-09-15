import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export interface AuthedRequest extends Request {
  adminId?: string;
  customerId?: string;
}

type Claims = { sub: string; role: "admin" | "customer" };

export function signAdminToken(adminId: string): string {
  return jwt.sign({ sub: adminId, role: "admin" } satisfies Claims, JWT_SECRET, { expiresIn: "7d" });
}

export function signCustomerToken(customerId: string): string {
  return jwt.sign({ sub: customerId, role: "customer" } satisfies Claims, JWT_SECRET, { expiresIn: "30d" });
}

function readToken(req: Request): Claims | null {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as Claims;
  } catch {
    return null;
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const claims = readToken(req);
  if (!claims || claims.role !== "admin") return res.status(401).json({ error: "Missing or invalid admin token" });
  req.adminId = claims.sub;
  next();
}

export function requireCustomer(req: AuthedRequest, res: Response, next: NextFunction) {
  const claims = readToken(req);
  if (!claims || claims.role !== "customer") return res.status(401).json({ error: "Missing or invalid login" });
  req.customerId = claims.sub;
  next();
}

/** Attaches customerId when a valid customer token is present, but never blocks the request -- used for guest-friendly checkout. */
export function optionalCustomer(req: AuthedRequest, _res: Response, next: NextFunction) {
  const claims = readToken(req);
  if (claims?.role === "customer") req.customerId = claims.sub;
  next();
}
