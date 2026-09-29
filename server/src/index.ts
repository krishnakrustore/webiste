import "dotenv/config";
import express from "express";
// Express 4 ignores rejected promises from async handlers; this forwards them to the error handler below.
import "express-async-errors";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { categoriesRouter, occasionsRouter, fabricTypesRouter } from "./routes/taxonomy.js";
import { testimonialsRouter } from "./routes/testimonials.js";
import { bannersRouter } from "./routes/banners.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { shippingRouter } from "./routes/shipping.js";
import { scheduleCallRouter } from "./routes/scheduleCall.js";
import { settingsRouter } from "./routes/settings.js";
import { customersRouter } from "./routes/customers.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { careGuidesRouter } from "./routes/careGuides.js";
import { policiesRouter } from "./routes/policies.js";
import { imagesRouter } from "./routes/images.js";
import { aiRouter } from "./routes/ai.js";
import { sitemapRouter } from "./routes/sitemap.js";

const app = express();
// Railway terminates TLS at its proxy; this makes req.protocol report https for absolute image URLs.
app.set("trust proxy", true);

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") ?? "*" }));
app.use(express.json({ limit: "25mb" })); // product images and AI reference photos arrive as base64 data URLs

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/occasions", occasionsRouter);
app.use("/api/fabric-types", fabricTypesRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/banners", bannersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/schedule-call", scheduleCallRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/care-guides", careGuidesRouter);
app.use("/api/policies", policiesRouter);
app.use("/api/images", imagesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/sitemap.xml", sitemapRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = (err as { status?: number; type?: string }).status;
  if ((err as { type?: string }).type === "entity.too.large") {
    return res.status(413).json({ error: "Upload is too large. Use fewer or smaller photos." });
  }
  if (status && status >= 400 && status < 500) {
    return res.status(status).json({ error: (err as Error).message || "Bad request" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`kgbk-server listening on http://localhost:${port}`);
});
