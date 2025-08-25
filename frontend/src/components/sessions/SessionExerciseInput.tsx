import React, { useState, useEffect } from "react";

// ui imports
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// type imports
import { SessionExerciseInputProps, ExerciseType, WorkoutExercise, SessionExercise } from "@/types/props/props-types";

// validator imports

const SessionExerciseInput: React.FC<SessionExerciseInputProps> = ({ exerciseIndex, exerciseObject, handleExerciseError }) => {

    // states
    const [exerciseInputData, setExerciseInputData] = useState<SessionExercise>({
        exercise_id: 0,
        exercise: undefined,
        weight_used: undefined,
        sets_completed: undefined,
        reps_completed: undefined,
        duration_seconds: undefined,
        distance_miles: undefined,
        pace_minutes_per_mile: undefined,
    });

    // individual state setters
    const setWeightUsed = (weight_used: number | undefined) =>
        setExerciseInputData(prev => ({ ...prev, weight_used }));

    const setSetsCompleted = (sets_completed: number | undefined) =>
        setExerciseInputData(prev => ({ ...prev, sets_completed }));

    const setRepsCompleted = (reps_completed: number | undefined) =>
        setExerciseInputData(prev => ({ ...prev, reps_completed }));

    const setDurationSeconds = (duration_seconds: number | undefined) =>
        setExerciseInputData(prev => ({ ...prev, duration_seconds }));

    const setDistanceMiles = (distance_miles: number | undefined) =>
        setExerciseInputData(prev => ({ ...prev, distance_miles }));

    const setPaceMinutesPerMile = (pace_minutes_per_mile: string | undefined) =>
        setExerciseInputData(prev => ({ ...prev, pace_minutes_per_mile }));

    const { exercise_id, exercise, weight_used, sets_completed, reps_completed, duration_seconds, distance_miles, pace_minutes_per_mile } = exerciseInputData;

    const [errors, setErrors] = useState<Record<string, string>>({});

    // blur and error handlers
    const handleBlur = (field: keyof SessionExercise) => {
        if (!exerciseInputData[field]) {
            setErrors(prev => ({ ...prev, [field]: "This field is required" }));
        }
    };

    const handleFocus = (field: keyof SessionExercise) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field as string];
            return newErrors;
        });
    };

    // useEffect(() => {
    //     const noErrors = Object.values(errors).every(err => !err);

    //     // Check if all required fields are filled based on exercise type
    //     let isFilled = false;
    //     if (exercise?.measurement_type === "reps") {
    //         isFilled = !!weight_used && !!sets_completed && !!reps_completed && !errors.sets_completed && !errors.reps_completed;
    //     } else if (exercise?.measurement_type === "duration") {
    //         isFilled = !!duration_seconds && !errors.duration_seconds;
    //     } else if (exercise?.measurement_type === "distance") {
    //         isFilled = !!pace_minutes_per_mile && !!distance_miles && !errors.distance_miles;
    //     }

    //     // Check if any input is focused
    //     const activeTag = document.activeElement?.tagName;
    //     const isInputFocused = activeTag === "INPUT" || activeTag === "SELECT" || activeTag === "TEXTAREA";

    //     if (exercise && noErrors && isFilled && !isInputFocused) {
    //         handleExerciseChange(exerciseIndex, {
    //             exercise_id: exerciseInputData.exercise_id,
    //             exercise: exerciseInputData.exercise,
    //             weight_used: exerciseInputData.weight_used,
    //             sets_completed: exerciseInputData.sets_completed ? Number(exerciseInputData.sets_completed) : undefined,
    //             reps_completed: exerciseInputData.reps_completed ? Number(exerciseInputData.reps_completed) : undefined,
    //             duration_seconds: exerciseInputData.duration_seconds ? Number(exerciseInputData.duration_seconds) : undefined,
    //             distance_miles: exerciseInputData.distance_miles ? Number(exerciseInputData.distance_miles) : undefined,
    //             pace_minutes_per_mile: exerciseInputData.pace_minutes_per_mile
    //         });

    //     }
    // }, [
    //     exercise,
    //     sets_completed,
    //     reps_completed,
    //     duration_seconds,
    //     distance_miles,
    //     errors
    // ]);

    // div for fields based on exercise type
    let content;

    if (exerciseObject?.measurement_type === "reps") {
        content = (
            <div>
                <Badge>{exerciseObject.measurement_type.toUpperCase()}</Badge>
                <div className="font-semibold mt-2">{exerciseObject.title}</div>
                <div className="text-sm text-muted-foreground mb-2">
                    Target: {exerciseObject.sets} sets x {exerciseObject.reps} reps
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor={`weight-${exerciseIndex}`}>Weight Used</Label>
                        <Input
                            id={`weight-${exerciseIndex}`}
                            type="number"
                            value={weight_used ?? ""}
                            onChange={e => setWeightUsed(e.target.value ? Number(e.target.value) : undefined)}
                            onBlur={() => handleBlur("weight_used")}
                            onFocus={() => handleFocus("weight_used")}
                            min={0}
                        />
                        {errors.weight_used && <span className="text-xs text-red-500">{errors.weight_used}</span>}
                    </div>
                    <div>
                        <Label htmlFor={`sets-${exerciseIndex}`}>Sets Completed</Label>
                        <Input
                            id={`sets-${exerciseIndex}`}
                            type="number"
                            value={sets_completed ?? ""}
                            onChange={e => setSetsCompleted(e.target.value ? Number(e.target.value) : undefined)}
                            onBlur={() => handleBlur("sets_completed")}
                            onFocus={() => handleFocus("sets_completed")}
                            min={0}
                        />
                        {errors.sets_completed && <span className="text-xs text-red-500">{errors.sets_completed}</span>}
                    </div>
                    <div>
                        <Label htmlFor={`reps-${exerciseIndex}`}>Reps Completed</Label>
                        <Input
                            id={`reps-${exerciseIndex}`}
                            type="number"
                            value={reps_completed ?? ""}
                            onChange={e => setRepsCompleted(e.target.value ? Number(e.target.value) : undefined)}
                            onBlur={() => handleBlur("reps_completed")}
                            onFocus={() => handleFocus("reps_completed")}
                            min={0}
                        />
                        {errors.reps_completed && <span className="text-xs text-red-500">{errors.reps_completed}</span>}
                    </div>
                </div>
            </div>
        );
    } else if (exerciseObject?.measurement_type === "duration") {
        content = (
            <div>
                <Badge>{exerciseObject.measurement_type.toUpperCase()}</Badge>
                <div className="font-semibold mt-2">{exerciseObject.title}</div>
                <div className="text-sm text-muted-foreground mb-2">
                    Target: {exerciseObject.duration_seconds} seconds
                </div>
                <div>
                    <Label htmlFor={`duration-${exerciseIndex}`}>Actual Duration (seconds)</Label>
                    <Input
                        id={`duration-${exerciseIndex}`}
                        type="number"
                        value={duration_seconds ?? ""}
                        onChange={e => setDurationSeconds(e.target.value ? Number(e.target.value) : undefined)}
                        onBlur={() => handleBlur("duration_seconds")}
                        onFocus={() => handleFocus("duration_seconds")}
                        min={0}
                    />
                    {errors.duration_seconds && <span className="text-xs text-red-500">{errors.duration_seconds}</span>}
                </div>
            </div>
        );
    } else if (exerciseObject?.measurement_type === "distance") {
        content = (
            <div>
                <Badge>{exerciseObject.measurement_type.toUpperCase()}</Badge>
                <div className="font-semibold mt-2">{exerciseObject.title}</div>
                <div className="text-sm text-muted-foreground mb-2">
                    Target: {exerciseObject.distance_miles} miles
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor={`distance-${exerciseIndex}`}>Actual Distance (miles)</Label>
                        <Input
                            id={`distance-${exerciseIndex}`}
                            type="number"
                            value={distance_miles ?? ""}
                            onChange={e => setDistanceMiles(e.target.value ? Number(e.target.value) : undefined)}
                            onBlur={() => handleBlur("distance_miles")}
                            onFocus={() => handleFocus("distance_miles")}
                            min={0}
                            step="0.01"
                        />
                        {errors.distance_miles && <span className="text-xs text-red-500">{errors.distance_miles}</span>}
                    </div>
                    <div>
                        <Label htmlFor={`pace-${exerciseIndex}`}>Actual Pace (min/mile)</Label>
                        <Input
                            id={`pace-${exerciseIndex}`}
                            type="text"
                            value={pace_minutes_per_mile ?? ""}
                            onChange={e => setPaceMinutesPerMile(e.target.value || undefined)}
                            onBlur={() => handleBlur("pace_minutes_per_mile")}
                            onFocus={() => handleFocus("pace_minutes_per_mile")}
                            placeholder="e.g. 8:30"
                        />
                        {errors.pace_minutes_per_mile && <span className="text-xs text-red-500">{errors.pace_minutes_per_mile}</span>}
                    </div>
                </div>
            </div>
        );
    } else {
        content = <div>No exercise selected.</div>;
    }

    return (
        <div className="shadow-md rounded-lg p-4 mb-4">
            {content}
        </div>
    )
}

export default SessionExerciseInput;