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

        return res.status(200).json({ message: `Got all friend requests for #${user_id}.`, friend_requests: response.rows });
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

        return res.status(200).json({ message: `Got all sent friend requests for #${user_id}.`, friend_requests: response.rows });
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

        return res.status(200).json({ message: `Got all rceived friend requests for #${user_id}.`, friend_requests: response.rows });
    } catch (error) {
        console.error('Error getting received friend requests:', error);
        return res.status(500).json({ message: 'Error getting received friend requests. Please try again later.' });
    }
};

// create a friend request
export const createFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { receiver_id } = req.params;
    const { user_id, username, profile_pic } = req.body;

    if (Number(user_id) === Number(receiver_id)) {
        return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }

    // Start transaction
    const client = await pool.connect();

    try {
        // Begin transaction
        await client.query("BEGIN");

        // Check if the receiver exists and get their info
        const receiverInfo: any = await getUserInfo(Number(receiver_id));

        const receiverUsername = receiverInfo.username;
        const receiverProfilePic = receiverInfo.profile_pic;

        // Check if a request already exists between sender and receiver
        const checkExistingRequestQuery = `
            SELECT * FROM friend_requests
            WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
        `;
        const existingRequest: QueryResult = await client.query(checkExistingRequestQuery, [user_id, receiver_id]);

        if (existingRequest.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "Friend request already exists between these users." });
        }

        // Insert new friend request into the database
        const createFriendRequestQuery = `
            INSERT INTO friend_requests (sender_id, receiver_id, status, created_at, updated_at)
            VALUES ($1, $2, 'Pending', NOW(), NOW())
            RETURNING *;
        `;

        const newRequest: QueryResult = await client.query(createFriendRequestQuery, [user_id, receiver_id]);

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
            client
        });

        // Commit transaction
        await client.query("COMMIT");

        return res.status(201).json({ message: "Friend request sent successfully.", createdRequest: newRequest.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error('Error sending friend request:', error);
        return res.status(500).json({ message: 'Error sending friend request. Please try again later.' });
    } finally {
        client.release();
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
        const query = `
            UPDATE friend_requests 
            SET status = 'Accepted', updated_at = NOW() 
            WHERE friend_request_id = $1 
            RETURNING sender_id, receiver_id;
        `;
        const result: QueryResult = await client.query(query, [friend_request_id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Friend request not found.' });
        }

        // Get sender and receiver IDs
        const senderId = result.rows[0].sender_id;  // The one who sent the request
        const receiverId = result.rows[0].receiver_id;  // The one who accepted the request

        // Fetch user info for both sender and receiver
        const senderInfo: any = await getUserInfo(senderId);
        const receiverInfo: any = await getUserInfo(receiverId);

        if (!senderInfo || !receiverInfo) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User information not found.' });
        }

        // Little confusing here
        // Create notification for the sender of the friend request
        // so have to put receiver in sender fields and vice versa
        await createNotification({
            sender_id: receiverId,  // The receiver is now the one who accepted the request
            sender_username: receiverInfo.username,  // Set to receiver's username
            sender_profile_pic: receiverInfo.profile_pic,  // Set to receiver's profile pic
            receiver_id: senderId,  // The sender is the one being notified
            receiver_username: senderInfo.username,  // Set to sender's username
            receiver_profile_pic: senderInfo.profile_pic,  // Set to sender's profile pic
            type: 'friend_request',
            message: `${receiverInfo.username} has accepted your friend request.`,
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

