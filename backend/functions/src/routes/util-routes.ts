const express = require("express")
import * as utilControllers from "../controllers/util-controllers"

const router = express.Router()

// /util

// check username
router.post("/checkUsername", utilControllers.checkUsernameAvailability)

// user routes

// post routes

// workout routes

// group routes

// search routes

module.exports = router