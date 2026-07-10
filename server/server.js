import express from "express";
import dotenv from "dotenv";
import productRoutes from "./routes/productRoutes.js";
import db from "./db/index.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Accounting API is running",
  });
});

app.use("/api/products", productRoutes);

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