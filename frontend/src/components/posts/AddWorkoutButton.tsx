import React, { useState, useEffect } from "react";

// hook imports
import { useAuth } from "@/context/AuthProvider";
import { workoutApi } from "@/api/workoutApi";

// ui imports
import { Button } from "@/components/ui/button";
import { Dumbbell, Loader2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// type imports
import { Workout, AddWorkoutButtonProps } from "@/types/props/props-types";

const AddWorkoutButton: React.FC<AddWorkoutButtonProps> = ({ onWorkoutSelect }) => {

    // hook destructuring
    const { user: authUser, token } = useAuth();
    const { getAllUserWorkouts } = workoutApi();

    // states
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loadingWorkouts, setLoadingWorkouts] = useState<boolean>(false);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const [open, setOpen] = useState(false);

    // useEffect to fetch workouts
    useEffect(() => {
        const fetchWorkouts = async () => {
            if (authUser && token) {
                try {
                    setLoadingWorkouts(true);
                    const data = await getAllUserWorkouts(authUser.username);
                    console.log("Fetched workouts:", data.workouts);
                    setWorkouts(data.workouts || []);
                    setLoadingWorkouts(false);
                } catch (error) {
                    console.error("Failed to fetch workouts:", error);
                    setWorkouts([]);
                }
            }
        };
        fetchWorkouts();
    }, [authUser, token]);

    const handleWorkoutSelect = (workout: Workout) => {
        setSelectedWorkout(workout);
        onWorkoutSelect(workout);
        setOpen(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant={selectedWorkout ? "secondary" : "ghost"}
                        className="w-fit sm:w-32 flex items-center justify-center"
                    >
                        {loadingWorkouts ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                <p>Add Workout</p>
                            </>
                        ) : selectedWorkout ? (
                            <>
                                <Dumbbell size={16} />
                                <span
                                    className="truncate max-w-[3rem] sm:max-w-[7rem]"
                                    title={selectedWorkout.workout_title}
                                >
                                    {selectedWorkout.workout_title}
                                </span>
                            </>
                        ) : (
                            <>
                                <Dumbbell size={16} />
                                <span className="hidden sm:inline">Add Workout</span>
                            </>
                        )}
                    </Button>
                </DialogTrigger>

                <DialogContent className="max-w-xs w-full sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Workout</DialogTitle>
                        <DialogDescription>
                            Select a workout to add to your post!
                        </DialogDescription>
                    </DialogHeader>
                    {loadingWorkouts ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : (
                        <ScrollArea >
                            <div className="flex flex-col gap-2 max-h-[40vh] p-2">
                                {workouts && workouts.map((workout) => {
                                    const isSelected = selectedWorkout?.workout_id === workout.workout_id;
                                    return (
                                        <div
                                            key={workout.workout_id}
                                            className={`group flex flex-col items-start w-full min-h-24 text-left p-2 rounded-md relative
                                                ${isSelected
                                                    ? "bg-[var(--accent-hover)] text-[var(--accent)] border border-[var(--accent)] shadow-xs hover:cursor-pointer"
                                                    : "border border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent)] hover:cursor-pointer"
                                                }`
                                            }
                                            onClick={() =>
                                                isSelected
                                                    ? setSelectedWorkout(null)
                                                    : handleWorkoutSelect(workout)
                                            }
                                        >
                                            <Avatar className="size-5 rounded-sm object-cover absolute top-2 right-2">
                                                <AvatarImage src={workout.profile_pic || ""} alt={workout.username} />
                                                <AvatarFallback>{workout.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col justify-center gap-1">
                                                <Badge className={`transition-colors duration-200 ${isSelected ? "bg-[var(--accent)] text-[var(--white)]" : "group-hover:bg-[var(--accent)] group-hover:text-[var(--white)]"}`}>
                                                    {workout.workout_type.toUpperCase()}
                                                </Badge>
                                                <p className={`font-semibold text-base ${isSelected ? "text-[var(--accent)]" : "text-[var(--accent)]"}`}>{workout.workout_title}</p>
                                                <div className="flex items-center gap-1 text-xs text-[var(--subhead-text)]">
                                                    <Dumbbell size={14} />
                                                    {workout.exercises.length} exercises
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export default AddWorkoutButton;