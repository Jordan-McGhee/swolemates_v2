import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// hook imports
import { useAuth } from "@/context/AuthProvider"
import { useFetch } from "@/hooks/useFetch"

// api imports
import { getSingleUserURL } from "@/api/profileApi";

// component imports
import ProfileHeader from "@/components/profile/ProfileHeader"
import { ProfileMenuBar } from "@/components/profile/ProfileMenuBar";
import ErrorModal from "@/components/ErrorModal";
import CreatePost from "@/components/posts/CreatePost";

// types imports
import { ProfileMenuItem, PostgreSQLUser, Feed, Post, Workout } from "@/types/props/props-types";

// view imports
import { ProfileFeed } from "@/components/profile/ProfileFeed";
import { ProfilePosts } from "@/components/profile/ProfilePosts";
import { ProfileWorkouts } from "@/components/profile/ProfileWorkouts";
import { ProfileFriends } from "@/components/profile/ProfileFriends";
import { ProfileGroups } from "@/components/profile/ProfileGroups";


export default function Profile() {
    // consts needed for profile
    const { username } = useParams<{ username?: string }>();
    const { user: authUser, token } = useAuth();
    const { sendRequest, isLoading, hasError, clearError } = useFetch();

    // state for current profile user
    const [profileUser, setProfileUser] = useState<PostgreSQLUser | null>(null);
    const [feed, setFeed] = useState<Feed>([]);

    // divide feed into posts and workouts for different views
    const posts: Post[] = feed.filter((item): item is Post => "content" in item);
    const workouts: Workout[] = feed.filter((item): item is Workout => !("content" in item) && "title" in item && "exercises" in item);


    // fetch profile user data
    useEffect(() => {
        console.log("Profile useEffect triggered for username:", username);

        if (!username) {
            console.warn("No username found in params.");
            return;
        }

        const fetchUser = async () => {
            console.log("Fetching user from backend...");
            try {
                const data = await sendRequest({
                    url: getSingleUserURL(username),
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: token ? `Bearer ${token}` : "",
                    },
                });

                if (!data) {
                    console.log("No data returned from backend, setting profileUser to null");
                    setProfileUser(null);
                    return;
                }
                console.log("User data received:", data.user);
                setProfileUser(data.user as PostgreSQLUser);
            } catch (err) {
                console.error("Error fetching user:", err);
                setProfileUser(null);
            }
        };

        fetchUser();

    }, [username, authUser, token]);

    // isOwnProfile to see if authUser is viewing their own profile
    const isOwnProfile = authUser?.username?.toLowerCase() === profileUser?.username?.toLowerCase();

    // menubar menu item
    const [selectedMenuItem, setSelectedMenuItem] = useState<ProfileMenuItem>("feed");

    // handle menubar item change
    const handleMenuItemClick = (item: ProfileMenuItem) => {
        setSelectedMenuItem(item);
    };

    return (
        <>

            {/* Error Modal */}
            <ErrorModal error={hasError} onClear={clearError} />


            {
                !isLoading &&
                <div className="flex flex-row gap-4 w-full">
                    {/* left side */}
                    <div className="w-full lg:w-[65%] flex flex-col gap-4">
                        <ProfileHeader
                            user={profileUser}
                            isLoading={isLoading}
                            isOwnProfile={isOwnProfile}
                        />

                        {/* Create Post Component */}
                        {isOwnProfile && (
                            <CreatePost
                                workouts={workouts || []}
                            />
                        )}

                        <ProfileMenuBar
                            selectedMenuItem={selectedMenuItem}
                            onMenuItemClick={(item) => handleMenuItemClick(item)}
                        />

                        {selectedMenuItem === "feed" && <ProfileFeed />}
                        {/* {selectedMenuItem === "feed" && <ProfileFeed user={profileUser} isLoading={isLoading}isOwnProfile={isOwnProfile} />} */}
                        {selectedMenuItem === "posts" && <ProfilePosts />}
                        {selectedMenuItem === "workouts" && <ProfileWorkouts />}
                        {selectedMenuItem === "friends" && <ProfileFriends />}
                        {selectedMenuItem === "groups" && <ProfileGroups />}
                    </div>

                    {/* right side */}
                    <div className="w-[35%] hidden lg:block">
                        <div className="bg-[var(--off-bg)] border border-[var(--accent)] rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-2">Friends</h3>
                            <p className="text-[var(--subhead-text)]">No friends yet.</p>
                        </div>
                    </div>
                </div>
            }
        </>

    );
}
