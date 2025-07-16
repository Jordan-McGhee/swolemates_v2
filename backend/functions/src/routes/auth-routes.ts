const express = require("express");
import * as authControllers from "../controllers/auth-controllers";

const router = express.Router();

// /auth

// Sync account for created or updated user
router.post("/sync", authControllers.syncFirebaseUser);

// Delete user by firebase UID
router.delete("/", authControllers.deleteUserByFirebaseUID);

module.exports = router;
