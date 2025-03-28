const express = require("express")
import * as notificationControllers from "../controllers/notification-controllers"

const router = express.Router()

// /notification

// Get all notifications for a user
router.get("/:user_id", notificationControllers.getUserNotifications);

// Get unread notifications for a user
router.get("/:user_id/unread", notificationControllers.getUnreadNotifications);

// Fetch notifications by type (query param: ?type=like/comment/friend_request)
router.get("/:user_id/filter", notificationControllers.getNotificationsByType);

// change notification read status
router.put("/:notification_id/status", notificationControllers.changeNotificationReadStatus);

// Mark all notifications as read for a user
router.put("/:user_id/read-all", notificationControllers.markAllNotificationsAsRead);

// Delete a single notification
router.delete("/:notification_id", notificationControllers.deleteNotification);

// Clear all notifications for a user
router.delete("/:user_id/clear", notificationControllers.deleteAllUserNotifications);

module.exports = router