import path from "node:path";
import { fileURLToPath } from "node:url";

import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import profitRoutes from "./routes/profitRoutes.js";
import stockHistoryRoutes from "./routes/stockHistoryRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import db from "./db/index.js";
import { runMigrations } from "./db/migrate.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const PgSession = connectPgSimple(session);
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.resolve(serverDirectory, "../client/dist");
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required");
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
if (process.env.NODE_ENV !== "production" || process.env.CLIENT_ORIGIN) {
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS"));
      },
      credentials: true,
    })
  );
}

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(
  session({
    store: new PgSession({
      pool: db,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    name: "accounting.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/products", requireAuth, productRoutes);
app.use("/api/stock-history", requireAuth, stockHistoryRoutes);
app.use("/api/customers", requireAuth, customerRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);
app.use("/api/invoices", requireAuth, invoiceRoutes);
app.use("/api/profits", requireAuth, profitRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientDirectory));
  app.use((req, res, next) => {
    if (req.method === "GET" && req.accepts("html")) {
      return res.sendFile(path.join(clientDirectory, "index.html"));
    }

    return next();
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Accounting API is running" });
  });
}

app.use(errorHandler);

async function startServer() {
  try {
    await runMigrations();
    const result = await db.query("SELECT NOW()");

    console.log("Connected to PostgreSQL");
    console.log("Database time:", result.rows[0].now);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();
