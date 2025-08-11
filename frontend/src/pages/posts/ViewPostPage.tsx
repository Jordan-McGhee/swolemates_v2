import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

// component imports
import ViewPostItem from "@/components/posts/ViewPost/ViewPostItem";

// hook import
import { useAuth } from "@/context/AuthProvider";
import { postApi } from "@/api/postApi";


const ViewPostPage: React.FC = () => {

    return (
        <div className="flex gap-4 w-full overflow-y-auto min-h-screen">

            {/* left side */}
            <div className="w-full lg:w-[65%] flex flex-col gap-4">
                <ViewPostItem />
            </div>

            {/* right side */}
            <div className="w-[35%] hidden lg:block">
                <div className="bg-[var(--off-bg)] border border-[var(--accent)] rounded-xl p-4">
                    <h3 className="text-lg font-semibold mb-2">Tips</h3>
                    <p className="text-[var(--subhead-text)]">
                        Engage with posts by liking and commenting to foster community interaction.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ViewPostPage;