import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

// hook imports
import { useAuth } from "@/context/AuthProvider"
import { useFetch } from "@/hooks/useFetch"

// types imports
import type { PostgreSQLUser } from "@/types/props/props-types"

// api imports
import { getSingleUserURL } from "@/api/profileApi"

// ui/icon imports
// import { Button } from "@/components/ui/button"
import { User, Users, Dumbbell, MessageSquareText } from "lucide-react"

// component imports
import ErrorModal from "@/components/ErrorModal"

export default function ProfileHeader() {
    const { username } = useParams()
    const { user: authUser } = useAuth()
    const { sendRequest, isLoading, hasError, clearError } = useFetch<{ user: PostgreSQLUser }>()
    const [profileUser, setProfileUser] = useState<PostgreSQLUser | null>(null)

    useEffect(() => {
        if (!username) {
            console.warn("No username found in params.")
            return
        }

        // If it's the current signed-in user, skip fetch
        if (authUser?.username.toLowerCase() === username.toLowerCase()) {
            setProfileUser(authUser)
            console.log("Viewing own profile, using authUser:", authUser)
            return
        }

        // Else, fetch the profile from backend
        const fetchUser = async () => {
            try {
                const data = await sendRequest({ url: getSingleUserURL(username) })

                if (!data) {
                    console.warn("No data returned from sendRequest for username:", username)
                    setProfileUser(null)
                    return
                }
                console.log("Fetched profile user data:", data)
                setProfileUser(data.user as PostgreSQLUser)
            } catch (err) {
                console.error("Failed to load profile:", err)
                setProfileUser(null)
            }
        }

        fetchUser()
    }, [username, authUser])

    return (
        <>
            {/* error and loading states */}
            <ErrorModal error={hasError} onClear={clearError} />

            {isLoading && <p>Loading profile...</p>}
            {profileUser &&

                <div className="flex gap-x-2 bg-white shadow-md rounded-xl p-4 h-[150px]">

                    {/* img/icon div */}
                    <div>
                        {
                            profileUser?.profile_pic ?
                                <img
                                    src={profileUser?.profile_pic || "/default-profile-pic.png"}
                                    alt={`${profileUser?.username}'s profile`}
                                    className="h-full rounded-xl border border-[var(--accent)] object-cover"
                                />
                                :
                                <User className="h-full w-full text-[var(--accent)]" />
                        }
                    </div>

                    {/* main content div */}
                    <div className="flex flex-col items-start justify-between h-full ml-4">
                        <div>
                            <p className="text-xl font-semibold text-[var(--accent)] mb-1">{profileUser?.username}</p>
                            <p className="text-[var(--subhead-text)]">{profileUser?.bio || "No bio available."}</p>
                        </div>

                        {/* user count for friends, posts, workouts */}
                        <div className="flex gap-x-2 text-[var(--subhead-text)]">
                            <div className="flex items-center gap-x-1.5">
                                <Users className="w-4 h-4" />
                                <span>0 Friends</span>
                            </div>
                            <div className="flex items-center gap-x-1.5">
                                <Dumbbell className="w-4 h-4" />
                                <span>0 Workouts</span>
                            </div>
                            <div className="flex items-center gap-x-1.5">
                                <MessageSquareText className="w-4 h-4" />
                                <span>0 Posts</span>
                            </div>
                        </div>
                    </div>

                    {/* <CardFooter>
                    {authUser?.user_id === profileUser?.user_id ? (
                        <Button>Edit Profile</Button>
                    ) : (
                        <Button>Follow</Button>
                    )}
                </CardFooter> */}
                </div>}


            {!isLoading && !hasError && !profileUser &&
                <p>User not found.</p>
            }
        </>
    )
}
