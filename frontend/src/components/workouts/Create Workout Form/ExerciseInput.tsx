import React, { useState, useEffect } from "react";

// ui imports
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash } from "lucide-react";

// type imports
import { ExerciseType, MeasurementType, ExerciseInputProps } from "@/types/props/props-types";

// validator imports
import { validateExerciseTitle, validateSets, validateReps, validateDuration, validateDistance } from "@/util/input-validators";
import { Button } from "@/components/ui/button";

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

const ExerciseInput: React.FC<ExerciseInputProps> = ({ exerciseIndex, handleExerciseChange, handleDeleteExercise, handleExerciseError }) => {
    const [exerciseInputData, setExerciseInputData] = useState<{
        title: string;
        exerciseType: ExerciseType;
        measurementType: MeasurementType;
        sets: string;
        reps: string;
        duration: string;
        distance: string;
    }>({
        title: "",
        exerciseType: "strength",
        measurementType: measurementTypeMap["strength"],
        sets: "",
        reps: "",
        duration: "",
        distance: ""
    });

    // individual state setters
    const setTitle = (title: string) =>
        setExerciseInputData(prev => ({ ...prev, title }));
    const setExerciseType = (exerciseType: ExerciseType) =>
        setExerciseInputData(prev => ({
            ...prev,
            exerciseType,
            measurementType: measurementTypeMap[exerciseType],
            sets: "",
            reps: "",
            duration: "",
            distance: ""
        }));
    const setSets = (sets: string) =>
        setExerciseInputData(prev => ({ ...prev, sets }));
    const setReps = (reps: string) =>
        setExerciseInputData(prev => ({ ...prev, reps }));
    const setDuration = (duration: string) =>
        setExerciseInputData(prev => ({ ...prev, duration }));
    const setDistance = (distance: string) =>
        setExerciseInputData(prev => ({ ...prev, distance }));
    const setMeasurementType = (measurementType: MeasurementType) =>
        setExerciseInputData(prev => ({ ...prev, measurementType }));

    const { title, exerciseType, measurementType, sets, reps, duration, distance } = exerciseInputData;

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (exerciseType) {
            setMeasurementType(measurementTypeMap[exerciseType as ExerciseType]);
        } else {
            setMeasurementType("reps");
        }
        // Reset measurement fields when type changes
        setSets("");
        setReps("");
        setDuration("");
        setDistance("");
    }, [exerciseType]);


    // blur and error handlers
    const handleTitleBlur = () => {
        const error = validateExerciseTitle(title);
        setErrors(prev => ({ ...prev, title: error || "" }));
        handleExerciseError(exerciseIndex, !!error);
    };

    const handleSetsBlur = () => {
        const error = validateSets(sets);
        setErrors(prev => ({ ...prev, sets: error || "" }));
        handleExerciseError(exerciseIndex, !!error);
    };

    const handleRepsBlur = () => {
        const error = validateReps(reps);
        setErrors(prev => ({ ...prev, reps: error || "" }));
        handleExerciseError(exerciseIndex, !!error);
    };

    const handleDurationBlur = () => {
        const error = validateDuration(duration);
        setErrors(prev => ({ ...prev, duration: error || "" }));
        handleExerciseError(exerciseIndex, !!error);
    };

    const handleDistanceBlur = () => {
        const error = validateDistance(distance);
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
        <div className="">
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
                <div className="flex justify-between items-center mt-1">
                    {errors.title && (
                        <p className="text-sm mt-1 text-[var(--danger)]">
                            {errors.title}
                        </p>
                    )}
                    <p
                        className={`ml-auto mt-1.5 text-xs text-right ${title.length > 50
                            ? "text-[var(--danger)]"
                            : "text-[var(--subhead-text)]"
                            }`}
                    >
                        {title.length}/50 characters
                    </p>
                </div>
            </div>
            <div className="flex w-full gap-x-4">
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
                            <Input
                                id="sets"
                                type="number"
                                min={1}
                                max={25}
                                step={1}
                                value={sets}
                                onChange={e => setSets(e.target.value)}
                                onBlur={handleSetsBlur}
                                placeholder="Sets"
                            />
                            {errors.sets && (
                                <p className="text-[var(--danger)] text-sm mt-1">{errors.sets}</p>
                            )}
                        </div>
                        <div className="w-full">
                            <Label htmlFor="reps" className="mb-2">Reps:</Label>
                            <Input
                                id="reps"
                                type="number"
                                min={1}
                                max={50}
                                step={1}
                                value={reps}
                                onChange={e => setReps(e.target.value)}
                                onBlur={handleRepsBlur}
                                placeholder="Reps"
                            />
                            {errors.reps && (
                                <p className="text-[var(--danger)] text-sm mt-1">{errors.reps}</p>
                            )}
                        </div>
                    </>
                )}
                {measurementType === "duration" && (
                    <div className="w-full">
                        <Label htmlFor="duration" className="mb-2">Duration (minutes):</Label>
                        <Input
                            id="duration"
                            type="number"
                            min={1}
                            max={300}
                            step={5}
                            value={duration}
                            onChange={e => setDuration(e.target.value)}
                            onBlur={handleDurationBlur}
                            placeholder="Minutes"
                        />
                        {errors.duration && (
                            <p className="text-[var(--danger)] text-sm mt-1">{errors.duration}</p>
                        )}
                    </div>
                )}
                {measurementType === "distance" && (
                    <div className="w-full">
                        <Label htmlFor="distance" className="mb-2">Distance (miles):</Label>
                        <Input
                            id="distance"
                            type="number"
                            min={0.1}
                            step={0.1}
                            value={distance}
                            onChange={e => setDistance(e.target.value)}
                            onBlur={handleDistanceBlur}
                            placeholder="Miles"
                        />
                        {errors.distance && (
                            <p className="text-[var(--danger)] text-sm mt-1">{errors.distance}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExerciseInput;