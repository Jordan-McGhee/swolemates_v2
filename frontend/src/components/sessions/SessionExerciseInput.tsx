import React, { useState, useEffect, useCallback, useRef } from "react";

// ui imports
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// type imports
import { SessionExerciseInputProps, ExerciseType, WorkoutExercise, SessionExercise } from "@/types/props/props-types";

const SessionExerciseInput: React.FC<SessionExerciseInputProps> = ({
    exerciseIndex,
    exerciseObject,
    handleExerciseError,
    handleExerciseChange
}) => {
    // states with initial values from exerciseObject prop
    const [exerciseInputData, setExerciseInputData] = useState<SessionExercise>(() => ({
        exercise_id: exerciseObject.exercise_id || 0,
        weight_used: undefined,
        sets_completed: exerciseObject.sets || undefined,
        reps_completed: exerciseObject.reps || undefined,
        duration_seconds: exerciseObject.duration_seconds || undefined,
        distance_miles: exerciseObject.distance_miles || undefined,
    }));

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Use ref to track the last sent data to prevent unnecessary calls
    const lastSentDataRef = useRef<string>("");

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
        setExerciseInputData(prev => ({
            ...prev,
            distance_miles: distance_miles !== undefined ? Math.round(distance_miles * 10) / 10 : undefined
        }));

    const setPaceMinutesPerMile = (pace_minutes_per_mile: string | undefined) =>
        setExerciseInputData(prev => ({ ...prev, pace_minutes_per_mile }));

    const { exercise_id, weight_used, sets_completed, reps_completed, duration_seconds, distance_miles, pace_minutes_per_mile } = exerciseInputData;

    // Handler functions for increment/decrement with error checking
    const handleWeightChange = useCallback((newValue: number | undefined) => {
        setWeightUsed(newValue);
        if (newValue !== undefined && newValue >= 1 && newValue <= 999) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.weight_used;
                return newErrors;
            });
        } else if (newValue !== undefined && (newValue < 1 || newValue > 999)) {
            setErrors(prev => ({ ...prev, weight_used: "Enter a valid weight (1-999 lbs)" }));
        }
    }, []);

    const handleSetsChange = useCallback((newValue: number | undefined) => {
        setSetsCompleted(newValue);
        if (newValue !== undefined && newValue >= 1 && newValue <= 20) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.sets_completed;
                return newErrors;
            });
        } else if (newValue !== undefined && (newValue < 1 || newValue > 20)) {
            setErrors(prev => ({ ...prev, sets_completed: "Enter sets (1-20)" }));
        }
    }, []);

    const handleRepsChange = useCallback((newValue: number | undefined) => {
        setRepsCompleted(newValue);
        if (newValue !== undefined && newValue > 0 && newValue <= 30) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.reps_completed;
                return newErrors;
            });
        } else if (newValue !== undefined && (newValue <= 0 || newValue > 30)) {
            setErrors(prev => ({ ...prev, reps_completed: "Enter reps (1-30)" }));
        }
    }, []);

    const handleDurationChange = useCallback((newValue: number | undefined) => {
        setDurationSeconds(newValue);
        const minutes = newValue ? Math.round(newValue / 60) : undefined;
        if (minutes !== undefined && minutes >= 1 && minutes <= 300) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.duration_seconds;
                return newErrors;
            });
        } else if (minutes !== undefined && (minutes < 1 || minutes > 300)) {
            setErrors(prev => ({ ...prev, duration_seconds: "Enter valid minutes (1-300)" }));
        }
    }, []);

    const handleDistanceChange = useCallback((newValue: number | undefined) => {
        setDistanceMiles(newValue);
        if (newValue !== undefined && newValue > 0 && newValue <= 100) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.distance_miles;
                return newErrors;
            });
        } else if (newValue !== undefined && (newValue <= 0 || newValue > 100)) {
            setErrors(prev => ({ ...prev, distance_miles: "Enter valid miles (0.1-100)" }));
        }
    }, []);

    // Memoize the validation logic
    const isFormValid = useCallback(() => {
        const noErrors = Object.values(errors).every(err => !err);

        // Check if all required fields are filled based on exercise type
        let isFilled = false;
        if (exerciseObject?.measurement_type === "reps") {
            isFilled = !!weight_used && !!sets_completed && !!reps_completed;
        } else if (exerciseObject?.measurement_type === "duration") {
            isFilled = !!duration_seconds;
        } else if (exerciseObject?.measurement_type === "distance") {
            isFilled = !!pace_minutes_per_mile && !!distance_miles;
        }

        return noErrors && isFilled;
    }, [errors, weight_used, sets_completed, reps_completed, duration_seconds, distance_miles, pace_minutes_per_mile, exerciseObject?.measurement_type]);

    // Create the data object to send
    const createExerciseData = useCallback(() => ({
        exercise_id: exercise_id,
        weight_used: weight_used ? Number(weight_used) : undefined,
        sets_completed: sets_completed ? Number(sets_completed) : undefined,
        reps_completed: reps_completed ? Number(reps_completed) : undefined,
        duration_seconds: duration_seconds ? Number(duration_seconds) : undefined,
        distance_miles: distance_miles ? Number(distance_miles) : undefined,
    }), [exercise_id, weight_used, sets_completed, reps_completed, duration_seconds, distance_miles]);

    useEffect(() => {
        // Only proceed if form is valid
        if (!isFormValid()) return;

        // Check if any input is focused
        const activeTag = document.activeElement?.tagName;
        const isInputFocused = activeTag === "INPUT" || activeTag === "SELECT" || activeTag === "TEXTAREA";

        // Don't update while user is actively typing
        if (isInputFocused) return;

        const exerciseData = createExerciseData();
        const dataString = JSON.stringify(exerciseData);

        // Only call handleExerciseChange if the data actually changed
        if (dataString !== lastSentDataRef.current) {
            lastSentDataRef.current = dataString;
            handleExerciseChange(exerciseIndex, exerciseData);
        }
    }, [isFormValid, createExerciseData, exerciseIndex, handleExerciseChange]);

    // div for fields based on exercise type
    let content;

    if (exerciseObject?.measurement_type === "reps") {
        // --- Reps-based exercise input fields ---
        content = (
            <div className="flex items-center justify-between h-32 sm:h-40">
                {/* Left: Exercise info & weight input */}
                <div>
                    <Badge>{exerciseObject.measurement_type.toUpperCase()}</Badge>
                    <div className="font-semibold mt-2 text-sm sm:text-base">{exerciseObject.title}</div>
                    <div className="text-xs text-[var(--subhead-text)] sm:text-base mb-2">
                        Target: {exerciseObject.sets} x {exerciseObject.reps}
                    </div>
                    {/* Weight Used */}
                    <div className="flex flex-col items-start mt-4">
                        <Label htmlFor={`weight-${exerciseIndex}`} className="text-xs sm:text-base">Weight Used (lbs)</Label>
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleWeightChange(Math.max((weight_used ?? 0) - 5, 0))}
                                aria-label="Decrease weight"
                                disabled={weight_used === undefined || weight_used <= 0}
                            >
                                -
                            </Button>
                            <Input
                                id={`weight-${exerciseIndex}`}
                                type="text"
                                min={0}
                                max={999}
                                value={weight_used ?? "0"}
                                onBlur={() => {
                                    if (weight_used === undefined || weight_used < 0 || weight_used > 999) {
                                        setErrors(prev => ({ ...prev, weight_used: "Enter a valid weight (0-999)" }));
                                    } else {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.weight_used;
                                            return newErrors;
                                        });
                                    }
                                }}
                                onFocus={() => setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.weight_used;
                                    return newErrors;
                                })}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                        const num = val ? Number(val) : undefined;
                                        if (num !== undefined && num > 999) {
                                            handleWeightChange(999);
                                        } else {
                                            handleWeightChange(num);
                                        }
                                    }
                                }}
                            className="w-15 text-center font-bold text-base sm:text-xl text-[var(--accent)] border-transparent focus:border focus:border-[var(--accent)] focus:bg-white bg-transparent shadow-none"
                            inputMode="numeric"
                            pattern="[0-9]*\.?[0-9]*"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleWeightChange(Math.min((weight_used ?? 0) + 5, 999))}
                                aria-label="Increase weight"
                                disabled={weight_used !== undefined && weight_used >= 999}
                            >
                                +
                            </Button>
                        </div>
                        {errors.weight_used && <span className="text-xs text-[var(--danger)] italic">{errors.weight_used}</span>}
                    </div>
                </div>
                {/* Right: Sets & reps input */}
                <div className="flex flex-col gap-4 items-center justify-center">
                    {/* Sets Completed */}
                    <div className="flex flex-col items-center">
                        <Label htmlFor={`sets-${exerciseIndex}`} className="text-xs sm:text-base">Sets Completed</Label>
                        <div className="flex items-center gap-1 mt-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSetsChange(Math.max((sets_completed ?? 0) - 1, 0))}
                                aria-label="Decrease sets"
                                disabled={sets_completed === undefined || sets_completed <= 0}
                            >
                                -
                            </Button>
                            <Input
                                id={`sets-${exerciseIndex}`}
                                type="text"
                                min={0}
                                max={20}
                                value={sets_completed ?? ""}
                                onBlur={() => {
                                    if (sets_completed === undefined || sets_completed < 0 || sets_completed > 20) {
                                        setErrors(prev => ({ ...prev, sets_completed: "Enter sets (0-20)" }));
                                    } else {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.sets_completed;
                                            return newErrors;
                                        });
                                    }
                                }}
                                onFocus={() => setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.sets_completed;
                                    return newErrors;
                                })}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                        const num = val ? Number(val) : undefined;
                                        if (num !== undefined && num > 20) {
                                            handleSetsChange(20);
                                        } else {
                                            handleSetsChange(num);
                                        }
                                    }
                                }}
                            className="w-15 text-center font-bold text-base sm:text-xl text-[var(--accent)] border-transparent focus:border focus:border-[var(--accent)] focus:bg-white bg-transparent shadow-none"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSetsChange(Math.min((sets_completed ?? 0) + 1, 20))}
                                aria-label="Increase sets"
                                disabled={sets_completed !== undefined && sets_completed >= 20}
                            >
                                +
                            </Button>
                        </div>
                        {errors.sets_completed && <span className="text-xs text-[var(--danger)] italic">{errors.sets_completed}</span>}
                    </div>
                    {/* Reps Completed */}
                    <div className="flex flex-col items-center">
                        <Label htmlFor={`reps-${exerciseIndex}`} className="text-xs sm:text-base">Reps Completed</Label>
                        <div className="flex items-center gap-1 mt-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRepsChange(Math.max((reps_completed ?? 0) - 1, 0))}
                                aria-label="Decrease reps"
                                disabled={reps_completed === undefined || reps_completed <= 0}
                            >
                                -
                            </Button>
                            <Input
                                id={`reps-${exerciseIndex}`}
                                type="text"
                                min={0}
                                max={30}
                                value={reps_completed ?? ""}
                                onBlur={() => {
                                    if (reps_completed === undefined || reps_completed < 0 || reps_completed > 30) {
                                        setErrors(prev => ({ ...prev, reps_completed: "Enter reps (0-30)" }));
                                    } else {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.reps_completed;
                                            return newErrors;
                                        });
                                    }
                                }}
                                onFocus={() => setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.reps_completed;
                                    return newErrors;
                                })}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                        const num = val ? Number(val) : undefined;
                                        if (num !== undefined && num > 30) {
                                            handleRepsChange(30);
                                        } else {
                                            handleRepsChange(num);
                                        }
                                    }
                                }}
                            className="w-15 text-center font-bold text-base sm:text-xl text-[var(--accent)] border-transparent focus:border focus:border-[var(--accent)] focus:bg-white bg-transparent shadow-none"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRepsChange(Math.min((reps_completed ?? 0) + 1, 30))}
                                aria-label="Increase reps"
                                disabled={reps_completed !== undefined && reps_completed >= 30}
                            >
                                +
                            </Button>
                        </div>
                        {errors.reps_completed && <span className="text-xs text-[var(--danger)]">{errors.reps_completed}</span>}
                    </div>
                </div>
            </div>
        );

    } else if (exerciseObject?.measurement_type === "duration") {
        // Convert target duration from seconds to minutes
        const targetMinutes = exerciseObject.duration_seconds ? Math.round(exerciseObject.duration_seconds / 60) : 0;

        content = (
            <div className="flex items-center justify-between h-24 sm:h-32">
                {/* Left: Exercise info */}
                <div>
                    <Badge>{exerciseObject.measurement_type.toUpperCase()}</Badge>
                    <div className="font-semibold mt-2 text-sm sm:text-base">{exerciseObject.title}</div>
                    <div className="text-sm text-muted-foreground mb-2 text-xs sm:text-base">
                        Target: {targetMinutes} minutes
                    </div>
                </div>
                {/* Right: Duration input */}
                <div className="flex flex-col items-center justify-center">
                    <Label htmlFor={`duration-${exerciseIndex}`} className="text-xs sm:text-base">Actual Duration</Label>
                    <div className="flex items-center gap-1 my-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDurationChange(Math.max(((duration_seconds ?? 0) - 60), 0))}
                            aria-label="Decrease duration"
                            disabled={duration_seconds === undefined || duration_seconds < 60}
                        >
                            -
                        </Button>
                        <Input
                            id={`duration-${exerciseIndex}`}
                            type="text"
                            min={0}
                            max={300}
                            value={duration_seconds !== undefined ? Math.round(duration_seconds / 60).toString() : ""}
                            onBlur={e => {
                                const val = e.target.value;
                                const num = val ? Number(val) : undefined;
                                if (num === undefined || isNaN(num) || num < 0 || num > 300) {
                                    setErrors(prev => ({ ...prev, duration_seconds: "Enter valid minutes (0-300)" }));
                                } else {
                                    setDurationSeconds(num * 60);
                                    setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.duration_seconds;
                                        return newErrors;
                                    });
                                }
                            }}
                            onFocus={() => setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.duration_seconds;
                                return newErrors;
                            })}
                            onChange={e => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val)) {
                                    const num = val ? Number(val) : undefined;
                                    if (num !== undefined && num > 0 && num <= 300) {
                                        handleDurationChange(num * 60);
                                    } else if (num !== undefined && (num < 1 || num > 300)) {
                                        setErrors(prev => ({ ...prev, duration_seconds: "Enter valid minutes (1-300)" }));
                                    } else {
                                        handleDurationChange(undefined);
                                    }
                                }
                            }}
                        className="w-15 text-center font-bold text-base sm:text-xl text-[var(--accent)] border-transparent focus:border focus:border-[var(--accent)] focus:bg-white bg-transparent shadow-none"
                        placeholder="Minutes"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDurationChange(Math.min(((duration_seconds ?? 0) + 60), 18000))}
                            aria-label="Increase duration"
                            disabled={duration_seconds !== undefined && duration_seconds >= 18000}
                        >
                            +
                        </Button>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--subhead-text)] -mt-2">minutes</p>
                    {errors.duration_seconds && <span className="text-xs text-[var(--danger)] italic">{errors.duration_seconds}</span>}
                </div>
            </div>
        );
    } else if (exerciseObject?.measurement_type === "distance") {
        content = (
            <div className="flex items-center justify-between h-24 sm:h-32">
                {/* Left: Exercise info */}
                <div>
                    <Badge>{exerciseObject.measurement_type.toUpperCase()}</Badge>
                    <div className="font-semibold mt-2 text-sm sm:text-base">{exerciseObject.title}</div>
                    <div className="text-xs text-[var(--subhead-text)] sm:text-base mb-2">
                        Target: <span className="text-sm sm:text-base">{exerciseObject.distance_miles} miles</span>
                    </div>
                </div>
                {/* Right: Distance input */}
                <div className="flex flex-col items-center justify-center">
                    {/* Actual Distance */}
                    <div className="flex flex-col items-center">
                        <Label htmlFor={`distance-${exerciseIndex}`} className="text-xs sm:text-base">Actual Distance</Label>
                        <div className="flex items-center gap-1 my-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDistanceChange(Math.max(((distance_miles ?? 0) - 0.1), 0))}
                                aria-label="Decrease distance"
                                disabled={distance_miles === undefined || distance_miles <= 0}
                            >
                                -
                            </Button>
                            <Input
                                id={`distance-${exerciseIndex}`}
                                type="text"
                                min={0}
                                max={100}
                                value={distance_miles !== undefined ? distance_miles.toString() : ""}
                                onBlur={() => {
                                    if (
                                        distance_miles === undefined ||
                                        isNaN(Number(distance_miles)) ||
                                        Number(distance_miles) <= 0 ||
                                        Number(distance_miles) > 100
                                    ) {
                                        setErrors(prev => ({ ...prev, distance_miles: "Enter valid miles (0.1-100)" }));
                                    } else {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.distance_miles;
                                            return newErrors;
                                        });
                                    }
                                }}
                                onFocus={() => setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.distance_miles;
                                    return newErrors;
                                })}
                                onChange={e => {
                                    const val = e.target.value;
                                    // Accept only valid decimal numbers or empty string
                                    if (/^\d*\.?\d*$/.test(val) || val === "") {
                                        if (val === "" || val === ".") {
                                            handleDistanceChange(undefined);
                                        } else {
                                            const num = Number(val);
                                            if (!isNaN(num)) {
                                                handleDistanceChange(num > 100 ? 100 : num);
                                            }
                                        }
                                    }
                                }}
                                className="w-15 text-center font-bold text-[var(--accent)] border-transparent focus:border focus:border-[var(--accent)] focus:bg-white bg-transparent shadow-none text-base sm:text-xl"
                                placeholder="Miles"
                                inputMode="text"
                                pattern="[0-9]*\.?[0-9]*"
                                autoComplete="off"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDistanceChange(Math.min(((distance_miles ?? 0) + 0.1), 100))}
                                aria-label="Increase distance"
                                disabled={distance_miles !== undefined && distance_miles >= 100}
                            >
                                +
                            </Button>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--subhead-text)] -mt-2">miles</p>
                        {errors.distance_miles && <span className="text-xs text-[var(--danger)] italic">{errors.distance_miles}</span>}
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