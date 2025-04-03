import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
import { QueryResult } from "pg";
import { createNotification, getUserInfo } from "../util/util";

// blank function
// export const fnName = async (req: Request, res: Response, next: NextFunction) => {}

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




export const createPost = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id, content, image_url, workout_id } = req.body;

    // Validate user_id
    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    // Validate content (required field)
    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Content cannot be empty." });
    }

    try {
        // If workout_id is provided, check if it exists
        if (workout_id) {
            if (isNaN(Number(workout_id))) {
                return res.status(400).json({ message: "Invalid workout ID." });
            }

            const checkWorkoutQuery = "SELECT * FROM workout_with_exercises WHERE workout_id = $1";
            const checkWorkoutRes: QueryResult = await pool.query(checkWorkoutQuery, [workout_id]);

            if (checkWorkoutRes.rows.length === 0) {
                return res.status(404).json({ message: `Workout #${workout_id} not found.` });
            }
        }

        // Insert post
        const createPostQuery = `
            INSERT INTO posts (user_id, content, image_url, workout_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *;
        `;

        const postResponse: QueryResult = await pool.query(createPostQuery, [
            user_id,
            content,
            image_url ?? null, // Ensure null if not provided
            workout_id ?? null, // Ensure null if not provided
        ]);

        return res.status(201).json({ message: "Post created.", post: postResponse.rows[0] });

    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json({ message: "Error creating post. Please try again later." });
    }
};


// edit post
export const editPost = async (req: Request, res: Response, next: NextFunction) => {

    // Grab post ID from params
    const { post_id } = req.params;

    // Grab info that could change in post
    const { user_id, content, image_url, workout_id } = req.body;

    // Validations
    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Post content cannot be empty." });
    }

    // Check if the post exists and belongs to the user
    const checkPostQuery = `SELECT * FROM posts WHERE post_id = $1`;

    try {
        const checkPostResponse: QueryResult = await pool.query(checkPostQuery, [post_id]);

        // Check if query returns a post
        if (checkPostResponse.rows.length === 0) {
            return res.status(404).json({ message: "Post not found." });
        }

        // Grab post creator's ID and current workout_id
        const postOwnerId = checkPostResponse.rows[0].user_id;
        const currentWorkoutId = checkPostResponse.rows[0].workout_id;

        // Validate user_id and check ownership (must match user_id from the post in order to edit)
        if (!user_id || isNaN(Number(user_id))) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        if (postOwnerId !== Number(user_id)) {
            return res.status(403).json({ message: "You don't have permission to edit this post." });
        }

        // If workout_id has changed, check if the new workout_id exists in the database
        if (workout_id !== currentWorkoutId) {

            // check if workout was removed from post
            if (workout_id) {
                const checkWorkoutQuery = `SELECT * FROM workouts WHERE workout_id = $1`;
                const checkWorkoutResponse: QueryResult = await pool.query(checkWorkoutQuery, [workout_id]);

                if (checkWorkoutResponse.rows.length === 0) {
                    return res.status(400).json({ message: "Invalid workout ID. Workout does not exist." });
                }
            }
        }

        // Update query
        const updatePostQuery = `
            UPDATE posts 
            SET content = $1, image_url = $2, workout_id = $3, updated_at = NOW()
            WHERE post_id = $4 
            RETURNING *;
        `;

        const updatedPostResponse: QueryResult = await pool.query(updatePostQuery, [
            content,
            image_url ?? null,
            workout_id ?? null,
            post_id
        ]);

        return res.status(200).json({ message: "Post updated successfully.", post: updatedPostResponse.rows[0] });
    } catch (error) {
        console.error(`Error updating post #${post_id}:`, error);
        return res.status(500).json({ message: `Error updating post #${post_id}: ${error}` });
    }
};




// comment on post
export const commentOnPost = async (req: Request, res: Response, next: NextFunction) => {

    // Grab post ID from params
    const { post_id } = req.params;

    // Grab user ID and comment content from body
    const { user_id, content } = req.body;

    // Validations
    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content cannot be empty." });
    }

    // Start a transaction to save comment and create notification
    const client = await pool.connect();

    try {
        // Begin transaction
        await client.query('BEGIN');

        // Check if post exists
        const checkPostQuery = "SELECT post_id, user_id FROM posts WHERE post_id = $1";
        const checkPostResponse: QueryResult = await client.query(checkPostQuery, [post_id]);

        if (checkPostResponse.rows.length === 0) {
            // Rollback transaction if post is not found
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Post #${post_id} not found. Cannot add comment.` });
        }

        const post = checkPostResponse.rows[0];

        // Get the user who owns the post
        const postOwnerId = post.user_id;

        // Insert comment
        const addCommentQuery = `
            INSERT INTO comments (post_id, user_id, content, created_at, updated_at) 
            VALUES ($1, $2, $3, NOW(), NOW()) 
            RETURNING *;
        `;
        const addCommentResponse: QueryResult = await client.query(addCommentQuery, [post_id, user_id, content.trim()]);

        // Create a notification for the post owner (if the user commenting is not the owner)
        if (postOwnerId !== user_id) {
            // Fetch user details using client
            const commenterDetails: any = await getUserInfo(user_id, client);

            const notificationMessage = `${commenterDetails.username} commented on your post.`;
            await createNotification({
                sender_id: user_id,
                sender_username: commenterDetails.username,
                sender_profile_pic: commenterDetails.profile_pic,
                receiver_id: postOwnerId,
                type: 'comment',
                message: notificationMessage,
                reference_type: 'post',
                reference_id: Number(post_id),
                client
            });
        }

        // Commit the transaction if everything is successful
        await client.query('COMMIT');

        return res.status(201).json({
            message: "Comment added successfully!",
            post_id,
            comment: addCommentResponse.rows[0]
        });

    } catch (error) {
        // Rollback transaction if an error occurs
        await client.query('ROLLBACK');
        console.error(`Error commenting on post #${post_id}:`, error);
        return res.status(500).json({ message: `Error commenting on post #${post_id}. Please try again later.` });
    } finally {
        // Release the client back to the pool
        client.release();
    }
};


// edit comment
export const editCommentOnPost = async (req: Request, res: Response, next: NextFunction) => {
    const { post_id, comment_id } = req.params;
    const { user_id, content } = req.body;

    // Validations
    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Content cannot be empty." });
    }

    try {
        // Check if comment exists and retrieve its owner
        const checkCommentQuery = `
            SELECT user_id FROM comments WHERE comment_id = $1;
        `;
        const checkCommentResponse: QueryResult = await pool.query(checkCommentQuery, [comment_id]);

        // Check if query returns a single comment
        if (checkCommentResponse.rows.length === 0) {
            return res.status(404).json({ message: "Comment not found." });
        }

        // Check if the current user is the owner of the comment
        if (checkCommentResponse.rows[0].user_id !== Number(user_id)) {
            return res.status(403).json({ message: "You don't have permission to edit this comment." });
        }

        // Update query
        const updateCommentQuery = `
            UPDATE comments 
            SET content = $1, updated_at = NOW()
            WHERE comment_id = $2
            RETURNING *;
        `;

        const updatedCommentResponse: QueryResult = await pool.query(updateCommentQuery, [content, comment_id]);

        return res.status(200).json({ message: "Comment updated successfully.", comment: updatedCommentResponse.rows[0] });
    } catch (error) {
        console.error(`Error updating comment #${comment_id}:`, error);
        return res.status(500).json({ message: `Error updating comment #${comment_id}: ${error}` });
    }
};



// delete comment on post
export const deletePostComment = async (req: Request, res: Response, next: NextFunction) => {
    const { post_id, comment_id } = req.params;
    const { user_id } = req.body; // User attempting to delete the comment

    // Validations
    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        // Retrieve comment info and check ownership by joining with posts
        const getCommentQuery = `
            SELECT c.user_id AS comment_owner, p.user_id AS post_owner
            FROM comments c
            JOIN posts p ON c.post_id = p.post_id
            WHERE c.comment_id = $1
        `;
        const commentResult: QueryResult = await pool.query(getCommentQuery, [comment_id]);

        // Check if comment exists
        if (commentResult.rows.length === 0) {
            return res.status(404).json({ message: `Comment #${comment_id} not found.` });
        }

        const { comment_owner, post_owner } = commentResult.rows[0];

        // Check if user is authorized to delete (must be comment owner OR post owner)
        if (Number(user_id) !== comment_owner && Number(user_id) !== post_owner) {
            return res.status(403).json({ message: "You are not authorized to delete this comment." });
        }

        // Delete the comment
        const deleteCommentQuery = `DELETE FROM comments WHERE comment_id = $1 RETURNING *;`;
        const deleteCommentResponse: QueryResult = await pool.query(deleteCommentQuery, [comment_id]);

        return res.status(200).json({
            message: `Comment #${comment_id} deleted successfully.`,
            deletedComment: deleteCommentResponse.rows[0]
        });

    } catch (error) {
        console.error(`Error deleting comment #${comment_id}:`, error);
        return res.status(500).json({ message: `Error deleting comment #${comment_id}. Please try again later.` });
    }
};


// like post
export const likePost = async (req: Request, res: Response, next: NextFunction) => {
    // Grab post ID from params
    const { post_id } = req.params;

    // Grab user ID from body
    const { user_id } = req.body;

    // Validations
    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    // Start a transaction by getting a client
    const client = await pool.connect();

    try {
        // Begin transaction
        await client.query('BEGIN');

        // Check if post exists
        const checkPostQuery = `SELECT * FROM posts WHERE post_id = $1`;
        const checkPostRes: QueryResult = await client.query(checkPostQuery, [post_id]);

        if (checkPostRes.rows.length === 0) {
            // Rollback transaction if post is not found
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Post #${post_id} not found.` });
        }

        // Check if the user already liked the post
        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND post_id = $2`;
        const checkLikeResponse: QueryResult = await client.query(checkLikeQuery, [user_id, post_id]);

        if (checkLikeResponse.rows.length > 0) {
            // Rollback transaction if already liked
            await client.query('ROLLBACK');
            return res.status(409).json({ message: "You have already liked this post." });
        }

        // Insert like into likes table
        const likeQuery = `
            INSERT INTO likes (user_id, post_id, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *;
        `;
        const likeResponse: QueryResult = await client.query(likeQuery, [user_id, post_id]);

        // Get the post owner details
        const postOwnerId = checkPostRes.rows[0].user_id;

        // Create a notification for the post owner (if the user liking is not the owner)
        if (postOwnerId !== user_id) {
            // Fetch user details using client
            const likerDetails: any = await getUserInfo(user_id, client);
            const notificationMessage = `${likerDetails.username} liked your post.`;
            await createNotification({
                sender_id: user_id,
                sender_username: likerDetails.username,
                sender_profile_pic: likerDetails.profile_pic,
                receiver_id: postOwnerId,
                type: 'like',
                message: notificationMessage,
                reference_type: 'post',
                reference_id: Number(post_id),
                client
            });
        }

        // Commit the transaction if everything is successful
        await client.query('COMMIT');

        return res.status(201).json({ message: "Post liked successfully!", like: likeResponse.rows[0] });

    } catch (error) {
        // Rollback transaction if an error occurs
        await client.query('ROLLBACK');
        console.error(`Error liking post #${post_id}:`, error);
        return res.status(500).json({ message: `Error liking post #${post_id}. Please try again later.` });
    } finally {
        // Release the client back to the pool
        client.release();
    }
};



// unlike post
export const unlikePost = async (req: Request, res: Response, next: NextFunction) => {
    const { post_id } = req.params;
    const { user_id } = req.body;

    // Validations
    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        // Check if post exists
        const checkPostQuery = `SELECT * FROM posts WHERE post_id = $1`;
        const checkPostRes: QueryResult = await pool.query(checkPostQuery, [post_id]);

        if (checkPostRes.rows.length === 0) {
            return res.status(404).json({ message: `Post #${post_id} not found.` });
        }

        // Check if the user has liked the post
        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND post_id = $2`;
        const checkLikeResponse: QueryResult = await pool.query(checkLikeQuery, [user_id, post_id]);

        if (checkLikeResponse.rows.length === 0) {
            return res.status(404).json({ message: "You haven't liked this post yet." });
        }

        // Remove like from the likes table
        const unlikeQuery = `DELETE FROM likes WHERE user_id = $1 AND post_id = $2 RETURNING *;`;
        const unlikeResponse: QueryResult = await pool.query(unlikeQuery, [user_id, post_id]);

        return res.status(200).json({ message: "Post unliked successfully!", removedLike: unlikeResponse.rows[0] });
    } catch (error) {
        console.error(`Error unliking post #${post_id}:`, error);
        return res.status(500).json({ message: `Error unliking post #${post_id}. Please try again later.` });
    }
};


// delete post
export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
    const { post_id } = req.params;
    const { user_id } = req.body;

    // Validations
    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    const client = await pool.connect();

    try {

        // Begin transaction to delete likes, comments, and then the entire post
        await client.query('BEGIN');

        // Check if the post exists and belongs to the user
        const checkPostQuery = `SELECT user_id FROM posts WHERE post_id = $1`;
        const checkPostResponse: QueryResult = await client.query(checkPostQuery, [post_id]);

        if (checkPostResponse.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Post not found." });
        }

        if (checkPostResponse.rows[0].user_id !== Number(user_id)) {
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

        // Commit the transaction
        await client.query('COMMIT');

        return res.status(200).json({ message: "Post deleted successfully.", deletedPost: deletePostResponse.rows[0] });
    } catch (error) {
        // Rollback the transaction if any error occurs
        await client.query('ROLLBACK');
        console.error(`Error deleting post #${post_id}:`, error);
        return res.status(500).json({ message: `Error deleting post #${post_id}. Please try again later. ${error}` });
    } finally {
        // Release the client back to the pool
        client.release();
    }
};

