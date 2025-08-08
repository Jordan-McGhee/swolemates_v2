import React from "react";
import CreateWorkoutForm from "../../components/workouts/Create Workout Form/CreateWorkoutForm";

const CreateWorkout: React.FC = () => {
    return (
        <>
            <div className="flex flex-row gap-4 w-full overflow-y-auto min-h-screen">
                {/* Left side */}
                <div className="w-full lg:w-[65%] flex flex-col gap-4">
                    <div className="bg-[var(--white)] rounded-xl p-6">
                        <CreateWorkoutForm />
                    </div>
                </div>

                {/* Right side */}
                <div className="w-[35%] hidden lg:block">
                    <div className="bg-[var(--off-bg)] border border-[var(--accent)] rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-2">Tips</h3>
                        <p className="text-[var(--subhead-text)]">
                            Plan your workout by adding exercises, sets, and reps.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateWorkout;