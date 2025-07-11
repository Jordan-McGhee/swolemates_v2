import { pool } from "../index";
import { Request, Response, NextFunction } from "express";
import { QueryResult } from "pg";
import { createNotification, getUserInfo } from "../util/util";
import { getUserIdFromFirebaseUid } from "../util/util";

// create post
export const createPost = async (req: Request, res: Response, next: NextFunction) => {

    // Grab Firebase UID from request
    const firebase_uid = req.user?.uid;
    const { content, image_url, workout_id } = req.body;

    // Validations
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Content cannot be empty." });
    }

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        if (workout_id) {
            if (isNaN(Number(workout_id))) {
                return res.status(400).json({ message: "Invalid workout ID." });
            }

            const checkWorkoutQuery = "SELECT * FROM workout_with_exercises WHERE workout_id = $1";
            const checkWorkoutRes = await pool.query(checkWorkoutQuery, [workout_id]);

            if (checkWorkoutRes.rows.length === 0) {
                return res.status(404).json({ message: `Workout #${workout_id} not found.` });
            }
        }

        const createPostQuery = `
            INSERT INTO posts (user_id, content, image_url, workout_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *;
        `;

        const postResponse = await pool.query(createPostQuery, [
            user_id,
            content,
            image_url ?? null,
            workout_id ?? null,
        ]);

        return res.status(201).json({ message: "Post created.", post: postResponse.rows[0] });
    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json({ message: "Error creating post. Please try again later." });
    }
};


// edit post
export const editPost = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    const { post_id } = req.params;
    const { content, image_url, workout_id } = req.body;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Post content cannot be empty." });
    }

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        const checkPostQuery = `SELECT * FROM posts WHERE post_id = $1`;
        const checkPostResponse = await pool.query(checkPostQuery, [post_id]);

        if (checkPostResponse.rows.length === 0) {
            return res.status(404).json({ message: "Post not found." });
        }

        const postOwnerId = checkPostResponse.rows[0].user_id;
        const currentWorkoutId = checkPostResponse.rows[0].workout_id;

        if (postOwnerId !== Number(user_id)) {
            return res.status(403).json({ message: "You don't have permission to edit this post." });
        }

        if (workout_id !== currentWorkoutId && workout_id) {
            const checkWorkoutQuery = `SELECT * FROM workouts WHERE workout_id = $1`;
            const checkWorkoutResponse = await pool.query(checkWorkoutQuery, [workout_id]);

            if (checkWorkoutResponse.rows.length === 0) {
                return res.status(400).json({ message: "Invalid workout ID. Workout does not exist." });
            }
        }

        const updatePostQuery = `
            UPDATE posts 
            SET content = $1, image_url = $2, workout_id = $3, updated_at = NOW()
            WHERE post_id = $4 
            RETURNING *;
        `;

        const updatedPostResponse = await pool.query(updatePostQuery, [
            content,
            image_url ?? null,
            workout_id ?? null,
            post_id,
        ]);

        return res.status(200).json({ message: "Post updated successfully.", post: updatedPostResponse.rows[0] });
    } catch (error) {
        console.error(`Error updating post #${post_id}:`, error);
        return res.status(500).json({ message: `Error updating post #${post_id}.` });
    }
};


// comment on post
export const commentOnPost = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    const { post_id } = req.params;
    const { content } = req.body;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content cannot be empty." });
    }

    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        await client.query("BEGIN");

        const checkPostQuery = "SELECT post_id, user_id FROM posts WHERE post_id = $1";
        const checkPostResponse = await client.query(checkPostQuery, [post_id]);

        if (checkPostResponse.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: `Post #${post_id} not found.` });
        }

        const postOwnerId = checkPostResponse.rows[0].user_id;

        const addCommentQuery = `
            INSERT INTO comments (post_id, user_id, content, created_at, updated_at) 
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING *;
        `;
        const addCommentResponse = await client.query(addCommentQuery, [post_id, user_id, content.trim()]);

        if (postOwnerId !== user_id) {
            const commenterDetails: any = await getUserInfo(user_id, client);
            const notificationMessage = `${commenterDetails.username} commented on your post.`;
            await createNotification({
                sender_id: user_id,
                sender_username: commenterDetails.username,
                sender_profile_pic: commenterDetails.profile_pic,
                receiver_id: postOwnerId,
                type: "comment",
                message: notificationMessage,
                reference_type: "post",
                reference_id: Number(post_id),
                client,
            });
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Comment added successfully!",
            post_id,
            comment: addCommentResponse.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Error commenting on post #${post_id}:`, error);
        return res.status(500).json({ message: `Error commenting on post #${post_id}.` });
    } finally {
        client.release();
    }
};


// edit comment
export const editCommentOnPost = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    const { post_id, comment_id } = req.params;
    const { content } = req.body;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }
    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Content cannot be empty." });
    }

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        const checkCommentQuery = `SELECT user_id FROM comments WHERE comment_id = $1;`;
        const checkCommentResponse = await pool.query(checkCommentQuery, [comment_id]);

        if (checkCommentResponse.rows.length === 0) {
            return res.status(404).json({ message: "Comment not found." });
        }

        if (checkCommentResponse.rows[0].user_id !== user_id) {
            return res.status(403).json({ message: "You don't have permission to edit this comment." });
        }

        const updateCommentQuery = `
            UPDATE comments 
            SET content = $1, updated_at = NOW()
            WHERE comment_id = $2
            RETURNING *;
        `;
        const updatedCommentResponse = await pool.query(updateCommentQuery, [content, comment_id]);

        return res.status(200).json({ message: "Comment updated successfully.", comment: updatedCommentResponse.rows[0] });
    } catch (error) {
        console.error(`Error updating comment #${comment_id}:`, error);
        return res.status(500).json({ message: `Error updating comment #${comment_id}. Please try again later.` });
    }
};

// delete comment
export const deletePostComment = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    const { post_id, comment_id } = req.params;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }
    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        const getCommentQuery = `
            SELECT c.user_id AS comment_owner, p.user_id AS post_owner
            FROM comments c
            JOIN posts p ON c.post_id = p.post_id
            WHERE c.comment_id = $1
        `;
        const commentResult = await pool.query(getCommentQuery, [comment_id]);

        if (commentResult.rows.length === 0) {
            return res.status(404).json({ message: `Comment #${comment_id} not found.` });
        }

        const { comment_owner, post_owner } = commentResult.rows[0];

        if (user_id !== comment_owner && user_id !== post_owner) {
            return res.status(403).json({ message: "You are not authorized to delete this comment." });
        }

        const deleteCommentQuery = `DELETE FROM comments WHERE comment_id = $1 RETURNING *;`;
        const deleteCommentResponse = await pool.query(deleteCommentQuery, [comment_id]);

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
    const firebase_uid = req.user?.uid;
    const { post_id } = req.params;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        const checkPostQuery = `SELECT * FROM posts WHERE post_id = $1`;
        const checkPostRes = await client.query(checkPostQuery, [post_id]);

        if (checkPostRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: `Post #${post_id} not found.` });
        }

        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND post_id = $2`;
        const checkLikeResponse = await client.query(checkLikeQuery, [user_id, post_id]);

        if (checkLikeResponse.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "You have already liked this post." });
        }

        const likeQuery = `
            INSERT INTO likes (user_id, post_id, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *;
        `;
        const likeResponse = await client.query(likeQuery, [user_id, post_id]);

        const postOwnerId = checkPostRes.rows[0].user_id;

        if (postOwnerId !== user_id) {
            const likerDetails: any = await getUserInfo(user_id, client);
            const notificationMessage = `${likerDetails.username} liked your post.`;

            await createNotification({
                sender_id: user_id,
                sender_username: likerDetails.username,
                sender_profile_pic: likerDetails.profile_pic,
                receiver_id: postOwnerId,
                type: "like",
                message: notificationMessage,
                reference_type: "post",
                reference_id: Number(post_id),
                client
            });
        }

        await client.query("COMMIT");

        return res.status(201).json({ message: "Post liked successfully!", like: likeResponse.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Error liking post #${post_id}:`, error);
        return res.status(500).json({ message: `Error liking post #${post_id}. Please try again later.` });
    } finally {
        client.release();
    }
};

// unlike post
export const unlikePost = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    const { post_id } = req.params;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        const checkPostQuery = `SELECT * FROM posts WHERE post_id = $1`;
        const checkPostRes = await pool.query(checkPostQuery, [post_id]);

        if (checkPostRes.rows.length === 0) {
            return res.status(404).json({ message: `Post #${post_id} not found.` });
        }

        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND post_id = $2`;
        const checkLikeResponse = await pool.query(checkLikeQuery, [user_id, post_id]);

        if (checkLikeResponse.rows.length === 0) {
            return res.status(404).json({ message: "You haven't liked this post yet." });
        }

        const unlikeQuery = `DELETE FROM likes WHERE user_id = $1 AND post_id = $2 RETURNING *;`;
        const unlikeResponse = await pool.query(unlikeQuery, [user_id, post_id]);

        return res.status(200).json({ message: "Post unliked successfully!", removedLike: unlikeResponse.rows[0] });
    } catch (error) {
        console.error(`Error unliking post #${post_id}:`, error);
        return res.status(500).json({ message: `Error unliking post #${post_id}. Please try again later.` });
    }
};

// delete post
export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    const { post_id } = req.params;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (!post_id || isNaN(Number(post_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        const checkPostQuery = `SELECT user_id FROM posts WHERE post_id = $1`;
        const checkPostResponse = await client.query(checkPostQuery, [post_id]);

        if (checkPostResponse.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Post not found." });
        }

        if (checkPostResponse.rows[0].user_id !== user_id) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "You are not authorized to delete this post." });
        }

        await client.query(`DELETE FROM likes WHERE post_id = $1`, [post_id]);
        await client.query(`DELETE FROM comments WHERE post_id = $1`, [post_id]);

        const deletePostQuery = `DELETE FROM posts WHERE post_id = $1 RETURNING *;`;
        const deletePostResponse = await client.query(deletePostQuery, [post_id]);

        await client.query("COMMIT");

        return res.status(200).json({ message: "Post deleted successfully.", deletedPost: deletePostResponse.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Error deleting post #${post_id}:`, error);
        return res.status(500).json({ message: `Error deleting post #${post_id}. Please try again later.` });
    } finally {
        client.release();
    }
};