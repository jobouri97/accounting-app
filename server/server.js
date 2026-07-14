import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import productRoutes from "./routes/productRoutes.js";
import stockHistoryRoutes from "./routes/stockHistoryRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import profitRoutes from "./routes/profitRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { requireAuth } from "./middleware/auth.js";
import db from "./db/index.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const PgSession = connectPgSimple(session);
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

app.get("/", (req, res) => {
  res.json({
    message: "Accounting API is running",
  });
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);

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
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

async function connectDatabase() {
  try {
    const result = await db.query("SELECT NOW()");

    console.log("✅ Connected to PostgreSQL");
    console.log("Database time:", result.rows[0].now);
  } catch (error) {
    console.error("❌ Failed to connect to PostgreSQL");
    console.error(error.message);
    process.exit(1);
  }
}

connectDatabase();
