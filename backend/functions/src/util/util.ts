import jwt from "jsonwebtoken";
import { pool } from "../index";
import { QueryResult } from "pg";
import admin from "firebase-admin";

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
 * Checks if a group name already exists in the database.
 * @param {string} group_name - The name of the group to check for existence.
 * @returns {Promise<boolean>} - Returns true if the group name exists, false otherwise.
 */
export const checkIfGroupNameExists = async (group_name: string): Promise<boolean> => {
    const query = "SELECT 1 FROM groups WHERE LOWER(name) = LOWER($1)";
    const result: QueryResult = await pool.query(query, [group_name]);
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
    SELECT user_id, username, email, profile_pic, bio, is_private, firebase_uid, created_at, updated_at
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

export const getViewerIdFromAuthHeader = async (authHeader?: string): Promise<string | null> => {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const idToken = authHeader.split(" ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.warn("Invalid or expired token:", error);
        return null; // Don't throw — route remains public
    }
};

/**
 * Slugifies a given name by converting it to lowercase, replacing non-alphanumeric characters with hyphens,
 * and removing leading or trailing hyphens.
 * @param {string} name - The name to slugify.
 * @returns {string} - The slugified version of the name.
 */
export const slugify = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
}

/**
 * Checks if a profile is private based on the target user's username.
 * @param {string} target_user_username - The username of the user to check.
 * @returns {Promise<boolean>} - Returns true if the profile is private, false otherwise.
 * @throws {Error} - Throws an error if the user is not found.
 */
export const isProfilePrivate = async (target_user_username: string): Promise<boolean> => {
    const query = "SELECT is_private FROM users WHERE LOWER(username) = LOWER($1)";
    const result: QueryResult = await pool.query(query, [target_user_username]);
    if (result.rows.length === 0) {
        throw new Error(`User with username ${target_user_username} not found.`);
    }
    return result.rows[0].is_private;
}

/**
 * Checks if two users are friends based on their user ID and the target user's username.
 * @param {number} viewer_id - The ID of the viewer.
 * @param {string} target_user_username - The username of the target user.
 * @returns {Promise<boolean>} - Returns true if they are friends, false otherwise.
 */
export const checkIfUsersAreFriends = async (viewer_id: number, target_user_username: string): Promise<boolean> => {
    // Get target user's user_id from username
    const userQuery = "SELECT user_id FROM users WHERE LOWER(username) = LOWER($1)";
    const userResult: QueryResult = await pool.query(userQuery, [target_user_username]);
    if (userResult.rows.length === 0) {
        throw new Error(`User with username ${target_user_username} not found.`);
    }
    const target_user_id = userResult.rows[0].user_id;

    const query = `
        SELECT 1 FROM friend_requests
        WHERE (sender_id = $1 AND receiver_id = $2 AND status = 'accepted')
        OR (sender_id = $2 AND receiver_id = $1 AND status = 'accepted')
    `;
    const result: QueryResult = await pool.query(query, [viewer_id, target_user_id]);
    return result.rows.length > 0;
}

/**
 * Checks if a user can view another user's private profile using the target user's username.
 * @param {number} viewer_id - The ID of the user trying to view the profile.
 * @param {string} target_user_username - The username of the user whose profile is being viewed.
 * @returns {Promise<boolean>} - Returns true if the viewer can view the profile, false otherwise.
 */
export const canViewPrivateProfile = async(viewer_id: number, target_user_username: string): Promise<boolean> => {
    // Get target user's user_id from username
    const userQuery = "SELECT user_id FROM users WHERE LOWER(username) = LOWER($1)";
    const userResult: QueryResult = await pool.query(userQuery, [target_user_username]);
    if (userResult.rows.length === 0) {
        throw new Error(`User with username ${target_user_username} not found.`);
    }
    const target_user_id = userResult.rows[0].user_id;

    if (viewer_id === target_user_id) return true; // always allow viewing own profile
    const [isPrivate, isFriend] = await Promise.all([
        isProfilePrivate(target_user_username),
        checkIfUsersAreFriends(viewer_id, target_user_username),
    ])
    return !isPrivate || isFriend;
}

/**
 * Checks if a user can view a private group.
 * @param {number} viewer_id - The ID of the user trying to view the group.
 * @param {number} group_id - The ID of the group being viewed.
 * @returns {Promise<boolean>} - Returns true if the viewer can view the group, false otherwise.
 */
export const canViewPrivateGroup = async (viewer_id: number, group_id: number): Promise<boolean> => {
    const query = `
        SELECT 1 FROM group_members
        WHERE group_id = $1 AND user_id = $2 AND is_member = true
    `;
    const result: QueryResult = await pool.query(query, [group_id, viewer_id]);
    return result.rows.length > 0;
}