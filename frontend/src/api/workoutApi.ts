import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthProvider";

// type imports
import { Like, Comment, Workout, WorkoutFormExercise, WorkoutType } from "@/types/props/props-types";

// workout api
export const workoutApi = () => {


    // hook destructuring
    const { token } = useAuth();
    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // Use Vite env var
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // get workouts by user
    interface GetAllUserWorkoutsResponse {
        message: string;
        workouts: Workout[];
        username: string;
        user_id: number;
        canView: boolean;
    }

    const getAllUserWorkouts = async (username: string): Promise<GetAllUserWorkoutsResponse> => {
        return await sendRequest({
            url: `${BACKEND_URL}/public/workout/user/${username}`,
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    };

    // get single workout
    const getSingleWorkout = async (workout_id: number) => {
        return await sendRequest({
            url: `${BACKEND_URL}/public/workout/${workout_id}`,
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
    }

    // create workout with exercises
    const createWorkout = async (workoutData: {
        title: string,
        description?: string,
        workout_type: WorkoutType,
        exercises: WorkoutFormExercise[]
    }) => {
        return await sendRequest({
            url: `${BACKEND_URL}/workout`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(workoutData)
        });
    };

    // edit workout
    const editWorkout = async (
        workout_id: number,
        workoutData: { user_id: number, title?: string, description?: string, workout_type?: string, exercises: WorkoutFormExercise[] }
    ) => {
        return await sendRequest({
            url: `${BACKEND_URL}/workout/${workout_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(workoutData)
        });
    };

    // comment on workout
    const commentOnWorkout = async (
        workout_id: number,
        content: string
    ) => {
        return await sendRequest({
            url: `${BACKEND_URL}/workout/${workout_id}/comment`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
    };

    // edit comment on workout
    const editCommentOnWorkout = async (
        workout_id: number,
        comment_id: number,
        content: string
    ) => {
        return await sendRequest({
            url: `${BACKEND_URL}/workout/${workout_id}/comment/${comment_id}`,
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
    };

    // delete comment on workout
    const deleteWorkoutComment = async (
        workout_id: number,
        comment_id: number,
    ) => {
        return await sendRequest({
            url: `${BACKEND_URL}/workout/${workout_id}/comment/${comment_id}`,
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    };

    // like workout
    const likeWorkout = async (
        workout_id: number
    ) => {
        return await sendRequest({
            url: `${BACKEND_URL}/workout/${workout_id}/like`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    };

    // unlike workout
    const unlikeWorkout = async (
        workout_id: number
    ) => {
        return await sendRequest({
            url: `${BACKEND_URL}/workout/${workout_id}/unlike`,
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    };

    // delete workout
    const deleteWorkout = async (
        workout_id: number
    ) => {
        return await sendRequest({
            url: `${BACKEND_URL}/workout/${workout_id}`,
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    };

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