import React, { useState, useMemo, useEffect } from "react";

// ui imports
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CharacterCounter } from '@/components/ui/character-counter';

// component imports
import SessionExerciseInput from "../SessionExerciseInput";

// type imports
import { EditSessionFormProps, SessionExercise, ExerciseType, Workout } from "@/types/props/props-types";

const EditSessionForm: React.FC<EditSessionFormProps> = ({
    session,
    onSubmit,
    // onCancel,
    isUpdating
}) => {

    session
    // form field states
    const [durationMinutes, setDurationMinutes] = useState<number>(0);
    const [difficulty, setDifficulty] = useState<number>(1);
    const [sessionNotes, setSessionNotes] = useState<string>('');
    const [exerciseInputs, setExerciseInputs] = useState<SessionExercise[]>(session.completed_exercises || []);

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

    // session blur handlers
    const handleSessionNotesBlur = () => {
        setFormError((prev: Record<string, string> | null) => {
            if (sessionNotes.trim().length > 250) {
                return { ...prev, sessionNotes: 'Session notes cannot exceed 250 characters.' };
            } else {
                setSessionNotes(sessionNotes.trim());
                return { ...prev, sessionNotes: '' };
            }
        });
    };

    // validation
    const isFormValid =
        durationMinutes > 0 &&
        durationMinutes <= 300 &&
        difficulty >= 1 &&
        difficulty <= 5 &&
        sessionNotes.trim().length <= 250 &&
        !formError &&
        exerciseErrors.every((err: boolean) => !err)

    // form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid) return;

        // console.log("Original Workout:", workout);
        // console.log("Submitting edited workout:", { workoutTitle, description, workoutType, exerciseInputs });
        await onSubmit({
            duration_minutes: durationMinutes,
            difficulty,
            session_notes: sessionNotes,
            completed_exercises: exerciseInputs
        });
    }

    // cancel handler
    const hasChanges = false;
    // const hasChanges = useMemo(() => {
    //     return (
    //         workoutTitle !== workout.workout_title ||
    //         description !== workout.workout_description ||
    //         workoutType !== workout.workout_type ||
    //         JSON.stringify(exerciseInputs) !== JSON.stringify(workout.exercises)
    //     );
    // }, [workoutTitle, description, workoutType, exerciseInputs]);

    // const handleCancel = () => {
    //     onCancel(hasChanges);
    // };

    // console.log("EditWorkoutForm:", { workout, workoutTitle, description, workoutType, exerciseInputs });

    return (
        <div className="bg-white rounded-lg shadow p-4 text-left">
            {/* header */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b ">
                <Button
                    variant="ghost"
                    // onClick={handleCancel}
                    className="p-2 hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] rounded-lg"
                    disabled={isUpdating}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <p className="text-2xl font-bold text-[var(--accent)]">Edit Session</p>
            </div>

            {/* form */}
        </div>
    )
}

export default EditSessionForm;