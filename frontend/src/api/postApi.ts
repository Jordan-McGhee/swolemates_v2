import { useFetch } from "@/hooks/useFetch";

// post api
export const postApi = () => {

    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // get all posts from user
    const getAllUserPosts = async (user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/post/user/${user_id}`
        })
    }

    // get single post
    const getSinglePost = async (post_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/post/${post_id}`
        })
    }

    // create post
    const createPost = async (postData: { user_id: number, content: string, image_url?: string, workout_id?: number }) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/post`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        })
    }

    // edit post
    const editPost = async (post_id: number, postData: { user_id: number, content: string, image_url?: string, workout_id?: number }) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/post/${post_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        })
    }

    // comment on post
    const commentOnPost = async (post_id: number, commentData: { user_id: number, content: string }) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/post/${post_id}/comment`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData)
        })
    }

    // edit comment on post
    const editCommentOnPost = async (post_id: number, comment_id: number, comment_data: { user_id: number, content: string }) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/post/${post_id}/comment/${comment_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(comment_data)
        })
    }

    // delete comment
    const deletePostComment = async (post_id: number, comment_id: number, user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/post/${post_id}/comment/${comment_id}`,
            method: "DELETE",
            body: JSON.stringify(user_id)
        })
    }

    // like post
    const likePost = async (post_id: number, user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/post/${post_id}/like`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user_id)
        })
    }

    // remove like
    const unlikePost = async (post_id: number, user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/post/${post_id}/unlike`,
            method: "DELETE",
            body: JSON.stringify(user_id)
        })
    }

    // delete post
    const deletePost = async (post_id: number, user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/post/${post_id}`,
            method: "DELETE",
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
        isLoadingApi: isLoading, hasError, clearError
    }
}