import express from "express";

import { getAllProfits } from "../controllers/profitController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getAllProfits, "Failed to retrieve profits"));

export default router;
