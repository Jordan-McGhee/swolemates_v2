import React, { useState, useMemo, useEffect } from "react";

// ui imports
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CharacterCounter } from '@/components/ui/character-counter';

// component imports
import ExerciseInput from "../Create Workout Form/ExerciseInput";

// type imports
import { EditWorkoutFormProps, WorkoutFormExercise, WorkoutType, WorkoutExercise } from "@/types/props/props-types";

const WORKOUT_TYPES: WorkoutType[] = ['strength', 'cardio', 'hiit', 'run', 'yoga', 'stretching', 'swimming', 'cycling', 'crossfit', 'bodyweight', 'other'];

const EditWorkoutForm: React.FC<EditWorkoutFormProps> = ({
    workout,
    onSubmit,
    onCancel,
    isUpdating
}) => {

    // form field states
    const [workoutTitle, setWorkoutTitle] = useState(workout.workout_title);
    const [description, setDescription] = useState(workout.workout_description || "");
    const [workoutType, setWorkoutType] = useState(workout.workout_type);
    const [exerciseInputs, setExerciseInputs] = useState<WorkoutExercise[]>(workout.exercises || []);

    // error states
    const [formError, setFormError] = useState<Record<string, string> | null>(null);
    const [exerciseErrors, setExerciseErrors] = useState<boolean[]>(Array(exerciseInputs.length || 3).fill(false));

    // Keep error state array in sync with exerciseInputs length
    useEffect(() => {
        setExerciseErrors((prevErrors: boolean[]) => {
            if (prevErrors.length !== exerciseInputs.length) {
                return Array(exerciseInputs.length).fill(false);
            }
            return prevErrors;
        });
    }, [exerciseInputs.length]);

    // workout blur handlers
    const handleWorkoutTitleBlur = () => {
        setFormError((prev: Record<string, string> | null) => {
            if (workoutTitle.trim().length < 5 || workoutTitle.trim().length > 25) {
                return { ...prev, workoutTitle: 'Workout name must be 5-25 characters.' };
            } else {
                return { ...prev, workoutTitle: '' };
            }
        });
    };

    const handleDescriptionBlur = () => {
        setFormError((prev: Record<string, string> | null) => {
            if (description.trim().length < 1 || description.trim().length > 75) {
                return { ...prev, description: 'Description must be 1-75 characters.' };
            } else {
                return { ...prev, description: '' };
            }
        });
    };

    // exercise handlers
    const handleExerciseChange = (index: number, updatedExercise: WorkoutFormExercise) => {
        setExerciseInputs(prevInputs =>
            prevInputs.map((exercise, idx) =>
                idx === index ? { ...exercise, ...updatedExercise } : exercise
            )
        );
    };

    const handleDeleteExercise = (index: number) => {
        if (exerciseInputs.length === 3) {
            setFormError((prev: Record<string, string> | null) => ({ ...prev, exercise: 'A workout must have at least 3 exercises.' }));
            return;
        }
        setExerciseInputs(prevInputs => prevInputs.filter((_, idx) => idx !== index));
    };

    // Validation
    const isFormValid =
        workoutTitle?.trim().length > 5 && workoutTitle.trim().length <= 25 &&
        description.trim().length > 0 && description.trim().length <= 75 &&
        workoutType !== undefined &&
        (!formError?.workoutTitle && !formError?.description) &&
        exerciseInputs.length >= 3 &&
        exerciseInputs.length <= 10 &&
        exerciseErrors.every((err: boolean) => !err) &&
        exerciseInputs.every(ex => (ex.title ?? '').trim().length > 0);

    // form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        // console.log("Original Workout:", workout);
        // console.log("Submitting edited workout:", { workoutTitle, description, workoutType, exerciseInputs });
        await onSubmit({
            workout_title: workoutTitle,
            workout_description: description,
            workout_type: workoutType,
            exercises: exerciseInputs
        });
    };

    // Cancel handler
    const hasChanges = useMemo(() => {
        return (
            workoutTitle !== workout.workout_title ||
            description !== workout.workout_description ||
            workoutType !== workout.workout_type ||
            JSON.stringify(exerciseInputs) !== JSON.stringify(workout.exercises)
        );
    }, [workoutTitle, description, workoutType, exerciseInputs]);

    const handleCancel = () => {
        onCancel(hasChanges);
    };

    // console.log("EditWorkoutForm:", { workout, workoutTitle, description, workoutType, exerciseInputs });

    return (
        <div className="bg-white rounded-lg shadow p-4 text-left">
            {/* header */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b ">
                <Button
                    variant="ghost"
                    onClick={handleCancel}
                    className="p-2 hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] rounded-lg"
                    disabled={isUpdating}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <p className="text-2xl font-bold text-[var(--accent)]">Edit Workout</p>
            </div>

            {/* form */}

            <form onSubmit={handleSubmit} className="text-left">
                <div className="flex gap-4">
                    <div className="flex-[4]">
                        <Label className="block mb-2 font-medium">Workout Name:</Label>
                        <Input
                            type="text"
                            value={workoutTitle}
                            onChange={e => setWorkoutTitle(e.target.value)}
                            onBlur={handleWorkoutTitleBlur}
                            placeholder="Enter workout name"
                            className="w-full"
                            disabled={isUpdating}
                        />
                        <div className="flex justify-between items-center mt-1">
                            <div>
                                {formError?.workoutTitle && (
                                    <p className="text-sm text-[var(--danger)]">
                                        {formError.workoutTitle}
                                    </p>
                                )}
                            </div>
                            <CharacterCounter value={workoutTitle} max={25} />
                        </div>
                    </div>
                    <div className="flex-2 min-w-[120px]">
                        <Label className="block mb-2 font-medium">Workout Type:</Label>
                        <Select
                            value={workoutType}
                            onValueChange={val => setWorkoutType(val as any)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Workout Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {WORKOUT_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <Label className="block mb-2 font-medium">Description:</Label>
                    <textarea
                        rows={2}
                        name="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        onBlur={handleDescriptionBlur}
                        placeholder="Add a description"
                        className="resize-none w-full border border-[var(--accent-hover)] rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] transition-colors"
                        disabled={isUpdating}
                    />
                    <div className="flex justify-between items-center mt-1">
                        {formError?.description && (
                            <p className="text-sm mt-1 text-[var(--danger)]">
                                {formError.description}
                            </p>
                        )}
                        <CharacterCounter value={description} max={75} />
                    </div>
                </div>

                {/* EXERCISES */}
                <p className='text-lg font-semibold text-[var(--accent)] bg-[var(--accent-hover)] px-6 py-2 -ml-6 -mr-6 my-6'>Edit Exercises</p>

                {/* exercise inputs */}
                {exerciseInputs.map((exercise, idx) => (
                    <ExerciseInput
                        key={exercise.exercise_id || idx}
                        exerciseIndex={idx + 1}
                        initialExerciseData={exercise}
                        handleExerciseChange={(_, updatedExercise) => handleExerciseChange(idx, updatedExercise)}
                        handleDeleteExercise={() => handleDeleteExercise(idx)}
                        handleExerciseError={(_, hasError) => {
                            setExerciseErrors(prev => {
                                const updated = [...prev];
                                updated[idx] = hasError;
                                return updated;
                            });
                        }}
                    />
                ))}

                {exerciseInputs.length < 10 && (
                    <Button
                        type="button"
                        onClick={() => {
                            setExerciseInputs([
                                ...exerciseInputs,
                                {
                                    title: '',
                                    exercise_type: 'strength',
                                    measurement_type: 'reps',
                                    sets: undefined,
                                    reps: undefined,
                                    duration_seconds: undefined,
                                    distance_miles: undefined,
                                    workout_id: workout.workout_id,
                                    exercise_id: Date.now() // or generate a temp id
                                } as WorkoutExercise
                            ]);
                        }}
                        variant="outline"
                        disabled={isUpdating}
                    >
                        Add Exercise
                    </Button>
                )}

                <div className="flex justify-end mt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={isUpdating}
                        className="ml-2"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        disabled={!isFormValid || isUpdating}
                    >
                        {isUpdating ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4" />
                                Updating Workout
                            </span>
                        ) : (
                            'Update Workout'
                        )}
                    </Button>
                </div>
            </form>
        </div>

    );
}

export default EditWorkoutForm;