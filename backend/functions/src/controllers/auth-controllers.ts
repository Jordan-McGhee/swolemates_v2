import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
// const { validationResult } = require("express-validator")
import { QueryResult } from "pg";

// /auth

// sync firebase user with backend
export const syncFirebaseUser = async (req: Request, res: Response, next: NextFunction) => {
    // pull firebase UID and email from request user object
    const firebase_uid = req.user.uid;
    const email = req.user.email;

    // pull user generated data from request body
    const { username, profile_pic } = req.body;

    try {
        // Check if the user already exists
        const checkQuery = "SELECT * FROM users WHERE firebase_uid = $1";
        const userCheck: QueryResult = await pool.query(checkQuery, [firebase_uid]);

        if (userCheck.rows.length > 0) {
            // Update username or profile_pic
            const updateQuery = `
        UPDATE users SET username = $1, profile_pic = $2, updated_at = NOW()
        WHERE firebase_uid = $3
        RETURNING *;
    `;
            const updatedUser = await pool.query(updateQuery, [
                username,
                profile_pic ?? null,
                firebase_uid,
            ]);
            return res.status(200).json({ message: "User synced.", user: updatedUser.rows[0] });
        }

        // Insert new user
        const insertQuery = `INSERT INTO users (firebase_uid, email, username, profile_pic, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *;
    `;
        const insertResult = await pool.query(insertQuery, [
            firebase_uid,
            email,
            username,
            profile_pic ?? null,
        ]);

        return res.status(201).json({ message: "User synced (new).", user: insertResult.rows[0] });
    } catch (error) {
        console.error("Error syncing Firebase user:", error);
        return res.status(500).json({ message: "Error syncing Firebase user." });
    }
};


// delete user from database after they delete their account on the frontend
export const deleteUserByFirebaseUID = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user.uid;

    try {
        const deleteQuery = "DELETE FROM users WHERE firebase_uid = $1";
        await pool.query(deleteQuery, [firebase_uid]);
        return res.status(200).json({ message: "User deleted from database." });
    } catch (error) {
        console.error("Error deleting user by Firebase UID:", error);
        return res.status(500).json({ message: "Failed to delete user from database." });
    }
};