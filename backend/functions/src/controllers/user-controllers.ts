// const bcrypt = require('bcryptjs');
import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
// const { validationResult } = require("express-validator")
import { QueryResult } from "pg";
import { checkIfUsernameExists }  from "../util/util";

// blank function
// export const fnName = async (req: Request, res: Response, next: NextFunction) => {}

// Get all users
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    const userQuery: string = "SELECT * FROM users";

    try {
        const userResponse: QueryResult = await pool.query(userQuery);
        return res.status(200).json({ message: "Got all users.", users: userResponse.rows });
    } catch (error) {
        console.error("Error getting all users:", error);
        return res.status(500).json({ message: `Error getting all users: ${error}` });
    }
};

// Get a single user
export const getSingleUser = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;
    const userQuery: string = "SELECT * FROM users WHERE user_id = $1";

    try {
        const userResponse: QueryResult = await pool.query(userQuery, [user_id]);
        if (userResponse.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ message: "Got user.", user: userResponse.rows[0] });
    } catch (error) {
        console.error("Error getting user:", error);
        return res.status(500).json({ message: `Error getting user: ${error}` });
    }
};

// Get user's friends
export const getUserFriends = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;

    try {
        // Query to get the accepted friend requests for the user
        const query = `
            SELECT 
                CASE 
                    WHEN f.sender_id = $1 THEN f.receiver_id 
                    ELSE f.sender_id 
                END AS friend_id
            FROM 
                friend_requests f
            WHERE 
                (f.sender_id = $1 OR f.receiver_id = $1)
                AND f.status = 'Accepted';
        `;

        // Run the query with the user_id
        const result: QueryResult = await pool.query(query, [user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No friends found.' });
        }

        // Extract the friend_ids from the query result
        const friendIds = result.rows.map(row => row.friend_id);

        // Now, get the user information for each friend
        const userQuery = `
            SELECT user_id, username, profile_pic
            FROM users
            WHERE user_id = ANY($1);
        `;

        // Get friends' details using the friend_ids
        const userResult: QueryResult = await pool.query(userQuery, [friendIds]);

        return res.status(200).json(userResult.rows);
    } catch (error) {
        console.error('Error fetching user friends:', error);
        return res.status(500).json({ message: 'Error fetching user friends. Please try again later.' });
    }
};

// Sign up controller
// export const signUp = async (req: Request, res: Response, next: NextFunction) => {

//     const errors = validationResult(req);

//     // checks for valid email string, username length > 4 and password length > 8
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     const { email, username, password } = req.body;

//     try {
//         // Check if email is already taken
//         const emailCheckQuery = "SELECT user_id FROM users WHERE email = $1";
//         const emailCheckResult: QueryResult = await pool.query(emailCheckQuery, [email]);

//         if (emailCheckResult.rows.length > 0) {
//             return res.status(400).json({ message: "Email is already in use." });
//         }

//         // Check if username is valid (no special characters)
//         const usernameRegex = /^[a-zA-Z0-9_]+$/;
//         if (!usernameRegex.test(username)) {
//             return res.status(400).json({ message: "Username contains invalid characters." });
//         }

//         // Check if username is already taken
//         const usernameExists = await checkIfUsernameExists(username);
//         if (usernameExists) {
//             return res.status(400).json({ message: "Username is already taken." });
//         }

//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, 12);

//         // Insert the user
//         const insertUserQuery = "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING *";
//         const userResponse: QueryResult = await pool.query(insertUserQuery, [email, username, hashedPassword]);
//         const user = userResponse.rows[0];

//         // Generate token
//         const token = generateToken(user.user_id);

//         return res.status(201).json({ message: "User created.", user, token });
//     } catch (error) {
//         console.error("Error signing up:", error);
//         return res.status(500).json({ message: `Error signing up: ${error}` });
//     }
// };

// Log in controller
// export const login = async (req: Request, res: Response, next: NextFunction) => {
//     const { emailOrUsername, password } = req.body;

//     try {
//         // Determine if the input is an email or username
//         let userQuery;
//         let values;

//         if (isEmailFormat(emailOrUsername)) {
//             // Input is an email
//             userQuery = "SELECT * FROM users WHERE email = $1";
//             values = [emailOrUsername];
//         } else {
//             // Input is a username
//             userQuery = "SELECT * FROM users WHERE username = $1";
//             values = [emailOrUsername];
//         }

//         const userResponse: QueryResult = await pool.query(userQuery, values);

//         if (userResponse.rows.length === 0) {
//             return res.status(401).json({ message: "Invalid credentials." });
//         }

//         const user = userResponse.rows[0];

//         // Check if the password is correct
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ message: "Invalid credentials." });
//         }

//         // Generate token
//         const token = generateToken(user.user_id);

//         return res.status(200).json({ message: "Logged in successfully.", user, token });
//     } catch (error) {
//         console.error("Error logging in:", error);
//         return res.status(500).json({ message: `Error logging in: ${error}` });
//     }
// };

// Change password
// export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     const { user_id } = req.params;
//     const { password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 12);
//     const updatePasswordQuery: string = "UPDATE users SET password = $1 WHERE user_id = $2";

//     try {
//         await pool.query(updatePasswordQuery, [hashedPassword, user_id]);
//         return res.status(200).json({ message: `Password changed successfully for user #${user_id}.` });
//     } catch (error) {
//         console.error("Error changing password:", error);
//         return res.status(500).json({ message: `Error changing password: ${error}` });
//     }
// };


// Update bio
export const updateBio = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;
    const { bio } = req.body;
    const updateBioQuery: string = "UPDATE users SET bio = $1 WHERE user_id = $2 RETURNING *";

    try {
        const userResponse: QueryResult = await pool.query(updateBioQuery, [bio, user_id]);
        return res.status(200).json({ message: `Bio updated for user #${user_id}.`, user: userResponse.rows[0] });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: `Error updating Bio: ${error}` });
    }
};


// Delete account
// export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
//     const { user_id } = req.params;
//     const deleteUserQuery: string = "DELETE FROM users WHERE user_id = $1";

//     try {
//         await pool.query(deleteUserQuery, [user_id]);
//         return res.status(200).json({ message: "Account deleted." });
//     } catch (error) {
//         console.error("Error deleting account:", error);
//         return res.status(500).json({ message: `Error deleting account: ${error}` });
//     }
// };