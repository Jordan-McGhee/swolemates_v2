import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
import { QueryResult } from "pg";
import { createNotification, getUserInfo, getUserIdFromFirebaseUid } from "../util/util";

// types import
import { UserInfo } from "../types/types";

// blank function
// export const fnName = async (req: Request, res: Response, next: NextFunction) => {}  

// GROUP
// Create a new group
export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });
    }

    const { group_name, description, is_private } = req.body;

    if (!group_name || group_name.trim().length < 3) {
        return res.status(400).json({ message: "Group name must be at least 3 characters long." });
    }

    if (!description || description.trim().length < 10) {
        return res.status(400).json({ message: "Group description must be at least 10 characters long." });
    }

    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            return res.status(401).json({ message: "User not found." });
        }

        await client.query("BEGIN");

        // Check for unique group name
        const normalizedName = group_name.trim().toLowerCase();
        const checkName = await client.query(
            `SELECT group_id FROM groups WHERE LOWER(name) = LOWER($1);`,
            [normalizedName]
        );
        if (checkName.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Group name is already taken." });
        }

        // Insert the group
        const groupRes = await client.query(
            `INSERT INTO groups (creator_id, name, description, is_private, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *;`,
            [user_id, group_name, description, is_private]
        );
        const group = groupRes.rows[0];

        // Add creator to group_members as admin/mod
        await client.query(
            `INSERT INTO group_members (user_id, group_id, is_admin, is_mod, joined_at)
        VALUES ($1, $2, TRUE, TRUE, NOW());`,
            [user_id, group.group_id]
        );

        await client.query("COMMIT");

        return res.status(201).json({ message: "Group created successfully.", group });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error creating group:", error);
        return res.status(500).json({ message: "Error creating group. Please try again later." });
    } finally {
        client.release();
    }
};

// Get all groups (optional: with search, pagination)
export const getAllGroups = async (req: Request, res: Response, next: NextFunction) => {
    const { search, page = 1, limit = 25 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
        let query = `SELECT * FROM groups ORDER BY created_at DESC LIMIT $1 OFFSET $2;`;
        let params: any[] = [limit, offset];

        if (search) {
            query = `SELECT * FROM groups WHERE name ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;`;
            params = [`%${search}%`, limit, offset];
        }

        const result: QueryResult = await pool.query(query, params);
        return res.status(200).json({ groups: result.rows });
    } catch (error) {
        console.error("Error fetching groups:", error);
        return res.status(500).json({ message: "Error fetching groups. Please try again later." });
    }
};

// Get single group by ID
export const getSingleGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;

    try {
        const query = `SELECT * FROM groups WHERE group_id = $1;`;
        const result: QueryResult = await pool.query(query, [group_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Group not found." });
        }

        return res.status(200).json({ group: result.rows[0] });
    } catch (error) {
        console.error("Error fetching group:", error);
        return res.status(500).json({ message: "Error fetching group. Please try again later." });
    }
};


// Update group details (only for group admin/moderators)
export const updateGroup = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });
    }

    const { group_id } = req.params;
    const { group_name, description } = req.body;

    // Validate group name and description before DB operations
    if (!group_name || group_name.trim().length < 3) {
        return res.status(400).json({ message: "Group name must be at least 3 characters long." });
    }

    if (!description || description.trim().length < 10) {
        return res.status(400).json({ message: "Group description must be at least 10 characters long." });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            await client.query("ROLLBACK");
            return res.status(401).json({ message: "User not found." });
        }

        // Check if user is an admin or moderator
        const membershipRes = await client.query(
            ` SELECT is_admin, is_mod FROM group_members WHERE user_id = $1 AND group_id = $2; `,
            [user_id, group_id]
        );

        if (
            membershipRes.rows.length === 0 ||
            (!membershipRes.rows[0].is_admin && !membershipRes.rows[0].is_mod)
        ) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "You do not have permission to update this group." });
        }

        const normalizedGroupName = group_name.trim().toLowerCase();

        // Check if another group already has this name
        const checkNameRes = await client.query(
            ` SELECT group_id FROM groups WHERE LOWER(name) = LOWER($1) AND group_id <> $2; `,
            [normalizedGroupName, group_id]
        );

        if (checkNameRes.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Group name is already taken." });
        }

        // Update the group
        const updateRes = await client.query(
            ` UPDATE groups SET name = $1, description = $2, updated_at = NOW() WHERE group_id = $3
      RETURNING *; `,
            [group_name, description, group_id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Group details updated successfully.",
            group: updateRes.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error updating group:", error);
        return res.status(500).json({ message: "Error updating group. Please try again later." });
    } finally {
        client.release();
    }
};

// Change group privacy (only for group admin/moderators)
export const changeGroupPrivacy = async (req: Request, res: Response) => {
    const { group_id } = req.params;
    const firebase_uid = req.user?.uid;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID" });
    }

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check permissions
        const checkMembershipQuery = `
            SELECT is_admin, is_mod FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const membershipRes = await pool.query(checkMembershipQuery, [user_id, group_id]);

        const member = membershipRes.rows[0];
        if (!member || (!member.is_admin && !member.is_mod)) {
            return res.status(403).json({ message: "You do not have permission to change this group's privacy settings." });
        }

        // Fetch current privacy status
        const currentPrivacyRes = await pool.query(
            `SELECT is_private FROM groups WHERE group_id = $1;`,
            [group_id]
        );
        if (currentPrivacyRes.rows.length === 0) {
            return res.status(404).json({ message: "Group not found." });
        }

        const currentPrivacy = currentPrivacyRes.rows[0].is_private;
        const newPrivacy = !currentPrivacy;

        // Update
        const updatePrivacyRes = await pool.query(
            `UPDATE groups SET is_private = $1, updated_at = NOW()
             WHERE group_id = $2 RETURNING *;`,
            [newPrivacy, group_id]
        );

        return res.status(200).json({
            message: `Group privacy updated to ${newPrivacy}.`,
            group: updatePrivacyRes.rows[0]
        });
    } catch (error) {
        console.error("Error changing group privacy:", error);
        return res.status(500).json({ message: "Error changing group privacy. Please try again later." });
    }
};

// Delete group (only for group admin)
export const deleteGroup = async (req: Request, res: Response) => {
    const { group_id } = req.params;
    const firebase_uid = req.user?.uid;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        await client.query('BEGIN');

        // Check admin permissions
        const adminRes = await client.query(
            `SELECT is_admin FROM group_members WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );

        if (adminRes.rows.length === 0 || !adminRes.rows[0].is_admin) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: "You do not have permission to delete this group." });
        }

        // Delete memberships
        await client.query(`DELETE FROM group_members WHERE group_id = $1;`, [group_id]);

        // Delete join requests
        await client.query(`DELETE FROM group_join_requests WHERE group_id = $1;`, [group_id]);

        // Delete group
        const deletedGroupRes = await client.query(
            `DELETE FROM groups WHERE group_id = $1 RETURNING *;`,
            [group_id]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            message: "Group deleted successfully.",
            deletedGroup: deletedGroupRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error deleting group:", error);
        return res.status(500).json({ message: "Error deleting group. Please try again later." });
    } finally {
        client.release();
    }
};



// Get all posts in a group
export const getGroupPosts = async (req: Request, res: Response) => {
    const { group_id } = req.params;

    try {
        const postsRes = await pool.query(
            `SELECT * FROM post_with_likes_comments WHERE group_id = $1 ORDER BY created_at DESC;`,
            [group_id]
        );

        return res.status(200).json({
            message: "Group posts retrieved successfully.",
            posts: postsRes.rows
        });
    } catch (error) {
        console.error("Error fetching group posts:", error);
        return res.status(500).json({ message: "Error fetching group posts. Please try again later." });
    }
};


// Create a post in a group
export const createGroupPost = async (req: Request, res: Response) => {
    const { group_id } = req.params;
    const { content, image_url, workout_id } = req.body;
    const firebase_uid = req.user?.uid;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Post content cannot be empty." });
    }

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if group exists
        const groupRes = await pool.query(
            `SELECT group_id FROM groups WHERE group_id = $1;`,
            [group_id]
        );
        if (groupRes.rows.length === 0) {
            return res.status(404).json({ message: `Group #${group_id} not found.` });
        }

        // Check membership
        const membershipRes = await pool.query(
            `SELECT 1 FROM group_members WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );
        if (membershipRes.rows.length === 0) {
            return res.status(403).json({ message: "You must be a member of this group to post." });
        }

        // If workout_id provided, validate workout exists
        if (workout_id) {
            const workoutRes = await pool.query(
                `SELECT workout_id FROM workouts WHERE workout_id = $1;`,
                [workout_id]
            );
            if (workoutRes.rows.length === 0) {
                return res.status(404).json({ message: `Workout #${workout_id} not found.` });
            }
        }

        // Create post
        const newPostRes = await pool.query(
            `
            INSERT INTO posts (user_id, content, image_url, workout_id, group_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *;
            `,
            [
                user_id,
                content.trim(),
                image_url ?? null,
                workout_id ?? null,
                group_id
            ]
        );

        return res.status(201).json({
            message: "Post created successfully.",
            post: newPostRes.rows[0]
        });
    } catch (error) {
        console.error("Error creating post in group:", error);
        return res.status(500).json({ message: "Error creating post. Please try again later." });
    }
};


// Edit a post in a group
export const editGroupPost = async (req: Request, res: Response) => {
    const { post_id } = req.params;
    const { content, image_url, workout_id } = req.body;
    const firebase_uid = req.user?.uid;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Post content cannot be empty." });
    }

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Get post and validate ownership
        const postRes = await pool.query(
            `SELECT user_id, workout_id FROM posts WHERE post_id = $1;`,
            [post_id]
        );

        if (postRes.rows.length === 0) {
            return res.status(404).json({ message: "Post not found." });
        }

        const postOwnerId = postRes.rows[0].user_id;
        const currentWorkoutId = postRes.rows[0].workout_id;

        if (postOwnerId !== user_id) {
            return res.status(403).json({ message: "You do not have permission to edit this post." });
        }

        // If workout changed, validate new workout
        if (workout_id && workout_id !== currentWorkoutId) {
            const workoutRes = await pool.query(
                `SELECT workout_id FROM workouts WHERE workout_id = $1;`,
                [workout_id]
            );

            if (workoutRes.rows.length === 0) {
                return res.status(400).json({ message: "Invalid workout ID. Workout does not exist." });
            }
        }

        // Update post
        const updatedPostRes = await pool.query(
            `
            UPDATE posts
            SET content = $1, image_url = $2, workout_id = $3, updated_at = NOW()
            WHERE post_id = $4
            RETURNING *;
            `,
            [content.trim(), image_url ?? null, workout_id ?? null, post_id]
        );

        return res.status(200).json({
            message: "Post updated successfully.",
            post: updatedPostRes.rows[0]
        });
    } catch (error) {
        console.error("Error updating post:", error);
        return res.status(500).json({ message: "Error updating post. Please try again later." });
    }
};


// delete a post in a group (post owner/admin/mods only)
export const deleteGroupPost = async (req: Request, res: Response) => {
    const { group_id, post_id } = req.params;
    const firebase_uid = req.user?.uid;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        const senderInfo: UserInfo = await getUserInfo(user_id);

        await client.query("BEGIN");

        // Get post owner
        const postRes = await client.query(
            `SELECT user_id FROM posts WHERE post_id = $1;`,
            [post_id]
        );

        if (postRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Post not found." });
        }

        const postOwnerId = postRes.rows[0].user_id;

        // Check admin/mod permissions
        const adminModRes = await client.query(
            `SELECT is_admin, is_mod FROM group_members_view WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );

        const isAdminOrMod =
            adminModRes.rows.length > 0 &&
            (adminModRes.rows[0].is_admin || adminModRes.rows[0].is_mod);

        if (postOwnerId !== user_id && !isAdminOrMod) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "You are not authorized to delete this post." });
        }

        // Delete likes
        await client.query(`DELETE FROM likes WHERE post_id = $1;`, [post_id]);

        // Delete comments
        await client.query(`DELETE FROM comments WHERE post_id = $1;`, [post_id]);

        // Delete post
        const deletePostRes = await client.query(
            `DELETE FROM posts WHERE post_id = $1 RETURNING *;`,
            [post_id]
        );

        // Notify post owner if deleted by admin/mod
        if (isAdminOrMod && postOwnerId !== user_id) {
            await createNotification({
                sender_id: senderInfo.user_id,
                sender_username: senderInfo.username,
                sender_profile_pic: senderInfo.profile_pic ?? '',
                receiver_id: postOwnerId,
                type: "group_change",
                message: `Your post was removed by a group admin or moderator.`,
                reference_type: "group",
                reference_id: Number(group_id),
                client
            });
        }

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Post deleted successfully.",
            post: deletePostRes.rows[0]
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error deleting post:", error);
        return res.status(500).json({ message: "Error deleting post. Please try again later." });
    } finally {
        client.release();
    }
};



// GROUP MEMBERSHIP
// invite a user to a group
export const inviteUserToGroup = async (req: Request, res: Response) => {
    const { group_id, invited_user_id } = req.params;
    const firebase_uid = req.user?.uid;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        const inviterInfo: UserInfo = await getUserInfo(user_id);

        await client.query("BEGIN");

        // Validate inviter membership and get group name
        const groupRes = await client.query(
            `SELECT name FROM groups WHERE group_id = $1;`,
            [group_id]
        );

        if (groupRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Group does not exist." });
        }

        const groupName = groupRes.rows[0].name;

        const membershipRes = await client.query(
            `SELECT 1 FROM group_members WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );

        if (membershipRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "You must be a member of the group to invite others." });
        }

        // Check if user is already a member
        const existingMemberRes = await client.query(
            `SELECT 1 FROM group_members WHERE user_id = $1 AND group_id = $2;`,
            [invited_user_id, group_id]
        );

        if (existingMemberRes.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "User is already a member of the group." });
        }

        // Check for pending invitation
        const pendingRes = await client.query(
            `SELECT 1 FROM group_join_requests WHERE user_id = $1 AND group_id = $2 AND status = 'pending';`,
            [invited_user_id, group_id]
        );

        if (pendingRes.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "User already has a pending invitation or request." });
        }

        // Validate invited user exists
        const invitedUserRes = await client.query(
            `SELECT user_id, username, profile_pic FROM users WHERE user_id = $1;`,
            [invited_user_id]
        );

        if (invitedUserRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "User does not exist." });
        }

        const invitedUser = invitedUserRes.rows[0];

        // Create invitation
        const inviteRes = await client.query(
            `
            INSERT INTO group_join_requests (user_id, group_id, status, is_invite, requested_at, updated_at)
            VALUES ($1, $2, 'pending', true, NOW(), NOW())
            RETURNING *;
            `,
            [invited_user_id, group_id]
        );

        // Notify invited user
        await createNotification({
            sender_id: inviterInfo.user_id,
            sender_username: inviterInfo.username,
            sender_profile_pic: inviterInfo.profile_pic ?? '',
            receiver_id: invitedUser.user_id,
            receiver_username: invitedUser.username,
            receiver_profile_pic: invitedUser.profile_pic ?? null,
            type: "group_invite",
            message: `${invitedUser.username}, you have been invited to join ${groupName}.`,
            reference_type: "group",
            reference_id: Number(group_id),
            client
        });

        await client.query("COMMIT");

        return res.status(200).json({
            message: "User invited successfully.",
            invite: inviteRes.rows[0]
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error inviting user to group:", error);
        return res.status(500).json({ message: "Error inviting user. Please try again later." });
    } finally {
        client.release();
    }
};



// get all members of a group, sorted with admins first, then mods, then regular members
export const getGroupMembers = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;

    try {
        const query = ` SELECT user_id, username, profile_pic, is_admin, is_mod, joined_at FROM group_members_view WHERE group_id = $1;
    `;
        const membersRes = await pool.query(query, [group_id]);
        return res.status(200).json({ members: membersRes.rows });
    } catch (error) {
        console.error('Error fetching group members:', error);
        return res.status(500).json({ message: 'Error fetching group members. Please try again later.' });
    }
};

// Join group
export const joinGroup = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: 'Unauthorized: Firebase UID not found.' });
    }
    const { group_id } = req.params;

    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            client.release();
            return res.status(401).json({ message: 'User not found.' });
        }

        await client.query('BEGIN');

        // Check if user is already a member
        const membershipRes = await client.query(
            `SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );
        if (membershipRes.rows.length > 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: 'You are already a member of this group.' });
        }

        // Check group existence and privacy
        const groupRes = await client.query(`SELECT is_private FROM groups WHERE group_id = $1;`, [group_id]);
        if (groupRes.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: 'Group not found.' });
        }

        const isPrivate = groupRes.rows[0].is_private;

        if (isPrivate) {
            // Check if join request already exists
            const requestRes = await client.query(
                `SELECT * FROM group_join_requests WHERE user_id = $1 AND group_id = $2;`,
                [user_id, group_id]
            );
            if (requestRes.rows.length > 0) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(400).json({ message: 'You have already requested to join this group. Please wait for admin/mod to respond.' });
            }

            // Insert join request
            const newRequestRes = await client.query(
                `INSERT INTO group_join_requests (user_id, group_id, status, requested_at, updated_at)
         VALUES ($1, $2, 'pending', NOW(), NOW()) RETURNING *;`,
                [user_id, group_id]
            );

            await client.query('COMMIT');
            client.release();
            return res.status(200).json({ message: 'Join request sent.', request: newRequestRes.rows[0] });
        } else {
            // Public group - add user immediately
            const newMemberRes = await client.query(
                `INSERT INTO group_members (user_id, group_id, is_admin, is_mod, joined_at)
         VALUES ($1, $2, false, false, NOW()) RETURNING *;`,
                [user_id, group_id]
            );

            await client.query('COMMIT');
            client.release();
            return res.status(201).json({ message: 'Joined group successfully.', member: newMemberRes.rows[0] });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        console.error('Error joining group:', error);
        return res.status(500).json({ message: 'Error joining group. Please try again later.' });
    }
};

// Remove join request
export const removeJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: 'Unauthorized: Firebase UID not found.' });
    }
    const { group_id } = req.params;

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            return res.status(401).json({ message: 'User not found.' });
        }

        const joinRequestQuery = `
      SELECT * FROM group_join_requests WHERE user_id = $1 AND group_id = $2 AND status = 'pending';
    `;
        const joinRequestRes = await pool.query(joinRequestQuery, [user_id, group_id]);

        if (joinRequestRes.rows.length === 0) {
            return res.status(400).json({ message: 'No join request found.' });
        }

        if (joinRequestRes.rows[0].user_id !== user_id) {
            return res.status(403).json({ message: "You aren't authorized to delete this request." });
        }

        const deleteJoinRequestQuery = `
      DELETE FROM group_join_requests WHERE user_id = $1 AND group_id = $2 RETURNING *;
    `;
        const deleteJoinRequestRes = await pool.query(deleteJoinRequestQuery, [user_id, group_id]);

        return res.status(200).json({ message: 'Join request deleted successfully!', deletedRequest: deleteJoinRequestRes.rows[0] });
    } catch (error) {
        console.error('Error deleting join request:', error);
        return res.status(500).json({ message: 'Error deleting join request. Please try again later.' });
    }
};

// User accept group invite
export const userAcceptGroupInvite = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: 'Unauthorized: Firebase UID not found.' });
    }
    const { group_id, request_id } = req.params;

    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            client.release();
            return res.status(401).json({ message: 'User not found.' });
        }

        await client.query('BEGIN');

        const checkRequestQuery = ` SELECT user_id FROM group_join_requests  WHERE request_id = $1 AND group_id = $2 AND status = 'pending' AND is_invite = true;
    `;
        const requestRes = await client.query(checkRequestQuery, [request_id, group_id]);

        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: 'Invitation not found or already processed.' });
        }

        if (requestRes.rows[0].user_id !== user_id) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(403).json({ message: 'You are not authorized to accept this invitation.' });
        }

        const updateRequestQuery = ` UPDATE group_join_requests SET status = 'accepted', updated_at = NOW()
      WHERE request_id = $1 RETURNING *;
    `;
        const updateRequestRes = await client.query(updateRequestQuery, [request_id]);

        const addMemberQuery = ` INSERT INTO group_members (user_id, group_id, is_admin, is_mod, joined_at)
      VALUES ($1, $2, false, false, NOW()) RETURNING *;
    `;
        const addMemberRes = await client.query(addMemberQuery, [user_id, group_id]);

        await client.query('COMMIT');
        client.release();

        return res.status(200).json({
            message: 'Invitation accepted successfully.',
            updated_request: updateRequestRes.rows[0],
            added_member: addMemberRes.rows[0],
        });
    } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        console.error('Error accepting group invitation:', error);
        return res.status(500).json({ message: 'Error accepting group invitation. Please try again later.' });
    }
};

// User deny group invite
export const userDenyGroupInvite = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: 'Unauthorized: Firebase UID not found.' });
    }
    const { group_id, request_id } = req.params;

    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            client.release();
            return res.status(401).json({ message: 'User not found.' });
        }

        await client.query('BEGIN');

        const checkRequestQuery = ` SELECT user_id FROM group_join_requests  WHERE request_id = $1 AND group_id = $2 AND status = 'pending' AND is_invite = true;
    `;
        const requestRes = await client.query(checkRequestQuery, [request_id, group_id]);

        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: 'Invitation not found or already processed.' });
        }

        if (requestRes.rows[0].user_id !== user_id) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(403).json({ message: 'You are not authorized to deny this invitation.' });
        }

        const deleteJoinRequestQuery = `
      DELETE FROM group_join_requests WHERE request_id = $1 RETURNING *;
    `;
        const deleteJoinRequestRes = await client.query(deleteJoinRequestQuery, [request_id]);

        await client.query('COMMIT');
        client.release();

        return res.status(200).json({
            message: 'Invitation denied successfully.',
            deleted_request: deleteJoinRequestRes.rows[0],
        });
    } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        console.error('Error denying group invitation:', error);
        return res.status(500).json({ message: 'Error denying group invitation. Please try again later.' });
    }
};

// Leave group
export const leaveGroup = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });

    const { group_id } = req.params;
    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            client.release();
            return res.status(401).json({ message: "User not found." });
        }

        await client.query("BEGIN");

        const membershipRes = await client.query(
            `SELECT is_admin FROM group_members WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );
        if (membershipRes.rows.length === 0) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(400).json({ message: "You are not a member of this group." });
        }
        if (membershipRes.rows[0].is_admin) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(403).json({ message: "Admin cannot leave the group. Transfer ownership or delete the group first." });
        }

        await client.query(`DELETE FROM group_join_requests WHERE user_id = $1 AND group_id = $2;`, [user_id, group_id]);
        const leaveRes = await client.query(
            `DELETE FROM group_members WHERE user_id = $1 AND group_id = $2 RETURNING *;`,
            [user_id, group_id]
        );

        await client.query("COMMIT");
        client.release();
        return res.status(200).json({ message: "Left the group successfully.", leftMember: leaveRes.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        client.release();
        console.error("Error leaving group:", error);
        return res.status(500).json({ message: "Error leaving group. Please try again later." });
    }
};

// Get all pending join requests (admin/mods only)
export const getPendingJoinRequests = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });

    const { group_id } = req.params;

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) return res.status(401).json({ message: "User not found." });

        const permissionsRes = await pool.query(
            `SELECT is_admin, is_mod FROM group_members WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );

        if (
            permissionsRes.rows.length === 0 ||
            (!permissionsRes.rows[0].is_admin && !permissionsRes.rows[0].is_mod)
        ) {
            return res.status(403).json({ message: "You are not authorized to view join requests." });
        }

        const joinRequestsRes = await pool.query(
            `SELECT * FROM group_pending_requests_view WHERE group_id = $1 AND status = 'pending' AND is_invite = false;`,
            [group_id]
        );

        return res.status(200).json({ pending_join_requests: joinRequestsRes.rows });
    } catch (error) {
        console.error("Error fetching pending join requests:", error);
        return res.status(500).json({ message: "Error fetching join requests. Please try again later." });
    }
};

// Accept join request (admin/mods only)
export const acceptJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });

    const { group_id, request_id } = req.params;
    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            client.release();
            return res.status(401).json({ message: "User not found." });
        }

        await client.query("BEGIN");

        const permissionsRes = await client.query(
            `SELECT * FROM group_members_view WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );
        if (
            permissionsRes.rows.length === 0 ||
            (!permissionsRes.rows[0].is_admin && !permissionsRes.rows[0].is_mod)
        ) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(403).json({ message: "You are not authorized to accept this request." });
        }

        const requestRes = await client.query(
            `SELECT * FROM group_join_requests WHERE request_id = $1 AND group_id = $2 AND status = 'pending' AND is_invite = false;`,
            [request_id, group_id]
        );
        if (requestRes.rows.length === 0) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(404).json({ message: "Join request not found or already processed." });
        }

        const joiningUserInfo = await getUserInfo(requestRes.rows[0].user_id, client);

        const updateRequestRes = await client.query(
            `UPDATE group_join_requests SET status = 'approved', updated_at = NOW() WHERE request_id = $1 RETURNING *;`,
            [request_id]
        );

        await client.query(
            `INSERT INTO group_members (user_id, group_id, is_admin, is_mod, joined_at) VALUES ($1, $2, false, false, NOW());`,
            [requestRes.rows[0].user_id, group_id]
        );

        const notificationMessage = `${joiningUserInfo.username}, your request to join ${permissionsRes.rows[0].group_name} has been accepted!`;
        await createNotification({
            sender_id: user_id,
            sender_username: permissionsRes.rows[0].username,
            sender_profile_pic: permissionsRes.rows[0].profile_pic,
            receiver_id: requestRes.rows[0].user_id,
            receiver_username: joiningUserInfo.username,
            receiver_profile_pic: joiningUserInfo.profile_pic ?? null,
            type: "group_invite",
            message: notificationMessage,
            reference_type: "group",
            reference_id: Number(group_id),
            client,
        });

        await client.query("COMMIT");
        client.release();

        return res.status(200).json({ message: "Join request accepted successfully.", updated_request: updateRequestRes.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        client.release();
        console.error("Error accepting join request:", error);
        return res.status(500).json({ message: "Error accepting join request. Please try again later." });
    }
};

// Deny join request (admin/mods only)
export const denyJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });

    const { group_id, request_id } = req.params;
    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            client.release();
            return res.status(401).json({ message: "User not found." });
        }

        await client.query("BEGIN");

        const permissionsRes = await client.query(
            `SELECT * FROM group_members_view WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );
        if (
            permissionsRes.rows.length === 0 ||
            (!permissionsRes.rows[0].is_admin && !permissionsRes.rows[0].is_mod)
        ) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(403).json({ message: "You are not authorized to deny this request." });
        }

        const requestRes = await client.query(
            `SELECT * FROM group_join_requests WHERE request_id = $1 AND group_id = $2 AND status = 'pending' AND is_invite = false;`,
            [request_id, group_id]
        );
        if (requestRes.rows.length === 0) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(404).json({ message: "Join request not found or already processed." });
        }

        const deniedUserInfo = await getUserInfo(requestRes.rows[0].user_id, client);

        const deleteJoinRequestRes = await client.query(
            `DELETE FROM group_join_requests WHERE request_id = $1 AND group_id = $2 RETURNING *;`,
            [request_id, group_id]
        );

        const notificationMessage = `${deniedUserInfo.username}, your request to join ${permissionsRes.rows[0].group_name} has been denied.`;
        await createNotification({
            sender_id: user_id,
            sender_username: permissionsRes.rows[0].username,
            sender_profile_pic: permissionsRes.rows[0].profile_pic,
            receiver_id: requestRes.rows[0].user_id,
            receiver_username: deniedUserInfo.username,
            receiver_profile_pic: deniedUserInfo.profile_pic ?? null,
            type: "group_invite",
            message: notificationMessage,
            reference_type: "group",
            reference_id: Number(group_id),
            client,
        });

        await client.query("COMMIT");
        client.release();

        return res.status(200).json({ message: "Join request denied successfully.", updated_request: deleteJoinRequestRes.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        client.release();
        console.error("Error denying join request:", error);
        return res.status(500).json({ message: "Error denying join request. Please try again later." });
    }
};

// Remove a member from a group (admin/mods only)
export const removeGroupMember = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });

    const { group_id, member_id } = req.params;
    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            client.release();
            return res.status(401).json({ message: "User not found." });
        }

        await client.query("BEGIN");

        const permissionsRes = await client.query(
            `SELECT * FROM group_members_view WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );
        if (
            permissionsRes.rows.length === 0 ||
            (!permissionsRes.rows[0].is_admin && !permissionsRes.rows[0].is_mod)
        ) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(403).json({ message: "You are not authorized to remove members from this group." });
        }

        const memberRes = await client.query(
            `SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2;`,
            [member_id, group_id]
        );
        if (memberRes.rows.length === 0) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(404).json({ message: "Member not found in the group." });
        }

        const deleteJoinRequestRes = await client.query(
            `DELETE FROM group_join_requests WHERE user_id = $1 AND group_id = $2 RETURNING *;`,
            [member_id, group_id]
        );
        if (deleteJoinRequestRes.rows.length === 0) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(404).json({ message: "Join request not found." });
        }

        const removedMemberRes = await client.query(
            `DELETE FROM group_members WHERE user_id = $1 AND group_id = $2 RETURNING *;`,
            [member_id, group_id]
        );

        const notificationMessage = `${permissionsRes.rows[0].username} removed you from ${permissionsRes.rows[0].group_name}.`;
        await createNotification({
            sender_id: user_id,
            sender_username: permissionsRes.rows[0].username,
            sender_profile_pic: permissionsRes.rows[0].profile_pic,
            receiver_id: Number(member_id),
            type: "group_change",
            message: notificationMessage,
            reference_type: "group",
            reference_id: Number(group_id),
            client,
        });

        await client.query("COMMIT");
        client.release();

        return res.status(200).json({ message: "Member removed successfully.", removed_member: removedMemberRes.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        client.release();
        console.error("Error removing member:", error);
        return res.status(500).json({ message: "Error removing member. Please try again later." });
    }
};

// Promote to moderator (admin only)
export const promoteToModerator = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });

    const { group_id, member_id } = req.params;
    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            client.release();
            return res.status(401).json({ message: "User not found." });
        }

        await client.query("BEGIN");

        const permissionsRes = await client.query(
            `SELECT * FROM group_members_view WHERE user_id = $1 AND group_id = $2;`,
            [user_id, group_id]
        );
        if (permissionsRes.rows.length === 0 || !permissionsRes.rows[0].is_admin) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(403).json({ message: "You are not authorized to promote members to moderator." });
        }

        const memberRes = await client.query(
            `SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2;`,
            [member_id, group_id]
        );
        if (memberRes.rows.length === 0) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(404).json({ message: "Member not found in the group." });
        }

        const promoteRes = await client.query(
            `UPDATE group_members SET is_mod = TRUE WHERE user_id = $1 AND group_id = $2 RETURNING *;`,
            [member_id, group_id]
        );

        const notificationMessage = `${permissionsRes.rows[0].username} has promoted you to a moderator in ${permissionsRes.rows[0].group_name}!`;
        await createNotification({
            sender_id: user_id,
            sender_username: permissionsRes.rows[0].username,
            sender_profile_pic: permissionsRes.rows[0].profile_pic,
            receiver_id: Number(member_id),
            type: "group_change",
            message: notificationMessage,
            reference_type: "group",
            reference_id: Number(group_id),
            client,
        });

        await client.query("COMMIT");
        client.release();

        return res.status(200).json({ message: "Member promoted to moderator successfully.", promoted_member: promoteRes.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        client.release();
        console.error("Error promoting member to moderator:", error);
        return res.status(500).json({ message: "Error promoting member to moderator. Please try again later." });
    }
};


// demote a moderator to a regular member (admin only)
export const demoteModerator = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, member_id } = req.params;

    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            await client.query('ROLLBACK');
            return res.status(401).json({ message: "User not found." });
        }

        // Check if the requesting user is an admin
        const checkPermissionsQuery = `
            SELECT * FROM group_members_view WHERE user_id = $1 AND group_id = $2;
        `;
        const permissionsRes: QueryResult = await client.query(checkPermissionsQuery, [user_id, group_id]);

        if (permissionsRes.rows.length === 0 || !permissionsRes.rows[0].is_admin) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: "You are not authorized to demote members." });
        }

        // Check if the user to be demoted is a moderator in the group
        const checkModQuery = `
            SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2 AND is_mod = true;
        `;
        const modRes: QueryResult = await client.query(checkModQuery, [member_id, group_id]);

        if (modRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User is not a moderator in this group.' });
        }

        // Demote the user to a regular member in the group_members table
        const demoteQuery = `
            UPDATE group_members SET is_mod = false WHERE user_id = $1 AND group_id = $2 RETURNING *;
        `;
        const demoteRes: QueryResult = await client.query(demoteQuery, [member_id, group_id]);

        // Create a notification for the user who was demoted
        const notificationMessage = `${permissionsRes.rows[0].username} has demoted you from a moderator to a regular member in ${permissionsRes.rows[0].group_name}.`;
        await createNotification({
            sender_id: user_id,
            sender_username: permissionsRes.rows[0].username,
            sender_profile_pic: permissionsRes.rows[0].profile_pic,
            receiver_id: Number(member_id),
            type: 'group_change',
            message: notificationMessage,
            reference_type: 'group',
            reference_id: Number(group_id),
            client
        });

        await client.query('COMMIT');

        return res.status(200).json({ message: 'Member demoted to regular member successfully.', demoted_member: demoteRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error demoting moderator:', error);
        return res.status(500).json({ message: 'Error demoting moderator. Please try again later.' });
    } finally {
        client.release();
    }
};

// grant admin status
export const promoteToAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, user_id: target_user_id } = req.params;

    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const admin_user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!admin_user_id) {
            await client.query('ROLLBACK');
            return res.status(401).json({ message: "Admin user not found." });
        }

        // Check if the requester is an admin
        const checkAdminQuery = `SELECT * FROM group_members_view WHERE user_id = $1 AND group_id = $2;`;
        const adminRes: QueryResult = await client.query(checkAdminQuery, [admin_user_id, group_id]);

        if (adminRes.rows.length === 0 || !adminRes.rows[0].is_admin) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You are not authorized to grant admin rights.' });
        }

        // Check if target user is in the group
        const checkMemberQuery = `SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2;`;
        const memberRes: QueryResult = await client.query(checkMemberQuery, [target_user_id, group_id]);

        if (memberRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User is not a member of this group.' });
        }

        // Grant admin & mod status
        const updateQuery = `
            UPDATE group_members 
            SET is_admin = TRUE, is_mod = TRUE 
            WHERE user_id = $1 AND group_id = $2 
            RETURNING *;
        `;
        const updateRes: QueryResult = await client.query(updateQuery, [target_user_id, group_id]);

        // Fetch promoted user's info
        let promotedUserInfo: any;
        try {
            promotedUserInfo = await getUserInfo(Number(target_user_id), client);
        } catch (error) {
            await client.query('ROLLBACK');
            return res.status(500).json({ message: "Failed to fetch promoted user's info." });
        }

        // Create a notification
        const notificationMessage = `${promotedUserInfo.username}, you have been promoted to an admin in ${adminRes.rows[0].group_name}.`;
        await createNotification({
            sender_id: admin_user_id,
            sender_username: adminRes.rows[0].username,
            sender_profile_pic: adminRes.rows[0].profile_pic,
            receiver_id: Number(target_user_id),
            receiver_username: promotedUserInfo.username,
            receiver_profile_pic: promotedUserInfo.profile_pic ?? null,
            type: 'group_change',
            message: notificationMessage,
            reference_type: 'group',
            reference_id: Number(group_id),
            client
        });

        await client.query('COMMIT');

        return res.status(200).json({ message: 'User granted admin status successfully.', updatedMember: updateRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error granting admin status:', error);
        return res.status(500).json({ message: 'Error granting admin status. Please try again later.' });
    } finally {
        client.release();
    }
};

// demote admin status
export const demoteAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, user_id: target_user_id } = req.params;

    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Firebase UID not found." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const admin_user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!admin_user_id) {
            await client.query('ROLLBACK');
            return res.status(401).json({ message: "Admin user not found." });
        }

        // Check if the requester is an admin
        const checkAdminQuery = `SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2;`;
        const adminRes: QueryResult = await client.query(checkAdminQuery, [admin_user_id, group_id]);

        if (adminRes.rows.length === 0 || !adminRes.rows[0].is_admin) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You are not authorized to remove admin rights.' });
        }

        // Check if target user is an admin
        const checkMemberQuery = `SELECT is_admin FROM group_members_view WHERE user_id = $1 AND group_id = $2;`;
        const memberRes: QueryResult = await client.query(checkMemberQuery, [target_user_id, group_id]);

        if (memberRes.rows.length === 0 || !memberRes.rows[0].is_admin) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'User is not an admin.' });
        }

        // Ensure there's at least one admin left
        const adminCountQuery = `SELECT COUNT(*) FROM group_members_view WHERE group_id = $1 AND is_admin = TRUE;`;
        const adminCountRes: QueryResult = await client.query(adminCountQuery, [group_id]);

        if (Number(adminCountRes.rows[0].count) <= 1) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Cannot remove the last admin. Please promote another user before demoting yourself.' });
        }

        // Remove admin status
        const updateQuery = `UPDATE group_members SET is_admin = FALSE WHERE user_id = $1 AND group_id = $2 RETURNING *;`;
        const updateRes: QueryResult = await client.query(updateQuery, [target_user_id, group_id]);

        // Fetch demoted user's info
        let demotedUserInfo: any;
        try {
            demotedUserInfo = await getUserInfo(Number(target_user_id), client);
        } catch (error) {
            await client.query('ROLLBACK');
            return res.status(500).json({ message: "Failed to fetch demoted user's info." });
        }

        // Create a notification
        const notificationMessage = `${demotedUserInfo.username}, you have been removed as an admin in ${adminRes.rows[0].group_name}.`;
        await createNotification({
            sender_id: admin_user_id,
            sender_username: adminRes.rows[0].username,
            sender_profile_pic: adminRes.rows[0].profile_pic,
            receiver_id: Number(target_user_id),
            receiver_username: demotedUserInfo.username,
            receiver_profile_pic: demotedUserInfo.profile_pic ?? null,
            type: 'group_change',
            message: notificationMessage,
            reference_type: 'group',
            reference_id: Number(group_id),
            client
        });

        await client.query('COMMIT');

        return res.status(200).json({ message: 'Admin rights removed successfully.', updatedMember: updateRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error removing admin status:', error);
        return res.status(500).json({ message: 'Error removing admin status. Please try again later.' });
    } finally {
        client.release();
    }
};
