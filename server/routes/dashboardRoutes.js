import express from "express";

import { getDashboard } from "../controllers/dashboardController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getDashboard, "Failed to retrieve dashboard"));

export default router;
