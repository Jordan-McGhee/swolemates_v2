const express = require("express")
// const { check } = require("express-validator")
import * as userControllers from "../controllers/user-controllers"

const router = express.Router()

// /user

// all users
router.get("/", userControllers.getAllUsers)

// get user
router.get("/:user_id", userControllers.getSingleUser)

// get user's friends
router.get("/:user_id/friends", userControllers.getUserFriends)

// sign up
// router.post(
//     "/signup",
//     [
//         check("email").normalizeEmail().isEmail().withMessage("Please use a valid email"),
//         check("username").isLength({ min: 4 }).withMessage("Username must be at least 4 characters long"),
//         check("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
//     ],
//     userControllers.signUp
// )

// log in
// router.post("/login", userControllers.login)

// change password
// router.patch("/:user_id/changePassword",
//     [
//         check("password").isLength({min: 8}).withMessage("Password must be at least 8 characters long")
//     ], 
//     userControllers.changePassword
// )

// check username
router.post("/checkUsername", userControllers.checkUsernameAvailability)

// update bio
router.patch("/:user_id/updateBio", userControllers.updateBio)

// delete account
// router.delete("/:user_id", userControllers.deleteAccount)


module.exports = router