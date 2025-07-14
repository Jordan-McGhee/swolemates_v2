import { pool } from "../index";
import { Request, Response, NextFunction } from "express";
import { QueryResult } from "pg";
import { createNotification, getUserInfo, getUserIdFromFirebaseUid } from "../util/util";

// Create workout
export const createWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    const { title, description, exercises } = req.body;

    if (!title || typeof title !== "string" || !description || typeof description !== "string") {
        return res.status(400).json({ message: "Workout must include a title and description." });
    }
    if (!Array.isArray(exercises) || exercises.length < 3 || exercises.length > 10) {
        return res.status(400).json({ message: "Workout must have between 3 and 10 exercises." });
    }

    const exerciseTitleSet = new Set();
    for (const ex of exercises) {
        const { title: exTitle, set_count, rep_count } = ex;
        if (!exTitle || !Number.isInteger(set_count) || !Number.isInteger(rep_count) || set_count <= 0 || rep_count <= 0) {
            return res.status(400).json({ message: "Each exercise must have a title and set/rep counts > 0." });
        }
        const lowerTitle = exTitle.trim().toLowerCase();
        if (exerciseTitleSet.has(lowerTitle)) {
            return res.status(400).json({ message: `Duplicate exercise title detected: "${exTitle}"` });
        }
        exerciseTitleSet.add(lowerTitle);
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        const workoutRes = await client.query(
            `INSERT INTO workouts (user_id, title, description, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING workout_id`,
            [user_id, title, description]
        );
        const workout_id = workoutRes.rows[0].workout_id;

        for (const ex of exercises) {
            const { title: exTitle, description: exDescription, weight_used, set_count, rep_count } = ex;
            const lowerTitle = exTitle.trim().toLowerCase();

            const checkRes = await client.query(
                `SELECT exercise_id FROM exercises WHERE LOWER(title) = $1`,
                [lowerTitle]
            );

            let exercise_id;
            if (checkRes.rows.length === 0) {
                const insertRes = await client.query(
                    `INSERT INTO exercises (title, description, created_at, updated_at)
                    VALUES ($1, $2, NOW(), NOW()) RETURNING exercise_id`,
                    [exTitle, exDescription ?? null]
                );
                exercise_id = insertRes.rows[0].exercise_id;
            } else {
                exercise_id = checkRes.rows[0].exercise_id;
            }

            await client.query(
                `INSERT INTO workout_exercises (workout_id, workout_name, exercise_id, exercise_name, weight_used, set_count, rep_count, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [workout_id, title, exercise_id, exTitle, weight_used ?? null, set_count, rep_count]
            );
        }

        await client.query("COMMIT");
        return res.status(201).json({ message: "Workout created successfully.", workout_id });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error creating workout:", error);
        return res.status(500).json({ message: "Error creating workout. Please try again later." });
    } finally {
        client.release();
    }
};

// Edit workout
export const editWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    const { workout_id } = req.params;
    const { title, description, exercises } = req.body;

    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }
    if (!title || typeof title !== "string" || !Array.isArray(exercises) || exercises.length < 3 || exercises.length > 10) {
        return res.status(400).json({ message: "Invalid workout update data." });
    }

    const exerciseTitleSet = new Set();
    for (const ex of exercises) {
        const { title: exTitle, set_count, rep_count } = ex;
        if (!exTitle || !Number.isInteger(set_count) || !Number.isInteger(rep_count) || set_count <= 0 || rep_count <= 0) {
            return res.status(400).json({ message: "Each exercise must have a title and valid set/rep counts." });
        }
        const lowerTitle = exTitle.trim().toLowerCase();
        if (exerciseTitleSet.has(lowerTitle)) {
            return res.status(400).json({ message: `Duplicate exercise title detected: "${exTitle}"` });
        }
        exerciseTitleSet.add(lowerTitle);
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        const workoutRes = await client.query(
            `SELECT user_id FROM workouts WHERE workout_id = $1`,
            [workout_id]
        );
        if (workoutRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Workout not found." });
        }
        if (workoutRes.rows[0].user_id !== user_id) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "Unauthorized to edit this workout." });
        }

        await client.query(
            `UPDATE workouts SET title = $1, description = $2, updated_at = NOW() WHERE workout_id = $3`,
            [title, description, workout_id]
        );

        const existingRes = await client.query(
            `SELECT exercise_id FROM workout_exercises WHERE workout_id = $1`,
            [workout_id]
        );
        const existingIds = existingRes.rows.map((r) => r.exercise_id);

        const titles = exercises.map((ex) => ex.title.toLowerCase());
        const checkRes = await client.query(
            `SELECT exercise_id, LOWER(title) AS title FROM exercises WHERE LOWER(title) = ANY($1::text[])`,
            [titles]
        );
        const titleToId: Record<string, number> = {};
        checkRes.rows.forEach((r) => {
            titleToId[r.title] = r.exercise_id;
        });

        for (const ex of exercises) {
            const { title: exTitle, description: exDescription, weight_used, set_count, rep_count } = ex;
            const lowerTitle = exTitle.trim().toLowerCase();
            let exercise_id = titleToId[lowerTitle];
            if (!exercise_id) {
                const insertRes = await client.query(
                    `INSERT INTO exercises (title, description, created_at, updated_at)
                    VALUES ($1, $2, NOW(), NOW()) RETURNING exercise_id`,
                    [exTitle, exDescription ?? null]
                );
                exercise_id = insertRes.rows[0].exercise_id;
                titleToId[lowerTitle] = exercise_id;
            }

            if (!existingIds.includes(exercise_id)) {
                await client.query(
                    `INSERT INTO workout_exercises (workout_id, workout_name, exercise_id, exercise_name, weight_used, set_count, rep_count, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                    [workout_id, title, exercise_id, exTitle, weight_used ?? null, set_count, rep_count]
                );
            }
        }

        const newIds = exercises.map((ex) => titleToId[ex.title.toLowerCase()]);
        const toRemove = existingIds.filter((id) => !newIds.includes(id));
        if (toRemove.length > 0) {
            await client.query(
                `DELETE FROM workout_exercises WHERE workout_id = $1 AND exercise_id = ANY($2::int[])`,
                [workout_id, toRemove]
            );
        }

        await client.query("COMMIT");
        return res.status(200).json({ message: "Workout updated successfully." });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error editing workout:", error);
        return res.status(500).json({ message: "Error editing workout. Please try again later." });
    } finally {
        client.release();
    }
};




// COMMENTS

// comment on workout
export const commentOnWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
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
            await client.query('ROLLBACK');  // Rollback transaction if workout is not found
            return res.status(404).json({ message: `Workout #${workout_id} not found.` });
        }

        const workout = checkWorkoutRes.rows[0];
        const workoutOwnerId = workout.user_id;

        // Insert comment into comments table
        const addCommentQuery = `
            INSERT INTO comments (workout_id, user_id, content, created_at, updated_at) 
            VALUES ($1, $2, $3, NOW(), NOW()) 
            RETURNING *;
        `;
        const addCommentRes: QueryResult = await client.query(addCommentQuery, [workout_id, user_id, content.trim()]);

        // Create a notification for the workout owner if the commenter is not the owner
        if (workoutOwnerId !== user_id) {
            const commenterDetails: any = await getUserInfo(user_id, client);  // Fetch user details using client
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

        await client.query('COMMIT');  // Commit the transaction if everything is successful

        return res.status(201).json({
            message: "Comment added successfully!",
            workout_id,
            comment: addCommentRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');  // Rollback transaction if an error occurs
        console.error(`Error commenting on workout #${workout_id}:`, error);
        return res.status(500).json({ message: `Error commenting on workout #${workout_id}. Please try again later.` });
    } finally {
        client.release();  // Release the client back to the pool
    }
};

// edit comment on workout
export const editCommentOnWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { workout_id, comment_id } = req.params;
    const { content } = req.body;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
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
            SELECT user_id FROM comments WHERE comment_id = $1;
        `;
        const checkCommentResponse: QueryResult = await pool.query(checkCommentQuery, [comment_id]);

        if (checkCommentResponse.rows.length === 0) {
            return res.status(404).json({ message: "Comment not found." });
        }

        // Check if the current user is the owner of the comment
        if (checkCommentResponse.rows[0].user_id !== user_id) {
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
}

// delete comment on workout
export const deleteCommentOnWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { workout_id, comment_id } = req.params;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    try {
        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Retrieve comment info and check ownership by joining with workouts
        const getCommentQuery = `
            SELECT c.user_id AS comment_owner, w.user_id AS workout_owner
            FROM comments c
            JOIN workouts w ON c.workout_id = w.workout_id
            WHERE c.comment_id = $1
        `;
        const commentResult: QueryResult = await pool.query(getCommentQuery, [comment_id]);

        if (commentResult.rows.length === 0) {
            return res.status(404).json({ message: `Comment #${comment_id} not found.` });
        }

        const { comment_owner, workout_owner } = commentResult.rows[0];

        // Check if user is authorized to delete (must be comment owner OR workout owner)
        if (user_id !== comment_owner && user_id !== workout_owner) {
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
}

// like workout
export const likeWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
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

        const workout = checkWorkoutRes.rows[0];
        const workoutOwnerId = workout.user_id;

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
    const firebase_uid = req.user?.uid;
    if (!firebase_uid) {
        return res.status(401).json({ message: "Unauthorized: Missing Firebase UID." });
    }

    const { workout_id } = req.params;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    try {
        // Retrieve user_id from firebase_uid
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);

        // Check if workout exists
        const checkWorkoutQuery = `SELECT * FROM workouts WHERE workout_id = $1`;
        const checkWorkoutRes: QueryResult = await pool.query(checkWorkoutQuery, [workout_id]);

        if (checkWorkoutRes.rows.length === 0) {
            return res.status(404).json({ message: `Workout #${workout_id} not found.` });
        }

        // Check if the user has liked the workout
        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND workout_id = $2`;
        const checkLikeRes: QueryResult = await pool.query(checkLikeQuery, [user_id, workout_id]);

        if (checkLikeRes.rows.length === 0) {
            return res.status(404).json({ message: "You haven't liked this workout yet." });
        }

        // Remove like from the likes table
        const unlikeQuery = `DELETE FROM likes WHERE user_id = $1 AND workout_id = $2 RETURNING *;`;
        const unlikeRes: QueryResult = await pool.query(unlikeQuery, [user_id, workout_id]);

        return res.status(200).json({ message: "Workout unliked successfully!", removedLike: unlikeRes.rows[0] });
    } catch (error) {
        console.error(`Error unliking workout #${workout_id}:`, error);
        return res.status(500).json({ message: `Error unliking workout #${workout_id}. Please try again later.` });
    }
};

// delete workout
export const deleteWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user?.uid;
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

        // Delete related likes/comments and workout/exercise connections
        await client.query(`DELETE FROM likes WHERE workout_id = $1`, [workout_id]);
        await client.query(`DELETE FROM comments WHERE workout_id = $1`, [workout_id]);
        await client.query(`DELETE FROM workout_exercises WHERE workout_id = $1`, [workout_id]);

        // Delete the workout
        const deleteWorkoutQuery = `DELETE FROM workouts WHERE workout_id = $1 RETURNING *;`;
        const deleteWorkoutResponse: QueryResult = await client.query(deleteWorkoutQuery, [workout_id]);

        await client.query("COMMIT");

        return res.status(200).json({ message: "Workout deleted successfully. All related posts updated.", deletedWorkout: deleteWorkoutResponse.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Error deleting workout #${workout_id}:`, error);
        return res.status(500).json({ message: "Error deleting workout. Please try again later." });
    } finally {
        client.release();
    }
};