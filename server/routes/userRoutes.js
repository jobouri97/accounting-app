import express from "express";

import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../controllers/userController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getAllUsers, "Failed to retrieve users"));
router.get("/:id", asyncHandler(getUserById, "Failed to retrieve user"));
router.post("/", asyncHandler(createUser, "Failed to create user"));
router.put("/:id", asyncHandler(updateUser, "Failed to update user"));
router.delete("/:id", asyncHandler(deleteUser, "Failed to delete user"));

export default router;
