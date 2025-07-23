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

// types imports
import { ProfileMenuItem, PostgreSQLUser } from "@/types/props/props-types";

// view imports
import { ProfileFeed } from "@/components/profile/ProfileFeed";
import { ProfilePosts } from "@/components/profile/ProfilePosts";
import { ProfileWorkouts } from "@/components/profile/ProfileWorkouts";
import { ProfileFriends } from "@/components/profile/ProfileFriends";
import { ProfileGroups } from "@/components/profile/ProfileGroups";


export default function Profile() {
    // consts needed for profile
    const { username } = useParams<{ username?: string }>();
    const { user: authUser, firebaseUser } = useAuth();
    const { sendRequest, isLoading, hasError, clearError } = useFetch();

    // state for current profile user
    const [profileUser, setProfileUser] = useState<PostgreSQLUser | null>(null);

    // fetch profile user data
    useEffect(() => {
        console.log("Profile useEffect triggered for username:", username);

        if (!username) {
            console.warn("No username found in params.");
            return;
        }

        // Only run fetch if not viewing own profile
        if (authUser?.username?.toLowerCase() === username.toLowerCase()) {
            console.log("Viewing own profile, setting profileUser to authUser");
            setProfileUser(authUser);
            return;
        }

        // Else, fetch the profile from backend
        const fetchUser = async () => {
            console.log("Fetching user from backend...");
            try {
                // Use firebaseUser?.token for Authorization
                const token = firebaseUser?.getIdToken ? await firebaseUser.getIdToken() : null;
                console.log("Token acquired:", token ? "Yes" : "No");
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

    }, [username, authUser, firebaseUser]);

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


            <div className="flex flex-row gap-4 w-full">
                {/* left side */}
                <div className="w-full lg:w-[65%] flex flex-col gap-4">
                    <ProfileHeader
                        user={profileUser}
                        isLoading={isLoading}
                        isOwnProfile={isOwnProfile}
                    />
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
        </>

    );
}
