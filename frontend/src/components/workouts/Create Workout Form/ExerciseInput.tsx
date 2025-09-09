import React, { useState, useEffect } from "react";

// ui imports
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

// type imports
import { ExerciseType, MeasurementType, ExerciseInputProps, WorkoutFormExercise, WorkoutExercise } from "@/types/props/props-types";

// validator imports
import { validateExerciseTitle, validateSets, validateReps, validateDuration, validateDistance } from "@/util/input-validators";

const exerciseTypes: ExerciseType[] = [
    "strength",
    "cardio",
    "flexibility",
    "stretch",
    "plyometric",
    "balance",
    "endurance",
    "other"
];

const measurementTypeMap: Record<ExerciseType, MeasurementType> = {
    strength: "reps",
    cardio: "duration",
    flexibility: "duration",
    stretch: "duration",
    plyometric: "reps",
    balance: "duration",
    endurance: "distance",
    other: "reps"
};

const ExerciseInput: React.FC<ExerciseInputProps & { initialExerciseData?: WorkoutFormExercise | WorkoutExercise }> = ({ exerciseIndex, handleExerciseChange, handleDeleteExercise, handleExerciseError, initialExerciseData }) => {
    const [exerciseInputData, setExerciseInputData] = useState<{
        title: string;
        exerciseType: ExerciseType;
        measurementType: MeasurementType;
        sets: number | undefined;
        reps: number | undefined;
        duration: number | undefined;
        distance: number | undefined;
    }>(() => {
        if (initialExerciseData) {
            return {
                title: initialExerciseData.title || "",
                exerciseType: initialExerciseData.exercise_type || "strength",
                measurementType: initialExerciseData.measurement_type || "reps",
                sets: initialExerciseData.sets !== undefined ? Number(initialExerciseData.sets) : undefined,
                reps: initialExerciseData.reps !== undefined ? Number(initialExerciseData.reps) : undefined,
                duration: initialExerciseData.duration_seconds !== undefined ? Math.round(Number(initialExerciseData.duration_seconds) / 60) : undefined,
                distance: initialExerciseData.distance_miles !== undefined ? Number(initialExerciseData.distance_miles) : undefined
            };
        }
        return {
            title: "",
            exerciseType: "strength",
            measurementType: measurementTypeMap["strength"],
            sets: undefined,
            reps: undefined,
            duration: undefined,
            distance: undefined
        };
    });

    // individual state setters
    const setTitle = (title: string) =>
        setExerciseInputData(prev => ({ ...prev, title }));
    const setExerciseType = (exerciseType: ExerciseType) =>
        setExerciseInputData(prev => ({
            ...prev,
            exerciseType,
            measurementType: measurementTypeMap[exerciseType],
            sets: undefined,
            reps: undefined,
            duration: undefined,
            distance: undefined
        }));
    const setSets = (sets: number | undefined) =>
        setExerciseInputData(prev => ({ ...prev, sets }));
    const setReps = (reps: number | undefined) =>
        setExerciseInputData(prev => ({ ...prev, reps }));
    const setDuration = (duration: number | undefined) =>
        setExerciseInputData(prev => ({ ...prev, duration }));
    const setDistance = (distance: number | undefined) =>
        setExerciseInputData(prev => ({ ...prev, distance }));
    const setMeasurementType = (measurementType: MeasurementType) =>
        setExerciseInputData(prev => ({ ...prev, measurementType }));

    const { title, exerciseType, measurementType, sets, reps, duration, distance } = exerciseInputData;

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!isInitialized) {
            setIsInitialized(true);
            return;
        }

        if (exerciseType) {
            setMeasurementType(measurementTypeMap[exerciseType as ExerciseType]);
        } else {
            setMeasurementType("reps");
        }
        // Only reset fields when user changes exercise type, not during initialization
        setSets(undefined);
        setReps(undefined);
        setDuration(undefined);
        setDistance(undefined);
    }, [exerciseType]);

    // Input validation helpers
    const handleNumericInput = (value: string, setter: (val: number | undefined) => void, max?: number) => {
        // Only allow digits
        if (/^\d*$/.test(value)) {
            if (value === "") {
                setter(undefined);
            } else {
                const num = Number(value);
                if (max && num > max) {
                    setter(max);
                } else {
                    setter(num);
                }
            }
        }
    };

    const handleDecimalInput = (value: string, setter: (val: number | undefined) => void, max?: number) => {
        // Allow digits and one decimal point
        if (/^\d*\.?\d*$/.test(value) || value === "") {
            if (value === "" || value === ".") {
                setter(undefined);
            } else {
                const num = Number(value);
                if (!isNaN(num)) {
                    if (max && num > max) {
                        setter(max);
                    } else {
                        setter(num);
                    }
                }
            }
        }
    };

    // blur and error handlers
    const handleTitleBlur = () => {
        const error = validateExerciseTitle(title);
        setErrors(prev => ({ ...prev, title: error || "" }));
        handleExerciseError(exerciseIndex, !!error);
    };

    const handleSetsBlur = () => {
        const error = validateSets(sets !== undefined ? String(sets) : "");
        setErrors(prev => ({ ...prev, sets: error || "" }));
        handleExerciseError(exerciseIndex, !!error);
    };

    const handleRepsBlur = () => {
        const error = validateReps(reps !== undefined ? String(reps) : "");
        setErrors(prev => ({ ...prev, reps: error || "" }));
        handleExerciseError(exerciseIndex, !!error);
    };

    const handleDurationBlur = () => {
        const error = validateDuration(duration !== undefined ? String(duration) : "");
        setErrors(prev => ({ ...prev, duration: error || "" }));
        handleExerciseError(exerciseIndex, !!error);
    };

    const handleDistanceBlur = () => {
        const error = validateDistance(distance !== undefined ? String(distance) : "");
        setErrors(prev => ({ ...prev, distance: error || "" }));
        handleExerciseError(exerciseIndex, !!error);
    };

    // if the input is fully filled, and no errors, handle exercise change
    useEffect(() => {
        const noErrors = Object.values(errors).every(err => !err);
        const isTitleFilled = !!title.trim();

        let isMeasurementFilled = false;
        if (measurementType === "reps") {
            isMeasurementFilled = !!sets && !!reps && !errors.sets && !errors.reps;
        } else if (measurementType === "duration") {
            isMeasurementFilled = !!duration && !errors.duration;
        } else if (measurementType === "distance") {
            isMeasurementFilled = !!distance && !errors.distance;
        }

        // Check if any input is focused
        const activeTag = document.activeElement?.tagName;
        const isInputFocused = activeTag === "INPUT" || activeTag === "SELECT" || activeTag === "TEXTAREA";

        if (isTitleFilled && noErrors && isMeasurementFilled && !isInputFocused) {
            handleExerciseChange(exerciseIndex, {
                title,
                exercise_type: exerciseType,
                measurement_type: measurementType,
                sets: sets ? Number(sets) : undefined,
                reps: reps ? Number(reps) : undefined,
                duration_seconds: duration ? Number(duration) * 60 : undefined,
                distance_miles: distance ? Number(distance) : undefined
            });
        }
    }, [title, exerciseType, measurementType, sets, reps, duration, distance, errors]);

    return (
        <div className="border border-[var(--accent-hover)] rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-semi">Exercise {exerciseIndex}</p>
                <Button
                    variant={"destructive"}
                    aria-label="Delete Exercise"
                    onClick={handleDeleteExercise}
                    className="flex items-center justify-center transition-colors"
                >
                    <Trash className="h-3 w-3" />
                </Button>
            </div>
            <div>
                <Label htmlFor="exercise-title" className="mb-2">Title:</Label>
                <Input
                    id="exercise-title"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    placeholder="Exercise Title"
                />
                {/* Title error and character count */}
                <div className="flex justify-between items-center my-1">
                    {errors.title && (
                        <p className="text-xs mt-1 text-[var(--danger)]">
                            {errors.title}
                        </p>
                    )}
                    <p
                        className={`ml-auto mt-1.5 text-xs text-right ${title.length > 30
                            ? "text-[var(--danger)]"
                            : "text-[var(--subhead-text)]"
                            }`}
                    >
                        {title.length}/30 characters
                    </p>
                </div>
            </div>
            <div className="flex w-fit justify-center gap-x-4">
                <div>
                    <Label htmlFor="exercise-type" className="mb-2">Exercise Type:</Label>
                    <Select
                        value={exerciseType}
                        onValueChange={value => setExerciseType(value as ExerciseType)}
                    >
                        <SelectTrigger id="exercise-type" className="w-[120px]">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            {exerciseTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {measurementType === "reps" && (
                    <>
                        <div className="w-full">
                            <Label htmlFor="sets" className="mb-2">Sets:</Label>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSets(Math.max((sets || 0) - 1, 0))}
                                    aria-label="Decrease sets"
                                    disabled={(sets || 0) <= 0}
                                >
                                    -
                                </Button>
                                <Input
                                    id="sets"
                                    type="text"
                                    value={sets ?? ""}
                                    onChange={e => handleNumericInput(e.target.value, setSets, 25)}
                                    onBlur={handleSetsBlur}
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="w-15 text-center font-bold text-base sm:text-xl text-[var(--accent)] border-transparent focus:border focus:border-[var(--accent)] focus:bg-white bg-transparent shadow-none"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSets(Math.min((sets || 0) + 1, 25))}
                                    aria-label="Increase sets"
                                    disabled={(sets || 0) >= 25}
                                >
                                    +
                                </Button>
                            </div>
                            {errors.sets && (
                                <p className="text-[var(--danger)] text-xs mt-1">{errors.sets}</p>
                            )}
                        </div>
                        <div className="w-full">
                            <Label htmlFor="reps" className="mb-2">Reps:</Label>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setReps(Math.max((reps || 0) - 1, 0))}
                                    aria-label="Decrease reps"
                                    disabled={(reps || 0) <= 0}
                                >
                                    -
                                </Button>
                                <Input
                                    id="reps"
                                    type="text"
                                    value={reps ?? ""}
                                    onChange={e => handleNumericInput(e.target.value, setReps, 50)}
                                    onBlur={handleRepsBlur}
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="w-15 text-center font-bold text-base sm:text-xl text-[var(--accent)] border-transparent focus:border focus:border-[var(--accent)] focus:bg-white bg-transparent shadow-none"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setReps(Math.min((reps || 0) + 1, 50))}
                                    aria-label="Increase reps"
                                    disabled={(reps || 0) >= 50}
                                >
                                    +
                                </Button>
                            </div>
                            {errors.reps && (
                                <p className="text-[var(--danger)] text-xs mt-1">{errors.reps}</p>
                            )}
                        </div>
                    </>
                )}
                {measurementType === "duration" && (
                    <div className="w-full">
                        <Label htmlFor="duration" className="mb-2">Duration (minutes):</Label>
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setDuration(Math.max((duration || 0) - 1, 0))}
                                aria-label="Decrease duration"
                                disabled={(duration || 0) <= 0}
                            >
                                -
                            </Button>
                            <Input
                                id="duration"
                                type="text"
                                value={duration ?? ""}
                                onChange={e => handleNumericInput(e.target.value, setDuration, 300)}
                                onBlur={handleDurationBlur}
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="0"
                                className="w-15 text-center font-bold text-base sm:text-xl text-[var(--accent)] border-transparent focus:border focus:border-[var(--accent)] focus:bg-white bg-transparent shadow-none"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setDuration(Math.min((duration || 0) + 1, 300))}
                                aria-label="Increase duration"
                                disabled={(duration || 0) >= 300}
                            >
                                +
                            </Button>
                        </div>
                        {errors.duration && (
                            <p className="text-[var(--danger)] text-xs mt-1">{errors.duration}</p>
                        )}
                    </div>
                )}
                {measurementType === "distance" && (
                    <div className="w-full">
                        <Label htmlFor="distance" className="mb-2">Distance (miles):</Label>
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setDistance(Math.max((distance || 0) - 0.1, 0))}
                                aria-label="Decrease distance"
                                disabled={(distance || 0) <= 0}
                            >
                                -
                            </Button>
                            <Input
                                id="distance"
                                type="text"
                                value={distance ?? ""}
                                onChange={e => handleDecimalInput(e.target.value, setDistance, 100)}
                                onBlur={handleDistanceBlur}
                                pattern="[0-9]*\.?[0-9]*"
                                inputMode="decimal"
                                placeholder="0"
                                className="w-15 text-center font-bold text-base sm:text-xl text-[var(--accent)] border-transparent focus:border focus:border-[var(--accent)] focus:bg-white bg-transparent shadow-none"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setDistance(Math.min((distance || 0) + 0.1, 100))}
                                aria-label="Increase distance"
                                disabled={(distance || 0) >= 100}
                            >
                                +
                            </Button>
                        </div>
                        {errors.distance && (
                            <p className="text-[var(--danger)] text-xs mt-1">{errors.distance}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExerciseInput;