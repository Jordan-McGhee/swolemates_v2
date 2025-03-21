const bcrypt = require('bcryptjs');
import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
const { validationResult } = require("express-validator")
import { QueryResult } from "pg";
import { generateToken, checkIfUsernameExists, isEmailFormat } from "../util/util";

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
        return res.status(500).json({ message: "Error getting all users." });
    }
};

// Get a single user
export const getSingleUser = async (req: Request, res: Response, next: NextFunction) => {

    const { user_id } = req.params;
    const userQuery: string = "SELECT * FROM users WHERE id = $1";

    try {
        const userResponse: QueryResult = await pool.query(userQuery, [user_id]);
        if (userResponse.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ message: "Got user.", user: userResponse.rows[0] });
    } catch (error) {
        console.error("Error getting user:", error);
        return res.status(500).json({ message: "Error getting user." });
    }
};

// sign up controller
export const signUp = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    try {
        // Check if email is already taken
        const emailCheckQuery = "SELECT id FROM users WHERE email = $1";
        const emailCheckResult: QueryResult = await pool.query(emailCheckQuery, [email]);

        if (emailCheckResult.rows.length > 0) {
            return res.status(400).json({ message: "Email is already in use." });
        }

        // Check if username is valid (no special characters)
        const usernameRegex = /^[a-zA-Z0-9_]+$/; // Only allow alphanumeric and underscore
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: "Username contains invalid characters." });
        }

        // Check if username is already taken
        const usernameExists = await checkIfUsernameExists(username);
        if (usernameExists) {
            return res.status(400).json({ message: "Username is already taken." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the user
        const insertUserQuery = "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username";
        const userResponse: QueryResult = await pool.query(insertUserQuery, [email, username, hashedPassword]);
        const user = userResponse.rows[0];

        // Generate token
        const token = generateToken(user.user_id);

        return res.status(201).json({ message: "User created.", user, token });
    } catch (error) {
        console.error("Error signing up:", error);
        return res.status(500).json({ message: "Error signing up." });
    }
};

// log in controller
export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { emailOrUsername, password } = req.body;

    try {
        // Determine if the input is an email or username
        let userQuery;
        let values;

        if (isEmailFormat(emailOrUsername)) {
            // Input is an email
            userQuery = "SELECT * FROM users WHERE email = $1";
            values = [emailOrUsername];
        } else {
            // Input is a username
            userQuery = "SELECT * FROM users WHERE username = $1";
            values = [emailOrUsername];
        }

        const userResponse: QueryResult = await pool.query(userQuery, values);

        if (userResponse.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const user = userResponse.rows[0];

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Generate token
        const token = generateToken(user.user_id);

        return res.status(200).json({ message: "Logged in successfully.", user, token });
    } catch (error) {
        console.error("Error logging in:", error);
        return res.status(500).json({ message: "Error logging in." });
    }
};

// Change password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { user_id } = req.params;
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatePasswordQuery: string = "UPDATE users SET password = $1 WHERE id = $2";

    try {
        await pool.query(updatePasswordQuery, [hashedPassword, user_id]);
        return res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ message: "Error changing password." });
    }
};

// Check username availability
export const checkUsernameAvailability = async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.body;

    try {
        const usernameExists = await checkIfUsernameExists(username);

        if (usernameExists) {
            return res.status(400).json({ message: "Username is already taken." });
        }

        return res.status(200).json({ message: "Username is available." });
    } catch (error) {
        console.error("Error checking username availability:", error);
        return res.status(500).json({ message: "Error checking username availability." });
    }
};

// Update profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;
    const { username, bio } = req.body;
    const updateProfileQuery: string = "UPDATE users SET username = $1, bio = $2 WHERE id = $3 RETURNING *";

    try {
        const userResponse: QueryResult = await pool.query(updateProfileQuery, [username, bio, user_id]);
        return res.status(200).json({ message: "Profile updated.", user: userResponse.rows[0] });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Error updating profile." });
    }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;
    const deleteUserQuery: string = "DELETE FROM users WHERE id = $1";

    try {
        await pool.query(deleteUserQuery, [user_id]);
        return res.status(200).json({ message: "Account deleted." });
    } catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({ message: "Error deleting account." });
    }
};