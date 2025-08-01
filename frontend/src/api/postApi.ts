// hook imports
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthProvider";

// post api
export const postApi = () => {
    // hook destructuring
    const { token } = useAuth();
    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // Use Vite env var
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // get all posts from user
    const getAllUserPosts = async (user_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/post/user/${user_id}`,
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
    }

    // get single post
    const getSinglePost = async (post_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/post/${post_id}`,
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
    }

    // create post
    const createPost = async (postData: { user_id: number, content: string, image_url?: string, workout_id?: number, group_id?: number }) => {
        return await sendRequest({
            url: `${BACKEND_URL}/post`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        })
    }

    // edit post
    const editPost = async (post_id: number, postData: { user_id: number, content: string, image_url?: string, workout_id?: number }) => {
        return await sendRequest({
            url: `${BACKEND_URL}/post/${post_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        })
    }

    // comment on post
    const commentOnPost = async (post_id: number, commentData: { user_id: number, content: string }) => {
        return await sendRequest({
            url: `${BACKEND_URL}/post/${post_id}/comment`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(commentData)
        })
    }

    // edit comment on post
    const editCommentOnPost = async (post_id: number, comment_id: number, comment_data: { user_id: number, content: string }) => {
        return await sendRequest({
            url: `${BACKEND_URL}/post/${post_id}/comment/${comment_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(comment_data)
        })
    }

    // delete comment
    const deletePostComment = async (post_id: number, comment_id: number, user_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/post/${post_id}/comment/${comment_id}`,
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(user_id)
        })
    }

    // like post
    const likePost = async (post_id: number, user_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/post/${post_id}/like`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(user_id)
        })
    }

    // remove like
    const unlikePost = async (post_id: number, user_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/post/${post_id}/unlike`,
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(user_id)
        })
    }

    // delete post
    const deletePost = async (post_id: number, user_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/post/${post_id}`,
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(user_id)
        })
    }

    return {
        getAllUserPosts,
        getSinglePost,
        createPost,
        editPost,
        commentOnPost,
        editCommentOnPost,
        deletePostComment,
        likePost,
        unlikePost,
        deletePost,
        isLoadingPost: isLoading,
        hasError,
        clearError
    }
}