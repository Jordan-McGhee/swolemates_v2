import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
import { QueryResult } from "pg";
// import { generateToken, checkIfUsernameExists, isEmailFormat } from "../util/util";

// blank function
// export const fnName = async (req: Request, res: Response, next: NextFunction) => {}

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
        const getWorkoutsByUserQuery = "SELECT * FROM workout_with_exercises WHERE user_id = $1 ORDER BY workout_created_at DESC";
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
    const getSingleWorkoutQuery = `SELECT * FROM workout_with_exercises WHERE workout_id = $1`;

    // Query for likes - pulls username, profile pic and id for each user
    const getLikesQuery = `
            SELECT users.user_id, users.username, users.profile_pic 
            FROM likes
            INNER JOIN users ON likes.user_id = users.user_id
            WHERE likes.workout_id = $1;
        `;

    // Query for comments - pulls username, profile pic, and comment info
    const getCommentsQuery = `
            SELECT comments.comment_id, users.username, users.profile_pic, comments.content, comments.created_at, comments.updated_at
            FROM comments
            JOIN users ON comments.user_id = users.user_id
            WHERE comments.workout_id = $1
            ORDER BY comments.created_at ASC
        `;

    try {
        // get the workout (this must succeed)
        const workoutResponse: QueryResult = await pool.query(getSingleWorkoutQuery, [workout_id])

        // check that workout exists
        if (workoutResponse.rows.length === 0) {
            return res.status(404).json({ message: "Workout not found" })
        }

        const workout = workoutResponse.rows[0]

        // empty array for likes and comments
        let likes = []; let comments = [];

        // Try to get likes and comments from db, but don't fail everything if it breaks
        try {
            const likesResponse: QueryResult = await pool.query(getLikesQuery, [workout_id]);
            likes = likesResponse.rows;
        } catch (error) {
            console.error(`Error fetching likes for workout #${workout_id}:`, error);
        }

        try {
            const commentsResponse: QueryResult = await pool.query(getCommentsQuery, [workout_id]);
            comments = commentsResponse.rows;
        } catch (error) {
            console.error(`Error fetching comments for workout #${workout_id}:`, error);
        }

        return res.status(200).json({
            message: "Got workout!",
            workout,
            workout_user_id: workout.user_id,
            likes,
            comments
        });

    } catch (error) {
        console.error(`Error retrieving post #${workout_id}:`, error);
        return res.status(500).json({ message: `Error retrieving post #${workout_id}. Please try again later.` });
    }
}

export const createWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id, title, description, exercises } = req.body;

    // Validate input
    if (!user_id || !title || !Array.isArray(exercises) || exercises.length < 3 || exercises.length > 10) {
        return res.status(400).json({ message: "Invalid workout. Must include a title, a short description, and 3 to 10 exercises." });
    }

    // Track duplicate exercise titles
    const exerciseTitleSet = new Set();

    // Validate each exercise
    for (const ex of exercises) {
        const { title: exTitle, set_count, rep_count } = ex;

        if (!exTitle || !Number.isInteger(set_count) || !Number.isInteger(rep_count) || set_count <= 0 || rep_count <= 0) {
            return res.status(400).json({ message: "Each exercise must have a title and set/rep counts greater than 0." });
        }

        const lowerTitle = exTitle.trim().toLowerCase();
        if (exerciseTitleSet.has(lowerTitle)) {
            return res.status(400).json({ message: `Duplicate exercise title detected: "${exTitle}"` });
        }
        exerciseTitleSet.add(lowerTitle);
    }

    // Create connection to start a transaction
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Insert new workout
        const workoutQuery = `
            INSERT INTO workouts (user_id, title, description, created_at, updated_at) 
            VALUES ($1, $2, $3, NOW(), NOW()) 
            RETURNING workout_id;
        `;
        const workoutResponse: QueryResult = await client.query(workoutQuery, [user_id, title, description]);

        // Grab ID from newly created workout
        const workout_id = workoutResponse.rows[0].workout_id;

        // Iterate over exercises
        for (const ex of exercises) {
            const { title: exTitle, description: exDescription, weight_used, set_count, rep_count } = ex;
            const lowerTitle = exTitle.trim().toLowerCase();

            // Check if exercise already exists
            const checkExerciseQuery = `SELECT exercise_id FROM exercises WHERE LOWER(title) = $1;`;
            const exerciseResponse: QueryResult = await client.query(checkExerciseQuery, [lowerTitle]);

            let exercise_id;

            if (exerciseResponse.rows.length === 0) {
                // Insert new exercise if it doesn't exist
                const insertExerciseQuery = `
                    INSERT INTO exercises (title, description, created_at, updated_at) 
                    VALUES ($1, $2, NOW(), NOW()) 
                    RETURNING exercise_id;
                `;
                const insertExerciseResponse = await client.query(insertExerciseQuery, [exTitle, exDescription ?? null]);
                exercise_id = insertExerciseResponse.rows[0].exercise_id;
            } else {
                exercise_id = exerciseResponse.rows[0].exercise_id;
            }

            // Insert into workout_exercises
            const insertWorkoutExerciseQuery = `
                INSERT INTO workout_exercises (workout_id, workout_name, exercise_id, exercise_name, weight_used, set_count, rep_count, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
            `;
            await client.query(insertWorkoutExerciseQuery, [
                workout_id,
                title,
                exercise_id,
                exTitle,
                weight_used ?? null,
                set_count,
                rep_count
            ]);
        }

        // Commit transaction
        await client.query("COMMIT");
        return res.status(201).json({ message: "Workout created successfully.", workout_id });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error creating workout:", error);
        return res.status(500).json({ message: `Error creating workout. ${error}` });
    } finally {
        client.release();
    }
};



// edit workout
export const editWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { workout_id } = req.params;
    const { user_id, title, description, exercises } = req.body;

    // VALIDATIONS
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    if (!user_id || !title || !Array.isArray(exercises) || exercises.length < 3 || exercises.length > 10) {
        return res.status(400).json({ message: "Invalid workout. Must include a title and 3 to 10 exercises." });
    }

    // Track duplicate exercise titles
    const exerciseTitleSet = new Set();

    // Validate each exercise before starting the transaction
    for (const ex of exercises) {
        const { title: exTitle, set_count, rep_count } = ex;

        if (!exTitle || !Number.isInteger(set_count) || !Number.isInteger(rep_count) || set_count <= 0 || rep_count <= 0) {
            return res.status(400).json({ message: "Each exercise must have a title and set/rep counts greater than 0." });
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

        // Check if workout exists and belongs to user
        const checkWorkoutQuery = "SELECT user_id FROM workouts WHERE workout_id = $1";
        const checkWorkoutResult = await client.query(checkWorkoutQuery, [workout_id]);

        if (checkWorkoutResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Workout not found." });
        }

        if (checkWorkoutResult.rows[0].user_id !== Number(user_id)) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "Unauthorized: You do not have permission to edit this workout." });
        }

        // Update workout details
        await client.query(
            "UPDATE workouts SET title = $1, description = $2, updated_at = NOW() WHERE workout_id = $3",
            [title, description, workout_id]
        );

        // Fetch existing exercises tied to this workout
        const existingExercisesResult = await client.query(
            "SELECT exercise_id FROM workout_exercises WHERE workout_id = $1",
            [workout_id]
        );
        const existingExerciseIds = existingExercisesResult.rows.map((row) => row.exercise_id);

        // Fetch existing exercises from the `exercises` table in a single batch query
        const exerciseTitles = exercises.map((ex) => ex.title.toLowerCase());
        const checkExistingExercisesQuery = `
            SELECT exercise_id, LOWER(title) AS title FROM exercises WHERE LOWER(title) = ANY($1::text[])
        `;
        const checkExistingExercisesRes = await client.query(checkExistingExercisesQuery, [exerciseTitles]);

        // Map found exercises for quick lookup
        const titleToIdMap: Record<string, number> = {};
        checkExistingExercisesRes.rows.forEach((row) => {
            titleToIdMap[row.title] = row.exercise_id;
        });

        // Process exercises
        for (const ex of exercises) {
            const { title: exTitle, description: exDescription, weight_used, set_count, rep_count } = ex;
            const lowerTitle = exTitle.toLowerCase();

            let exercise_id = titleToIdMap[lowerTitle];

            // If the exercise does not exist, insert it
            if (!exercise_id) {
                const insertExerciseQuery = `
                    INSERT INTO exercises (title, description, created_at, updated_at) 
                    VALUES ($1, $2, NOW(), NOW()) 
                    RETURNING exercise_id;
                `;
                const insertExerciseRes = await client.query(insertExerciseQuery, [exTitle, exDescription || null]);
                exercise_id = insertExerciseRes.rows[0].exercise_id;
                titleToIdMap[lowerTitle] = exercise_id;
            }

            // If this exercise is not already in the workout, insert it
            if (!existingExerciseIds.includes(exercise_id)) {
                const insertWorkoutExerciseQuery = `
                    INSERT INTO workout_exercises (workout_id, workout_name, exercise_id, exercise_name, weight_used, set_count, rep_count, created_at) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
                `;
                await client.query(insertWorkoutExerciseQuery, [
                    workout_id,
                    title,
                    exercise_id,
                    exTitle,
                    weight_used ?? null,
                    set_count,
                    rep_count
                ]);
            }
        }

        // Identify exercises to remove
        const newExerciseIds = exercises.map((ex) => titleToIdMap[ex.title.toLowerCase()]);
        const exercisesToRemove = existingExerciseIds.filter((id) => !newExerciseIds.includes(id));

        // Remove exercises in one query
        if (exercisesToRemove.length > 0) {
            await client.query(
                "DELETE FROM workout_exercises WHERE workout_id = $1 AND exercise_id = ANY($2::int[])",
                [workout_id, exercisesToRemove]
            );
        }

        await client.query("COMMIT");
        return res.status(200).json({ message: "Workout updated successfully." });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error updating workout:", error);
        return res.status(500).json({ message: "Error updating workout. Please try again later." });
    } finally {
        client.release();
    }
};



// COMMENTS

// comment on workout
export const commentOnWorkout = async (req: Request, res: Response, next: NextFunction) => {
    // Grab workout ID from params
    const { workout_id } = req.params;

    // Grab user ID and comment content from body
    const { user_id, content } = req.body;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content cannot be empty." });
    }

    try {
        // Check if post exists
        const checkWorkoutQuery = "SELECT workout_id FROM workouts WHERE workout_id = $1";
        const checkWorkoutResponse: QueryResult = await pool.query(checkWorkoutQuery, [workout_id]);

        if (checkWorkoutResponse.rows.length === 0) {
            return res.status(404).json({ message: `Workout #${workout_id} not found. Cannot add comment.` });
        }

        // Insert comment
        const addCommentQuery = `
                INSERT INTO comments (workout_id, user_id, content, created_at, updated_at) 
                VALUES ($1, $2, $3, NOW(), NOW()) 
                RETURNING *;
            `;

        const addCommentResponse: QueryResult = await pool.query(addCommentQuery, [workout_id, user_id, content.trim()]);

        return res.status(201).json({
            message: "Comment added successfully!",
            workout_id,
            comment: addCommentResponse.rows[0]
        });

    } catch (error) {
        console.error(`Error commenting on workout #${workout_id}:`, error);
        return res.status(500).json({ message: `Error commenting on workout #${workout_id}. Please try again later.` });
    }
}

// edit comment on workout
export const editCommentOnWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { workout_id, comment_id } = req.params;
    const { user_id, content } = req.body;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
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
}

// delete comment on workout
export const deleteCommentOnWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { workout_id, comment_id } = req.params;
    const { user_id } = req.body; // User attempting to delete the comment

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    if (!comment_id || isNaN(Number(comment_id))) {
        return res.status(400).json({ message: "Invalid comment ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        // Retrieve comment info and check ownership by joining with workouts
        const getCommentQuery = `
            SELECT c.user_id AS comment_owner, w.user_id AS workout_owner
            FROM comments c
            JOIN workouts w ON c.workout_id = w.workout_id
            WHERE c.comment_id = $1
        `;
        const commentResult: QueryResult = await pool.query(getCommentQuery, [comment_id]);

        // Check if comment exists
        if (commentResult.rows.length === 0) {
            return res.status(404).json({ message: `Comment #${comment_id} not found.` });
        }

        const { comment_owner, workout_owner } = commentResult.rows[0];

        // Check if user is authorized to delete (must be comment owner OR work owner)
        if (Number(user_id) !== comment_owner && Number(user_id) !== workout_owner) {
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

// LIKES

// like workout
export const likeWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { workout_id } = req.params;
    const { user_id } = req.body;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        // Check if workout exists
        const checkWorkoutQuery = `SELECT * FROM workouts WHERE workout_id = $1`;
        const checkWorkoutRes: QueryResult = await pool.query(checkWorkoutQuery, [workout_id]);

        if (checkWorkoutRes.rows.length === 0) {
            return res.status(404).json({ message: `Workout #${workout_id} not found.` });
        }

        // Check if the user already liked the workout
        const checkLikeQuery = `SELECT * FROM likes WHERE user_id = $1 AND workout_id = $2`;
        const checkLikeRes: QueryResult = await pool.query(checkLikeQuery, [user_id, workout_id]);

        if (checkLikeRes.rows.length > 0) {
            return res.status(409).json({ message: "You have already liked this workout." });
        }

        // Insert like into likes table
        const likeQuery = `
            INSERT INTO likes (user_id, workout_id, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *;
        `;
        const likeRes: QueryResult = await pool.query(likeQuery, [user_id, workout_id]);

        return res.status(201).json({ message: "Workout liked successfully!", like: likeRes.rows[0] });
    } catch (error) {
        console.error(`Error liking workout #${workout_id}:`, error);
        return res.status(500).json({ message: `Error liking workout #${workout_id}. Please try again later.` });
    }
};


// unlike workout
export const unlikeWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { workout_id } = req.params;
    const { user_id } = req.body;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
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


// DELETE

// delete workout
export const deleteWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { workout_id } = req.params;
    const { user_id } = req.body;

    // Validations
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }

    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    const client = await pool.connect();

    try {
        // Begin transaction to update posts and delete related data before removing the workout
        await client.query("BEGIN");

        // Check if the workout exists and belongs to the user
        const checkWorkoutQuery = `SELECT user_id FROM workouts WHERE workout_id = $1`;
        const checkWorkoutResponse: QueryResult = await client.query(checkWorkoutQuery, [workout_id]);

        if (checkWorkoutResponse.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Workout not found." });
        }

        if (checkWorkoutResponse.rows[0].user_id !== Number(user_id)) {
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

        // Commit transaction
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

