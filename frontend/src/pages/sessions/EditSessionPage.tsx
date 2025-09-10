import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// component imports
import EditSessionForm from "@/components/sessions/EditSession/EditSessionForm";

// ui imports
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// type imports
import { WorkoutSession, SessionExercise, ExerciseType, Workout } from "@/types/props/props-types";

// hook imports
import { useAuth } from "@/context/AuthProvider";
import { sessionApi } from "@/api/sessionApi";

// util imports
import { formatDate } from "@/util/general-util";

const EditSessionPage: React.FC = () => {

    // hook destructuring
    const { user: authUser, token } = useAuth();
    const { getSingleSession, editSession } = sessionApi();
    const navigate = useNavigate();

    // session id from url params
    const { session_id } = useParams<{ session_id?: string }>();

    // states
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // workout states
    // const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    // const [workouts, setWorkouts] = useState<Workout[]>([]);
    // const [loadingSelectedWorkout, setLoadingSelectedWorkout] = useState<boolean>(false);

    // store initial values
    const [initialValues, setInitialValues] = useState({
        duration_minutes: 0,
        difficulty: 1,
        session_notes: ''
    })
    const [initialExerciseInputs, setInitialExerciseInputs] = useState<SessionExercise[]>([]);

    // initialize initial values when session is fetched
    useEffect(() => {
        if (session) {
            // initial session values
            const initialData = {
                duration_minutes: session.duration_minutes || 0,
                difficulty: session.difficulty || 1,
                session_notes: session.session_notes || '',
            };
            setInitialValues(initialData);
            console.log("Initial values set:", initialData);

            // initial exercise values
            const initialExercises = session.completed_exercises
                ? session.completed_exercises.map((ex) => ({
                    exercise_id: ex.exercise_id,
                    title: ex.title || '',
                    exercise_type: ex.exercise_type as ExerciseType || undefined,
                    measurement_type: ex.measurement_type || 'reps',
                    sets_completed: ex.sets_completed || 0,
                    reps_completed: ex.reps_completed || 0,
                    duration_seconds: ex.duration_seconds || 0,
                    distance_miles: ex.distance_miles || 0,
                }))
                : [];

            setInitialExerciseInputs(initialExercises);
            console.log("Initial exercises set:", initialExercises);
        }
    }, [session]);

    // fetch session data
    useEffect(() => {
        const fetchSession = async () => {
            if (!session_id) {
                toast.error("Invalid session ID");
                navigate('/');
                return;
            }

            if (!authUser || !token) {
                return;
            }

            try {
                setIsLoading(true);

                const fetchedSession = await getSingleSession(Number(session_id));

                // Check if user is authorized to edit
                // if (fetchedSession.user_id !== authUser?.user_id) {
                //     toast.error("You are not authorized to edit this session");
                //     navigate(`/sessions/${session_id}`);
                //     return;
                // }

                setSession(fetchedSession.session);
            } catch (error: any) {
                console.error("Failed to fetch session:", error);
                toast.error(error.message || "Failed to fetch session");
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSession();
    }, [session_id, authUser, token]);

    // handlers
    const handleSubmit = async (updatedSession: {
        duration_minutes: number;
        difficulty: number;
        session_notes: string;
        completed_exercises: SessionExercise[];
    }) => {
        if (!session_id) return;

        try {
            setIsUpdating(true);

            const updateData: any = {};

            updateData.user_id = authUser?.user_id;

            if (updatedSession.duration_minutes !== initialValues.duration_minutes) {
                updateData.duration_minutes = updatedSession.duration_minutes;
            }

            if (updatedSession.difficulty !== initialValues.difficulty) {
                updateData.difficulty = updatedSession.difficulty;
            }

            if (updatedSession.session_notes !== initialValues.session_notes) {
                updateData.session_notes = updatedSession.session_notes;
            }

            updateData.completed_exercises = updatedSession.completed_exercises;

            if (Object.keys(updateData).length === 0) {
                toast.error("No changes made to update");
                setIsUpdating(false);
                return;
            }

            console.log("Updating session with data:", updateData);

            await editSession(Number(session_id), updateData);

            toast.success("Session updated successfully!");
            navigate(`/sessions/${session_id}`);

        } catch (error: any) {
            console.error("Failed to update session:", error);
            toast.error(error.message || "Failed to update session");

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
        navigate(`/sessions/${session_id}`);
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
    if (!session) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-[var(--subhead-text)] mb-4">Session not found</p>
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

    console.log("Editing session:", session);

    return (
        <div className="flex gap-4 w-full min-h-screen">
            {/* Left side - Edit Form */}
            <div className="w-full lg:w-[65%] flex flex-col gap-4 overflow-y-auto h-full">
                <EditSessionForm
                    session={session}
                    onSubmit={handleSubmit}
                    // onCancel={handleCancel}
                    isUpdating={isUpdating}
                />
            </div>

            {/* Right side - Session Preview or Info */}
            <div className="w-[35%] hidden lg:block overflow-y-auto h-full">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-xl font-semibold text-[var(--accent)] mb-4">Session Information</p>

                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-[var(--subhead-text)] text-lg">Original Author</p>
                            <p className='text-[var(--accent)] font-semibold'>{session.username || authUser?.username}</p>
                        </div>

                        {session.created_at && (
                            <div>
                                <p className="text-[var(--subhead-text)] text-lg">Created</p>
                                <p className='text-[var(--accent)] font-semibold'>{formatDate(session.created_at, "shortTime")}</p>
                            </div>
                        )}

                        {session.updated_at && session.updated_at !== session.created_at && (
                            <div>
                                <p className="text-[var(--subhead-text)] text-lg">Last Updated</p>
                                <p className='text-[var(--accent)] font-semibold'>{formatDate(session.updated_at, "shortTime")}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-[var(--subhead-text)] text-lg">Engagement</p>
                            <p className='text-[var(--accent)] font-semibold'>{session.likes?.length || 0} likes • {session.comments?.length || 0} comments</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditSessionPage;