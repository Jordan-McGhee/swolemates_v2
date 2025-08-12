import React, { useState } from "react";

// component imports
import ViewPostItem from "@/components/posts/ViewPost/ViewPostItem";
import ViewPostLikes from "@/components/posts/ViewPost/ViewPostLikes";

// type imports
import { Like } from "@/types/props/props-types";


const ViewPostPage: React.FC = () => {

    // likes state for receiving from ViewPostItem
    const [likes, setLikes] = useState<Like[]>([]);

    // like updater handler
    const handleLikesUpdate = (updatedLikes: Like[]) => {
        setLikes(updatedLikes);
    };

    console.log("Updated likes in ViewPostPage:", likes);

    return (
        <div className="flex gap-4 w-full min-h-screen">
            {/* left side */}
            <div className="w-full lg:w-[65%] flex flex-col gap-4 overflow-y-auto h-full">
                <ViewPostItem onLikesUpdate={handleLikesUpdate} />
            </div>

            {/* right side */}
            <div className="w-[35%] hidden lg:block overflow-y-auto h-screen">
                <ViewPostLikes likes={likes} />
            </div>
        </div>
    );
}

export default ViewPostPage;