import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// ui imports
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dumbbell, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// type imports
import { PostItemWorkoutProps, Workout } from "@/types/props/props-types";

// util imports
import { formatDate } from "@/util/general-util";

// hook imports
import { workoutApi } from "@/api/workoutApi";

export const PostItemWorkout: React.FC<PostItemWorkoutProps> = ({ workout_id, workout_title }) => {

    // hook destructuring
    const { getSingleWorkout } = workoutApi();

    // state for detailed workout data
    const [detailedWorkout, setDetailedWorkout] = useState<Workout | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // function to fetch detailed workout data
    const fetchWorkout = async (workout_id: number) => {
        if (!workout_id) return;
        try {
            setLoadingDetails(true);
            const data = await getSingleWorkout(workout_id);
            setDetailedWorkout(data.workout);
            setLoadingDetails(false);
        } catch (err) {
            console.error("Failed to fetch workout details:", err);
            setError("Failed to load workout details.");
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        if (workout_id) {
            fetchWorkout(workout_id);
        }
    }, [workout_id]);

    return (
        <>
            {/* error state */}
            {error && (
                null
            )}

            {/* workout display */}

            {/* mobile */}
            <div className="lg:hidden">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="secondary" className="px-2 py-1 w-28 md:w-32 flex items-center border-none">
                            <Dumbbell className="h-4 w-4" />
                            <p className="truncate">{workout_title}</p>
                        </Button>
                    </PopoverTrigger>
                    {loadingDetails ? (
                        <PopoverContent className="w-80 flex justify-center items-center">
                            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                        </PopoverContent>
                    ) : detailedWorkout && (
                        <PopoverContent className="w-80">
                            <div className="flex flex-col">
                                <Badge variant="default">
                                    {detailedWorkout.workout_type.toUpperCase()}
                                </Badge>

                                <Link to={`/workouts/${detailedWorkout.workout_id}`} className="text-lg font-semibold text-[var(--accent)] mt-1 hover:underline">
                                    {detailedWorkout.workout_title}
                                </Link>

                                <p className="text-xs my-1">{detailedWorkout.workout_description}</p>

                                <p className="font-semibold text-base mt-1 text-[var(--accent)]">
                                    {detailedWorkout.exercises.length} exercise{detailedWorkout.exercises.length !== 1 ? "s" : ""}
                                </p>

                                <div className="flex items-center gap-2 mt-2">
                                    <Avatar className="size-7 rounded-sm">
                                        <AvatarImage src={detailedWorkout.profile_pic} alt={detailedWorkout.username} />
                                        <AvatarFallback>
                                            {detailedWorkout.username?.[0]?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs font-medium">{detailedWorkout.username}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(detailedWorkout.created_at, "relative")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    )}
                </Popover>
            </div>

            {/* desktop */}
            <div className="hidden lg:block">
                <HoverCard>
                    <HoverCardTrigger asChild>
                        <Button variant="secondary" className="px-2 py-1 w-32 flex items-center border-none">
                            <Dumbbell className="h-4 w-4" />
                            <p className="truncate">{workout_title}</p>
                        </Button>
                    </HoverCardTrigger>
                    {loadingDetails ? (
                        <HoverCardContent className="w-80 flex justify-center items-center">
                            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                        </HoverCardContent>
                    ) : detailedWorkout && (
                        <HoverCardContent className="w-80">
                            <div className="flex flex-col">
                                <Badge
                                    variant="default"
                                >
                                    {detailedWorkout.workout_type.toUpperCase()}
                                </Badge>

                                <Link to={`/workouts/${detailedWorkout.workout_id}`} className="text-lg font-semibold text-[var(--accent)] mt-1 hover:underline">
                                    {detailedWorkout.workout_title}
                                </Link>

                                <p className="text-xs my-1">{detailedWorkout.workout_description}</p>

                                <p className="font-semibold text-base mt-1 text-[var(--accent)]">
                                    {detailedWorkout.exercises.length} exercise{detailedWorkout.exercises.length !== 1 ? "s" : ""}
                                </p>

                                <div className="flex items-center gap-2 mt-2">
                                    <Avatar className="size-7 rounded-sm">
                                        <AvatarImage src={detailedWorkout.profile_pic} alt={detailedWorkout.username} />
                                        <AvatarFallback>
                                            {detailedWorkout.username?.[0]?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs font-medium">{detailedWorkout.username}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(detailedWorkout.created_at, "relative")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </HoverCardContent>
                    )}
                </HoverCard>
            </div>
        </>
    );
}

export default PostItemWorkout;