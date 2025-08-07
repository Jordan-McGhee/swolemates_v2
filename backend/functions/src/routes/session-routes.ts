const express = require("express")
import * as sessionControllers from "../controllers/session-controllers"

const router = express.Router()

// /session

// WORKOUT SESSIONS

// create a completed workout session
router.post("/", sessionControllers.createSession)

// edit a workout session
router.patch("/:session_id", sessionControllers.editSession)

// COMMENTS

// comment on session
router.post("/:session_id/comment", sessionControllers.commentOnSession)

// edit comment on session
router.patch("/:session_id/comment/:comment_id", sessionControllers.editCommentOnSession)

// delete comment on session
router.delete("/:session_id/comment/:comment_id", sessionControllers.deleteCommentOnSession)

// LIKES

// like session
router.post("/:session_id/like", sessionControllers.likeSession)

// unlike session
router.delete("/:session_id/unlike", sessionControllers.unlikeSession)

// delete a workout session
router.delete("/:session_id", sessionControllers.deleteSession)



module.exports = router