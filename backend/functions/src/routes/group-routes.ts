const express = require("express")
import * as groupControllers from "../controllers/group-controllers"
import { checkGroupAccess } from "../middleware/checkGroupAccess";

const router = express.Router()

// /group

// GROUP
// create a new group
router.post("/", groupControllers.createGroup);

// get all groups (optional: with search, pagination)
router.get("/", groupControllers.getAllGroups);

// get single group by ID
router.get("/:group_id", checkGroupAccess, groupControllers.getSingleGroup);

// update group details (only for group admin/moderators)
router.put("/:group_id", groupControllers.updateGroup);

// change group privacy
router.put("/:group_id/privacy", groupControllers.changeGroupPrivacy);

// delete group (only for group admin)
router.delete("/:group_id", groupControllers.deleteGroup);

// POSTS
// get all posts in a group
router.get("/:group_id/posts", checkGroupAccess, groupControllers.getGroupPosts);

// create a post in a group
router.post("/:group_id/posts", groupControllers.createGroupPost);

// edit post in group
router.put("/:group_id/posts/:post_id", groupControllers.editGroupPost);

// delete a post in a group (post owner/admin/mods only)
router.delete("/:group_id/posts/:post_id", groupControllers.deleteGroupPost);

// GROUP MEMBERSHIP

// USER ACTIONS
// Invite a user to a group
router.post("/:group_id/invite/:invited_user_id", groupControllers.inviteUserToGroup);

// get all members of a group
router.get("/:group_id/members", checkGroupAccess, groupControllers.getGroupMembers);

// join group/request to join
router.post("/:group_id/join", groupControllers.joinGroup);

// remove request to join
router.delete("/:group_id/remove-request", groupControllers.removeJoinRequest)

// user accept a group invitation
router.post("/:group_id/invite/:request_id/accept-invite", groupControllers.userAcceptGroupInvite);

// user deny a group invitation
router.post("/:group_id/invite/:request_id/deny-invite", groupControllers.userDenyGroupInvite);

// leave group
router.delete("/:group_id/leave", groupControllers.leaveGroup);

// MOD/ADMIN ACTIONS
// get all pending join requests
router.get("/:group_id/join-requests", groupControllers.getPendingJoinRequests);  

// accept a join request (admin/mod only)
router.post("/:group_id/join-request/:request_id/accept", groupControllers.acceptJoinRequest);

// deny a join request (admin/mod only)
router.post("/:group_id/join-request/:request_id/deny", groupControllers.denyJoinRequest);

// remove a member from a group (admin/mods only)
router.delete("/:group_id/members/:member_id", groupControllers.removeGroupMember);


// MANAGE MODERATORS
// promote a member to moderator (admin only)
router.patch("/:group_id/members/:member_id/promote", groupControllers.promoteToModerator); 

// demote a moderator to a regular member (admin only)
router.patch("/:group_id/members/:member_id/demote", groupControllers.demoteModerator); 

// grant admin rights
router.patch('/:group_id/members/:user_id/promote-admin', groupControllers.promoteToAdmin); 

// remove admin rights
router.patch('/:group_id/members/:user_id/demote-admin', groupControllers.demoteAdmin); 

module.exports = router