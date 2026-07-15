import express from "express";

import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from "../controllers/invoiceController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getAllInvoices, "Failed to retrieve invoices"));
router.get("/:id", asyncHandler(getInvoiceById, "Failed to retrieve invoice"));
router.post("/", asyncHandler(createInvoice, "Failed to create invoice"));
router.put("/:id", asyncHandler(updateInvoice, "Failed to update invoice"));
router.delete("/:id", asyncHandler(deleteInvoice, "Failed to delete invoice"));

export default router;
