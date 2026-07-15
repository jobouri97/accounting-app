import express from "express";

import {
  getCurrentUser,
  googleLogin,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.post("/register", asyncHandler(register, "Failed to register"));
router.post("/login", asyncHandler(login, "Failed to log in"));
router.post("/google", asyncHandler(googleLogin, "Failed to log in with Google"));
router.post("/logout", requireAuth, asyncHandler(logout, "Failed to log out"));
router.get("/me", requireAuth, asyncHandler(getCurrentUser, "Failed to retrieve account"));

export default router;
