import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// component imports
import EditWorkoutForm from "@/components/workouts/EditWorkout/EditWorkoutForm";

// ui imports
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// type imports
import { Workout, WorkoutFormExercise } from "@/types/props/props-types";

// hook imports
import { useAuth } from "@/context/AuthProvider";
import { workoutApi } from "@/api/workoutApi";

// util imports
import { formatDate } from "@/util/general-util";

const EditWorkoutPage: React.FC = () => {

    // hook destructuring
    const { user: authUser, token } = useAuth();
    const { getSingleWorkout, editWorkout } = workoutApi();
    const navigate = useNavigate();

    // workout id from url params
    const { workout_id } = useParams<{ workout_id?: string }>();

    // states
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // store initial values
    const [initialValues, setInitialValues] = useState({
        workout_title: '',
        workout_description: '',
        workout_type: '',
    })
    const [initialExerciseInputs, setInitialExerciseInputs] = useState<WorkoutFormExercise[]>([]);

    // error states
    // const [formError, setFormError] = useState<Record<string, string> | null>(null);
    // const [exerciseErrors, setExerciseErrors] = useState<boolean[]>(Array(initialExerciseInputs.length).fill(false));

    // initialize initial values when workout is fetched
    useEffect(() => {
        
        if (workout) {

            // initial workout values
            const initialData = {
                workout_title: workout.workout_title || '',
                workout_description: workout.workout_description || '',
                workout_type: workout.workout_type || '',
            }
            setInitialValues(initialData);
            // console.log("Initial values set:", initialData);

            // initial exercise values
            const initialExercises = workout.exercises ? workout.exercises.map(ex => ({
                title: ex.title || '',
                exercise_type: ex.exercise_type || '',
                measurement_type: ex.measurement_type || 'reps',
                sets: ex.sets || 0,
                reps: ex.reps || 0,
                duration_seconds: ex.duration_seconds || 0,
                distance_miles: ex.distance_miles || 0,
            })) : [];

            setInitialExerciseInputs(initialExercises);
            // console.log("Initial exercises set:", initialExercises);
        }
    }, [workout]);

    // fetch workout data
    useEffect(() => {
        // // Log errors for missing workout_id, authUser, or token
        // if (!workout_id) {
        //     console.error("EditWorkoutPage: workout_id is missing");
        // }
        // if (!authUser || !token) {
        //     console.error("EditWorkoutPage: authUser or token is missing");
        // }
        const fetchWorkout = async () => {
            if (!workout_id) {
                toast.error("Invalid workout ID");
                navigate('/');
                return;
            }

            if (!authUser || !token) {
                return;
            }

            try {
                setIsLoading(true);

                // console.log("Fetching workout with ID:", workout_id);
                const fetchedWorkout = await getSingleWorkout(Number(workout_id));

                // Check if user is authorized to edit
                // if (fetchedWorkout.user_id !== authUser?.user_id) {
                //     toast.error("You are not authorized to edit this workout");
                //     navigate(`/workouts/${workout_id}`);
                //     return;
                // }

                setWorkout(fetchedWorkout.workout);
            } catch (error: any) {
                console.error("Failed to fetch workout:", error);
                toast.error(error.message || "Failed to fetch workout");
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkout();
    }, [workout_id, authUser, token]);

    // handle form submission
    const handleSubmit = async (formData: { workout_title: string; workout_description: string; workout_type: string; exercises: WorkoutFormExercise[] }) => {
        if (!workout_id) return;

        try {
            setIsUpdating(true);

            const updateData: any = {};

            updateData.user_id = authUser?.user_id;

            if (formData.workout_title !== initialValues.workout_title) {
                updateData.workout_title = formData.workout_title;
            }

            if (formData.workout_description !== initialValues.workout_description) {
                updateData.description = formData.workout_description;
            }

            if (formData.workout_type !== initialValues.workout_type) {
                updateData.workout_type = formData.workout_type;
            }

            updateData.exercises = formData.exercises;

            if (Object.keys(updateData).length === 0) {
                toast.error("No changes made to update");
                setIsUpdating(false);
                return;
            }

            console.log("Updating workout with data:", updateData);

            await editWorkout(Number(workout_id), updateData);

            toast.success("Workout updated successfully!");
            navigate(`/workouts/${workout_id}`);

        } catch (error: any) {
            console.error("Failed to update workout:", error);
            toast.error(error.message || "Failed to update workout");

        } finally {
            setIsUpdating(false);
        }
    }

    // Handle cancel
    const handleCancel = (hasChanges: boolean) => {
        if (hasChanges) {
            const confirmCancel = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
            if (!confirmCancel) return;
        }
        navigate(`/workouts/${workout_id}`);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-[var(--accent)]" />
            </div>
        );
    }

    // Not found state
    if (!workout) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Workout not found</p>
                    <Button
                        onClick={() => navigate('/')}
                        className="bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                    >
                        Go back home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-4 w-full min-h-screen">
            {/* Left side - Edit Form */}
            <div className="w-full lg:w-[65%] flex flex-col gap-4 overflow-y-auto h-full">
                <EditWorkoutForm
                    workout={workout}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isUpdating={isUpdating}
                />
            </div>

            {/* Right side - Workout Preview or Info */}
            <div className="w-[35%] hidden lg:block overflow-y-auto h-full">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-xl font-semibold text-[var(--accent)] mb-4">Workout Information</p>

                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-[var(--subhead-text)] text-lg">Original Author</p>
                            <p className='text-[var(--accent)] font-semibold'>{workout.username || authUser?.username}</p>
                        </div>

                        {workout.created_at && (
                            <div>
                                <p className="text-[var(--subhead-text)] text-lg">Created</p>
                                <p className='text-[var(--accent)] font-semibold'>{formatDate(workout.created_at, "shortTime")}</p>
                            </div>
                        )}

                        {workout.updated_at && workout.updated_at !== workout.created_at && (
                            <div>
                                <p className="text-[var(--subhead-text)] text-lg">Last Updated</p>
                                <p className='text-[var(--accent)] font-semibold'>{formatDate(workout.updated_at, "shortTime")}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-[var(--subhead-text)] text-lg">Engagement</p>
                            <p className='text-[var(--accent)] font-semibold'>{workout.likes?.length || 0} likes • {workout.comments?.length || 0} comments</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditWorkoutPage;