import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
import { QueryResult } from "pg";
import { checkIfUsernameExists } from "../util/util";

// public controllers - don't require firebaseUID

// blank function
// export const fnName = async (req: Request, res: Response, next: NextFunction) => {}

// Check username availability
export const checkUsernameAvailability = async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.body;

    try {
        const usernameExists = await checkIfUsernameExists(username);

        if (usernameExists) {
            return res.status(400).json({ message: "Username is already taken." });
        }

        return res.status(200).json({ message: "Username is available." });
    } catch (error) {
        console.error("Error checking username availability:", error);
        return res.status(500).json({ message: `Error checking username availability: ${error}` });
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
    const { user_id } = req.params;
    const userQuery: string = "SELECT user_id, username, profile_pic, bio, created_at, updated_at FROM users WHERE user_id = $1";

    try {
        const userResponse: QueryResult = await pool.query(userQuery, [user_id]);
        if (userResponse.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ message: "Got user.", user: userResponse.rows[0] });
    } catch (error) {
        console.error("Error getting user:", error);
        return res.status(500).json({ message: `Error getting user: ${error}` });
    }
};

// Get user's friends
export const getUserFriends = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;

    try {
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
            SELECT user_id, username, profile_pic
            FROM users
            WHERE user_id = ANY($1);
        `;

        // Get friends' details using the friend_ids
        const userResult: QueryResult = await pool.query(userQuery, [friendIds]);

        return res.status(200).json(userResult.rows);
    } catch (error) {
        console.error('Error fetching user friends:', error);
        return res.status(500).json({ message: 'Error fetching user friends. Please try again later.' });
    }
};

// posts

// get all posts from user
export const getAllUserPosts = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;

    // Validate user_id
    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        // Check if user exists
        const checkUserQuery = "SELECT * FROM users WHERE user_id = $1";
        const checkUserRes: QueryResult = await pool.query(checkUserQuery, [user_id]);

        if (checkUserRes.rows.length === 0) {
            return res.status(404).json({ message: `User #${user_id} not found.` });
        }

        // Fetch user's posts
        const getAllUserPostsQuery = "SELECT * FROM post_with_likes_comments WHERE user_id = $1 AND group_id = NULL ORDER BY created_at DESC";
        const allUserPostsRes: QueryResult = await pool.query(getAllUserPostsQuery, [user_id]);

        return res.status(200).json({
            message: `Retrieved all posts from user #${user_id}`,
            posts: allUserPostsRes.rows,
            user_id: user_id
        });
    } catch (error) {
        console.error(`Error retrieving posts from user #${user_id}:`, error);
        return res.status(500).json({ message: `Error retrieving posts from user #${user_id}. Please try again later.` });
    }
};

// get single post
export const getSinglePost = async (req: Request, res: Response, next: NextFunction) => {
    const { post_id } = req.params;

    // Validate post_id
    if (!post_id || isNaN(Number(post_id))) {
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

        // Check if post exists
        if (postResponse.rows.length === 0) {
            return res.status(404).json({ message: "Post not found." });
        }

        const post = postResponse.rows[0];
        let workout = null;

        // If the post is linked to a workout, fetch the workout details
        if (post.workout_id) {
            try {
                const workoutResponse: QueryResult = await pool.query(getWorkoutQuery, [post.workout_id]);

                if (workoutResponse.rows.length > 0) {
                    workout = workoutResponse.rows[0];
                }
            } catch (error) {
                console.error(`Error fetching workout for post #${post_id}:`, error);
            }
        }

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
    const { user_id } = req.params;

    // Validate user_id
    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        // Check if user exists
        const checkUserQuery = "SELECT * FROM users WHERE user_id = $1";
        const checkUserRes: QueryResult = await pool.query(checkUserQuery, [user_id]);

        if (checkUserRes.rows.length === 0) {
            return res.status(404).json({ message: `User #${user_id} not found.` });
        }

        // Fetch user's workouts
        const getWorkoutsByUserQuery = "SELECT * FROM workouts_with_likes_comments WHERE user_id = $1 ORDER BY workout_created_at DESC";
        const getWorkoutsByUserRes: QueryResult = await pool.query(getWorkoutsByUserQuery, [user_id]);

        return res.status(200).json({
            message: `Got all workouts created by user #${user_id}`,
            workouts: getWorkoutsByUserRes.rows,
            user_id: user_id
        });
    } catch (error) {
        console.error(`Error retrieving workouts created by user #${user_id}:`, error);
        return res.status(500).json({ message: `Error retrieving workouts created by user #${user_id}. Please try again later.` });
    }
};


// get single workout
export const getSingleWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { workout_id } = req.params

    // Validate workout_id
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    // Query for the post
    const getSingleWorkoutQuery = `SELECT * FROM workouts_with_likes_comments WHERE workout_id = $1`;

    try {
        // get the workout (this must succeed)
        const workoutResponse: QueryResult = await pool.query(getSingleWorkoutQuery, [workout_id])

        // check that workout exists
        if (workoutResponse.rows.length === 0) {
            return res.status(404).json({ message: "Workout not found" })
        }

        const workout = workoutResponse.rows[0]

        return res.status(200).json({
            message: "Got workout!",
            workout,
            workout_user_id: workout.user_id,
            likes: workout.likes,
            comments: workout.comments
        });

    } catch (error) {
        console.error(`Error retrieving post #${workout_id}:`, error);
        return res.status(500).json({ message: `Error retrieving post #${workout_id}. Please try again later.` });
    }
}

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