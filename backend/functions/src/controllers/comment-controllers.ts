import { pool } from "../index";
import { Request, Response, NextFunction } from "express";
// import { QueryResult } from "pg";
import { createNotification, getUserInfo } from "../util/util";
import { getUserIdFromFirebaseUid, getIdFromAuthHeader } from "../util/util";

// like comment
export const likeComment = async (req: Request, res: Response, next: NextFunction) => {
    console.log("Liking comment...");
    console.log("Request params:", req.params);

    // Grab Firebase UID from auth header
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    console.log("Decoded Firebase UID:", firebase_uid);

    const { comment_id } = req.params;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "User not found." });
        }
        console.log("User ID from Firebase UID:", user_id);

        const checkCommentQuery = `SELECT * FROM comments WHERE comment_id = $1`;
        const checkCommentRes = await client.query(checkCommentQuery, [comment_id]);

        if (checkCommentRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: `Comment #${comment_id} not found.` });
        }

        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND comment_id = $2`;
        const checkLikeResponse = await client.query(checkLikeQuery, [user_id, comment_id]);

        if (checkLikeResponse.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "You have already liked this comment." });
        }

        const likeQuery = `
            INSERT INTO likes (user_id, comment_id, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *;
        `;
        const likeResponse = await client.query(likeQuery, [user_id, comment_id]);

        const commentOwnerId = checkCommentRes.rows[0].user_id;

        if (commentOwnerId !== user_id) {
            const likerDetails: any = await getUserInfo(user_id, client);
            const notificationMessage = `${likerDetails.username} liked your comment.`;

            await createNotification({
                sender_id: user_id,
                sender_username: likerDetails.username,
                sender_profile_pic: likerDetails.profile_pic,
                receiver_id: commentOwnerId,
                type: "like",
                message: notificationMessage,
                reference_type: "comment",
                reference_id: Number(comment_id),
                client
            });
        }

        await client.query("COMMIT");

        return res.status(201).json({ message: "Comment liked successfully!", like: likeResponse.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Error liking comment #${comment_id}:`, error);
        return res.status(500).json({ message: `Error liking comment #${comment_id}. Please try again later.` });
    } finally {
        client.release();
    }
};

// unlike comment
export const unlikeComment = async (req: Request, res: Response, next: NextFunction) => {
    console.log("Unliking comment...");
    console.log("Request params:", req.params);

    // Grab Firebase UID from auth header
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    console.log("Decoded Firebase UID:", firebase_uid);

    const { comment_id } = req.params;

    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        if (!user_id) {
            return res.status(404).json({ message: "User not found." });
        }
        console.log("User ID from Firebase UID:", user_id);

        const checkCommentQuery = `SELECT * FROM comments WHERE comment_id = $1`;
        const checkCommentRes = await pool.query(checkCommentQuery, [comment_id]);

        if (checkCommentRes.rows.length === 0) {
            return res.status(404).json({ message: `Comment #${comment_id} not found.` });
        }

        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND comment_id = $2`;
        const checkLikeResponse = await pool.query(checkLikeQuery, [user_id, comment_id]);

        if (checkLikeResponse.rows.length === 0) {
            return res.status(404).json({ message: "You haven't liked this comment yet." });
        }

        const unlikeQuery = `DELETE FROM likes WHERE user_id = $1 AND comment_id = $2 RETURNING *;`;
        const unlikeResponse = await pool.query(unlikeQuery, [user_id, comment_id]);

        return res.status(200).json({ message: "Comment unliked successfully!", removedLike: unlikeResponse.rows[0] });
    } catch (error) {
        console.error(`Error unliking comment #${comment_id}:`, error);
        return res.status(500).json({ message: `Error unliking comment #${comment_id}. Please try again later.` });
    }
};
