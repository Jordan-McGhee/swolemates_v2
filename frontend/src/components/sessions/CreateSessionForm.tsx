import react, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";

// hook imports
import { useAuth } from "@/context/AuthProvider";
// import { useFetch } from "@/hooks/useFetch";
import { workoutApi } from "@/api/workoutApi";
import { sessionApi } from "@/api/sessionApi";

// ui imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CharacterCounter } from "../ui/character-counter";

// type imports
import { Workout, SessionExercise } from "@/types/props/props-types";

// validation imports

// component imports
import AddWorkoutButton from "../posts/AddWorkoutButton";
import SessionExerciseInput from "./SessionExerciseInput";

// utils imports
import { formatDate } from "@/util/general-util";

const CreateSessionForm: React.FC = () => {

    // hook destructuring
    const { user } = useAuth();
    const { getAllUserWorkouts, getSingleWorkout } = workoutApi();
    const { createSession } = sessionApi();

    // get workout_id from query params
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const workout_id = searchParams.get("workout_id");

    // state
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingSelectedWorkout, setLoadingSelectedWorkout] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // form fields
    const [duration, setDuration] = useState<number | null>(null);
    const [difficulty, setDifficulty] = useState<number>(1); // Default to 1 instead of 0
    const [notes, setNotes] = useState<string>("");
    const [formError, setFormError] = useState<Record<string, string> | null>(null);
    const [exerciseInputs, setExerciseInputs] = useState<SessionExercise[]>([]);
    const [exerciseErrors, setExerciseErrors] = useState<boolean[]>([]);

    // fetch workouts and selected workout
    useEffect(() => {
        const fetchSessionFormData = async () => {
            if (!user?.username) {
                console.log("No user logged in.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setFetchError(null);

            try {
                console.log("Fetching workouts for user:", user.username);
                const userWorkouts = await getAllUserWorkouts(user.username);
                setWorkouts(userWorkouts.workouts || []);
                console.log("Workouts fetched:", userWorkouts.workouts);

                // If workout_id is provided, fetch and select that workout
                if (workout_id && !isNaN(Number(workout_id))) {
                    console.log("Fetching workout for ID:", workout_id);
                    await fetchAndSetWorkout(Number(workout_id));
                }
            } catch (error) {
                console.error("Error fetching workouts:", error);
                setFetchError("Failed to fetch workouts. Please refresh the page.");
                toast.error("Failed to fetch workouts.");
            } finally {
                setLoading(false);
            }
        };

        fetchSessionFormData();
    }, [workout_id, user?.username]);

    // Helper function to fetch and set a workout
    const fetchAndSetWorkout = async (workoutId: number) => {
        setLoadingSelectedWorkout(true);
        setFetchError(null);

        try {
            if (isNaN(workoutId) || workoutId <= 0) {
                throw new Error("Invalid workout ID");
            }

            const response = await getSingleWorkout(workoutId);
            console.log("Single workout response:", response);

            // Handle different possible response structures
            let workout: Workout;
            if (response.workout) {
                // If response has a workout property
                workout = response.workout;
            } else if (response.workout_id) {
                // If response is the workout directly
                workout = response as Workout;
            } else {
                throw new Error("Invalid workout response structure");
            }

            if (!workout || !workout.exercises || workout.exercises.length === 0) {
                throw new Error("Workout not found or has no exercises");
            }

            console.log("Selected workout:", workout);
            setSelectedWorkout(workout);

            // Initialize exercise inputs
            const initialExerciseInputs = workout.exercises.map((ex: any) => ({
                session_exercise_id: ex.session_exercise_id || 0,
                exercise_id: ex.exercise_id,
                weight_used: undefined,
                sets_completed: undefined,
                reps_completed: undefined,
                duration_seconds: undefined,
                distance_miles: undefined,
                pace_minutes_per_mile: undefined,
            }));

            setExerciseInputs(initialExerciseInputs);
            setExerciseErrors(Array(workout.exercises.length).fill(false));

        } catch (error) {
            console.error("Error fetching workout:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch workout";
            setFetchError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoadingSelectedWorkout(false);
        }
    };

    // handler functions
    const handleWorkoutChange = async (workout_id: number) => {
        await fetchAndSetWorkout(workout_id);
    };

    // form handlers
    const handleDurationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        if (value === "") {
            setDuration(null);
            setFormError((prev) => ({ ...prev, duration: "" }));
        } else {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue >= 0) {
                setDuration(numValue);
                setFormError((prev) => ({ ...prev, duration: "" }));
            } else {
                setFormError((prev) => ({ ...prev, duration: "Duration must be a non-negative number or empty." }));
            }
        }
    };

    const handleDifficultyChange = (value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 1 && numValue <= 5) {
            setDifficulty(numValue);
            setFormError((prev) => ({ ...prev, difficulty: "" }));
        } else {
            setFormError((prev) => ({ ...prev, difficulty: "Difficulty must be between 1 and 5." }));
        }
    };

    const handleNotesBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        const value = e.target.value.trim();
        if (value.length > 250) {
            setFormError((prev) => ({ ...prev, notes: "Notes cannot exceed 250 characters." }));
        } else {
            setNotes(value);
            setFormError((prev) => ({ ...prev, notes: "" }));
        }
    };

    // exercise handlers
    const handleExerciseChange = (index: number, updatedExercise: SessionExercise) => {
        setExerciseInputs((prev) => {
            const newExercises = [...prev];
            newExercises[index] = updatedExercise;
            console.log("Updated exercise inputs:", newExercises);
            return newExercises;
        });
    };

    // Form validation
    const formIsValid =
        selectedWorkout &&
        (duration === null || (typeof duration === 'number' && duration >= 0)) &&
        (difficulty >= 1 && difficulty <= 5) &&
        (notes.length <= 250) &&
        exerciseInputs.length > 0 &&
        !exerciseErrors.some(err => err) &&
        (!formError || Object.values(formError).every(error => !error));

    // form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedWorkout) {
            toast.error("Please select a workout.");
            return;
        }

        if (!formIsValid) {
            toast.error("Please fix form errors before submitting.");
            return;
        }

        setSubmitting(true);

        // Submit the form data
        const formData = {
            workout_id: selectedWorkout.workout_id,
            duration_minutes: duration || 0,
            difficulty,
            notes,
            exercises: exerciseInputs.map((input, index) => ({
                ...input,
                error: exerciseErrors[index],
            })),
        };

        try {
            const res = await createSession(formData);
            toast.success(
                <>
                    Session created successfully!{" "}
                    <Link
                        to={`/sessions/${res.session_id}`}
                        className='underline hover:text-[var(--accent)] italic'
                    >
                        View Session
                    </Link>
                </>
            );
        } catch (error) {
            console.error("Error creating session:", error);
            toast.error("Failed to create session.");
        } finally {
            setSubmitting(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span>Loading workouts...</span>
            </div>
        );
    }

    // Show error state
    if (fetchError && !selectedWorkout) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-[var(--danger)] mb-4">{fetchError}</p>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* avatar & title + workout selector in flex */}
            <div className="mb-4 flex-col sm:flex-row sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={user?.profile_pic} alt={user?.username} />
                        <AvatarFallback>
                            {user?.username
                                ? user.username
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                : 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-2xl">Create Session</p>
                </div>

                {/* workout selector */}
                <AddWorkoutButton
                    buttonClassName="w-full mt-4 sm:mt-0 sm:w-fit flex items-center justify-center"
                    propsClassName="truncate max-w-[12rem]"
                    onWorkoutSelect={(workout) => {
                        if (workout) {
                            handleWorkoutChange(workout.workout_id);
                        }
                    }}
                    passedWorkout={selectedWorkout || undefined}
                />
            </div>

            {/* loading selected workout */}
            {loadingSelectedWorkout && (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    <span>Loading workout...</span>
                </div>
            )}

            {selectedWorkout && !loadingSelectedWorkout && (
                <>
                    <div className="flex flex-col gap-1 w-full">
                        <Badge className="">
                            {selectedWorkout.workout_type?.toUpperCase()}
                        </Badge>
                        {/* title and description */}
                        <p className="text-2xl font-semibold w-full">{selectedWorkout.workout_title}</p>
                    </div>

                    {selectedWorkout?.workout_description && (
                        <p className="text-[var(--subhead-text)] -mt-3">{selectedWorkout.workout_description}</p>
                    )}

                    {/* user avatar and name */}
                    <div className="flex flex-row justify-between items-center gap-6">
                        {/* Difficulty first */}
                        <div className="flex flex-col items-start">
                            <Label>Difficulty*</Label>
                            <div className="flex flex-row gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleDifficultyChange(String(star))}
                                        className="p-0 bg-transparent border-none"
                                        aria-label={`Set difficulty to ${star}`}
                                    >
                                        <svg
                                            width={28}
                                            height={28}
                                            viewBox="0 0 24 24"
                                            fill={difficulty >= star ? "#facc15" : "none"}
                                            stroke="#facc15"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                            {formError?.difficulty && (
                                <span className="text-xs text-[var(--danger)] italic">{formError.difficulty}</span>
                            )}
                        </div>

                        {/* Duration with +/- buttons */}
                        <div className="flex flex-col flex-end items-center">
                            <Label htmlFor="duration" className="">Duration</Label>
                            <div className="flex items-center gap-1 mt-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDuration(prev => Math.max((prev ?? 0) - 5, 0))}
                                    aria-label="Decrease duration"
                                    disabled={duration === null || duration <= 0}
                                >
                                    -
                                </Button>
                                <Input
                                    id="duration"
                                    type="text"
                                    min={0}
                                    max={300}
                                    step={1}
                                    value={duration !== null ? duration : "0"}
                                    onBlur={handleDurationBlur}
                                    onFocus={() => setFormError(prev => ({ ...prev, duration: "" }))}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (/^\d*$/.test(val)) {
                                            const num = val ? Number(val) : null;
                                            if (num !== null && num >= 0 && num <= 300) {
                                                setDuration(num);
                                                setFormError(prev => ({ ...prev, duration: "" }));
                                            } else if (num !== null && (num < 0 || num > 300)) {
                                                setFormError(prev => ({ ...prev, duration: "Enter valid minutes (0-300)" }));
                                            } else {
                                                setDuration(null);
                                            }
                                        }
                                    }}
                                    className="w-12 sm:w-16 text-center font-bold text-[var(--accent)] border-transparent focus:border focus:border-[var(--accent)] focus:bg-white bg-transparent shadow-none text-sm sm:text-xl"
                                    placeholder="Minutes"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDuration(prev => Math.min((prev ?? 0) + 5, 300))}
                                    aria-label="Increase duration"
                                    disabled={duration !== null && duration >= 300}
                                >
                                    +
                                </Button>
                            </div>
                            <div className="w-full flex justify-center">
                                <span className="text-sm text-[var(--subhead-text)]">minutes</span>
                            </div>
                            {formError?.duration && (
                                <span className="text-xs text-[var(--danger)] italic">{formError.duration}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col mt-4">
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                            id="notes"
                            value={notes}
                            onBlur={handleNotesBlur}
                            onChange={e => setNotes(e.target.value)}
                            maxLength={100}
                            placeholder="How was your workout?"
                            className={`border rounded px-3 py-2 mt-1 resize-none ${formError?.notes ? "border-[var(--danger)]" : ""}`}
                            rows={3}
                        />

                        <CharacterCounter
                            value={notes}
                            max={250}
                        />

                        {formError?.notes && (
                            <span className="text-xs text-[var(--danger)] italic">{formError.notes}</span>
                        )}
                    </div>

                    {/* EXERCISES */}
                    <p className='text-lg font-semibold text-[var(--accent)] bg-[var(--accent-hover)] px-6 py-2 -ml-6 -mr-6 my-6'>Exercises</p>

                    {selectedWorkout.exercises?.map((exercise, index) => (
                        <SessionExerciseInput
                            key={index}
                            exerciseIndex={index + 1}
                            exerciseObject={exercise}
                            handleExerciseError={(idx, hasError) => {
                                setExerciseErrors(prev => {
                                    const newErrors = [...prev];
                                    newErrors[idx] = hasError;
                                    return newErrors;
                                });
                            }}
                            handleExerciseChange={(idx, updatedExercise) => {
                                handleExerciseChange((idx - 1), updatedExercise);
                            }}
                        />
                    ))}

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={!formIsValid || submitting}
                            className=""
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={16} />
                                    Creating Session...
                                </>
                            ) : (
                                <>
                                    <Dumbbell className="mr-2" size={16} />
                                    Create Session
                                </>
                            )}
                        </Button>
                    </div>
                </>
            )}

            {/* Show message if no workout selected */}
            {!selectedWorkout && !loadingSelectedWorkout && !loading && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Dumbbell className="mb-4 text-[var(--accent)]" size={48} />
                    <p className="text-[var(--subhead-text)] mb-2">No workout selected</p>
                    <p className="text-sm text-[var(--subhead-text)]">Please select a workout to create a session</p>
                </div>
            )}
        </form>
    );
}

export default CreateSessionForm;