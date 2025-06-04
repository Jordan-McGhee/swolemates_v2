import { useFetch } from "@/hooks/useFetch";

// notification api
export const notificationApi = () => {

    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // get all notifications
    const getAllNotifications = async (user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/notification/${user_id}`
        })
    }

    // get unread notifications
    const getUnreadNotifications = async (user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/notification/${user_id}/unread`
        })
    }

    // get notifications by type (query param: ?type=like/comment/friend_request)
    const getNotificationsByType = async (user_id: number, notification_type: string) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/notification/${user_id}/filter?type=${notification_type}`
        })
    }

    // change notification read status
    const changeNotificationReadStatus = async (notification_id: number, read_status: boolean) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/notification/${notification_id}/status`,
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(read_status)
        })
    }

    // mark all notifications as read
    const markAllNotificationsAsRead = async (user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/${user_id}/read-all`,
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    // delete a notification
    const deleteNotification = async (notification_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/${notification_id}`,
            method: "DELETE"
        })
    }

    // clear all notifications
        const deleteAllUserNotifications = async (user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/${user_id}/clear`,
            method: "DELETE"
        })
    }

    return {
        getAllNotifications,
        getUnreadNotifications,
        getNotificationsByType,
        changeNotificationReadStatus,
        markAllNotificationsAsRead,
        deleteNotification,
        deleteAllUserNotifications,
        isLoadingApi: isLoading, hasError, clearError
    }
}