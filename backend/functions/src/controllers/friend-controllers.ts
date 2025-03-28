import { Request, Response, NextFunction } from 'express';
import { pool } from "../index";
import { createNotification, getUserInfo } from "../util/util";
import { QueryResult } from "pg";

// Get all friend requests for a user
export const getAllUserFriendRequests = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;

    try {
        const query = "SELECT * FROM friend_requests WHERE sender_id = $1 OR receiver_id = $1";
        const response: QueryResult = await pool.query(query, [user_id]);

        return res.status(200).json(response.rows);
    } catch (error) {
        console.error('Error getting friend requests:', error);
        return res.status(500).json({ message: 'Error getting friend requests. Please try again later.' });
    }
};

// Get all friend requests sent by a user
export const getAllUserSentRequests = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;

    try {
        const query = "SELECT * FROM friend_requests WHERE sender_id = $1 AND status = 'Pending'";
        const response: QueryResult = await pool.query(query, [user_id]);

        return res.status(200).json(response.rows);
    } catch (error) {
        console.error('Error getting sent friend requests:', error);
        return res.status(500).json({ message: 'Error getting sent friend requests. Please try again later.' });
    }
};

// Get all friend requests received by a user
export const getAllUserReceivedRequests = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;

    try {
        const query = "SELECT * FROM friend_requests WHERE receiver_id = $1 AND status = 'Pending'";
        const response: QueryResult = await pool.query(query, [user_id]);

        return res.status(200).json(response.rows);
    } catch (error) {
        console.error('Error getting received friend requests:', error);
        return res.status(500).json({ message: 'Error getting received friend requests. Please try again later.' });
    }
};

// Create a friend request
export const createFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { receiver_id } = req.params;
    const { user_id, username, profile_pic } = req.body;

    // Validate sender and receiver are not the same
    if (user_id === Number(receiver_id)) {
        return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }

    try {
        // Check if the receiver exists and get their info
        const receiverInfo: QueryResult = await pool.query("SELECT * FROM users WHERE user_id = $1", [receiver_id]);

        if (receiverInfo.rows.length === 0) {
            return res.status(404).json({ message: `User with user ID ${receiver_id} not found.` });
        }

        const receiverUsername = receiverInfo.rows[0].username;
        const receiverProfilePic = receiverInfo.rows[0].profile_pic;

        // Check if a request already exists between sender and receiver
        const checkExistingRequestQuery = `
            SELECT * FROM friend_requests
            WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
        `;
        const existingRequest: QueryResult = await pool.query(checkExistingRequestQuery, [user_id, receiver_id]);

        if (existingRequest.rows.length > 0) {
            return res.status(409).json({ message: "Friend request already exists between these users." });
        }

        // Insert new friend request into the database
        const createFriendRequestQuery = `
            INSERT INTO friend_requests (sender_id, receiver_id, status, created_at, updated_at)
            VALUES ($1, $2, 'Pending', NOW(), NOW())
            RETURNING *;
        `;
        const newRequest: QueryResult = await pool.query(createFriendRequestQuery, [user_id, receiver_id]);

        // Create notification for the receiver
        await createNotification({
            sender_id: user_id,
            sender_username: username,
            sender_profile_pic: profile_pic,
            receiver_id: Number(receiver_id),
            receiver_username: receiverUsername,
            receiver_profile_pic: receiverProfilePic,
            type: 'friend_request',
            message: `${username} has sent you a friend request.`,
            reference_type: 'friend_request',
            reference_id: newRequest.rows[0].friend_request_id,
        });

        return res.status(201).json({ message: "Friend request sent successfully.", request: newRequest.rows[0] });
    } catch (error) {
        console.error('Error sending friend request:', error);
        return res.status(500).json({ message: 'Error sending friend request. Please try again later.' });
    }
};



// Accept a friend request
export const acceptFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { friend_request_id } = req.params;

     // Create a client for transaction
    const client = await pool.connect();

    try {
        // Begin transaction
        await client.query('BEGIN');

        // Update friend request status to 'Accepted'
        const query = "UPDATE friend_requests SET status = 'Accepted', updated_at = NOW() WHERE friend_request_id = $1 RETURNING *";
        const result: QueryResult = await client.query(query, [friend_request_id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Friend request not found.' });
        }

        // Get the sender and receiver info for notification
        const senderId = result.rows[0].sender_id;  // The one who sent the request
        const receiverId = result.rows[0].receiver_id;  // The one who accepted the request
        const receiverUsername = result.rows[0].receiver_username; // Get receiver's username
        const receiverProfilePic = result.rows[0].receiver_profile_pic; // Get receiver's profile pic

        // Create notification for the sender of the friend request
        await createNotification({
            sender_id: receiverId,  // The receiver is now the one who accepted the request
            sender_username: receiverUsername,  // Set to receiver's username
            sender_profile_pic: receiverProfilePic,  // Set to receiver's profile pic
            receiver_id: senderId,  // The sender is the one being notified
            type: 'friend_request_accepted',
            message: `${receiverUsername} has accepted your friend request.`,
            reference_type: 'friend_request',
            reference_id: Number(friend_request_id),
            client
        });

        await client.query('COMMIT');

        return res.status(200).json({ message: 'Friend request accepted.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error accepting friend request:', error);
        return res.status(500).json({ message: 'Error accepting friend request. Please try again later.' });
    } finally {
        client.release();
    }
};

// Deny a friend request
export const denyFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { friend_request_id } = req.params;

    try {
        // Update friend request status to 'Denied'
        const query = "UPDATE friend_requests SET status = 'Denied', updated_at = NOW() WHERE friend_request_id = $1 RETURNING *";
        const result: QueryResult = await pool.query(query, [friend_request_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Friend request not found.' });
        }

        return res.status(200).json({ message: 'Friend request denied.' });
    } catch (error) {
        console.error('Error denying friend request:', error);
        return res.status(500).json({ message: 'Error denying friend request. Please try again later.' });
    }
};

// Cancel a friend request
export const cancelFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { friend_request_id } = req.params;

    try {
        // Delete friend request from the database
        const query = "DELETE FROM friend_requests WHERE friend_request_id = $1 RETURNING *";
        const result: QueryResult = await pool.query(query, [friend_request_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Friend request not found.' });
        }

        // Return the canceled friend request data
        return res.status(200).json({
            message: 'Friend request canceled.',
            canceledRequest: result.rows[0]
        });
    } catch (error) {
        console.error('Error canceling friend request:', error);
        return res.status(500).json({ message: 'Error canceling friend request. Please try again later.' });
    }
};

