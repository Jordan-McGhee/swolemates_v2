const express = require("express")
import * as commentControllers from "../controllers/comment-controllers"

const router = express.Router()

// / comment

// like comment
router.post("/:comment_id/like", commentControllers.likeComment)

// unlike comment
router.post("/:comment_id/unlike", commentControllers.unlikeComment)

module.exports = router