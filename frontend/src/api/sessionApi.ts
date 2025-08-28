// hook imports
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthProvider";
import { SessionExercise } from "@/types/props/props-types";

// type imports

// session api
export const sessionApi = () => {
    // hook destructuring
    const { token } = useAuth();
    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // Use Vite env var
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // get all sessions from user
    const getAllUserSessions = async (user_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/public/session/user/${user_id}`,
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
    }

    // get single session
    const getSingleSession = async (session_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/public/session/${session_id}`,
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
    }

    // create session
    const createSession = async (sessionData: { workout_id: number, duration_minutes: number, notes?: string, difficulty?: number, exercises: SessionExercise[] }) => {
        return await sendRequest({
            url: `${BACKEND_URL}/session`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(sessionData)
        })
    }

    // edit session
    const editSession = async (session_id: number, sessionData: { duration_minutes: number, notes?: string, difficulty?: number, exercises: SessionExercise[] }) => {
        return await sendRequest({
            url: `${BACKEND_URL}/session/${session_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(sessionData)
        })
    }

    // comment on session
    const commentOnSession = async (session_id: number, content: string) => {
        return await sendRequest({
            url: `${BACKEND_URL}/session/${session_id}/comment`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        })
    }

    // edit comment on session
    const editCommentOnSession = async (session_id: number, comment_id: number, content: string) => {
        return await sendRequest({
            url: `${BACKEND_URL}/session/${session_id}/comment/${comment_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        })
    }

    // delete comment on session
    const deleteCommentOnSession = async (session_id: number, comment_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/session/${session_id}/comment/${comment_id}`,
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
    }  

    // like session
    const likeSession = async (session_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/session/${session_id}/like`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
    }

    // unlike session
    const unlikeSession = async (session_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/session/${session_id}/unlike`,
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
    }

    // delete session
    const deleteSession = async (session_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/session/${session_id}`,
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
    }

    return {
        isLoading,
        hasError,
        clearError,
        getAllUserSessions,
        getSingleSession,
        createSession,
        editSession,
        commentOnSession,
        editCommentOnSession,
        deleteCommentOnSession,
        likeSession,
        unlikeSession,
        deleteSession
    }
}
