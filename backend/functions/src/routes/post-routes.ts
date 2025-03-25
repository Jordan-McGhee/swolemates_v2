const express = require("express")
import * as postControllers from "../controllers/post-controllers"

const router = express.Router()

// / post

// get all posts from user
router.get("/user/:user_id", postControllers.getAllUserPosts)

// get single post
router.get("/:post_id", postControllers.getSinglePost)

// create post
router.post("/", postControllers.createPost)

// edit post
router.patch("/:post_id", postControllers.editPost)

// COMMENTS

// comment on post
router.post("/:post_id/comment", postControllers.commentOnPost)

// edit comment on post
router.patch("/:post_id/comment/:comment_id", postControllers.editCommentOnPost)

// remove comment
router.delete("/:post_id/comment/:comment_id", postControllers.deletePostComment)

// LIKES

// like post
router.post("/:post_id/like", postControllers.likePost)

// remove like
router.delete("/:post_id/unlike", postControllers.unlikePost)

// DELETE

// delete post
router.delete("/:post_id", postControllers.deletePost)

module.exports = router