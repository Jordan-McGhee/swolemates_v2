import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
import { QueryResult } from "pg";
// import { generateToken, checkIfUsernameExists, isEmailFormat } from "../util/util";

// blank function
// export const fnName = async (req: Request, res: Response, next: NextFunction) => {}

// get all workouts by user
export const getWorkoutsByUser = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params

    // Validate user_id
    if (!user_id || isNaN(Number(user_id))) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    const getWorkoutsByUserQuery = "SELECT * FROM workouts WHERE user_id = $1 ORDER BY created_at DESC"

    try {
        const getWorkoutsByUserResponse: QueryResult = await pool.query(getWorkoutsByUserQuery, [user_id])

        return res.status(200).json({
            message: `Got all workouts created by user #${user_id}`,
            workouts: getWorkoutsByUserResponse.rows,
            user_id: user_id
        })
    } catch (error) {
        console.error(`Error retrieving workouts created by user #${user_id}:`, error);
        return res.status(500).json({ message: `Error retrieving workouts created by user #${user_id}: ${error}` });
    }
}

// get single workout
export const getSingleWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { workout_id } = req.params

    // Validate workout_id
    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid post ID." });
    }

    // Query for the post
    const getSingleWorkoutQuery = `SELECT * FROM workouts WHERE workout_id = $1`;

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

// create workout
export const createWorkout = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id, title, description, exercises } = req.body;

    // Validate input
    if (!user_id || !title || !Array.isArray(exercises) || exercises.length === 0 || exercises.length > 10) {
        return res.status(400).json({ message: "Invalid workout data. Must include user_id, title, and up to 10 exercises." });
    }

    // create connection to start a transaction to save workout, the exercises, and update the workout_exercises table tying workouts to exercises
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Insert new workout
        const workoutQuery = `INSERT INTO workouts (user_id, title, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING workout_id;`;

        const workoutResponse: QueryResult = await client.query(workoutQuery, [user_id, title, description]);

        // grab id from newly created workout
        const workout_id = workoutResponse.rows[0].workout_id;

        // iterate over exercises in given array
        for (const ex of exercises) {
            const { title: exTitle, description: exDescription, weight_used, set_count, rep_count } = ex;

            // Check if an exercise with the same title already exists (case-insensitive)
            const checkExerciseQuery = `SELECT exercise_id FROM exercises WHERE LOWER(title) = LOWER($1);`;
            const exerciseResponse: QueryResult = await client.query(checkExerciseQuery, [exTitle]);

            let exercise_id;

            if (exerciseResponse.rows.length === 0) {
                // If exercise does not exist in database yet, insert it
                const insertExerciseQuery = `INSERT INTO exercises (title, description, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING exercise_id;`;

                const insertExerciseResponse = await client.query(insertExerciseQuery, [exTitle, exDescription]);
                exercise_id = insertExerciseResponse.rows[0].exercise_id;
            } else {
                // Use existing exercise_id to tie together in workout_exercises table
                exercise_id = exerciseResponse.rows[0].exercise_id;
            }

            // Insert into workout_exercises
            const insertWorkoutExerciseQuery = `
                INSERT INTO workout_exercises (workout_id, exercise_id, weight_used, set_count, rep_count, created_at) 
                VALUES ($1, $2, $3, $4, $5, NOW());
            `;
            await client.query(insertWorkoutExerciseQuery, [workout_id, exercise_id, weight_used, set_count, rep_count]);
        }

        // if all worked correctly, commit these changes and return success message
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

    // pull data from params and body
    const { workout_id } = req.params;
    const { user_id, title, description, exercises } = req.body;

    // VALIDATIONS

    if (!workout_id || isNaN(Number(workout_id))) {
        return res.status(400).json({ message: "Invalid workout ID." });
    }
    if (!user_id || !title || !Array.isArray(exercises) || exercises.length === 0 || exercises.length > 10) {
        return res.status(400).json({ message: "Invalid workout data. Must include user_id, title, and up to 10 exercises." });
    }

    // CREATE TRANSACTION
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Check if the workout exists and get its owner
        const checkWorkoutQuery = "SELECT * FROM workouts WHERE workout_id = $1";
        const checkWorkoutResult = await client.query(checkWorkoutQuery, [workout_id]);

        if (checkWorkoutResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Workout not found." });
        }

        const workoutOwnerId = checkWorkoutResult.rows[0].user_id;

        // Check if the current user is the owner
        if (workoutOwnerId !== Number(user_id)) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "Unauthorized: You do not have permission to edit this workout." });
        }

        // Update workout title and description
        const updateWorkoutQuery = `
            UPDATE workouts SET title = $1, description = $2, updated_at = NOW() WHERE workout_id = $3
        `;
        await client.query(updateWorkoutQuery, [title, description, workout_id]);


        // Get existing workout exercises
        const existingExercisesQuery = `SELECT exercise_id FROM workout_exercises WHERE workout_id = $1`;

        const existingExercisesResult = await client.query(existingExercisesQuery, [workout_id]);

        // get array of exercise ids to compare with edits made to exercises
        const existingExerciseIds = existingExercisesResult.rows.map((row) => row.exercise_id);

        // Process new exercises
        const exerciseIds: Record<string, number> = {};

        for (const ex of exercises) {
            const { title: exTitle, description: exDescription, weight_used, set_count, rep_count } = ex;

            if (!exerciseIds[exTitle.toLowerCase()]) {
                // Check if the exercise exists
                const checkExerciseQuery = `SELECT exercise_id FROM exercises WHERE LOWER(title) = LOWER($1)`;
                const checkExerciseRes = await client.query(checkExerciseQuery, [exTitle]);

                if (checkExerciseRes.rows.length === 0) {
                    // Insert new exercise
                    const insertExerciseQuery = `
                        INSERT INTO exercises (title, description, created_at, updated_at) 
                        VALUES ($1, $2, NOW(), NOW()) 
                        RETURNING exercise_id;
                    `;
                    const insertExerciseRes = await client.query(insertExerciseQuery, [exTitle, exDescription]);
                    exerciseIds[exTitle.toLowerCase()] = insertExerciseRes.rows[0].exercise_id;
                } else {
                    exerciseIds[exTitle.toLowerCase()] = checkExerciseRes.rows[0].exercise_id;
                }
            }

            const exercise_id = exerciseIds[exTitle.toLowerCase()];

            if (!existingExerciseIds.includes(exercise_id)) {
                // Insert into workout_exercises
                const insertWorkoutExerciseQuery = `
                    INSERT INTO workout_exercises (workout_id, exercise_id, weight_used, set_count, rep_count, created_at) 
                    VALUES ($1, $2, $3, $4, $5, NOW());
                `;
                await client.query(insertWorkoutExerciseQuery, [workout_id, exercise_id, weight_used, set_count, rep_count]);
            }
        }

        // Remove exercises not in the updated list
        const newExerciseIds = exercises.map((ex) => exerciseIds[ex.title.toLowerCase()]);
        const exercisesToRemove = existingExerciseIds.filter((id) => !newExerciseIds.includes(id));

        if (exercisesToRemove.length > 0) {
            const deleteWorkoutExercisesQuery = `
                DELETE FROM workout_exercises WHERE workout_id = $1 AND exercise_id = ANY($2::int[]);
            `;
            await client.query(deleteWorkoutExercisesQuery, [workout_id, exercisesToRemove]);
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
export const commentOnWorkout = async (req: Request, res: Response, next: NextFunction) => { }

// edit comment on workout
export const editCommentOnWorkout = async (req: Request, res: Response, next: NextFunction) => { }

// delete comment on workout
export const deleteCommentOnWorkout = async (req: Request, res: Response, next: NextFunction) => { }

// LIKES

// like workout
export const likeWorkout = async (req: Request, res: Response, next: NextFunction) => { }

// unlike workout
export const unlikeWorkout = async (req: Request, res: Response, next: NextFunction) => { }

// DELETE

// delete workout
export const deleteWorkout = async (req: Request, res: Response, next: NextFunction) => { }