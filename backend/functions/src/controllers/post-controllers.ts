import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
import { QueryResult } from "pg";
// import { generateToken, checkIfUsernameExists, isEmailFormat } from "../util/util";

// blank function
// export const fnName = async (req: Request, res: Response, next: NextFunction) => {}

// get all posts from user
export const getAllUserPosts = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;

    // Validate user_id
    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    // Update query to order posts by created_at in descending order
    const getAllUserPostsQuery = `SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC`;

    try {
        const allUserPostsResponse: QueryResult = await pool.query(getAllUserPostsQuery, [user_id]);

        return res.status(200).json({
            message: `Retrieved all posts from user #${user_id}`,
            posts: allUserPostsResponse.rows,
            user_id: user_id
        });
    } catch (error) {
        console.error(`Error retrieving posts from user #${user_id}:`, error);
        return res.status(500).json({ message: `Error retrieving posts from user #${user_id}: ${error}` });
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
    const getSinglePostQuery = `SELECT * FROM posts WHERE post_id = $1`;

    // Query for likes - pulls username, profile pic and id for each user
    const getLikesQuery = `
        SELECT users.user_id, users.username, users.profile_pic 
        FROM likes
        INNER JOIN users ON likes.user_id = users.user_id
        WHERE likes.post_id = $1;
    `;

    // Query for comments - pulls username, profile pic, and comment info
    const getCommentsQuery = `
        SELECT comments.comment_id, users.username, users.profile_pic, comments.content, comments.created_at, comments.updated_at
        FROM comments
        JOIN users ON comments.user_id = users.user_id
        WHERE comments.post_id = $1
        ORDER BY comments.created_at ASC
    `;

    try {
        // Get the post (this must succeed)
        const postResponse: QueryResult = await pool.query(getSinglePostQuery, [post_id]);

        // Check if post exists
        if (postResponse.rows.length === 0) {
            return res.status(404).json({ message: "Post not found." });
        }

        const post = postResponse.rows[0];

        // empty arrays for likes and comments
        let likes = []; let comments = [];

        // Try to get likes and comments from db, but don't fail everything if it breaks
        try {
            const likesResponse: QueryResult = await pool.query(getLikesQuery, [post_id]);
            likes = likesResponse.rows;
        } catch (error) {
            console.error(`Error fetching likes for post #${post_id}:`, error);
        }

        try {
            const commentsResponse: QueryResult = await pool.query(getCommentsQuery, [post_id]);
            comments = commentsResponse.rows;
        } catch (error) {
            console.error(`Error fetching comments for post #${post_id}:`, error);
        }

        return res.status(200).json({
            message: "Got post!",
            post,
            post_user_id: post.user_id,
            likes,
            comments
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

    const createPostQuery = `
        INSERT INTO posts (user_id, content, image_url, workout_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *;
    `;

    try {
        const postResponse: QueryResult = await pool.query(createPostQuery, [
            user_id,
            content,
            image_url ?? null, // Ensure null if not provided
            workout_id ?? null, // Ensure null if not provided
        ]);

        return res.status(201).json({ message: "Post created.", post: postResponse.rows[0] });
    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json({ message: `Error creating post. ${error}` });
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

        // Check if query returns a single post
        if (checkPostResponse.rows.length === 0) {
            return res.status(404).json({ message: "Post not found." });
        }

        // grab post creator's id
        const postOwnerId = checkPostResponse.rows[0].user_id;

        // Validate user_id and check ownership (must match user_id from the post in order to edit)
        if (!user_id || isNaN(Number(user_id))) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        if (postOwnerId !== Number(user_id)) {
            return res.status(403).json({ message: "You don't have permission to edit this post." });
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

    try {
        // Check if post exists
        const checkPostQuery = "SELECT post_id FROM posts WHERE post_id = $1";
        const checkPostResponse: QueryResult = await pool.query(checkPostQuery, [post_id]);

        if (checkPostResponse.rows.length === 0) {
            return res.status(404).json({ message: `Post #${post_id} not found. Cannot add comment.` });
        }

        // Insert comment
        const addCommentQuery = `
            INSERT INTO comments (post_id, user_id, content, created_at, updated_at) 
            VALUES ($1, $2, $3, NOW(), NOW()) 
            RETURNING *;
        `;

        const addCommentResponse: QueryResult = await pool.query(addCommentQuery, [post_id, user_id, content.trim()]);

        return res.status(201).json({
            message: "Comment added successfully!",
            post_id,
            comment: addCommentResponse.rows[0]
        });

    } catch (error) {
        console.error(`Error commenting on post #${post_id}:`, error);
        return res.status(500).json({ message: `Error commenting on post #${post_id}. Please try again later.` });
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
        // Check if the user already liked the post
        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND post_id = $2`;
        const checkLikeResponse: QueryResult = await pool.query(checkLikeQuery, [user_id, post_id]);

        if (checkLikeResponse.rows.length > 0) {
            return res.status(409).json({ message: "You have already liked this post." });
        }

        // Insert like into likes table
        const likeQuery = `
            INSERT INTO likes (user_id, post_id, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *;
        `;
        const likeResponse: QueryResult = await pool.query(likeQuery, [user_id, post_id]);

        return res.status(201).json({ message: "Post liked successfully!", like: likeResponse.rows[0] });
    } catch (error) {
        console.error(`Error liking post #${post_id}:`, error);
        return res.status(500).json({ message: `Error liking post #${post_id}. Please try again later.` });
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

