import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
import { QueryResult } from "pg";
import { createNotification, getUserInfo } from "../util/util";

// blank function
// export const fnName = async (req: Request, res: Response, next: NextFunction) => {}  

// GROUP
// Create a new group
export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id, group_name, description, is_private } = req.body;

    // validate group name and description
    if (!group_name || group_name.trim().length < 3) {
        return res.status(400).json({ message: "Group name must be at least 3 characters long." });
    }

    if (!description || description.trim().length < 10) {
        return res.status(400).json({ message: "Group description must be at least 10 characters long." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Convert group name to lowercase for case-insensitive uniqueness check
        const normalizedGroupName = group_name.trim().toLowerCase();

        // Check if a group exists with the same (case-insensitive) name
        const checkGroupNameQuery = `
            SELECT group_id FROM groups WHERE LOWER(name) = LOWER($1);
        `;
        const checkGroupNameRes: QueryResult = await client.query(checkGroupNameQuery, [normalizedGroupName]);

        if (checkGroupNameRes.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: "Group name is already taken." });
        }

        // Insert new group
        const createGroupQuery = `
            INSERT INTO groups (creator_id, name, description, is_private, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *;
        `;
        const groupRes: QueryResult = await client.query(createGroupQuery, [user_id, group_name, description, is_private]);
        const group = groupRes.rows[0];

        // Insert creator into group_members as admin and moderator
        const addCreatorToGroupQuery = `
            INSERT INTO group_members (user_id, group_id, is_admin, is_mod, joined_at)
            VALUES ($1, $2, TRUE, TRUE, NOW());
        `;
        await client.query(addCreatorToGroupQuery, [user_id, group.group_id]);

        await client.query('COMMIT');

        return res.status(201).json({ message: 'Group created successfully.', group });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating group:', error);
        return res.status(500).json({ message: 'Error creating group. Please try again later.' });
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
        console.error('Error fetching groups:', error);
        return res.status(500).json({ message: 'Error fetching groups. Please try again later.' });
    }
};

// Get single group by ID
export const getSingleGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;

    try {
        const query = `SELECT * FROM groups WHERE group_id = $1;`;
        const result: QueryResult = await pool.query(query, [group_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        return res.status(200).json({ group: result.rows[0] });
    } catch (error) {
        console.error('Error fetching group:', error);
        return res.status(500).json({ message: 'Error fetching group. Please try again later.' });
    }
};


// Update group details (only for group admin/moderators)
export const updateGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;
    const { user_id, group_name, description } = req.body;

    // validate group name and description
    if (!group_name || group_name.trim().length < 3) {
        return res.status(400).json({ message: "Group name must be at least 3 characters long." });
    }

    if (!description || description.trim().length < 10) {
        return res.status(400).json({ message: "Group description must be at least 10 characters long." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if user is an admin or moderator
        const checkMembershipQuery = `
            SELECT is_admin, is_mod FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const membershipRes: QueryResult = await client.query(checkMembershipQuery, [user_id, group_id]);

        if (membershipRes.rows.length === 0 || (!membershipRes.rows[0].is_admin && !membershipRes.rows[0].is_mod)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You do not have permission to update this group.' });
        }

        // Convert group name to lowercase for case-insensitive uniqueness check
        const normalizedGroupName = group_name.trim().toLowerCase();

        // Check if another group already has this name (excluding the current group)
        const checkGroupNameQuery = `
            SELECT group_id FROM groups WHERE LOWER(name) = LOWER($1) AND group_id <> $2;
        `;
        const checkGroupNameRes: QueryResult = await client.query(checkGroupNameQuery, [normalizedGroupName, group_id]);

        if (checkGroupNameRes.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: "Group name is already taken." });
        }

        // Update group details
        const updateGroupQuery = `
            UPDATE groups SET name = $1, description = $2, updated_at = NOW()
            WHERE group_id = $3 RETURNING *;
        `;
        const updatedGroupRes: QueryResult = await client.query(updateGroupQuery, [group_name, description, group_id]);

        await client.query('COMMIT');

        return res.status(200).json({ message: 'Group details updated successfully.', group: updatedGroupRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating group:', error);
        return res.status(500).json({ message: 'Error updating group. Please try again later.' });
    } finally {
        client.release();
    }
};

// Change group privacy (only for group admin/moderators)
export const changeGroupPrivacy = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;

    // grab user id and group's current privacy status from body
    const { user_id, is_private } = req.body;

    try {
        // Check if user is an admin or moderator
        const checkMembershipQuery = `
            SELECT is_admin, is_mod FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const membershipRes: QueryResult = await pool.query(checkMembershipQuery, [user_id, group_id]);

        if (membershipRes.rows.length === 0 || (!membershipRes.rows[0].is_admin && !membershipRes.rows[0].is_mod)) {
            return res.status(403).json({ message: "You do not have permission to change this group’s privacy settings." });
        }

        // Update group privacy
        const updatePrivacyQuery = `
            UPDATE groups SET is_private = $1, updated_at = NOW()
            WHERE group_id = $2 RETURNING *;
        `;

        // update privacy to opposite of group's current privacy status
        const updatedGroupRes: QueryResult = await pool.query(updatePrivacyQuery, [!is_private, group_id]);

        return res.status(200).json({ message: `Group privacy updated to ${!is_private}.`, group: updatedGroupRes.rows[0] });
    } catch (error) {
        console.error('Error changing group privacy:', error);
        return res.status(500).json({ message: 'Error changing group privacy. Please try again later.' });
    }
};

// Delete group (only for group admin)
export const deleteGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;
    const { user_id } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if user is the group admin
        const checkAdminQuery = `
            SELECT is_admin FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const adminRes: QueryResult = await client.query(checkAdminQuery, [user_id, group_id]);

        if (adminRes.rows.length === 0 || !adminRes.rows[0].is_admin) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You do not have permission to delete this group.' });
        }

        // Delete all group memberships
        const deleteMembershipsQuery = `DELETE FROM group_members WHERE group_id = $1;`;
        await client.query(deleteMembershipsQuery, [group_id]);

        // delete all join requests
        const deleteGroupJoinRequestsQuery = `DELETE FROM group_join_requests WHERE group_id = $1 RETURNING *`
        await client.query(deleteGroupJoinRequestsQuery, [group_id])

        // Delete the group
        const deleteGroupQuery = `DELETE FROM groups WHERE group_id = $1 RETURNING *;`;
        const deletedGroupRes: QueryResult = await client.query(deleteGroupQuery, [group_id]);

        await client.query('COMMIT');

        return res.status(200).json({ message: 'Group deleted successfully.', deletedGroup: deletedGroupRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting group:', error);
        return res.status(500).json({ message: 'Error deleting group. Please try again later.' });
    } finally {
        client.release();
    }
};


// Get all posts in a group
export const getGroupPosts = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;

    try {
        const getPostsQuery = `
            SELECT * FROM posts WHERE group_id = $1 ORDER BY created_at DESC;
        `;
        const postsRes: QueryResult = await pool.query(getPostsQuery, [group_id]);

        return res.status(200).json({ message: 'Group posts retrieved successfully.', posts: postsRes.rows });
    } catch (error) {
        console.error('Error fetching group posts:', error);
        return res.status(500).json({ message: 'Error fetching group posts. Please try again later.' });
    }
};

// Create a post in a group
export const createGroupPost = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;
    const { user_id, content, image_url, workout_id } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Post content cannot be empty." });
    }

    try {
        // Check if the group exists
        const checkGroupQuery = "SELECT group_id FROM groups WHERE group_id = $1;";
        const checkGroupRes: QueryResult = await pool.query(checkGroupQuery, [group_id]);

        if (checkGroupRes.rows.length === 0) {
            return res.status(404).json({ message: `Group #${group_id} not found.` });
        }

        // Check if the user is a member of the group
        const checkMembershipQuery = `SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2;`;
        const membershipRes: QueryResult = await pool.query(checkMembershipQuery, [user_id, group_id]);

        if (membershipRes.rows.length === 0) {
            return res.status(403).json({ message: 'You must be a member of this group to post.' });
        }

        // if workout is provided, check it exists
        if (workout_id) {
            const checkWorkoutQuery = "SELECT * FROM workouts WHERE workout_id = $1";
            const checkWorkoutRes: QueryResult = await pool.query(checkWorkoutQuery, [workout_id]);

            if (checkWorkoutRes.rows.length === 0) {
                return res.status(404).json({ message: `Workout #${workout_id} not found.` });
            }
        }

        // Insert new post
        const createPostQuery = `
            INSERT INTO posts (user_id, content, image_url, workout_id, group_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *;
        `;
        const newPostRes: QueryResult = await pool.query(createPostQuery, [
            user_id,
            content,
            image_url ?? null,
            workout_id ?? null,
            group_id
        ]);

        return res.status(201).json({ message: 'Post created successfully.', post: newPostRes.rows[0] });
    } catch (error) {
        console.error('Error creating post in group:', error);
        return res.status(500).json({ message: 'Error creating post. Please try again later.' });
    }
};

// Edit a post in a group
export const editGroupPost = async (req: Request, res: Response, next: NextFunction) => {
    const { post_id } = req.params;
    const { user_id, content, image_url, workout_id } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Post content cannot be empty." });
    }

    try {
        // Check if user is the post owner
        const checkPostQuery = `SELECT * FROM posts WHERE post_id = $1;`;
        const postRes: QueryResult = await pool.query(checkPostQuery, [post_id]);

        if (postRes.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Grab post creator's ID and current workout_id
        const postOwnerId = postRes.rows[0].user_id;
        const currentWorkoutId = postRes.rows[0].workout_id;

        if (postOwnerId !== Number(user_id)) {
            return res.status(403).json({ message: 'You do not have permission to edit this post.' });
        }

        // If workout_id is changing, check if the new workout_id exists
        if (workout_id && workout_id !== currentWorkoutId) {
            const checkWorkoutQuery = `SELECT workout_id FROM workouts WHERE workout_id = $1`;
            const checkWorkoutRes: QueryResult = await pool.query(checkWorkoutQuery, [workout_id]);

            if (checkWorkoutRes.rows.length === 0) {
                return res.status(400).json({ message: "Invalid workout ID. Workout does not exist." });
            }
        }

        // Update query
        const updatePostQuery = `
            UPDATE posts 
            SET content = $1, image_url = $2, workout_id = $3, updated_at = NOW()
            WHERE post_id = $4 
            RETURNING *;
        `;
        const updatedPostRes: QueryResult = await pool.query(updatePostQuery, [
            content,
            image_url ?? null,
            workout_id ?? null,
            post_id
        ]);


        return res.status(200).json({ message: 'Post updated successfully.', post: updatedPostRes.rows[0] });
    } catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({ message: 'Error updating post. Please try again later.' });
    }
};

// delete a post in a group (post owner/admin/mods only)
export const deleteGroupPost = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, post_id } = req.params;

    // user info from user deleting post
    const { user_id, username, profile_pic, group_name } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get user_id from post being deleted
        const getPostQuery = `SELECT user_id FROM posts WHERE post_id = $1;`;
        const postRes: QueryResult = await client.query(getPostQuery, [post_id]);

        if (postRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Post not found.' });
        }

        const postOwnerId = postRes.rows[0].user_id;

        // Check if the user is the post owner, admin, or mod
        const checkAdminModQuery = `SELECT is_admin, is_mod FROM group_members WHERE user_id = $1 AND group_id = $2;`;
        const adminModRes: QueryResult = await client.query(checkAdminModQuery, [user_id, group_id]);

        const isAdminOrMod = adminModRes.rows.length > 0 && (adminModRes.rows[0].is_admin || adminModRes.rows[0].is_mod);

        // If user isn't post owner or group mod/admin, they don't have permission to delete the post
        if (postOwnerId !== Number(user_id) && !isAdminOrMod) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: "You are not authorized to delete this post." });
        }

        // Delete likes associated with this post
        await client.query(`DELETE FROM likes WHERE post_id = $1`, [post_id]);

        // Delete comments associated with this post
        await client.query(`DELETE FROM comments WHERE post_id = $1`, [post_id]);

        // Delete the post
        const deletePostQuery = `DELETE FROM posts WHERE post_id = $1 RETURNING *;`;
        const deletePostResponse: QueryResult = await client.query(deletePostQuery, [post_id]);

        // If an admin or mod deletes the post, notify the post owner
        if (isAdminOrMod && postOwnerId !== Number(user_id)) {
            await createNotification({
                sender_id: user_id,
                sender_username: username,
                sender_profile_pic: profile_pic,
                receiver_id: postOwnerId,
                type: 'group_change',
                message: `Your post was removed by a group admin or moderator in ${group_name}.`,
                reference_type: 'group',
                reference_id: Number(group_id),
                client
            });
        }

        await client.query('COMMIT');

        return res.status(200).json({ message: 'Post deleted successfully.', post: deletePostResponse.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting post:', error);
        return res.status(500).json({ message: 'Error deleting post. Please try again later.' });
    } finally {
        client.release();
    }
};


// GROUP MEMBERSHIP
// invite a user to a group
export const inviteUserToGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, invited_user_id } = req.params;

    // The user sending the invite
    const { user_id, username, profile_pic, group_name } = req.body;

    const client = await pool.connect();

    try {
        // Begin transaction to handle the invitation process
        await client.query('BEGIN');

        // Verify that the invited user exists using getUserInfo helper
        let invitedUserInfo: any;
        try {
            invitedUserInfo = await getUserInfo(Number(invited_user_id), client);
        } catch (error) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User does not exist.' });
        }

        // Check if the inviting user is already a member of the group
        const checkMembershipQuery = `
            SELECT * FROM group_members
            WHERE user_id = $1 AND group_id = $2;
        `;
        const checkMembershipRes: QueryResult = await pool.query(checkMembershipQuery, [user_id, group_id]);

        if (checkMembershipRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You must be a member of the group to invite others.' });
        }

        // Check if the invited user is already a member of the group
        const checkExistingMembershipQuery = `
            SELECT * FROM group_members
            WHERE user_id = $1 AND group_id = $2;
        `;
        const checkExistingMembershipRes: QueryResult = await pool.query(checkExistingMembershipQuery, [invited_user_id, group_id]);

        if (checkExistingMembershipRes.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'User is already a member of the group.' });
        }

        // Check if the invited user already has a pending invitation or join request
        const checkPendingInviteQuery = `
            SELECT * FROM group_join_requests
            WHERE user_id = $1 AND group_id = $2 AND status = 'pending';
        `;
        const checkPendingInviteRes: QueryResult = await pool.query(checkPendingInviteQuery, [invited_user_id, group_id]);

        if (checkPendingInviteRes.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'User already has a pending invitation or request.' });
        }

        // Insert a new invitation in the group_join_requests table with status 'pending'
        const inviteQuery = `
            INSERT INTO group_join_requests (user_id, group_id, status, is_invite, requested_at, updated_at)
            VALUES ($1, $2, 'pending', true, NOW(), NOW()) RETURNING *;
        `;
        const inviteRes: QueryResult = await pool.query(inviteQuery, [invited_user_id, group_id]);

        // Create a notification for the invited user
        const notificationMessage = `${invitedUserInfo.username}, you have been invited to join ${group_name}.`;
        await createNotification({
            sender_id: user_id,
            sender_username: username,
            sender_profile_pic: profile_pic,
            receiver_id: Number(invited_user_id),
            receiver_username: invitedUserInfo.username,
            receiver_profile_pic: invitedUserInfo.profile_pic ?? null,
            type: 'group_invite',
            message: notificationMessage,
            reference_type: 'group',
            reference_id: Number(group_id),
            client
        });

        // Commit the transaction
        await client.query('COMMIT');

        return res.status(200).json({ message: 'User invited successfully.', invite: inviteRes.rows[0] });
    } catch (error) {
        // Rollback the transaction if any error occurs
        await client.query('ROLLBACK');
        console.error('Error inviting user to group:', error);
        return res.status(500).json({ message: 'Error inviting user. Please try again later.' });
    } finally {
        client.release();
    }
};

// get all members of a group, sorted with admins first, then mods, then regular members
export const getGroupMembers = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;

    try {
        // Grab all users and their profile info from the group_members table
        const query = `
            SELECT gm.user_id, gm.is_admin, gm.is_mod, gm.joined_at, u.username, u.profile_pic 
            FROM group_members gm
            JOIN users u ON gm.user_id = u.user_id
            WHERE gm.group_id = $1
            ORDER BY gm.is_admin DESC, gm.is_mod DESC;
        `;
        const membersRes: QueryResult = await pool.query(query, [group_id]);

        return res.status(200).json({ members: membersRes.rows });
    } catch (error) {
        console.error('Error fetching group members:', error);
        return res.status(500).json({ message: 'Error fetching group members. Please try again later.' });
    }
};

export const joinGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;
    const { user_id } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if the user is already a member
        const checkMembershipQuery = `SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2;`;
        const membershipRes: QueryResult = await client.query(checkMembershipQuery, [user_id, group_id]);

        if (membershipRes.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'You are already a member of this group.' });
        }

        // Check if the group exists/is private
        const checkGroupQuery = `SELECT is_private FROM groups WHERE group_id = $1;`;
        const groupRes: QueryResult = await client.query(checkGroupQuery, [group_id]);

        if (groupRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Group not found.' });
        }

        const isPrivate = groupRes.rows[0].is_private;

        if (isPrivate) {
            // Check if there's already a pending request
            const checkRequestQuery = `SELECT * FROM group_join_requests WHERE user_id = $1 AND group_id = $2`;
            const requestRes: QueryResult = await client.query(checkRequestQuery, [user_id, group_id]);

            if (requestRes.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'You have already requested to join this group. Please wait for an admin or moderator to reply to your request.' });
            }

            // Insert a new join request
            const insertRequestQuery = `
                INSERT INTO group_join_requests (user_id, group_id, status, requested_at, updated_at)
                VALUES ($1, $2, 'pending', NOW(), NOW()) RETURNING *;
            `;
            const newRequestRes: QueryResult = await client.query(insertRequestQuery, [user_id, group_id]);

            await client.query('COMMIT');
            return res.status(200).json({ message: 'Join request sent.', request: newRequestRes.rows[0] });
        } else {
            // If the group is public, add the user directly
            const insertMemberQuery = `
                INSERT INTO group_members (user_id, group_id, is_admin, is_mod, joined_at)
                VALUES ($1, $2, false, false, NOW()) RETURNING *;
            `;
            const newMemberRes: QueryResult = await client.query(insertMemberQuery, [user_id, group_id]);

            await client.query('COMMIT');
            return res.status(201).json({ message: 'Joined group successfully.', member: newMemberRes.rows[0] });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error joining group:', error);
        return res.status(500).json({ message: 'Error joining group. Please try again later.' });
    } finally {
        client.release();
    }
};

// remove requet to join
export const removeJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;
    const { user_id } = req.body;

    try {
        // check if join request exists in db
        const joinRequestQuery = `SELECT * FROM group_join_requests WHERE user_id = $1 AND group_id = $2 AND status = 'pending'`
        const joinRequestRes: QueryResult = await pool.query(joinRequestQuery, [user_id, group_id])

        if (joinRequestRes.rows.length === 0) {
            return res.status(400).json({ message: `No join request found.` })
        }

        // make sure user_id in body matches user_id in join request
        if (joinRequestRes.rows[0].user_id !== Number(user_id)) {
            return res.status(403).json({ message: "You aren't authorized to delete this request." })
        }

        // delete join request
        const deleteJoinRequestQuery = `DELETE FROM group_join_requests WHERE user_id = $1 AND group_id = $2 RETURNING *;`
        const deleteJoinRequestRes: QueryResult = await pool.query(deleteJoinRequestQuery, [user_id, group_id])

        return res.status(200).json({ message: "Join request deleted successfully!", deletedRequest: deleteJoinRequestRes.rows[0] })
    } catch (error) {
        console.error(`Error deleting join request: ${error}`)
        return res.status(500).json({ message: `Error deleting join request: ${error}` })
    }
}

// user accept a group invitation
export const userAcceptGroupInvite = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, request_id } = req.params;

    // The user who is accepting the invite
    const { user_id } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if the join request exists and is still pending
        const checkRequestQuery = `
            SELECT user_id FROM group_join_requests 
            WHERE request_id = $1 AND group_id = $2 AND status = 'pending' AND is_invite = true;
        `;
        const requestRes: QueryResult = await client.query(checkRequestQuery, [request_id, group_id]);

        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Invitation not found or already processed.' });
        }

        // Ensure the user accepting the invite is the intended recipient
        if (requestRes.rows[0].user_id !== user_id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You are not authorized to accept this invitation.' });
        }

        // Update the join request status to 'accepted'
        const updateRequestQuery = `
            UPDATE group_join_requests 
            SET status = 'accepted', updated_at = NOW() 
            WHERE request_id = $1 RETURNING *;
        `;
        const updateRequestRes: QueryResult = await client.query(updateRequestQuery, [request_id]);

        // Add the user to the group_members table
        const addMemberQuery = `
            INSERT INTO group_members (user_id, group_id, is_admin, is_mod, joined_at)
            VALUES ($1, $2, false, false, NOW()) RETURNING *;
        `;
        const addMemberRes: QueryResult = await client.query(addMemberQuery, [user_id, group_id]);

        await client.query('COMMIT');

        return res.status(200).json({
            message: 'Invitation accepted successfully.',
            updated_request: updateRequestRes.rows[0],
            added_member: addMemberRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error accepting group invitation:', error);
        return res.status(500).json({ message: 'Error accepting group invitation. Please try again later.' });
    } finally {
        client.release();
    }
};

// user deny group invitation
export const userDenyGroupInvite = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, request_id } = req.params;

    // The user denying the invite
    const { user_id } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if the join request exists and is still pending
        const checkRequestQuery = `
            SELECT user_id FROM group_join_requests 
            WHERE request_id = $1 AND group_id = $2 AND status = 'pending' AND is_invite = true;
        `;
        const requestRes: QueryResult = await client.query(checkRequestQuery, [request_id, group_id]);

        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Invitation not found or already processed.' });
        }

        // Ensure the user denying the invite is the intended recipient
        if (requestRes.rows[0].user_id !== user_id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You are not authorized to deny this invitation.' });
        }

        // Delete the join request
        const deleteJoinRequestQuery = `
            DELETE FROM group_join_requests WHERE request_id = $1 RETURNING *;
        `;
        const deleteJoinRequestRes: QueryResult = await client.query(deleteJoinRequestQuery, [request_id]);

        await client.query('COMMIT');

        return res.status(200).json({
            message: 'Invitation denied successfully.',
            deleted_request: deleteJoinRequestRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error denying group invitation:', error);
        return res.status(500).json({ message: 'Error denying group invitation. Please try again later.' });
    } finally {
        client.release();
    }
};

// Leave group
export const leaveGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;
    const { user_id } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if the user is in the group
        const checkMembershipQuery = `SELECT is_admin FROM group_members WHERE user_id = $1 AND group_id = $2;`;
        const membershipRes: QueryResult = await client.query(checkMembershipQuery, [user_id, group_id]);

        if (membershipRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'You are not a member of this group.' });
        }

        const isAdmin = membershipRes.rows[0].is_admin;

        // Prevent an admin from leaving unless they delete the group or transfer ownership
        if (isAdmin) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Admin cannot leave the group. Transfer ownership or delete the group first.' });
        }

        // delete join request
        const deleteJoinRequestQuery = `DELETE FROM group_join_requests WHERE user_id = $1 AND group_id = $2 RETURNING *;`
        await client.query(deleteJoinRequestQuery, [user_id, group_id])

        // Remove the user from the group
        const leaveQuery = `DELETE FROM group_members WHERE user_id = $1 AND group_id = $2 RETURNING *;`;
        const leaveRes: QueryResult = await client.query(leaveQuery, [user_id, group_id]);

        await client.query('COMMIT');

        return res.status(200).json({ message: 'Left the group successfully.', leftMember: leaveRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error leaving group:', error);
        return res.status(500).json({ message: 'Error leaving group. Please try again later.' });
    } finally {
        client.release();
    }
};

// get all pending join requests (admin/mods only)
export const getPendingJoinRequests = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id } = req.params;
    const { user_id } = req.body;

    try {
        // Check if the user is an admin or mod of the group
        const checkPermissionsQuery = `
            SELECT is_admin, is_mod FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const permissionsRes: QueryResult = await pool.query(checkPermissionsQuery, [user_id, group_id]);

        if (permissionsRes.rows.length === 0 || (!permissionsRes.rows[0].is_admin && !permissionsRes.rows[0].is_mod)) {
            return res.status(403).json({ message: "You are not authorized to view join requests." });
        }

        // Get all pending join requests
        const getJoinRequestsQuery = `
            SELECT * FROM group_join_requests WHERE group_id = $1 AND status = 'pending' AND is_invite = false;
        `;
        const joinRequestsRes: QueryResult = await pool.query(getJoinRequestsQuery, [group_id]);

        return res.status(200).json({ pending_join_requests: joinRequestsRes.rows });
    } catch (error) {
        console.error('Error fetching pending join requests:', error);
        return res.status(500).json({ message: 'Error fetching join requests. Please try again later.' });
    }
};


// accept join request (admin/mods only)
export const acceptJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, request_id } = req.params;

    // admin/mod info
    const { user_id, username, profile_pic, group_name } = req.body;

    const client = await pool.connect();

    try {
        // Begin transaction
        await client.query('BEGIN');

        // Check if the accepting user is an admin or mod of the group
        const checkPermissionsQuery = `
            SELECT is_admin, is_mod FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const permissionsRes: QueryResult = await client.query(checkPermissionsQuery, [user_id, group_id]);

        if (permissionsRes.rows.length === 0 || (!permissionsRes.rows[0].is_admin && !permissionsRes.rows[0].is_mod)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: "You are not authorized to accept this request." });
        }

        // Check if the join request exists and is pending
        const checkRequestQuery = `
            SELECT * FROM group_join_requests WHERE request_id = $1 AND group_id = $2 AND status = 'pending' AND is_invite = false;
        `;
        const requestRes: QueryResult = await client.query(checkRequestQuery, [request_id, group_id]);

        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Join request not found or already processed.' });
        }

        // Fetch invited user's info using getUserInfo helper
        let joiningUserInfo: any;
        try {
            joiningUserInfo = await getUserInfo(requestRes.rows[0].user_id, client);
        } catch (error) {
            await client.query('ROLLBACK');
            return res.status(500).json({ message: 'Failed to fetch invited user info.' });
        }

        // Update the join request status to 'approved'
        const updateRequestQuery = `
            UPDATE group_join_requests
            SET status = 'approved', updated_at = NOW()
            WHERE request_id = $1 RETURNING *;
        `;
        const updateRequestRes: QueryResult = await client.query(updateRequestQuery, [request_id]);

        // Add the user to the group_members table
        const addMemberQuery = `
            INSERT INTO group_members (user_id, group_id, is_admin, is_mod, joined_at)
            VALUES ($1, $2, false, false, NOW()) RETURNING *;
        `;
        await client.query(addMemberQuery, [requestRes.rows[0].user_id, group_id]);

        // Create a notification for the user who was added
        const notificationMessage = `${joiningUserInfo.username}, your request to join ${group_name} has been accepted!`;
        await createNotification({
            sender_id: user_id,
            sender_username: username,
            sender_profile_pic: profile_pic,
            receiver_id: requestRes.rows[0].user_id,
            receiver_username: joiningUserInfo.username,
            receiver_profile_pic: joiningUserInfo.profile_pic ?? null,
            type: 'group_invite',
            message: notificationMessage,
            reference_type: 'group',
            reference_id: Number(group_id),
            client
        });

        // Commit the transaction
        await client.query('COMMIT');

        return res.status(200).json({ message: 'Join request accepted successfully.', updated_request: updateRequestRes.rows[0] });
    } catch (error) {
        // Rollback the transaction if any error occurs
        await client.query('ROLLBACK');
        console.error('Error accepting join request:', error);
        return res.status(500).json({ message: 'Error accepting join request. Please try again later.' });
    } finally {
        client.release();
    }
};


// deny join request (admin/mods only)
export const denyJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, request_id } = req.params;

    // admin/mod info
    const { user_id, username, profile_pic, group_name } = req.body;

    const client = await pool.connect();

    try {
        // Begin transaction
        await client.query('BEGIN');

        // Check if the denying user is an admin or mod of the group
        const checkPermissionsQuery = `
            SELECT is_admin, is_mod FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const permissionsRes: QueryResult = await client.query(checkPermissionsQuery, [user_id, group_id]);

        if (permissionsRes.rows.length === 0 || (!permissionsRes.rows[0].is_admin && !permissionsRes.rows[0].is_mod)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: "You are not authorized to deny this request." });
        }

        // Check if the join request exists and is pending
        const checkRequestQuery = `
            SELECT * FROM group_join_requests WHERE request_id = $1 AND group_id = $2 AND status = 'pending' AND is_invite = false;
        `;
        const requestRes: QueryResult = await client.query(checkRequestQuery, [request_id, group_id]);

        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Join request not found or already processed.' });
        }

        // Fetch invited user's info using getUserInfo helper
        let deniedUserInfo: any;
        try {
            deniedUserInfo = await getUserInfo(requestRes.rows[0].user_id, client);
        } catch (error) {
            await client.query('ROLLBACK');
            return res.status(500).json({ message: "Failed to fetch denied user's info." });
        }

        // delete join request
        const deleteJoinRequestQuery = `DELETE FROM group_join_requests WHERE request_id = $1 AND group_id = $2 RETURNING *;`
        const deleteJoinRequestRes: QueryResult = await client.query(deleteJoinRequestQuery, [request_id, group_id])

        // Create a notification for the user who was denied
        const notificationMessage = `${deniedUserInfo.username}, your request to join ${group_name} has been denied.`;
        await createNotification({
            sender_id: user_id,
            sender_username: username,
            sender_profile_pic: profile_pic,
            receiver_id: requestRes.rows[0].user_id,
            receiver_username: deniedUserInfo.username,
            receiver_profile_pic: deniedUserInfo.profile_pic ?? null,
            type: 'group_invite',
            message: notificationMessage,
            reference_type: 'group',
            reference_id: Number(group_id),
            client
        });

        // Commit the transaction
        await client.query('COMMIT');

        return res.status(200).json({ message: 'Join request denied successfully.', updated_request: deleteJoinRequestRes.rows[0] });
    } catch (error) {
        // Rollback the transaction if any error occurs
        await client.query('ROLLBACK');
        console.error('Error denying join request:', error);
        return res.status(500).json({ message: 'Error denying join request. Please try again later.' });
    } finally {
        client.release();
    }
};


// remove a member from a group (admin/mods only)
export const removeGroupMember = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, member_id } = req.params;

    // admin/mod info
    const { user_id, username, profile_pic, group_name } = req.body;

    const client = await pool.connect();

    try {
        // Begin transaction
        await client.query('BEGIN');

        // Check if the requesting user is an admin or mod of the group
        const checkPermissionsQuery = `
            SELECT is_admin, is_mod FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const permissionsRes: QueryResult = await client.query(checkPermissionsQuery, [user_id, group_id]);

        if (permissionsRes.rows.length === 0 || (!permissionsRes.rows[0].is_admin && !permissionsRes.rows[0].is_mod)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: "You are not authorized to remove members from this group." });
        }

        // Check if the user to be removed is actually a member of the group
        const checkMemberQuery = `
            SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const memberRes: QueryResult = await client.query(checkMemberQuery, [member_id, group_id]);

        if (memberRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Member not found in the group.' });
        }

        // Remove the user from the group_members table
        const removeMemberQuery = `
            DELETE FROM group_members WHERE user_id = $1 AND group_id = $2 RETURNING *;
        `;
        const removedMemberRes: QueryResult = await client.query(removeMemberQuery, [member_id, group_id]);

        // Create a notification for the user who was removed
        const notificationMessage = `${username} removed you from ${group_name}.`;
        await createNotification({
            sender_id: user_id,
            sender_username: username,
            sender_profile_pic: profile_pic,
            receiver_id: Number(member_id),
            type: 'group_change',
            message: notificationMessage,
            reference_type: 'group',
            reference_id: Number(group_id),
            client
        });

        // Commit the transaction
        await client.query('COMMIT');

        return res.status(200).json({ message: 'Member removed successfully.', removed_member: removedMemberRes.rows[0] });
    } catch (error) {
        // Rollback the transaction if any error occurs
        await client.query('ROLLBACK');
        console.error('Error removing member:', error);
        return res.status(500).json({ message: 'Error removing member. Please try again later.' });
    } finally {
        client.release();
    }
};


// MANAGE MODERATORS
// promote a member to moderator (admin only)
export const promoteToModerator = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, member_id } = req.params;

    // admin info
    const { user_id, username, profile_pic, group_name } = req.body;

    const client = await pool.connect();

    try {
        // Begin transaction
        await client.query('BEGIN');

        // Check if the requesting user is an admin
        const checkPermissionsQuery = `
            SELECT is_admin FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const permissionsRes: QueryResult = await client.query(checkPermissionsQuery, [user_id, group_id]);

        if (permissionsRes.rows.length === 0 || !permissionsRes.rows[0].is_admin) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: "You are not authorized to promote members to moderator." });
        }

        // Check if the user to be promoted is a member of the group
        const checkMemberQuery = `
            SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2;
        `;
        const memberRes: QueryResult = await client.query(checkMemberQuery, [member_id, group_id]);

        if (memberRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Member not found in the group.' });
        }

        // Promote the user to moderator in the group_members table
        const promoteQuery = `
            UPDATE group_members SET is_mod = true WHERE user_id = $1 AND group_id = $2 RETURNING *;
        `;
        const promoteRes: QueryResult = await client.query(promoteQuery, [member_id, group_id]);

        // Create a notification for the user who was promoted
        const notificationMessage = `${username} has been promoted to a moderator in ${group_name}!`;
        await createNotification({
            sender_id: user_id,
            sender_username: username,
            sender_profile_pic: profile_pic,
            receiver_id: Number(member_id),
            type: 'group_change',
            message: notificationMessage,
            reference_type: 'group',
            reference_id: Number(group_id),
            client
        });

        // Commit the transaction
        await client.query('COMMIT');

        return res.status(200).json({ message: 'Member promoted to moderator successfully.', promoted_member: promoteRes.rows[0] });
    } catch (error) {
        // Rollback the transaction if any error occurs
        await client.query('ROLLBACK');
        console.error('Error promoting member to moderator:', error);
        return res.status(500).json({ message: 'Error promoting member to moderator. Please try again later.' });
    } finally {
        client.release();
    }
};


// demote a moderator to a regular member (admin only)
export const demoteModerator = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, member_id } = req.params;

    // admin info
    const { user_id, username, profile_pic, group_name } = req.body;

    const client = await pool.connect();

    try {
        // Begin transaction
        await client.query('BEGIN');

        // Check if the requesting user is an admin
        const checkPermissionsQuery = `
            SELECT is_admin FROM group_members WHERE user_id = $1 AND group_id = $2;
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
        const notificationMessage = `${username} has demoted you from a moderator to a regular member in ${group_name}.`;
        await createNotification({
            sender_id: user_id,
            sender_username: username,
            sender_profile_pic: profile_pic,
            receiver_id: Number(member_id),
            type: 'group_change',
            message: notificationMessage,
            reference_type: 'group',
            reference_id: Number(group_id),
            client
        });

        // Commit the transaction
        await client.query('COMMIT');

        return res.status(200).json({ message: 'Member demoted to regular member successfully.', demoted_member: demoteRes.rows[0] });
    } catch (error) {
        // Rollback the transaction if any error occurs
        await client.query('ROLLBACK');
        console.error('Error demoting moderator:', error);
        return res.status(500).json({ message: 'Error demoting moderator. Please try again later.' });
    } finally {
        client.release();
    }
};

// grant admin status
export const promoteToAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { group_id, user_id } = req.params;

    // Admin's info
    const { admin_id, username, profile_pic, group_name } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if the requester is an admin
        const checkAdminQuery = `SELECT is_admin FROM group_members WHERE user_id = $1 AND group_id = $2;`;
        const adminRes: QueryResult = await client.query(checkAdminQuery, [admin_id, group_id]);

        if (adminRes.rows.length === 0 || !adminRes.rows[0].is_admin) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You are not authorized to grant admin rights.' });
        }

        // Check if target user is in the group
        const checkMemberQuery = `SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2;`;
        const memberRes: QueryResult = await client.query(checkMemberQuery, [user_id, group_id]);

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
        const updateRes: QueryResult = await client.query(updateQuery, [user_id, group_id]);

        // Fetch promoted user's info
        let promotedUserInfo: any;
        try {
            promotedUserInfo = await getUserInfo(Number(user_id), client);
        } catch (error) {
            await client.query('ROLLBACK');
            return res.status(500).json({ message: "Failed to fetch promoted user's info." });
        }

        // Create a notification
        const notificationMessage = `${promotedUserInfo.username}, you have been promoted to an admin in ${group_name}.`;
        await createNotification({
            sender_id: admin_id,
            sender_username: username,
            sender_profile_pic: profile_pic,
            receiver_id: Number(user_id),
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
    const { group_id, user_id } = req.params;

    // Admin's info
    const { admin_id, username, profile_pic, group_name } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if the requester is an admin
        const checkAdminQuery = `SELECT is_admin FROM group_members WHERE user_id = $1 AND group_id = $2;`;
        const adminRes: QueryResult = await client.query(checkAdminQuery, [admin_id, group_id]);

        if (adminRes.rows.length === 0 || !adminRes.rows[0].is_admin) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You are not authorized to remove admin rights.' });
        }

        // Check if target user is an admin
        const checkMemberQuery = `SELECT is_admin FROM group_members WHERE user_id = $1 AND group_id = $2;`;
        const memberRes: QueryResult = await client.query(checkMemberQuery, [user_id, group_id]);

        if (memberRes.rows.length === 0 || !memberRes.rows[0].is_admin) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'User is not an admin.' });
        }

        // Ensure there's at least one admin left
        const adminCountQuery = `SELECT COUNT(*) FROM group_members WHERE group_id = $1 AND is_admin = TRUE;`;
        const adminCountRes: QueryResult = await client.query(adminCountQuery, [group_id]);

        if (Number(adminCountRes.rows[0].count) <= 1) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Cannot remove the last admin. Please promote another user before demoting yourself.' });
        }

        // Remove admin status
        const updateQuery = `UPDATE group_members SET is_admin = FALSE WHERE user_id = $1 AND group_id = $2 RETURNING *;`;
        const updateRes: QueryResult = await client.query(updateQuery, [user_id, group_id]);

        // Fetch demoted user's info
        let demotedUserInfo: any;
        try {
            demotedUserInfo = await getUserInfo(Number(user_id), client);
        } catch (error) {
            await client.query('ROLLBACK');
            return res.status(500).json({ message: "Failed to fetch demoted user's info." });
        }

        // Create a notification
        const notificationMessage = `${demotedUserInfo.username}, you have been removed as an admin in ${group_name}.`;
        await createNotification({
            sender_id: admin_id,
            sender_username: username,
            sender_profile_pic: profile_pic,
            receiver_id: Number(user_id),
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
