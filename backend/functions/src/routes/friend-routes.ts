const express = require("express")
import * as friendControllers from "../controllers/friend-controllers"

const router = express.Router()

// /friend

// get all friend request
router.get("/:user_id", friendControllers.getAllUserFriendRequests)

// get all friend requests sent by user
router.get("/:user_id/sent", friendControllers.getAllUserSentRequests)

// get all friend requests received by user
router.get("/:user_id/received", friendControllers.getAllUserReceivedRequests)

// create friend request
router.post("/:receiver_id", friendControllers.createFriendRequest)

// accept friend request
router.put("/accept/:friend_request_id", friendControllers.acceptFriendRequest)

// deny friend reequrequestest
router.put("/deny/:friend_request_id", friendControllers.denyFriendRequest)

// cancel friend request
router.delete("/cancel/:friend_request_id", friendControllers.cancelFriendRequest)



module.exports = router