import { useFetch } from "@/hooks/useFetch";

// friend api
export const FriendApi = () => {

    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // get all friend requests
    const getAllFriendRequests = async (user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/friend/${user_id}`
        })
    }

    // get friend requests sent by user
    const getAllSentFriendRequests = async (user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/friend/${user_id}/sent`
        })
    }

    // get received friend requests
    const getAllReceivedFriendRequests = async (user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/friend/${user_id}/received`
        })
    }

    // create friend request
    /**
     * @param receiver_id receiving user's id
     * @param userData user_id, username, profile pic of user sending friend request
     * @returns response 
     */

    const createFriendRequest = async (receiver_id: number, userData: { user_id: number, username: string, profile_pic: string }) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/friend/${receiver_id}`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
    }

    // accept friend request
    const acceptFriendRequest = async (friend_request_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/friend/accept/${friend_request_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    // deny friend request
    const denyFriendRequest = async (friend_request_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/friend/deny/${friend_request_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    // cancel sent friend request
    const cancelFriendRequest = async (friend_request_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/friend/cancel/${friend_request_id}`,
            method: "DELETE"
        })
    }

    return {
        getAllFriendRequests,
        getAllSentFriendRequests,
        getAllReceivedFriendRequests,
        createFriendRequest,
        acceptFriendRequest,
        denyFriendRequest,
        cancelFriendRequest,
        isLoadingApi: isLoading, hasError, clearError
    }
}