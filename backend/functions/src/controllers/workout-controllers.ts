import { pool } from "../index";
import { Request, Response, NextFunction } from "express";
import { QueryResult } from "pg";
import { createNotification, getUserInfo, getIdFromAuthHeader, getUserIdFromFirebaseUid } from "../util/util";

// Create workout
export const createWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    console.log("Decoded Firebase UID:", firebase_uid);

    const { title, description, workout_type, exercises } = req.body;

    // Validations
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized. You must be signed in to post." });
    }
    if (!title || typeof title !== "string" || !description || typeof description !== "string") {
        return res.status(400).json({ message: "Workout must include a title and description." });
    }
    if (!Array.isArray(exercises) || exercises.length < 1 || exercises.length > 10) {
        return res.status(400).json({ message: "Workout must have between 1 and 10 exercises." });
    }
    if (workout_type && !["strength", "cardio", "mobility"].includes(workout_type)) {
        return res.status(400).json({ message: "Invalid workout_type." });
    }

    const exerciseTitleSet = new Set();
    for (const ex of exercises) {
        const { title: exTitle, sets, reps, duration_seconds, distance_miles } = ex;
        if (!exTitle || typeof exTitle !== "string") {
            return res.status(400).json({ message: "Each exercise must have a title." });
        }
        const lowerTitle = exTitle.trim().toLowerCase();
        if (exerciseTitleSet.has(lowerTitle)) {
            return res.status(400).json({ message: `Duplicate exercise title detected: "${exTitle}"` });
        }
        exerciseTitleSet.add(lowerTitle);

        if (
            (sets == null || reps == null) &&
            duration_seconds == null &&
            distance_miles == null
        ) {
            return res.status(400).json({ message: "Each exercise must have at least one measurement (sets/reps, duration_seconds, or distance_miles)." });
        }
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Insert workout
        const workoutRes = await client.query(
            `INSERT INTO workouts (user_id, title, workout_type, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING workout_id`,
            [user_id, title, workout_type ?? 'strength']
        );
        const workout_id = workoutRes.rows[0].workout_id;

        for (const ex of exercises) {
            const {
                title: exTitle,
                exercise_type,
                measurement_type,
                sets,
                reps,
                duration_seconds,
                distance_miles
            } = ex;
            const lowerTitle = exTitle.trim().toLowerCase();

            // Check if exercise exists (by title, case-insensitive)
            const checkRes = await client.query(
                `SELECT exercise_id FROM exercises WHERE LOWER(title) = $1`,
                [lowerTitle]
            );

            let exercise_id;
            if (checkRes.rows.length === 0) {
                // Insert into exercises table
                const insertRes = await client.query(
                    `INSERT INTO exercises (title, exercise_type, measurement_type, created_at, updated_at)
                    VALUES ($1, $2, $3, NOW(), NOW()) RETURNING exercise_id`,
                    [
                        exTitle,
                        exercise_type ?? 'strength',
                        measurement_type ?? 'reps'
                    ]
                );
                exercise_id = insertRes.rows[0].exercise_id;
            } else {
                exercise_id = checkRes.rows[0].exercise_id;
            }

            // Insert into workout_exercises junction table
            await client.query(
                `INSERT INTO workout_exercises (
                    workout_id, exercise_id, sets, reps, duration_seconds, distance_miles, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [
                    workout_id,
                    exercise_id,
                    sets ?? null,
                    reps ?? null,
                    duration_seconds ?? null,
                    distance_miles ?? null
                ]
            );
        }

        await client.query("COMMIT");
        return res.status(201).json({ message: "Workout created successfully.", workout_id });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("[createWorkout] Error creating workout:", error);
        return res.status(500).json({ message: "Error creating workout. Please try again later." });
    } finally {
        client.release();
    }
};

// Edit workout
export const editWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    console.log("[editWorkout] Decoded Firebase UID:", firebase_uid);

    const { workout_id } = req.params;
    const { workout_title, description, workout_type, exercises } = req.body;

    // Validations
    if (!firebase_uid) {
        console.log("[editWorkout] Unauthorized: Missing Firebase UID.");
        return res.status(401).json({ message: "Unauthorized. You must be signed in to edit." });
    }
    if (!workout_id || isNaN(Number(workout_id))) {
        console.log("[editWorkout] Invalid workout ID:", workout_id);
        return res.status(400).json({ message: "Invalid workout ID." });
    }
    // if (!title || typeof title !== "string" || !description || typeof description !== "string") {
    //     console.log("[editWorkout] Invalid title/description:", title, description);
    //     return res.status(400).json({ message: "Workout must include a title and description." });
    // }
    if (!Array.isArray(exercises) || exercises.length < 1 || exercises.length > 10) {
        console.log("[editWorkout] Invalid exercises array:", exercises);
        return res.status(400).json({ message: "Workout must have between 1 and 10 exercises." });
    }
    // if (workout_type && !["strength", "cardio", "mobility"].includes(workout_type)) {
    //     console.log("[editWorkout] Invalid workout_type:", workout_type);
    //     return res.status(400).json({ message: "Invalid workout_type." });
    // }

    const exerciseTitleSet = new Set();
    for (const ex of exercises) {
        const { title: exTitle, sets, reps, duration_seconds, distance_miles } = ex;
        if (!exTitle || typeof exTitle !== "string") {
            console.log("[editWorkout] Missing exercise title:", ex);
            return res.status(400).json({ message: "Each exercise must have a title." });
        }
        const lowerTitle = exTitle.trim().toLowerCase();
        if (exerciseTitleSet.has(lowerTitle)) {
            console.log("[editWorkout] Duplicate exercise title detected:", exTitle);
            return res.status(400).json({ message: `Duplicate exercise title detected: "${exTitle}"` });
        }
        exerciseTitleSet.add(lowerTitle);

        if (
            (sets == null || reps == null) &&
            duration_seconds == null &&
            distance_miles == null
        ) {
            console.log("[editWorkout] Missing measurement for exercise:", exTitle);
            return res.status(400).json({ message: "Each exercise must have at least one measurement (sets/reps, duration_seconds, or distance_miles)." });
        }
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        console.log("[editWorkout] Editing workout for user_id:", user_id);

        // Check workout ownership
        const workoutRes = await client.query(
            `SELECT * FROM workouts WHERE workout_id = $1`,
            [workout_id]
        );
        if (workoutRes.rows.length === 0) {
            await client.query("ROLLBACK");
            console.log("[editWorkout] Workout not found:", workout_id);
            return res.status(404).json({ message: "Workout not found." });
        }
        if (workoutRes.rows[0].user_id !== user_id) {
            await client.query("ROLLBACK");
            console.log("[editWorkout] Unauthorized to edit workout:", workout_id);
            return res.status(403).json({ message: "Unauthorized to edit this workout." });
        }

        // Update workout main info
        await client.query(
            `UPDATE workouts SET title = $1, description = $2, workout_type = $3, updated_at = NOW() WHERE workout_id = $4`,
            [workout_title ?? workoutRes.rows[0].title, description ?? workoutRes.rows[0].description, workout_type ?? 'strength', workout_id]
        );
        console.log("[editWorkout] Updated workout info:", { workout_title, description, workout_type });


        // Check for existing exercises in library
        const titles = exercises.map((ex) => ex.title.trim().toLowerCase());
        const checkRes = await client.query(
            `SELECT exercise_id, LOWER(title) AS title FROM exercises WHERE LOWER(title) = ANY($1::text[])`,
            [titles]
        );
        const titleToId: Record<string, number> = {};
        checkRes.rows.forEach((r) => {
            titleToId[r.title] = r.exercise_id;
        });

        // Insert new exercises into library if needed, and build up exercise_id mapping
        for (const ex of exercises) {
            const {
                title: exTitle,
                exercise_type,
                measurement_type,
            } = ex;
            const lowerTitle = exTitle.trim().toLowerCase();
            let exercise_id = titleToId[lowerTitle];
            if (!exercise_id) {
                const insertRes = await client.query(
                    `INSERT INTO exercises (title, exercise_type, measurement_type, created_at, updated_at)
                    VALUES ($1, $2, $3, NOW(), NOW()) RETURNING exercise_id`,
                    [
                        exTitle,
                        exercise_type ?? 'strength',
                        measurement_type ?? 'reps'
                    ]
                );
                exercise_id = insertRes.rows[0].exercise_id;
                titleToId[lowerTitle] = exercise_id;
                console.log("[editWorkout] Inserted new exercise:", exTitle, "ID:", exercise_id);
            }
        }

        // Remove all current workout_exercises for this workout (to allow full update)
        await client.query(
            `DELETE FROM workout_exercises WHERE workout_id = $1`,
            [workout_id]
        );
        console.log("[editWorkout] Removed old workout_exercises for workout:", workout_id);

        // Insert new workout_exercises
        for (const ex of exercises) {
            const {
                title: exTitle,
                sets,
                reps,
                duration_seconds,
                distance_miles
            } = ex;
            const lowerTitle = exTitle.trim().toLowerCase();
            const exercise_id = titleToId[lowerTitle];

            await client.query(
                `INSERT INTO workout_exercises (
                    workout_id, exercise_id, sets, reps, duration_seconds, distance_miles, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [
                    workout_id,
                    exercise_id,
                    sets ?? null,
                    reps ?? null,
                    duration_seconds ?? null,
                    distance_miles ?? null
                ]
            );
            console.log("[editWorkout] Added exercise to workout:", exTitle, "ID:", exercise_id);
        }

        await client.query("COMMIT");
        console.log("[editWorkout] Workout updated successfully:", workout_id);
        return res.status(200).json({ message: "Workout updated successfully." });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("[editWorkout] Error editing workout:", error);
        return res.status(500).json({ message: "Error editing workout. Please try again later." });
    } finally {
        client.release();
    }
};




// COMMENTS

// comment on workout
export const commentOnWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { workout_id } = req.params;
    const { content } = req.body;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content cannot be empty." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if workout exists and get the owner of the workout
        const checkWorkoutQuery = `
            SELECT workout_id, user_id 
            FROM workouts 
            WHERE workout_id = $1
        `;
        const checkWorkoutRes: QueryResult = await client.query(checkWorkoutQuery, [workout_id]);

        if (checkWorkoutRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Workout #${workout_id} not found.` });
        }

        const workoutOwnerId = checkWorkoutRes.rows[0].user_id;

        // Insert comment into comments table (assumes comments table exists and has workout_id, user_id, content, created_at, updated_at)
        const addCommentQuery = `
            INSERT INTO comments (workout_id, user_id, content, created_at, updated_at) 
            VALUES ($1, $2, $3, NOW(), NOW()) 
            RETURNING *;
        `;
        const addCommentRes: QueryResult = await client.query(addCommentQuery, [workout_id, user_id, content.trim()]);

        // Create a notification for the workout owner if the commenter is not the owner
        if (workoutOwnerId !== user_id) {
            const commenterDetails: any = await getUserInfo(user_id, client);
            const notificationMessage = `${commenterDetails.username} commented on your workout.`;
            await createNotification({
                sender_id: user_id,
                sender_username: commenterDetails.username,
                sender_profile_pic: commenterDetails.profile_pic,
                receiver_id: workoutOwnerId,
                type: 'comment',
                message: notificationMessage,
                reference_type: 'workout',
                reference_id: Number(workout_id),
                client,
            });
        }

        await client.query('COMMIT');

        return res.status(201).json({
            message: "Comment added successfully!",
            workout_id,
            comment: addCommentRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error commenting on workout #${workout_id}:`, error);
        return res.status(500).json({ message: `Error commenting on workout #${workout_id}. Please try again later.` });
    } finally {
        client.release();
    }
};

// edit comment on workout
export const editCommentOnWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { workout_id, comment_id } = req.params;
    const { content } = req.body;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Content cannot be empty." });
    }

    try {
        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if comment exists and retrieve its owner
        const checkCommentQuery = `
            SELECT user_id, workout_id FROM comments WHERE comment_id = $1 AND workout_id = $2;
        `;
        const checkCommentResponse: QueryResult = await pool.query(checkCommentQuery, [comment_id, workout_id]);

        if (checkCommentResponse.rows.length === 0) {
            return res.status(404).json({ message: "Comment not found for this workout." });
        }

        // Check if the current user is the owner of the comment
        if (checkCommentResponse.rows[0].user_id !== user_id) {
            return res.status(403).json({ message: "You don't have permission to edit this comment." });
        }

        // Update query
        const updateCommentQuery = `
            UPDATE comments 
            SET content = $1, updated_at = NOW()
            WHERE comment_id = $2 AND workout_id = $3
            RETURNING *;
        `;

        const updatedCommentResponse: QueryResult = await pool.query(updateCommentQuery, [content.trim(), comment_id, workout_id]);

        return res.status(200).json({ message: "Comment updated successfully.", comment: updatedCommentResponse.rows[0] });
    } catch (error) {
        console.error(`Error updating comment #${comment_id}:`, error);
        return res.status(500).json({ message: `Error updating comment #${comment_id}: ${error}` });
    }
}

// delete comment on workout
export const deleteCommentOnWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { workout_id, comment_id } = req.params;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    const client = await pool.connect();
    try {
        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Retrieve comment info and check ownership by joining with workouts
        const getCommentQuery = `
            SELECT c.user_id AS comment_owner, w.user_id AS workout_owner
            FROM comments c
            JOIN workouts w ON c.workout_id = w.workout_id
            WHERE c.comment_id = $1 AND c.workout_id = $2
        `;
        const commentResult: QueryResult = await client.query(getCommentQuery, [comment_id, workout_id]);

        if (commentResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ message: `Comment #${comment_id} not found for workout #${workout_id}.` });
        }

        const { comment_owner, workout_owner } = commentResult.rows[0];

        // Check if user is authorized to delete (must be comment owner OR workout owner)
        if (user_id !== comment_owner && user_id !== workout_owner) {
            client.release();
            return res.status(403).json({ message: "You are not authorized to delete this comment." });
        }

        // Delete the comment
        const deleteCommentQuery = `DELETE FROM comments WHERE comment_id = $1 AND workout_id = $2 RETURNING *;`;
        const deleteCommentResponse: QueryResult = await client.query(deleteCommentQuery, [comment_id, workout_id]);

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
}

// like workout
export const likeWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { workout_id } = req.params;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if workout exists and get the owner of the workout
        const checkWorkoutQuery = `
            SELECT workout_id, user_id 
            FROM workouts 
            WHERE workout_id = $1
        `;
        const checkWorkoutRes: QueryResult = await client.query(checkWorkoutQuery, [workout_id]);

        if (checkWorkoutRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Workout #${workout_id} not found.` });
        }

        const workoutOwnerId = checkWorkoutRes.rows[0].user_id;

        // Check if the user already liked the workout
        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND workout_id = $2`;
        const checkLikeRes: QueryResult = await client.query(checkLikeQuery, [user_id, workout_id]);

        if (checkLikeRes.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: "You have already liked this workout." });
        }

        // Insert like into likes table
        const likeQuery = `
            INSERT INTO likes (user_id, workout_id, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *;
        `;
        const likeRes: QueryResult = await client.query(likeQuery, [user_id, workout_id]);

        // Create a notification for the workout owner if the user liking is not the owner
        if (workoutOwnerId !== user_id) {
            const likerDetails: any = await getUserInfo(user_id, client);
            const notificationMessage = `${likerDetails.username} liked your workout.`;
            await createNotification({
                sender_id: user_id,
                sender_username: likerDetails.username,
                sender_profile_pic: likerDetails.profile_pic,
                receiver_id: workoutOwnerId,
                type: 'like',
                message: notificationMessage,
                reference_type: 'workout',
                reference_id: Number(workout_id),
                client,
            });
        }

        await client.query('COMMIT');

        return res.status(201).json({ message: "Workout liked successfully!", like: likeRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error liking workout #${workout_id}:`, error);
        return res.status(500).json({ message: `Error liking workout #${workout_id}. Please try again later.` });
    } finally {
        client.release();
    }
};

// unlike workout
export const unlikeWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { workout_id } = req.params;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    const client = await pool.connect();

    try {
        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if workout exists
        const checkWorkoutQuery = `SELECT * FROM workouts WHERE workout_id = $1`;
        const checkWorkoutRes: QueryResult = await client.query(checkWorkoutQuery, [workout_id]);

        if (checkWorkoutRes.rows.length === 0) {
            client.release();
            return res.status(404).json({ message: `Workout #${workout_id} not found.` });
        }

        // Check if the user has liked the workout
        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND workout_id = $2`;
        const checkLikeRes: QueryResult = await client.query(checkLikeQuery, [user_id, workout_id]);

        if (checkLikeRes.rows.length === 0) {
            client.release();
            return res.status(404).json({ message: "You haven't liked this workout yet." });
        }

        // Remove like from the likes table
        const unlikeQuery = `DELETE FROM likes WHERE user_id = $1 AND workout_id = $2 RETURNING *;`;
        const unlikeRes: QueryResult = await client.query(unlikeQuery, [user_id, workout_id]);

        client.release();
        return res.status(200).json({ message: "Workout unliked successfully!", removedLike: unlikeRes.rows[0] });
    } catch (error) {
        client.release();
        console.error(`Error unliking workout #${workout_id}:`, error);
        return res.status(500).json({ message: `Error unliking workout #${workout_id}. Please try again later.` });
    }
};

// delete workout
export const deleteWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const firebase_uid = await getIdFromAuthHeader(authHeader);
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { workout_id } = req.params;

    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if the workout exists and belongs to the user
        const checkWorkoutQuery = `SELECT user_id FROM workouts WHERE workout_id = $1`;
        const checkWorkoutResponse: QueryResult = await client.query(checkWorkoutQuery, [workout_id]);

        if (checkWorkoutResponse.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Workout not found." });
        }

        if (checkWorkoutResponse.rows[0].user_id !== user_id) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "You are not authorized to delete this workout." });
        }

        // Update posts that reference this workout_id, setting workout_id to NULL
        await client.query(`UPDATE posts SET workout_id = NULL WHERE workout_id = $1`, [workout_id]);

        // Delete related likes/comments and workout_exercise connections
        await client.query(`DELETE FROM likes WHERE workout_id = $1`, [workout_id]);
        await client.query(`DELETE FROM comments WHERE workout_id = $1`, [workout_id]);
        await client.query(`DELETE FROM workout_exercises WHERE workout_id = $1`, [workout_id]);

        // Delete related workout_sessions and session_exercises
        // First, get all session_ids for this workout
        const sessionIdsRes: QueryResult = await client.query(
            `SELECT session_id FROM workout_sessions WHERE workout_id = $1`,
            [workout_id]
        );
        const sessionIds = sessionIdsRes.rows.map(row => row.session_id);

        if (sessionIds.length > 0) {
            await client.query(
                `DELETE FROM session_exercises WHERE session_id = ANY($1::int[])`,
                [sessionIds]
            );
            await client.query(
                `DELETE FROM workout_sessions WHERE workout_id = $1`,
                [workout_id]
            );
        }

        // Delete the workout
        const deleteWorkoutQuery = `DELETE FROM workouts WHERE workout_id = $1 RETURNING *;`;
        const deleteWorkoutResponse: QueryResult = await client.query(deleteWorkoutQuery, [workout_id]);

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Workout deleted successfully. All related posts and sessions updated.",
            deletedWorkout: deleteWorkoutResponse.rows[0]
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Error deleting workout #${workout_id}:`, error);
        return res.status(500).json({ message: "Error deleting workout. Please try again later." });
    } finally {
        client.release();
    }
};