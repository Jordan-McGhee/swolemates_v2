import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

const ViewWorkout: React.FC = () => {

    const { workout_id } = useParams<{ workout_id: string }>();

    return (
        <div>
            View Workout {workout_id}
        </div>
    )
}

export default ViewWorkout;