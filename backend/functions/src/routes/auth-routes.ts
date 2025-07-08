const express = require("express")
import * as authControllers from "../controllers/auth-controllers"

const router = express.Router()

// sync account for created or updated user
router.post("/sync", authControllers.syncFirebaseUser)

// delete user by firebaseUID
router.delete("/", authControllers.deleteUserByFirebaseUID)

module.exports = router