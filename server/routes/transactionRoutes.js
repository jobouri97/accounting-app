import express from "express";

import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getAllTransactions, "Failed to retrieve transactions"));
router.get("/:id", asyncHandler(getTransactionById, "Failed to retrieve transaction"));
router.post("/", asyncHandler(createTransaction, "Failed to create transaction"));
router.put("/:id", asyncHandler(updateTransaction, "Failed to update transaction"));
router.delete("/:id", asyncHandler(deleteTransaction, "Failed to delete transaction"));

export default router;
