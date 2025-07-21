import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

// hook imports
import { useAuth } from "@/context/AuthProvider"
import { useFetch } from "@/hooks/useFetch"

// types imports
import type { PostgreSQLUser } from "@/types/props/props-types"

// api imports
import { getSingleUserURL } from "@/api/profileApi"

export default function ProfileHeader() {
    const { user_id } = useParams()
    const { user: authUser } = useAuth()
    const { sendRequest, isLoading, hasError, clearError } = useFetch<PostgreSQLUser>()
    const [profileUser, setProfileUser] = useState<PostgreSQLUser | null>(null)

    useEffect(() => {
        if (!user_id) return

        // If it's the current signed-in user, skip fetch
        if (authUser?.user_id === user_id) {
            setProfileUser(authUser)
            return
        }

        // Else, fetch the profile from backend
        const fetchUser = async () => {
            try {
                const data = await sendRequest({ url: getSingleUserURL(user_id) })
                setProfileUser(data)
            } catch (err) {
                console.error("Failed to load profile:", err)
            }
        }

        fetchUser()
    }, [user_id, authUser])

    if (isLoading) return <p>Loading...</p>
    if (hasError) return <p>Error: {hasError}</p>
    if (!profileUser) return <p>User not found.</p>

    return (
        <div>
            <h1>{profileUser.username}'s Profile</h1>
            {/* Render bio, pic, etc. */}
        </div>
    )
}
