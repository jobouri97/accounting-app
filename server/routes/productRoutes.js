import express from "express";

import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getAllProducts, "Failed to retrieve products"));

router.get("/:id", asyncHandler(getProductById, "Failed to retrieve product"));

router.post("/", asyncHandler(createProduct, "Failed to create product"));

router.put("/:id", asyncHandler(updateProduct, "Failed to update product"));

router.delete("/:id", asyncHandler(deleteProduct, "Failed to delete product"));

export default router;
