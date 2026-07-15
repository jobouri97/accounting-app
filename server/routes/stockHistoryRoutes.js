import express from "express";

import {
    getStockHistory,
    getStockHistoryById,
    createStockHistory,
    updateStockHistory,
    deleteStockHistory,
} from "../controllers/stockHistoryController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getStockHistory, "Failed to retrieve stock history"));
router.get("/:id", asyncHandler(getStockHistoryById, "Failed to retrieve stock history record"));
router.post("/", asyncHandler(createStockHistory, "Failed to create stock history"));
router.put("/:id", asyncHandler(updateStockHistory, "Failed to update stock history"));
router.delete("/:id", asyncHandler(deleteStockHistory, "Failed to delete stock history"));

export default router;
