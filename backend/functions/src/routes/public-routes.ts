const express = require("express")
import * as publicControllers from "../controllers/public-controllers"
import { checkGroupAccess } from "../middleware/checkGroupAccess"

const router = express.Router()

// /public

// check username
router.post("/checkUsername", publicControllers.checkUsername)

// check email
router.post("/checkEmail", publicControllers.checkEmail)


// user routes
// get all users
router.get("/user/", publicControllers.getAllUsers)

// get single user
router.get("/user/:user_id", publicControllers.getSingleUser)

// get user's friends
router.get("/user/:user_id/friends", publicControllers.getUserFriends)

// post routes
// get all posts from user
router.get("/post/user/:user_id", publicControllers.getAllUserPosts)

// get single post
router.get("/post/:post_id", publicControllers.getSinglePost)

// workout routes
// get workouts by user
router.get("/workout/user/:user_id", publicControllers.getWorkoutsByUser)

// get single workout
router.get("/workout/:workout_id", publicControllers.getSingleWorkout)

// group routes
// get all groups (public)
router.get("/group", publicControllers.getAllGroups);

// get single group by ID (public if group is public or user is member)
router.get("/group/:group_id", checkGroupAccess, publicControllers.getSingleGroup);

// get all posts in a group (public if group is public or user is member)
router.get("/group/:group_id/posts", checkGroupAccess, publicControllers.getGroupPosts);

// get all members of a group (public if group is public or user is member)
router.get("/group/:group_id/members", checkGroupAccess, publicControllers.getGroupMembers);



module.exports = router