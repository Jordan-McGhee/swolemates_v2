const express = require("express")
import * as utilControllers from "../controllers/util-controllers"

const router = express.Router()

// check username
router.post("/checkUsername", utilControllers.checkUsernameAvailability)

module.exports = router