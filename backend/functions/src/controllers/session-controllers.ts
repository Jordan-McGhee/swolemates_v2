import { pool } from "../index";
import { Request, Response, NextFunction } from "express";
import { createNotification, getUserInfo, getIdFromAuthHeader, getUserIdFromFirebaseUid } from "../util/util";

// Create session
export const createSession = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);

    const { workout_id, duration_minutes, total_distance_miles, notes, difficulty, exercises } = req.body;

    // Validations
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized. You must be signed in to log a session." });
    }
    if (!workout_id || typeof workout_id !== "number") {
        return res.status(400).json({ message: "Session must include a valid workout_id." });
    }
    if (difficulty && (typeof difficulty !== "number" || difficulty < 1 || difficulty > 5)) {
        return res.status(400).json({ message: "Difficulty must be an integer between 1 and 5." });
    }
    if (!Array.isArray(exercises) || exercises.length < 1) {
        return res.status(400).json({ message: "Session must include at least one exercise performance." });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Insert session
        const sessionRes = await client.query(
            `INSERT INTO workout_sessions (workout_id, user_id, duration_minutes, total_distance_miles, notes, difficulty, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING session_id`,
            [workout_id, user_id, duration_minutes ?? null, total_distance_miles ?? null, notes ?? null, difficulty ?? null]
        );
        const session_id = sessionRes.rows[0].session_id;

        // Get all target values for this workout's exercises in one query
        const targetsRes = await client.query(
            `SELECT exercise_id, sets, reps, duration_seconds, distance_miles
            FROM workout_exercises 
            WHERE workout_id = $1`,
            [workout_id]
        );

        // Create a map for quick lookup of targets by exercise_id
        const targetsMap = new Map();
        targetsRes.rows.forEach(row => {
            const target: any = {};
            if (row.sets !== null) target.sets = row.sets;
            if (row.reps !== null) target.reps = row.reps;
            if (row.duration_seconds !== null) target.duration_seconds = row.duration_seconds;
            if (row.distance_miles !== null) target.distance_miles = row.distance_miles;
            targetsMap.set(row.exercise_id, target);
        });

        for (const ex of exercises) {
            const {
                exercise_id,
                weight_used,
                sets_completed,
                reps_completed,
                duration_seconds,
                distance_miles,
                pace_minutes_per_mile
            } = ex;

            if (!exercise_id || typeof exercise_id !== "number") {
                await client.query("ROLLBACK");
                return res.status(400).json({ message: "Each exercise must include a valid exercise_id." });
            }

            // Get the target for this exercise
            const target = targetsMap.get(exercise_id);
            if (!target) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message: `Exercise ${exercise_id} is not part of workout ${workout_id}.`
                });
            }

            await client.query(
                `INSERT INTO session_exercises (
                    session_id, exercise_id, weight_used, sets_completed, reps_completed, 
                    duration_seconds, distance_miles, pace_minutes_per_mile, exercise_target, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
                [
                    session_id,
                    exercise_id,
                    weight_used ?? null,
                    sets_completed ?? null,
                    reps_completed ?? null,
                    duration_seconds ?? null,
                    distance_miles ?? null,
                    pace_minutes_per_mile ?? null,
                    JSON.stringify(target)
                ]
            );
        }

        await client.query("COMMIT");
        return res.status(201).json({ message: "Session logged successfully.", session_id });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("[createSession] Error creating session:", error);
        return res.status(500).json({ message: "Error logging session. Please try again later." });
    } finally {
        client.release();
    }
};

// edit session
export const editSession = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);

    const { session_id, workout_id, duration_minutes, total_distance_miles, notes, difficulty, exercises } = req.body;

    // Validations
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized. You must be signed in to edit a session." });
    }
    if (!session_id || typeof session_id !== "number") {
        return res.status(400).json({ message: "Session must include a valid session_id." });
    }
    if (difficulty && (typeof difficulty !== "number" || difficulty < 1 || difficulty > 5)) {
        return res.status(400).json({ message: "Difficulty must be an integer between 1 and 5." });
    }
    if (!Array.isArray(exercises) || exercises.length < 1) {
        return res.status(400).json({ message: "Session must include at least one exercise performance." });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check session ownership
        const sessionCheck = await client.query(
            `SELECT user_id FROM workout_sessions WHERE session_id = $1`,
            [session_id]
        );
        if (sessionCheck.rowCount === 0 || sessionCheck.rows[0].user_id !== user_id) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "You do not have permission to edit this session." });
        }

        // Update session
        await client.query(
            `UPDATE workout_sessions
            SET workout_id = $1, duration_minutes = $2, total_distance_miles = $3, notes = $4, difficulty = $5, updated_at = NOW()
            WHERE session_id = $6`,
            [
                workout_id ?? null,
                duration_minutes ?? null,
                total_distance_miles ?? null,
                notes ?? null,
                difficulty ?? null,
                session_id
            ]
        );

        // Get the workout_id (in case it changed) for target lookup
        const finalWorkoutId = workout_id ?? (await client.query(
            `SELECT workout_id FROM workout_sessions WHERE session_id = $1`,
            [session_id]
        )).rows[0].workout_id;

        // Get all target values for this workout's exercises
        const targetsRes = await client.query(
            `SELECT exercise_id, sets, reps, duration_seconds, distance_miles
            FROM workout_exercises 
            WHERE workout_id = $1`,
            [finalWorkoutId]
        );

        // Create a map for quick lookup of targets by exercise_id
        const targetsMap = new Map();
        targetsRes.rows.forEach(row => {
            const target: any = {};
            if (row.sets !== null) target.sets = row.sets;
            if (row.reps !== null) target.reps = row.reps;
            if (row.duration_seconds !== null) target.duration_seconds = row.duration_seconds;
            if (row.distance_miles !== null) target.distance_miles = row.distance_miles;
            targetsMap.set(row.exercise_id, target);
        });

        // Remove old exercises
        await client.query(
            `DELETE FROM session_exercises WHERE session_id = $1`,
            [session_id]
        );

        // Insert new exercises with targets
        for (const ex of exercises) {
            const {
                exercise_id,
                weight_used,
                sets_completed,
                reps_completed,
                duration_seconds,
                distance_miles,
                pace_minutes_per_mile
            } = ex;

            if (!exercise_id || typeof exercise_id !== "number") {
                await client.query("ROLLBACK");
                return res.status(400).json({ message: "Each exercise must include a valid exercise_id." });
            }

            // Get the target for this exercise
            const target = targetsMap.get(exercise_id);
            if (!target) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message: `Exercise ${exercise_id} is not part of workout ${finalWorkoutId}.`
                });
            }

            await client.query(
                `INSERT INTO session_exercises (
                    session_id, exercise_id, weight_used, sets_completed, reps_completed, 
                    duration_seconds, distance_miles, pace_minutes_per_mile, exercise_target, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
                [
                    session_id,
                    exercise_id,
                    weight_used ?? null,
                    sets_completed ?? null,
                    reps_completed ?? null,
                    duration_seconds ?? null,
                    distance_miles ?? null,
                    pace_minutes_per_mile ?? null,
                    JSON.stringify(target)
                ]
            );
        }

        await client.query("COMMIT");
        return res.status(200).json({ message: "Session updated successfully.", session_id });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("[editSession] Error editing session:", error);
        return res.status(500).json({ message: "Error editing session. Please try again later." });
    } finally {
        client.release();
    }
};

// Comment on session
export const commentOnSession = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { session_id } = req.params;
    const { content } = req.body;

    // Validations
    if (!session_id || isNaN(Number(session_id))) {
        return res.status(400).json({ message: "Invalid session ID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content cannot be empty." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if session exists and get the owner of the session
        const checkSessionQuery = `
            SELECT session_id, user_id 
            FROM workout_sessions 
            WHERE session_id = $1
        `;
        const checkSessionRes = await client.query(checkSessionQuery, [session_id]);

        if (checkSessionRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Session #${session_id} not found.` });
        }

        const sessionOwnerId = checkSessionRes.rows[0].user_id;

        // Insert comment into session_comments table
        const addCommentQuery = `
            INSERT INTO comments (session_id, user_id, content, created_at, updated_at) 
            VALUES ($1, $2, $3, NOW(), NOW()) 
            RETURNING *;
        `;
        const addCommentRes = await client.query(addCommentQuery, [session_id, user_id, content.trim()]);

        // Create a notification for the session owner if the commenter is not the owner
        if (sessionOwnerId !== user_id) {
            const commenterDetails = await getUserInfo(user_id, client);
            const notificationMessage = `${commenterDetails.username} commented on your session.`;
            await createNotification({
                sender_id: user_id,
                sender_username: commenterDetails.username,
                sender_profile_pic: commenterDetails.profile_pic ?? "",
                receiver_id: sessionOwnerId,
                type: 'comment',
                message: notificationMessage,
                reference_type: 'session',
                reference_id: Number(session_id),
                client,
            });
        }

        await client.query('COMMIT');

        return res.status(201).json({
            message: "Comment added successfully!",
            session_id,
            comment: addCommentRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[commentOnSession] Error commenting on session #${session_id}:`, error);
        return res.status(500).json({ message: `Error commenting on session #${session_id}. Please try again later.` });
    } finally {
        client.release();
    }
};

// Edit comment on session
export const editCommentOnSession = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { session_id, comment_id } = req.params;
    const { content } = req.body;

    // Validations
    if (!session_id || isNaN(Number(session_id))) {
        return res.status(400).json({ message: "Invalid session ID." });
    }

    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Content cannot be empty." });
    }

    const client = await pool.connect();
    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if comment exists and retrieve its owner
        const checkCommentQuery = `
            SELECT user_id, session_id FROM comments WHERE comment_id = $1 AND session_id = $2;
        `;
        const checkCommentResponse = await client.query(checkCommentQuery, [comment_id, session_id]);

        if (checkCommentResponse.rows.length === 0) {
            return res.status(404).json({ message: "Comment not found for this session." });
        }

        // Check if the current user is the owner of the comment
        if (checkCommentResponse.rows[0].user_id !== user_id) {
            return res.status(403).json({ message: "You don't have permission to edit this comment." });
        }

        // Update query
        const updateCommentQuery = `
            UPDATE comments 
            SET content = $1, updated_at = NOW()
            WHERE comment_id = $2 AND session_id = $3
            RETURNING *;
        `;

        const updatedCommentResponse = await client.query(updateCommentQuery, [content.trim(), comment_id, session_id]);

        return res.status(200).json({ message: "Comment updated successfully.", comment: updatedCommentResponse.rows[0] });
    } catch (error) {
        console.error(`[editCommentOnSession] Error updating comment #${comment_id}:`, error);
        return res.status(500).json({ message: `Error updating comment #${comment_id}: ${error}` });
    } finally {
        client.release();
    }
};

// Delete comment on session
export const deleteCommentOnSession = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { session_id, comment_id } = req.params;

    // Validations
    if (!session_id || isNaN(Number(session_id))) {
        return res.status(400).json({ message: "Invalid session ID." });
    }

    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    const client = await pool.connect();
    try {
        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Retrieve comment info and check ownership by joining with workout_sessions
        const getCommentQuery = `
            SELECT c.user_id AS comment_owner, s.user_id AS session_owner
            FROM comments c
            JOIN workout_sessions s ON c.session_id = s.session_id
            WHERE c.comment_id = $1 AND c.session_id = $2
        `;
        const commentResult = await client.query(getCommentQuery, [comment_id, session_id]);

        if (commentResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ message: `Comment #${comment_id} not found for session #${session_id}.` });
        }

        const { comment_owner, session_owner } = commentResult.rows[0];

        // Check if user is authorized to delete (must be comment owner OR session owner)
        if (user_id !== comment_owner && user_id !== session_owner) {
            client.release();
            return res.status(403).json({ message: "You are not authorized to delete this comment." });
        }

        // Delete the comment
        const deleteCommentQuery = `DELETE FROM comments WHERE comment_id = $1 AND session_id = $2 RETURNING *;`;
        const deleteCommentResponse = await client.query(deleteCommentQuery, [comment_id, session_id]);

        client.release();
        return res.status(200).json({
            message: `Comment #${comment_id} deleted successfully.`,
            deletedComment: deleteCommentResponse.rows[0]
        });
    } catch (error) {
        client.release();
        console.error(`Error deleting comment #${comment_id}:`, error);
        return res.status(500).json({ message: `Error deleting comment #${comment_id}. Please try again later.` });
    }
};

// like session
export const likeSession = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { session_id } = req.params;

    // Validations
    if (!session_id || isNaN(Number(session_id))) {
        return res.status(400).json({ message: "Invalid session ID." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if session exists and get owner
        const checkSessionQuery = `
            SELECT session_id, user_id 
            FROM workout_sessions 
            WHERE session_id = $1
        `;
        const checkSessionRes = await client.query(checkSessionQuery, [session_id]);

        if (checkSessionRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Session #${session_id} not found.` });
        }

        const sessionOwnerId = checkSessionRes.rows[0].user_id;

        // Check if already liked
        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND session_id = $2`;
        const checkLikeRes = await client.query(checkLikeQuery, [user_id, session_id]);

        if (checkLikeRes.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: "You have already liked this session." });
        }

        // Insert like
        const likeQuery = `
            INSERT INTO likes (user_id, session_id, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *;
        `;
        const likeRes = await client.query(likeQuery, [user_id, session_id]);

        // Notification if not owner
        if (sessionOwnerId !== user_id) {
            const likerDetails = await getUserInfo(user_id, client);
            const notificationMessage = `${likerDetails.username} liked your session.`;
            await createNotification({
                sender_id: user_id,
                sender_username: likerDetails.username,
                sender_profile_pic: likerDetails.profile_pic ?? "",
                receiver_id: sessionOwnerId,
                type: 'like',
                message: notificationMessage,
                reference_type: 'session',
                reference_id: Number(session_id),
                client,
            });
        }

        await client.query('COMMIT');

        return res.status(201).json({ message: "Session liked successfully!", like: likeRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error liking session #${session_id}:`, error);
        return res.status(500).json({ message: `Error liking session #${session_id}. Please try again later.` });
    } finally {
        client.release();
    }
};

// unlike session
export const unlikeSession = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { session_id } = req.params;

    // Validations
    if (!session_id || isNaN(Number(session_id))) {
        return res.status(400).json({ message: "Invalid session ID." });
    }

    const client = await pool.connect();

    try {
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if session exists
        const checkSessionQuery = `SELECT * FROM workout_sessions WHERE session_id = $1`;
        const checkSessionRes = await client.query(checkSessionQuery, [session_id]);

        if (checkSessionRes.rows.length === 0) {
            client.release();
            return res.status(404).json({ message: `Session #${session_id} not found.` });
        }

        // Check if liked
        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND session_id = $2`;
        const checkLikeRes = await client.query(checkLikeQuery, [user_id, session_id]);

        if (checkLikeRes.rows.length === 0) {
            client.release();
            return res.status(404).json({ message: "You haven't liked this session yet." });
        }

        // Remove like
        const unlikeQuery = `DELETE FROM likes WHERE user_id = $1 AND session_id = $2 RETURNING *;`;
        const unlikeRes = await client.query(unlikeQuery, [user_id, session_id]);

        client.release();
        return res.status(200).json({ message: "Session unliked successfully!", removedLike: unlikeRes.rows[0] });
    } catch (error) {
        client.release();
        console.error(`Error unliking session #${session_id}:`, error);
        return res.status(500).json({ message: `Error unliking session #${session_id}. Please try again later.` });
    }
};

// delete session
export const deleteSession = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { session_id } = req.params;

    if (!session_id || isNaN(Number(session_id))) {
        return res.status(400).json({ message: "Invalid session ID." });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if the session exists and belongs to the user
        const checkSessionQuery = `SELECT user_id FROM workout_sessions WHERE session_id = $1`;
        const checkSessionResponse = await client.query(checkSessionQuery, [session_id]);

        if (checkSessionResponse.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Session not found." });
        }

        if (checkSessionResponse.rows[0].user_id !== user_id) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "You are not authorized to delete this session." });
        }

        // Delete related likes, comments, and session_exercises
        await client.query(`DELETE FROM likes WHERE session_id = $1`, [session_id]);
        await client.query(`DELETE FROM comments WHERE session_id = $1`, [session_id]);
        await client.query(`DELETE FROM session_exercises WHERE session_id = $1`, [session_id]);

        // Delete the session
        const deleteSessionQuery = `DELETE FROM workout_sessions WHERE session_id = $1 RETURNING *;`;
        const deleteSessionResponse = await client.query(deleteSessionQuery, [session_id]);

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Session deleted successfully.",
            deletedSession: deleteSessionResponse.rows[0]
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Error deleting session #${session_id}:`, error);
        return res.status(500).json({ message: "Error deleting session. Please try again later." });
    } finally {
        client.release();
    }
};