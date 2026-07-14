import express from "express";

import { getAllProfits } from "../controllers/profitController.js";

const router = express.Router();

router.get("/", getAllProfits);

export default router;
