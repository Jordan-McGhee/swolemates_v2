import React from 'react';

// type imports
import { ViewWorkoutExerciseItemProps } from '@/types/props/props-types';

// ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';


const ViewWorkoutExerciseItem: React.FC<ViewWorkoutExerciseItemProps> = ({ exercise, index }) => {
    return (
        <div>
            <Card className="mb-4 text-[var(--subhead-text)]">
                <CardHeader>
                    {/* Exercise Title in its own row */}
                    <CardTitle className="text-lg md:text-xl font-semibold">
                        {exercise?.title}
                    </CardTitle>
                    {/* Exercise type and details in a flex row underneath */}
                    <div className="flex items-center justify-between">
                        <Badge>
                            {exercise.exercise_type.toUpperCase()}
                        </Badge>
                        
                        <div className='text-right text-lg'>
                            {exercise.sets && exercise.reps ? (
                                <div className="flex items-center gap-2">
                                    <p><span className="font-semibold text-2xl text-[var(--accent)] italic">{exercise.sets}</span> sets</p>
                                    <p>x</p>
                                    <p><span className="font-semibold text-2xl text-[var(--accent)] italic">{exercise.reps}</span> reps</p>
                                </div>
                            ) : exercise.duration_seconds ? (
                                <div className='flex items-center gap-2'>
                                    {Math.floor(exercise.duration_seconds / 60) !== 0 && (
                                        <p>
                                            <span className="font-semibold text-2xl text-[var(--accent)] italic">
                                                {Math.floor(exercise.duration_seconds / 60)}
                                            </span> min
                                        </p>
                                    )}
                                    {exercise.duration_seconds % 60 !== 0 && (
                                        <p>
                                            <span className="font-semibold text-2xl text-[var(--accent)] italic">
                                                {exercise.duration_seconds % 60}
                                            </span> sec
                                        </p>
                                    )}
                                </div>
                            ) : exercise.distance_miles ? (
                                <div>
                                    <p><span className="font-semibold text-2xl text-[var(--accent)] italic">{exercise.distance_miles}</span> miles</p>
                                </div>
                            ) : (
                                <span className="text-muted-foreground">No details provided</span>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
};

export default ViewWorkoutExerciseItem;