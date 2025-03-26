const express = require("express")
import * as workoutControllers from "../controllers/workout-controllers"

const router = express.Router()

// /workout

// get workouts by user
router.get("/user/:user_id", workoutControllers.getWorkoutsByUser)

// get single workout
router.get("/:workout_id", workoutControllers.getSingleWorkout)

// create workout
router.post("/", workoutControllers.createWorkout)

// edit workout
router.patch("/:workout_id", workoutControllers.editWorkout)

// COMMENTS

// comment on workout
router.post("/:workout_id/comment", workoutControllers.commentOnWorkout)

// edit comment on workout
router.patch("/:workout_id/comment/:comment_id", workoutControllers.editCommentOnWorkout)

// delete comment on workout
router.delete("/:workout_id/comment/:comment_id", workoutControllers.deleteCommentOnWorkout)

// LIKES

// like workout
router.post("/:workout_id/like", workoutControllers.likeWorkout)

// unlike workout
router.delete("/:workout_id/unlike", workoutControllers.unlikeWorkout)

// DELETE

// delete workout
router.delete("/:workout_id", workoutControllers.deleteWorkout)

module.exports = router