import { useFetch } from "@/hooks/useFetch";

// workout api
export const workoutApi = () => {

    type ExerciseInput = {
        title: string
        description?: string
        weight_used?: number
        set_count: number
        rep_count: number
    }


    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // get workouts by user
    const getAllUserWorkouts = async (user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/workout/user/${user_id}`
        })
    }

    // get single workout
    const getSingleWorkout = async (workout_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/workout/${workout_id}`
        })
    }

    // create workout
    const createWorkout = async (workoutData: { user_id: number, content: string, description: string, exercises: ExerciseInput[] }) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/workout`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workoutData)
        })
    }

    // edit workout
    const editWorkout = async (workout_id: number, workoutData: { user_id: number, content: string, description: string, exercises: ExerciseInput[] }) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/workout/${workout_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workoutData)
        })
    }

    // comment on workout
    const commentOnWorkout = async (workout_id: number, commentData: { user_id: number, content: string }) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/workout/${workout_id}/comment`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData)
        })
    }

    // edit comment on workot
    const editCommentOnWorkout = async (workout_id: number, comment_id: number, comment_data: { user_id: number, content: string }) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/workout/${workout_id}/comment/${comment_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(comment_data)
        })
    }

    // delete comment on workout
    const deleteWorkoutComment = async (workout_id: number, comment_id: number, user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/workout/${workout_id}/comment/${comment_id}`,
            method: "DELETE",
            body: JSON.stringify(user_id)
        })
    }

    // like workout
    const likeWorkout = async (workout_id: number, user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/workout/${workout_id}/like`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user_id)
        })
    }

    // unlike workout
    const unlikeWorkout = async (workout_id: number, user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/workout/${workout_id}/unlike`,
            method: "DELETE",
            body: JSON.stringify(user_id)
        })
    }

    // delete workout
    const deleteWorkout = async (workout_id: number, user_id: number) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/workout/${workout_id}`,
            method: "DELETE",
            body: JSON.stringify(user_id)
        })
    }

    return {
        getAllUserWorkouts,
        getSingleWorkout,
        createWorkout,
        editWorkout,
        commentOnWorkout,
        editCommentOnWorkout,
        deleteWorkoutComment,
        likeWorkout,
        unlikeWorkout,
        deleteWorkout,
        isLoadingApi: isLoading, hasError, clearError
    }
}