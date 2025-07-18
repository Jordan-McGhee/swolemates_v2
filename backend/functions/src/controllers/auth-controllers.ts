import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
// const { validationResult } = require("express-validator")
import { QueryResult } from "pg";

// utils import
import { slugify, getUserIdFromFirebaseUid, getUserInfo } from "../util/util";

// /auth

// Get PostgreSQL user by Firebase UID
export const getPostgreSQLUser = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user.uid;

    console.log("Fetching PostgreSQL user for Firebase UID:", req.user);

    try {
        console.log("Looking up user ID by Firebase UID:", firebase_uid);
        const user_id = await getUserIdFromFirebaseUid(firebase_uid);
        console.log("Found user ID:", user_id);

        const userInfo = await getUserInfo(user_id);
        console.log("Retrieved user info:", userInfo);

        return res.status(200).json({ user: userInfo });
    } catch (error) {
        console.error("Error getting PostgreSQL user:", error);
        return res.status(500).json({ message: "Failed to retrieve user.", error});
    }

}

// Update user profile info (username, bio, etc.)
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user.uid;
    const { username, bio, profile_pic } = req.body;

    try {
        // Check user exists
        const userQuery = "SELECT * FROM users WHERE firebase_uid = $1";
        const userResult: QueryResult = await pool.query(userQuery, [firebase_uid]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        // Update user with provided data
        const updateQuery = `
            UPDATE users
            SET username = $1,
                bio = $2,
                profile_pic = $3,
                updated_at = NOW()
            WHERE firebase_uid = $4
            RETURNING *;
        `;

        const updatedResult = await pool.query(updateQuery, [
            username,
            bio ?? null,
            profile_pic ?? null,
            firebase_uid,
        ]);

        return res.status(200).json({ message: "User profile updated.", user: updatedResult.rows[0] });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ message: "Failed to update user profile." });
    }
};

// sync firebase user with backend
export const syncFirebaseUser = async (req: Request, res: Response, next: NextFunction) => {
    const firebase_uid = req.user.uid;
    const email = req.user.email;
    const sign_in_provider = req.user.sign_in_provider;
    const { username: rawUsername, profile_pic } = req.body;

    try {
        const checkQuery = "SELECT * FROM users WHERE firebase_uid = $1";
        const userCheck: QueryResult = await pool.query(checkQuery, [firebase_uid]);

        let finalUsername = rawUsername;

        if (userCheck.rows.length === 0) {
            // Initial signup
            if (sign_in_provider === "google.com") {
                // Slugify username on first creation only
                const baseSlug = slugify(rawUsername);
                finalUsername = baseSlug;
                let suffix = 1;

                while (true) {
                    const existing = await pool.query(
                        "SELECT 1 FROM users WHERE username = $1",
                        [finalUsername]
                    );
                    if (existing.rowCount === 0) break;
                    finalUsername = `${baseSlug}-${suffix++}`;
                }
            }

            const insertQuery = `
                INSERT INTO users (firebase_uid, email, username, profile_pic, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING *;
            `;

            const insertResult = await pool.query(insertQuery, [
                firebase_uid,
                email,
                finalUsername,
                profile_pic ?? null,
            ]);

            return res.status(201).json({ message: "User synced (new).", user: insertResult.rows[0] });
        }

        // Existing user: update profile_pic only — do NOT overwrite username here
        const updateQuery = `
            UPDATE users 
            SET profile_pic = $1, updated_at = NOW()
            WHERE firebase_uid = $2
            RETURNING *;
        `;

        const updatedUser = await pool.query(updateQuery, [
            profile_pic ?? null,
            firebase_uid,
        ]);

        return res.status(200).json({ message: "User synced.", user: updatedUser.rows[0] });

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

        console.log(`Deleted user with Firebase UID: ${firebase_uid}`);
        return res.status(200).json({ message: "User deleted from database." });
    } catch (error) {
        console.error("Error deleting user by Firebase UID:", error);
        return res.status(500).json({ message: "Failed to delete user from database." });
    }
};