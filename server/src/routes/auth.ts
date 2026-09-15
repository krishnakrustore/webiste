import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { signAdminToken, requireAdmin, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) return res.status(401).json({ error: "Incorrect username or password" });

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(401).json({ error: "Incorrect username or password" });

  const token = signAdminToken(admin.id);
  res.json({ token, username: admin.username });
});

authRouter.get("/me", requireAdmin, async (req: AuthedRequest, res) => {
  const admin = await prisma.adminUser.findUnique({ where: { id: req.adminId } });
  if (!admin) return res.status(404).json({ error: "Not found" });
  res.json({ username: admin.username });
});

authRouter.post("/change-password", requireAdmin, async (req: AuthedRequest, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both current and new password required" });
  if (newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters" });

  const admin = await prisma.adminUser.findUnique({ where: { id: req.adminId } });
  if (!admin) return res.status(404).json({ error: "Not found" });

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });
  res.json({ ok: true });
});
