import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

const ViewSession: React.FC = () => {

    const { session_id } = useParams<{ session_id: string }>();

    return (
        <div>
            View Session {session_id}
        </div>
    )
}

export default ViewSession;