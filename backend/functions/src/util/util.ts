import jwt from "jsonwebtoken";
import { pool } from "../index";
import { QueryResult } from "pg";

// generate token
const JWT_TOKEN = process.env.JWT_TOKEN as string;

/**
 * Generates a JWT token for a given user_id.
 * @param {string} user_id - The ID of the user for whom the token is being generated.
 * @returns {string} - The generated JWT token.
 */
export const generateToken = (user_id: string): string => {
    return jwt.sign({ user_id }, JWT_TOKEN, { expiresIn: "1d" });
};

/**
 * Checks if a username already exists in the database.
 * @param {string} username - The username to check for existence.
 * @returns {Promise<boolean>} - Returns true if the username exists, false otherwise.
 */
export const checkIfUsernameExists = async (username: string): Promise<boolean> => {
    const query = "SELECT user_id FROM users WHERE username = $1";
    const result: QueryResult = await pool.query(query, [username]);
    return result.rows.length > 0;
};

/**
 * Validates if a given string is in the proper email format.
 * @param {string} value - The string to validate as an email.
 * @returns {boolean} - Returns true if the string is a valid email format, false otherwise.
 */
export const isEmailFormat = (value: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
};

/**
 * Creates a notification for a user, either in a transaction or standard query.
 * @param {Object} params - The parameters needed to create a notification.
 * @param {number} params.sender_id - The ID of the sender of the notification.
 * @param {string} params.sender_username - The unique username of the sender of the notification.
 * @param {string} params.sender_profile_pic - The string of the sender's profile pic.
 * @param {number} params.receiver_id - The ID of the receiver of the notification.
 * @param {string} params.receiver_username - The unique username of the receiver of the notification. (optional)
 * @param {string} params.receiver_profile_pic - The string of the receiver's profile pic. (optional)
 * @param {string} params.type - The type of notification.
 * @param {string} params.message - The message of the notification.
 * @param {string} params.reference_type - The type of reference (e.g., post, workout).
 * @param {number} params.reference_id - The ID of the referenced entity.
 * @param {any} [params.client] - An optional client (transaction) to run the query in the same transaction.
 * @returns {Promise<Object>} - The created notification object.
 */
export const createNotification = async ({
    sender_id,
    sender_username,
    sender_profile_pic,
    receiver_id,
    receiver_username,
    receiver_profile_pic,
    type,
    message,
    reference_type,
    reference_id,
    client
}: {
    sender_id: number;
    sender_username: string;
    sender_profile_pic: string;
    receiver_id: number;
    receiver_username?: string;
    receiver_profile_pic?: string;
    type: string;
    message: string;
    reference_type: string;
    reference_id: number;
    client?: any;
}): Promise<Object> => {
    const notificationQuery = `
        INSERT INTO notifications 
        (sender_id, sender_username, sender_profile_pic, receiver_id, type, message, reference_type, reference_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *;
    `;

    let notificationRes: QueryResult;

    if (client) {
        // If a client (transaction) is provided, use it
        notificationRes = await client.query(notificationQuery, [
            sender_id,
            sender_username,
            sender_profile_pic,
            receiver_id,
            receiver_username,
            receiver_profile_pic,
            type,
            message,
            reference_type,
            reference_id,
        ]);
    } else {
        // Otherwise, use the pool (standard query)
        notificationRes = await pool.query(notificationQuery, [
            sender_id,
            sender_username,
            sender_profile_pic,
            receiver_id,
            receiver_username,
            receiver_profile_pic,
            type,
            message,
            reference_type,
            reference_id,
        ]);
    }

    // Return the created notification
    return notificationRes.rows[0];
};

/**
 * Retrieves the username for a given user_id, supports transactions.
 * @param {number} user_id - The ID of the user whose username is being retrieved.
 * @param {any} [client] - An optional client (transaction) to run the query in the same transaction.
 * @returns {Promise<string>} - The username associated with the provided user_id.
 * @throws {Error} - Throws an error if the user is not found.
 */
export const getUserInfo = async (user_id: number, client?: any): Promise<string> => {
    const getUsernameQuery = `
        SELECT *
        FROM users
        WHERE user_id = $1
    `;

    let getUsernameResponse: QueryResult;

    if (client) {
        // If a client (transaction) is provided, use it
        getUsernameResponse = await client.query(getUsernameQuery, [user_id]);
    } else {
        // Otherwise, use the pool
        getUsernameResponse = await pool.query(getUsernameQuery, [user_id]);
    }

    if (getUsernameResponse.rows.length === 0) {
        throw new Error(`User #${user_id} not found.`);
    }

    return getUsernameResponse.rows[0]
};
