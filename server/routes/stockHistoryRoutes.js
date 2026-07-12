import express from "express";

import {
    getStockHistory,
    getStockHistoryById,
    createStockHistory,
    updateStockHistory,
    deleteStockHistory,
} from "../controllers/stockHistoryController.js";

const router = express.Router();

router.get("/", getStockHistory);
router.get("/:id", getStockHistoryById);
router.post("/", createStockHistory);
router.put("/:id", updateStockHistory);
router.delete("/:id", deleteStockHistory);

export default router;