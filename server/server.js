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
const serverDirectory = path.dirname(fileURLToPath(import.meta.url)); //returns the directory of server.js (current file)
const clientDirectory = path.resolve(serverDirectory, "../client/dist"); //the built react files are located in folder "dist"
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173") //chooses which frontend address is allowed to make requests to the backend
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
if (process.env.NODE_ENV !== "production" || process.env.CLIENT_ORIGIN) { //if we are in development mode or we are using separate frontend address
  app.use(
    cors({ //CORS controls which websites are allowed to call your backend API from browser JavaScript
      origin(origin, callback) { //origin is the URL
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true); //(!origin) means request not coming from browser (such as request coming from postman)
        return callback(new Error("Origin is not allowed by CORS")); //if it's coming from browser but URL not included in allowedOrigins throw an error
      },
      credentials: true, //For an already allowed origin, permit the browser to include credentials (credentials include: cookie that hold sessionid) - note that session stored in server and cookie stored in browser
                         //so browser saves cookie holding sessionid, it uses this sessionid to request data from the server
                         //the server knows from the sessionid (sent by browser) which user is communicating with me
    })
  );
}

app.get("/api/health", (req, res) => { //This checks that the Express application responds. You can try it by adding "/api/health" to the URL
  res.status(200).json({ status: "ok" });
});

app.use(
  session({
    store: new PgSession({
      pool: db,
      tableName: "user_sessions",
      createTableIfMissing: true, //Check whether the user_sessions table exists. If it does not exist, create it automatically.
    }),
    name: "accounting.sid",
    secret: process.env.SESSION_SECRET,
    resave: false, //Do not save the session back to PostgreSQL on every request if nothing changed. Save it only when session data is modified, such as after login.
    saveUninitialized: false, //Do not save a new empty session until your application puts something inside it. (Ex. if user opened website but didn't login so no session is saved in postgress)
    cookie: {
      httpOnly: true, //Browser JavaScript cannot read this cookie; the browser sends it automatically with eligible HTTP(S) requests.
      sameSite: "lax", //Limits sending the cookie with cross-site requests, helping protect against CSRF.
      secure: process.env.NODE_ENV === "production", //In production, it becomes true, so the browser sends the cookie only over HTTPS.
                                                     //In development, it becomes false, allowing it over local HTTP, such as http://localhost:3000.
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
  app.use(express.static(clientDirectory)); //When the browser requests a static file, look for it inside clientDirectory and send it back if found.
  app.use((req, res, next) => {
    if (req.method === "GET" && req.accepts("html")) { //If the request is a GET request and the browser accepts HTML, send the frontend’s index.html.
                                                       //Example where browser doesn't accept html request: is when request header contains (Accept: application/json)
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
    const result = await db.query("SELECT NOW()"); //Confirms that the application can connect to PostgreSQL.

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
