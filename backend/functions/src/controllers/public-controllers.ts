import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
import { QueryResult } from "pg";
import { checkIfUsernameExists, checkIfGroupNameExists, getViewerIdFromAuthHeader, getUserIdFromFirebaseUid, canViewPrivateProfile, canViewPrivateGroup } from "../util/util";

// public controllers - don't require firebaseUID

// blank function
// export const fnName = async (req: Request, res: Response, next: NextFunction) => {}

// check if username is available
export const checkUsername = async (req: Request, res: Response) => {
    const { username } = req.query;

    console.log("=== CheckUsernameExists Called ===");
    console.log("Username to check:", username);

    if (!username || typeof username !== "string") {
        return res.status(400).json({ message: "Missing or invalid username." });
    }

    try {
        const result = await checkIfUsernameExists(username);

        console.log("Query result:", result);

        return res.status(200).json({ exists: result });
    } catch (error) {
        console.error("Error checking username existence:", error);
        return res.status(500).json({ message: "Failed to check username." });
    }
};

// check if email is available
export const checkEmail = async (req: Request, res: Response) => {
    const { email } = req.query;

    console.log("=== CheckEmailExists Called ===");
    console.log("Email to check:", email);

    if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Missing or invalid email." });
    }

    try {
        const query = "SELECT 1 FROM users WHERE email = $1";
        const result = await pool.query(query, [email]);

        console.log("Query result:", result.rows);

        return res.status(200).json({ exists: result.rows.length > 0 });
    } catch (error) {
        console.error("Error checking email existence:", error);
        return res.status(500).json({ message: "Failed to check email." });
    }
};

// check if group name is available
export const checkGroupName = async (req: Request, res: Response) => {
    const { group_name } = req.query;

    console.log("=== CheckGroupNameExists Called ===");
    console.log("Group name to check:", group_name);

    if (!group_name || typeof group_name !== "string") {
        return res.status(400).json({ message: "Missing or invalid group name." });
    }

    try {
        const exists = await checkIfGroupNameExists(group_name);

        console.log("Util result:", exists);

        return res.status(200).json({ exists });
    } catch (error) {
        console.error("Error checking group name existence:", error);
        return res.status(500).json({ message: "Failed to check group name." });
    }
};

// public user controllers
// Get all users
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    const userQuery: string = "SELECT * FROM users";

    try {
        const userResponse: QueryResult = await pool.query(userQuery);
        return res.status(200).json({ message: "Got all users.", users: userResponse.rows });
    } catch (error) {
        console.error("Error getting all users:", error);
        return res.status(500).json({ message: `Error getting all users: ${error}` });
    }
};

// Get a single user
export const getSingleUser = async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;
    console.log("Fetching user:", username);

    try {
        // Try to get viewer Firebase UID (if token exists)
        const authHeader = req.headers.authorization;
        const firebaseUid = await getViewerIdFromAuthHeader(authHeader);
        console.log("Decoded Firebase UID:", firebaseUid);

        let viewerId: number | null = null;

        if (firebaseUid) {
            try {
                viewerId = await getUserIdFromFirebaseUid(firebaseUid);
                console.log("Mapped Firebase UID to viewer user_id:", viewerId);
            } catch (err) {
                console.warn("Failed to map Firebase UID to user_id:", err);
                // Still allow public viewing if mapping fails
            }
        } else {
            console.log("No valid token found; treating request as unauthenticated.");
        }

        // Privacy check
        const canView = await canViewPrivateProfile(viewerId ?? -1, username);
        console.log(`Viewer (user_id: ${viewerId}) can view target user (${username})?`, canView);

        if (!canView) {
            console.log("Access denied due to privacy settings.");
            return res.status(403).json({ message: "This profile is private.", canView });
        }

        // Fetch user info
        const userQuery = `
            SELECT user_id, username, profile_pic, bio, is_private, created_at, updated_at 
            FROM users 
            WHERE LOWER(username) = LOWER($1)
        `;
        const userResponse: QueryResult = await pool.query(userQuery, [username]);

        if (userResponse.rows.length === 0) {
            console.log("User not found with username:", username);
            return res.status(404).json({ message: "User not found." });
        }

        console.log("User found. Returning data.");
        return res.status(200).json({ message: "Got user.", user: userResponse.rows[0], canView });

    } catch (error) {
        console.error("Error getting user:", error);
        return res.status(500).json({ message: `Error getting user: ${error}` });
    }
};

// Get user's friends (with privacy check)
export const getUserFriends = async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;
    console.log("Fetching friends for user:", username);

    try {
        // Get the user's user_id from the username
        const userIdQuery = `SELECT user_id FROM users WHERE LOWER(username) = LOWER($1)`;
        const userIdResult: QueryResult = await pool.query(userIdQuery, [username]);

        if (userIdResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user_id = userIdResult.rows[0].user_id;

        // Try to get viewer Firebase UID (if token exists)
        const authHeader = req.headers.authorization;
        const firebaseUid = await getViewerIdFromAuthHeader(authHeader);
        console.log("Decoded Firebase UID:", firebaseUid);

        let viewerId: number | null = null;

        if (firebaseUid) {
            try {
                viewerId = await getUserIdFromFirebaseUid(firebaseUid);
                console.log("Mapped Firebase UID to viewer user_id:", viewerId);
            } catch (err) {
                console.warn("Failed to map Firebase UID to user_id:", err);
                // Still allow public viewing if mapping fails
            }
        } else {
            console.log("No valid token found; treating request as unauthenticated.");
        }

        // Privacy check
        const canView = await canViewPrivateProfile(viewerId ?? -1, username);
        console.log(`Viewer (user_id: ${viewerId}) can view target user's friends (${username})?`, canView);

        if (!canView) {
            console.log("Access denied due to privacy settings.");
            return res.status(403).json({ message: "This user's friends list is private.", canView });
        }

        // Query to get the accepted friend requests for the user
        const query = `
            SELECT 
                CASE 
                    WHEN f.sender_id = $1 THEN f.receiver_id 
                    ELSE f.sender_id 
                END AS friend_id
            FROM 
                friend_requests f
            WHERE 
                (f.sender_id = $1 OR f.receiver_id = $1)
                AND f.status = 'Accepted';
        `;

        // Run the query with the user_id
        const result: QueryResult = await pool.query(query, [user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No friends found.' });
        }

        // Extract the friend_ids from the query result
        const friendIds = result.rows.map(row => row.friend_id);

        // Now, get the user information for each friend
        const userQuery = `
            SELECT user_id, username, profile_pic, is_private
            FROM users
            WHERE user_id = ANY($1);
        `;

        // Get friends' details using the friend_ids
        const userResult: QueryResult = await pool.query(userQuery, [friendIds]);

        return res.status(200).json({ friends: userResult.rows, canView });
    } catch (error) {
        console.error('Error fetching user friends:', error);
        return res.status(500).json({ message: 'Error fetching user friends. Please try again later.' });
    }
};

// posts

// get all posts from user
export const getAllUserPosts = async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;

    console.log("=== getAllUserPosts called ===");
    console.log("Requested username:", username);

    // Validate username
    if (!username || typeof username !== "string") {
        console.warn("Invalid username provided:", username);
        return res.status(400).json({ message: "Invalid username." });
    }

    try {
        // Get user_id from username
        const userIdQuery = "SELECT user_id FROM users WHERE LOWER(username) = LOWER($1)";
        const userIdRes: QueryResult = await pool.query(userIdQuery, [username]);

        if (userIdRes.rows.length === 0) {
            console.warn(`User with username '${username}' not found.`);
            return res.status(404).json({ message: `User '${username}' not found.` });
        }

        const user_id = userIdRes.rows[0].user_id;

        // Try to get viewer Firebase UID (if token exists)
        const authHeader = req.headers.authorization;
        const firebaseUid = await getViewerIdFromAuthHeader(authHeader);

        let viewerId: number | null = null;

        if (firebaseUid) {
            try {
                viewerId = await getUserIdFromFirebaseUid(firebaseUid);
                console.log("Mapped Firebase UID to viewer user_id:", viewerId);
            } catch (err) {
                console.warn("Failed to map Firebase UID to user_id:", err);
            }
        } else {
            console.log("No valid token found; treating request as unauthenticated.");
        }

        // Privacy check
        const canView = await canViewPrivateProfile(viewerId ?? -1, username);
        console.log(`Viewer (user_id: ${viewerId}) can view target user's posts (${username})?`, canView);

        if (!canView) {
            console.log("Access denied due to privacy settings.");
            return res.status(403).json({ message: `${username}'s posts are private.`, canView });
        }

        // Fetch user's posts (only posts not in a group)
        const getAllUserPostsQuery = "SELECT * FROM post_with_likes_comments WHERE user_id = $1 AND group_id IS NULL ORDER BY created_at DESC";
        const allUserPostsRes: QueryResult = await pool.query(getAllUserPostsQuery, [user_id]);

        console.log(`Found ${allUserPostsRes.rows.length} posts for user '${username}'`);

        return res.status(200).json({
            message: `Retrieved all posts from user '${username}'`,
            posts: allUserPostsRes.rows,
            username,
            user_id,
            canView
        });
    } catch (error) {
        console.error(`Error retrieving posts from user '${username}':`, error);
        return res.status(500).json({ message: `Error retrieving posts from user '${username}'. Please try again later.` });
    }
};

// get single post
export const getSinglePost = async (req: Request, res: Response, next: NextFunction) => {
    const { post_id } = req.params;

    console.log("=== getSinglePost called ===");
    console.log("Requested post_id:", post_id);

    // Validate post_id
    if (!post_id || isNaN(Number(post_id))) {
        console.warn("Invalid post ID provided:", post_id);
        return res.status(400).json({ message: "Invalid post ID." });
    }

    // Query for the post
    const getSinglePostQuery = `SELECT * FROM post_with_likes_comments WHERE post_id = $1`;

    // Query for workout (if it exists) using the workout_with_exercises view
    const getWorkoutQuery = `
        SELECT * FROM workout_with_likes_comments WHERE workout_id = $1;
    `;

    try {
        // Get the post
        const postResponse: QueryResult = await pool.query(getSinglePostQuery, [post_id]);
        console.log("Post query result:", postResponse.rows);

        // Check if post exists
        if (postResponse.rows.length === 0) {
            console.warn("Post not found with ID:", post_id);
            return res.status(404).json({ message: "Post not found." });
        }

        const post = postResponse.rows[0];
        let workout = null;

        // If the post is linked to a workout, fetch the workout details
        if (post.workout_id) {
            try {
                const workoutResponse: QueryResult = await pool.query(getWorkoutQuery, [post.workout_id]);
                console.log(`Workout query result for post #${post_id}:`, workoutResponse.rows);

                if (workoutResponse.rows.length > 0) {
                    workout = workoutResponse.rows[0];
                }
            } catch (error) {
                console.error(`Error fetching workout for post #${post_id}:`, error);
            }
        }

        console.log("Returning post and workout data.");
        return res.status(200).json({
            message: "Got post!",
            post,
            post_user_id: post.user_id,
            likes: post.likes,
            comments: post.comments,
            workout
        });

    } catch (error) {
        console.error(`Error retrieving post #${post_id}:`, error);
        return res.status(500).json({ message: `Error retrieving post #${post_id}. Please try again later.` });
    }
};

// workouts
// get all workouts by user
export const getWorkoutsByUser = async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;

    // Validate username
    if (!username || typeof username !== "string") {
        return res.status(400).json({ message: "Invalid username." });
    }

    try {
        // Get user_id from username
        const userIdQuery = "SELECT user_id FROM users WHERE LOWER(username) = LOWER($1)";
        const userIdRes: QueryResult = await pool.query(userIdQuery, [username]);

        if (userIdRes.rows.length === 0) {
            return res.status(404).json({ message: `User '${username}' not found.` });
        }

        const user_id = userIdRes.rows[0].user_id;

        // Try to get viewer Firebase UID (if token exists)
        const authHeader = req.headers.authorization;
        const firebaseUid = await getViewerIdFromAuthHeader(authHeader);

        let viewerId: number | null = null;

        if (firebaseUid) {
            try {
                viewerId = await getUserIdFromFirebaseUid(firebaseUid);
            } catch (err) {
                console.warn("Failed to map Firebase UID to user_id:", err);
            }
        }

        // Privacy check
        const canView = await canViewPrivateProfile(viewerId ?? -1, username);
        if (!canView) {
            return res.status(403).json({ message: "This user's workouts are private.", canView });
        }

        // Fetch user's workouts
        const getWorkoutsByUserQuery = "SELECT * FROM workouts_with_likes_comments WHERE user_id = $1 ORDER BY workout_created_at DESC";
        const getWorkoutsByUserRes: QueryResult = await pool.query(getWorkoutsByUserQuery, [user_id]);

        return res.status(200).json({
            message: `Got all workouts created by user '${username}'`,
            workouts: getWorkoutsByUserRes.rows,
            username,
            user_id,
            canView
        });
    } catch (error) {
        console.error(`Error retrieving workouts created by user '${username}':`, error);
        return res.status(500).json({ message: `Error retrieving workouts created by user '${username}'. Please try again later.` });
    }
};


// get single workout
export const getSingleWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { workout_id } = req.params;

    // Validate workout_id
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    // Query for the workout
    const getSingleWorkoutQuery = `SELECT * FROM workouts_with_likes_comments WHERE workout_id = $1`;

    try {
        // Get the workout
        const workoutResponse: QueryResult = await pool.query(getSingleWorkoutQuery, [workout_id]);

        // Check that workout exists
        if (workoutResponse.rows.length === 0) {
            return res.status(404).json({ message: "Workout not found." });
        }

        const workout = workoutResponse.rows[0];

        // Try to get viewer Firebase UID (if token exists)
        const authHeader = req.headers.authorization;
        const firebaseUid = await getViewerIdFromAuthHeader(authHeader);

        let viewerId: number | null = null;

        if (firebaseUid) {
            try {
                viewerId = await getUserIdFromFirebaseUid(firebaseUid);
            } catch (err) {
                console.warn("Failed to map Firebase UID to user_id:", err);
            }
        }

        // Privacy check
        const canView = await canViewPrivateProfile(viewerId ?? -1, workout.username);
        if (!canView) {
            return res.status(403).json({ message: "This user's workouts are private.", canView });
        }

        return res.status(200).json({
            message: "Got workout!",
            workout,
            workout_user_id: workout.user_id,
            likes: workout.likes,
            comments: workout.comments,
            canView
        });

    } catch (error) {
        console.error(`Error retrieving workout #${workout_id}:`, error);
        return res.status(500).json({ message: `Error retrieving workout #${workout_id}. Please try again later.` });
    }
};

// groups

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
    const { group_name } = req.params;
    console.log("=== getSingleGroup called ===");
    console.log("Requested group_name:", group_name);

    // Default to true, will be set based on privacy check
    let canView = true;

    try {
        const query = `SELECT * FROM groups WHERE LOWER(name) = LOWER($1);`;
        const result: QueryResult = await pool.query(query, [group_name]);
        console.log("Group query result:", result.rows);

        if (result.rows.length === 0) {
            console.warn("Group not found with name:", group_name);
            return res.status(404).json({ message: "Group not found." });
        }

        const group = result.rows[0];

        if (group.is_private) {
            // Check if user is a member or the group is public
            const authHeader = req.headers.authorization;
            const firebaseUid = await getViewerIdFromAuthHeader(authHeader);
            let viewerId: number | null = null;

            if (firebaseUid) {
                try {
                    viewerId = await getUserIdFromFirebaseUid(firebaseUid);
                    console.log("Mapped Firebase UID to viewer user_id:", viewerId);
                } catch (err) {
                    console.warn("Failed to map Firebase UID to user_id:", err);
                }
            } else {
                console.log("No valid token found; treating request as unauthenticated.");
            }

            canView = await canViewPrivateGroup(viewerId ?? -1, group.group_id);
            console.log(`Viewer (user_id: ${viewerId}) can view group (${group.group_id})?`, canView);
            if (!canView) {
                console.log("Access denied due to group privacy settings.");
                return res.status(403).json({ message: "This group is private. Try joining to view their page!", canView });
            }
        }

        console.log("Returning group data.");
        return res.status(200).json({ group, canView });
    } catch (error) {
        console.error("Error fetching group:", error);
        return res.status(500).json({ message: "Error fetching group. Please try again later." });
    }
};

// Get all posts in a group
export const getGroupPosts = async (req: Request, res: Response, next: NextFunction) => {
    const { group_name } = req.params;
    console.log("=== getGroupPosts called ===");
    console.log("Requested group_name:", group_name);

    // Default to true, will be set based on privacy check
    let canView = true;

    try {
        // Check if group exists and if it's private
        const groupQuery = `SELECT * FROM groups WHERE LOWER(name) = LOWER($1);`;
        const groupRes: QueryResult = await pool.query(groupQuery, [group_name]);
        console.log("Group query result:", groupRes.rows);

        if (groupRes.rows.length === 0) {
            console.warn("Group not found with name:", group_name);
            return res.status(404).json({ message: "Group not found." });
        }

        const group = groupRes.rows[0];

        if (group.is_private) {
            // Check if user is a member or the group is public
            const authHeader = req.headers.authorization;
            const firebaseUid = await getViewerIdFromAuthHeader(authHeader);
            let viewerId: number | null = null;

            if (firebaseUid) {
                try {
                    viewerId = await getUserIdFromFirebaseUid(firebaseUid);
                    console.log("Mapped Firebase UID to viewer user_id:", viewerId);
                } catch (err) {
                    console.warn("Failed to map Firebase UID to user_id:", err);
                }
            } else {
                console.log("No valid token found; treating request as unauthenticated.");
            }

            canView = await canViewPrivateGroup(viewerId ?? -1, group.group_id);
            console.log(`Viewer (user_id: ${viewerId}) can view group posts (${group.group_id})?`, canView);
            if (!canView) {
                console.log("Access denied due to group privacy settings.");
                return res.status(403).json({ message: "This group's posts are private. Try joining to view their posts!", canView });
            }
        }

        const postsRes = await pool.query(
            `SELECT * FROM post_with_likes_comments WHERE group_id = $1 ORDER BY created_at DESC;`,
            [group.group_id]
        );
        console.log(`Found ${postsRes.rows.length} posts for group #${group.group_id}`);

        return res.status(200).json({
            message: "Group posts retrieved successfully.",
            posts: postsRes.rows,
            canView
        });
    } catch (error) {
        console.error("Error fetching group posts:", error);
        return res.status(500).json({ message: "Error fetching group posts. Please try again later." });
    }
};

// get all members of a group, sorted with admins first, then mods, then regular members
export const getGroupMembers = async (req: Request, res: Response, next: NextFunction) => {
    const { group_name } = req.params;
    console.log("=== getGroupMembers called ===");
    console.log("Requested group_name:", group_name);

    // Default to true, will be set based on privacy check
    let canView = true;

    try {
        // Check if group exists and if it's private
        const groupQuery = `SELECT * FROM groups WHERE LOWER(name) = LOWER($1);`;
        const groupRes: QueryResult = await pool.query(groupQuery, [group_name]);
        console.log("Group query result:", groupRes.rows);

        if (groupRes.rows.length === 0) {
            console.warn("Group not found with name:", group_name);
            return res.status(404).json({ message: "Group not found." });
        }

        const group = groupRes.rows[0];

        if (group.is_private) {
            // Check if user is a member or the group is public
            const authHeader = req.headers.authorization;
            const firebaseUid = await getViewerIdFromAuthHeader(authHeader);
            let viewerId: number | null = null;

            if (firebaseUid) {
                try {
                    viewerId = await getUserIdFromFirebaseUid(firebaseUid);
                    console.log("Mapped Firebase UID to viewer user_id:", viewerId);
                } catch (err) {
                    console.warn("Failed to map Firebase UID to user_id:", err);
                }
            } else {
                console.log("No valid token found; treating request as unauthenticated.");
            }

            canView = await canViewPrivateGroup(viewerId ?? -1, group.group_id);
            console.log(`Viewer (user_id: ${viewerId}) can view group members (${group.group_id})?`, canView);
            if (!canView) {
                console.log("Access denied due to group privacy settings.");
                return res.status(403).json({ message: "This group's members list is private. Try joining to view their members!", canView });
            }
        }

        // Sorted: admins first, then mods, then regular members
        const membersQuery = `
            SELECT user_id, username, profile_pic, is_admin, is_mod, joined_at
            FROM group_members_view
            WHERE group_id = $1
            ORDER BY is_admin DESC, is_mod DESC, joined_at ASC;
        `;
        const membersRes = await pool.query(membersQuery, [group.group_id]);
        console.log(`Found ${membersRes.rows.length} members for group #${group.group_id}`);
        return res.status(200).json({ members: membersRes.rows, canView });
    } catch (error) {
        console.error('Error fetching group members:', error);
        return res.status(500).json({ message: 'Error fetching group members. Please try again later.' });
    }
};