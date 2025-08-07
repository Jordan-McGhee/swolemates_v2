import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ExerciseType, MeasurementType } from "@/types/props/props-types";

interface ExerciseInputProps {
    onErrorChange: (hasError: boolean) => void;
}

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

const ExerciseInput: React.FC<ExerciseInputProps> = ({ onErrorChange }) => {
    const [title, setTitle] = useState("");
    const [exerciseType, setExerciseType] = useState<ExerciseType>("strength");
    const [measurementType, setMeasurementType] = useState<MeasurementType>(measurementTypeMap["strength"]);
    const [error, setError] = useState<string | null>(null);

    // Measurement fields
    const [sets, setSets] = useState("");
    const [reps, setReps] = useState("");
    const [duration, setDuration] = useState("");
    const [distance, setDistance] = useState("");

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

    useEffect(() => {
        let hasError = !title.trim() || !exerciseType;
        if (measurementType === "reps") {
            hasError = hasError || !sets.trim() || !reps.trim();
        } else if (measurementType === "duration") {
            hasError = hasError || !duration.trim();
        } else if (measurementType === "distance") {
            hasError = hasError || !distance.trim();
        }
        setError(hasError ? "All fields are required." : null);
        onErrorChange(hasError);
    }, [title, exerciseType, measurementType, sets, reps, duration, distance, onErrorChange]);

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="exercise-title" className="mb-2">Title:</Label>
                <Input
                    id="exercise-title"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Exercise Title"
                />
            </div>
            <div className="grid grid-cols-5 gap-x-4 w-full">
                <div className="col-span-1">
                    <Label htmlFor="exercise-type" className="mb-2">Exercise Type:</Label>
                    <Select
                        value={exerciseType}
                        onValueChange={value => setExerciseType(value as ExerciseType)}
                    >
                        <SelectTrigger id="exercise-type">
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
                        <div className="col-span-2 w-full">
                            <Label htmlFor="sets" className="mb-2">Sets:</Label>
                            <Input
                                id="sets"
                                type="number"
                                min={1}
                                value={sets}
                                onChange={e => setSets(e.target.value)}
                                placeholder="Sets"
                            />
                        </div>
                        <div className="col-span-2 w-full">
                            <Label htmlFor="reps" className="mb-2">Reps:</Label>
                            <Input
                                id="reps"
                                type="number"
                                min={1}
                                value={reps}
                                onChange={e => setReps(e.target.value)}
                                placeholder="Reps"
                            />
                        </div>
                    </>
                )}
                {measurementType === "duration" && (
                    <div className="col-span-4 w-full">
                        <Label htmlFor="duration" className="mb-2">Duration (minutes):</Label>
                        <Input
                            id="duration"
                            type="number"
                            min={1}
                            value={duration}
                            onChange={e => setDuration(e.target.value)}
                            placeholder="Minutes"
                        />
                    </div>
                )}
                {measurementType === "distance" && (
                    <div className="col-span-4 w-full">
                        <Label htmlFor="distance" className="mb-2">Distance (miles):</Label>
                        <Input
                            id="distance"
                            type="number"
                            min={0.1}
                            step={0.1}
                            value={distance}
                            onChange={e => setDistance(e.target.value)}
                            placeholder="Miles"
                        />
                    </div>
                )}
            </div>

            {error && <div className="text-xs text-[var(--danger)] italic mt-2 w-full">{error}</div>}
        </div>
    );
};

export default ExerciseInput;