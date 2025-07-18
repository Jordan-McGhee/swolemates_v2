const express = require("express");
import * as authControllers from "../controllers/auth-controllers";

const router = express.Router();

// /auth

// Get PostgreSQL user by Firebase UID
router.get("/user", authControllers.getPostgreSQLUser);

// Update user profile info (username, bio, etc.)
router.put("/user", authControllers.updateUserProfile);

// Sync account for created or updated user
router.post("/sync", authControllers.syncFirebaseUser);

// Delete user by firebase UID
router.delete("/", authControllers.deleteUserByFirebaseUID);

module.exports = router;
