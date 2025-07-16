import jwt from "jsonwebtoken";
import { pool } from "../index";
import { QueryResult } from "pg";

// types import
import { UserInfo } from "../types/types";

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
    const query = "SELECT 1 FROM users WHERE username = $1";
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
    receiver_username = null,  // Default to null if undefined
    receiver_profile_pic = null, // Default to null if undefined
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
    receiver_username?: string | null;
    receiver_profile_pic?: string | null;
    type: string;
    message: string;
    reference_type: string;
    reference_id: number;
    client?: any;
}): Promise<Object> => {
    const notificationQuery = `
        INSERT INTO notifications 
        (sender_id, sender_username, sender_profile_pic, receiver_id, receiver_username, receiver_profile_pic, type, message, reference_type, reference_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *;
    `;

    const values = [
        sender_id,
        sender_username,
        sender_profile_pic,
        receiver_id,
        receiver_username,
        receiver_profile_pic,
        type,
        message,
        reference_type,
        reference_id
    ];

    const notificationRes: QueryResult = client
        ? await client.query(notificationQuery, values)
        : await pool.query(notificationQuery, values);

    return notificationRes.rows[0];
};


/**
 * Retrieves user info for a given user_id, supports transactions.
 * @param {number} user_id - The ID of the user to retrieve.
 * @param {any} [client] - Optional transaction client.
 * @returns {Promise<UserInfo>} - The user info object.
 * @throws {Error} - Throws if user not found.
 */
export const getUserInfo = async (
    user_id: number,
    client?: any
): Promise<UserInfo> => {
    const getUserQuery = `
    SELECT user_id, username, profile_pic, bio, created_at, updated_at
    FROM users
    WHERE user_id = $1
`;

    let result: QueryResult;

    if (client) {
        result = await client.query(getUserQuery, [user_id]);
    } else {
        result = await pool.query(getUserQuery, [user_id]);
    }

    if (result.rows.length === 0) {
        throw new Error(`User #${user_id} not found.`);
    }

    return result.rows[0] as UserInfo;
};

/**
 * Retrieves the user_id for a given Firebase UID.
 * @param {string} firebaseUid - The Firebase UID of the user.
 * @returns {Promise<number>} - The user_id associated with the provided Firebase UID.
 * @throws {Error} - Throws an error if the user is not found.
 */
export const getUserIdFromFirebaseUid = async (firebaseUid: string) => {
    const { rows } = await pool.query(
        "SELECT user_id FROM users WHERE firebase_uid = $1",
        [firebaseUid]
    );

    if (rows.length === 0) {
        throw new Error("User not found.");
    }

    return rows[0].user_id;
};
