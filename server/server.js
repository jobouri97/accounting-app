import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Accounting API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});