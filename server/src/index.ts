import "dotenv/config";
import express from "express";
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

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") ?? "*" }));
app.use(express.json({ limit: "15mb" })); // generous limit: product images arrive as base64 data URLs

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

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`kgbk-server listening on http://localhost:${port}`);
});
