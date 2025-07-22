const express = require("express")
import * as publicControllers from "../controllers/public-controllers"
import { checkGroupAccess } from "../middleware/checkGroupAccess"

const router = express.Router()

// /public

// availability checks
// check username
router.get("/checkUsername", publicControllers.checkUsername)

// check email
router.get("/checkEmail", publicControllers.checkEmail)

// check group name availability
router.get("/checkGroupName", publicControllers.checkGroupName)


// user routes
// get all users
router.get("/user/", publicControllers.getAllUsers)

// get single user
router.get("/user/:username", publicControllers.getSingleUser)

// get user's friends
router.get("/user/:username/friends", publicControllers.getUserFriends)

// post routes
// get all posts from user
router.get("/post/user/:username", publicControllers.getAllUserPosts)

// get single post
router.get("/post/:post_id", publicControllers.getSinglePost)

// workout routes
// get workouts by user
router.get("/workout/user/:username", publicControllers.getWorkoutsByUser)

// get single workout
router.get("/workout/:workout_id", publicControllers.getSingleWorkout)

// group routes
// get all groups (public)
router.get("/group", publicControllers.getAllGroups);

// get single group by ID (public if group is public or user is member)
router.get("/group/:group_name", checkGroupAccess, publicControllers.getSingleGroup);

// get all posts in a group (public if group is public or user is member)
router.get("/group/:group_name/posts", checkGroupAccess, publicControllers.getGroupPosts);

// get all members of a group (public if group is public or user is member)
router.get("/group/:group_name/members", checkGroupAccess, publicControllers.getGroupMembers);



module.exports = router