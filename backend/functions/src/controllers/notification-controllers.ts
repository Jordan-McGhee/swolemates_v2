import { pool } from "../index"
import { Request, Response, NextFunction } from "express"
import { QueryResult } from "pg";

// blank function
// export const fnName = async (req: Request, res: Response, next: NextFunction) => {}

// Get all notifications for a user
export const getUserNotifications = async (req: Request, res: Response) => {
    const { user_id } = req.params;

    const query = `
        SELECT * FROM notifications 
        WHERE receiver_id = $1 
        ORDER BY created_at DESC;
    `;

    try {
        const notifications = await pool.query(query, [user_id]);
        return res.status(200).json({ notifications: notifications.rows });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Could not retrieve notifications." });
    }
};

// get unread notifications
export const getUnreadNotifications = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params

    const unreadQuery = `
    SELECT * FROM notifications
    WHERE receiver_id = $1 and is_read = FALSE
    ORDER BY created_at DESC
    `

    try {
        const unreadNotifications = await pool.query(unreadQuery, [user_id]);
        return res.status(200).json({ notifications: unreadNotifications.rows });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Could not retrieve notifications." });
    }
}

// get notifications by type
export const getNotificationsByType = async (req: Request, res: Response) => {
    const { user_id } = req.params;
    const { type } = req.query; // can be one of the following: [ friend_request, comment, like, group_invite, post_mention ]

    if (!type) {
        return res.status(400).json({ message: "Notification type is required." });
    }

    const query = `
        SELECT * FROM notifications 
        WHERE receiver_id = $1 AND type = $2
        ORDER BY created_at DESC;
    `;

    try {
        const notifications = await pool.query(query, [user_id, type]);
        return res.status(200).json({ notifications: notifications.rows });
    } catch (error) {
        console.error("Error filtering notifications:", error);
        return res.status(500).json({ message: "Could not retrieve notifications by type." });
    }
};

// change notification read status
export const changeNotificationReadStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { notification_id } = req.params;
    const { is_read } = req.body; // Read status from the request body

    // Validate notification_id
    if (!notification_id || isNaN(Number(notification_id))) {
        return res.status(400).json({ message: "Invalid notification ID." });
    }

    // Validate is_read status (boolean)
    if (typeof is_read !== 'boolean') {
        return res.status(400).json({ message: "is_read status must be a boolean." });
    }

    const changeStatusQuery = `
        UPDATE notifications
        SET is_read = $1, updated_at = NOW()
        WHERE notification_id = $2
        RETURNING *;
    `;

    try {
        // Update the read status directly
        const updateNotificationResponse: QueryResult = await pool.query(changeStatusQuery, [!is_read, notification_id]);

        // Check if the notification was updated
        if (updateNotificationResponse.rows.length === 0) {
            return res.status(404).json({ message: "Notification not found." });
        }

        return res.status(200).json({
            message: `Notification read status updated from ${is_read} to ${!is_read}`,
            notification: updateNotificationResponse.rows[0]
        });
    } catch (error) {
        console.error(`Error updating notification read status for #${notification_id}:`, error);
        return res.status(500).json({ message: "Error updating notification status. Please try again later." });
    }
};


// mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
    const { user_id } = req.params;

    const query = `
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE receiver_id = $1 
        RETURNING *;
    `;

    try {
        const updatedNotifications = await pool.query(query, [user_id]);
        return res.status(200).json({ message: "All notifications marked as read.", notifications: updatedNotifications.rows });
    } catch (error) {
        console.error("Error updating notifications:", error);
        return res.status(500).json({ message: "Could not update notifications." });
    }
};

// delete single notification
export const deleteNotification = async (req: Request, res: Response) => {
    const { notification_id } = req.params;

    const query = `
        DELETE FROM notifications 
        WHERE notification_id = $1 
        RETURNING *;
    `;

    try {
        const deletedNotification = await pool.query(query, [notification_id]);
        return res.status(200).json({ message: "Notification deleted.", notification: deletedNotification.rows[0] });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({ message: "Could not delete notification." });
    }
};

// delete all notifications
export const deleteAllUserNotifications = async (req: Request, res: Response) => {
    const { user_id } = req.params;

    const query = `
        DELETE FROM notifications 
        WHERE receiver_id = $1;
    `;

    try {
        await pool.query(query, [user_id]);
        return res.status(200).json({ message: "All notifications cleared successfully." });
    } catch (error) {
        console.error("Error clearing notifications:", error);
        return res.status(500).json({ message: "Could not clear notifications." });
    }
};