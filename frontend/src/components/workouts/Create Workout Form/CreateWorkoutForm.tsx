import React, { useState } from 'react';

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

// component imports
import ExerciseInput from './ExerciseInput';

// type imports
import { WorkoutType } from '@/types/props/props-types';

const WORKOUT_TYPES: WorkoutType[] = ['strength', 'cardio', 'hiit', 'run', 'yoga', 'stretching', 'swimming', 'cycling', 'crossfit', 'bodyweight', 'other'];

const CreateWorkoutForm: React.FC = () => {
    const { user, token } = useAuth();
    const { isLoading } = useFetch();
    const { createWorkout } = workoutApi();

    const [workoutName, setWorkoutName] = useState('');
    const [description, setDescription] = useState('');
    const [workoutType, setWorkoutType] = useState<WorkoutType | undefined>(undefined);
    const [formError, setFormError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Submit logic here
    };

    const isFormValid =
        workoutName.trim().length > 5 && workoutName.trim().length <= 25 &&
        description.trim().length > 0 && description.trim().length <= 75 &&
        workoutType !== undefined;

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
                        placeholder="Enter workout name"
                        className="w-full"
                    />
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
                    placeholder="Enter description"
                    className="w-full"
                />
            </div>

            {/* exercise inputs */}
            <ExerciseInput onErrorChange={() => {}} />

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
