import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthProvider";

// comment api
export const commentApi = () => {
    // hook destructuring
    const { token } = useAuth();
    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // Use Vite env var
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // like comment
    const likeComment = async (comment_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/comment/${comment_id}/like`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
    }

    // unlike comment
    const unlikeComment = async (comment_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/comment/${comment_id}/unlike`,
            method: "POST",
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
        likeComment,
        unlikeComment
    }
}