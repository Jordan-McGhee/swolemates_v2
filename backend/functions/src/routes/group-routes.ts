const express = require("express")
import * as groupControllers from "../controllers/group-controllers"

const router = express.Router()

// /group

// GROUP
// create a new group
router.post("/", groupControllers.createGroup);

// get all groups (optional: with search, pagination)
router.get("/", groupControllers.getAllGroups);

// get single group by ID
router.get("/:group_id", groupControllers.getSingleGroup);

// update group details (only for group admin/moderators)
router.put("/:group_id", groupControllers.updateGroup);

// change group privacy
router.put("/:group_id/privacy", groupControllers.changeGroupPrivacy);

// delete group (only for group admin)
router.delete("/:group_id", groupControllers.deleteGroup);

// POSTS
// get all posts in a group
router.get("/:group_id/posts", groupControllers.getGroupPosts);

// create a post in a group
router.post("/:group_id/posts", groupControllers.createGroupPost);

// edit post in group
router.put("/:group_id/posts/:post_id", groupControllers.editGroupPost);

// delete a post in a group (post owner/admin/mods only)
router.delete("/:group_id/posts/:post_id", groupControllers.deleteGroupPost);

// GROUP MEMBERSHIP

// USER ACTIONS
// get all members of a group
router.get("/:group_id/members", groupControllers.getGroupMembers);

// join group/request to join
router.post("/:group_id/join", groupControllers.joinGroup);

// user accept a group invitation
router.post("/:group_id/invite/accept-invite", groupControllers.userAcceptGroupInvite);

// user deny a group invitation
router.post("/:group_id/invite/deny-invite", groupControllers.userDenyGroupInvite);

// leave group
router.delete("/:group_id/leave", groupControllers.leaveGroup);

// MOD/ADMIN ACTIONS
// Invite a user to a group
router.post("/:group_id/invite/:invited_user_id", groupControllers.inviteUserToGroup);


// get all pending join requests
router.get("/:group_id/join-requests", groupControllers.getPendingJoinRequests);  

// accept a join request (admin/mod only)
router.post("/:group_id/join-request/accept", groupControllers.acceptGroupInvite);

// deny a join request (admin/mod only)
router.post("/:group_id/join-request/deny", groupControllers.denyGroupInvite);

// remove a member from a group (admin/mods only)
router.delete("/:group_id/members/:user_id", groupControllers.removeGroupMember);


// MANAGE MODERATORS
// promote a member to moderator (admin only)
router.patch("/:group_id/members/:user_id/promote", groupControllers.promoteToModerator);

// demote a moderator to a regular member (admin only)
router.patch("/:group_id/members/:user_id/demote", groupControllers.demoteModerator);


module.exports = router