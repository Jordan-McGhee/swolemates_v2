const express = require("express")
import * as searchControllers from "../controllers/search-controllers"

const router = express.Router()

// /search
// Accepts query and optionally type (users, groups, workouts)
// Example: GET /search?query=fit&type=users
router.get('/search', searchControllers.searchItems);

module.exports = router