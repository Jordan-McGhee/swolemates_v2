import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// hook imports
import { useAuth } from '@/context/AuthProvider';
import { useFetch } from '@/hooks/useFetch';
import { workoutApi } from '@/api/workoutApi';

// ui imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { CharacterCounter } from '@/components/ui/character-counter';

// component imports
import ExerciseInput from './ExerciseInput';

// type imports
import { WorkoutType, WorkoutFormExercise } from '@/types/props/props-types';

// validation imports
import { validateWorkoutName, validateWorkoutDescription } from '@/util/input-validators';

const WORKOUT_TYPES: WorkoutType[] = ['strength', 'cardio', 'hiit', 'run', 'yoga', 'stretching', 'swimming', 'cycling', 'crossfit', 'bodyweight', 'other'];

const CreateWorkoutForm: React.FC = () => {
    const { user } = useAuth();
    const { isLoading } = useFetch();
    const { createWorkout } = workoutApi();

    // form field states
    const [workoutName, setWorkoutName] = useState('');
    const [description, setDescription] = useState('');
    const [workoutType, setWorkoutType] = useState<WorkoutType | undefined>(undefined);
    const [formError, setFormError] = useState<Record<string, string> | null>(null);
    const [exerciseInputs, setExerciseInputs] = useState<WorkoutFormExercise[]>(
        Array.from({ length: 3 }, () => ({
            title: '',
            exercise_type: 'strength',
            measurement_type: 'reps',
            sets: undefined,
            reps: undefined,
            duration_seconds: undefined,
            distance_miles: undefined
        }))
    );
    // input errors
    const [exerciseErrors, setExerciseErrors] = useState<boolean[]>(Array(exerciseInputs.length).fill(false));

    // workout blur handlers
    const handleWorkoutNameBlur = () => {
        const error = validateWorkoutName(workoutName);
        setFormError(prev => ({
            ...prev,
            workoutName: error || ''
        }));
    };

    const handleDescriptionBlur = () => {
        const error = validateWorkoutDescription(description);
        setFormError(prev => ({
            ...prev,
            description: error || ''
        }));
    };

    // exercise handlers
    const handleExerciseChange = (index: number, updatedExercise: WorkoutFormExercise) => {
        setExerciseInputs(prevInputs =>
            prevInputs.map((exercise, idx) =>
                idx === index ? updatedExercise : exercise
            )
        );
        // console.log(exerciseInputs);
    };

    const handleDeleteExercise = (index: number) => {
        if (exerciseInputs.length === 3) {
            toast.error('A workout must have at least 3 exercises.');
            return;
        }
        setExerciseInputs(prevInputs => prevInputs.filter((_, idx) => idx !== index));
    };

    // Handler to update error state for a specific exercise input
    const handleExerciseError = (index: number, hasError: boolean) => {
        setExerciseErrors(prevErrors => {
            const updated = [...prevErrors];
            updated[index] = hasError;
            return updated;
        });
    };

    // Keep error state array in sync with exerciseInputs length
    React.useEffect(() => {
        if (exerciseErrors.length !== exerciseInputs.length) {
            setExerciseErrors(Array(exerciseInputs.length).fill(false));
        }
    }, [exerciseInputs.length]);


    const isFormValid =
        workoutName.trim().length > 5 && workoutName.trim().length <= 25 &&
        description.trim().length > 0 && description.trim().length <= 75 &&
        workoutType !== undefined &&
        (!formError?.workoutName && !formError?.description) &&
        exerciseInputs.length >= 3 &&
        exerciseInputs.length <= 10 &&
        exerciseErrors.every(err => !err) &&
        exerciseInputs.every(ex => ex.title.trim().length > 0);

    // form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const workoutData = {
                title: workoutName.trim(),
                description: description.trim(),
                workout_type: workoutType as WorkoutType,
                exercises: exerciseInputs
            };
            const response = await createWorkout(workoutData);
            if (response?.workout_id) {
                toast.success(
                    <>
                        Workout created successfully!{' '}
                        <Link
                            to={`/workouts/${response.workout_id}`}
                            className='underline hover:text-[var(--accent)] italic'
                        >
                            View workout
                        </Link>
                    </>
                );
                // Reset form fields
                setWorkoutName('');
                setDescription('');
                setWorkoutType(undefined);
                setExerciseInputs(Array.from({ length: 3 }, () => ({
                    title: '',
                    exercise_type: 'strength',
                    measurement_type: 'reps',
                    sets: undefined,
                    reps: undefined,
                    duration_seconds: undefined,
                    distance_miles: undefined
                })));
                setFormError(null);
                setExerciseErrors(Array(3).fill(false));
            } else {
                toast.error(response?.message || 'Failed to create workout.');
            }
        } catch (error: any) {
            toast.error(error?.message || 'An error occurred while creating workout.');
        }
    };

    // console.log({
    //     workoutNameValid: workoutName.trim().length > 5 && workoutName.trim().length <= 25,
    //     workoutNameValue: workoutName,
    //     descriptionValid: description.trim().length > 0 && description.trim().length <= 75,
    //     descriptionValue: description,
    //     workoutTypeValid: workoutType !== undefined,
    //     workoutTypeValue: workoutType,
    //     formErrorValid: !formError?.workoutName && !formError?.description,
    //     formErrorValue: formError,
    //     exerciseCountValid: exerciseInputs.length >= 3 && exerciseInputs.length <= 10,
    //     exerciseCountValue: exerciseInputs.length,
    //     exerciseErrorsValid: exerciseErrors.every(err => !err),
    //     exerciseErrorsValue: exerciseErrors,
    //     exerciseTitlesValid: exerciseInputs.every(ex => ex.title.trim().length > 0),
    //     exerciseTitlesValue: exerciseInputs.map(ex => ex.title)
    // });

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="flex items-center gap-3 mb-4">
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
                <p className="font-semibold text-2xl">Create Workout</p>
            </div>

            <div className="flex gap-4">
                <div className="flex-[4]">
                    <Label className="block mb-2 font-medium">Workout Name:</Label>
                    <Input
                        type="text"
                        value={workoutName}
                        onChange={e => setWorkoutName(e.target.value)}
                        onBlur={handleWorkoutNameBlur}
                        placeholder="Enter workout name"
                        className="w-full"
                    />
                    <div className="flex justify-between items-center mt-1">
                        <div>
                            {formError?.workoutName && (
                                <p className="text-sm text-[var(--danger)]">
                                    {formError.workoutName}
                                </p>
                            )}
                        </div>
                        <CharacterCounter
                            value={workoutName}
                            max={25}
                        />

                    </div>
                </div>
                <div className="flex-2 min-w-[120px]">
                    <Label className="block mb-2 font-medium">Workout Type:</Label>
                    <Select
                        value={workoutType || undefined}
                        onValueChange={val => setWorkoutType(val as WorkoutType)}
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
                <Input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    placeholder="Enter description"
                    className="w-full"
                />
                <div className="flex justify-between items-center mt-1">
                    {formError?.description && (
                        <p className="text-sm mt-1 text-[var(--danger)]">
                            {formError.description}
                        </p>
                    )}
                    <CharacterCounter
                        value={description}
                        max={75}
                    />
                </div>
            </div>

            {/* EXERCISES */}
            <p className='text-lg font-semibold text-[var(--accent)] bg-[var(--accent-hover)] px-6 py-2 -ml-6 -mr-6 my-6'>Add Exercises</p>

            {/* exercise inputs */}
            {Array.from({ length: exerciseInputs.length }).map((_, idx) => (
                <ExerciseInput
                    key={idx}
                    exerciseIndex={idx + 1}
                    handleExerciseChange={(idx: number, updatedExercise: WorkoutFormExercise) => handleExerciseChange((idx - 1), updatedExercise)}
                    handleDeleteExercise={() => handleDeleteExercise(idx)}
                    handleExerciseError={(idx: number, hasError: boolean) => handleExerciseError(idx, hasError)}
                />
            ))}

            {
                exerciseInputs.length <= 10 && (
                    <Button
                        type="button"
                        onClick={() => {
                            if (exerciseInputs.length < 10) {
                                setExerciseInputs([
                                    ...exerciseInputs,
                                    {
                                        title: '',
                                        exercise_type: 'strength',
                                        measurement_type: 'reps',
                                        sets: undefined,
                                        reps: undefined,
                                        duration_seconds: undefined,
                                        distance_miles: undefined
                                    }
                                ]);
                            }
                        }}
                        variant="outline"
                    >
                        Add Exercise
                    </Button>
                )
            }


            <div className="flex justify-end mt-4">
                <Button
                    type="submit"
                    disabled={!isFormValid}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin h-4 w-4" />
                            Creating Workout
                        </span>
                    ) : (
                        'Create Workout'
                    )}
                </Button>
            </div>
        </form>
    );
};

export default CreateWorkoutForm;
