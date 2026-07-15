import express from "express";

import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getAllCustomers, "Failed to retrieve customers"));
router.get("/:id", asyncHandler(getCustomerById, "Failed to retrieve customer"));
router.post("/", asyncHandler(createCustomer, "Failed to create customer"));
router.put("/:id", asyncHandler(updateCustomer, "Failed to update customer"));
router.delete("/:id", asyncHandler(deleteCustomer, "Failed to delete customer"));

export default router;
