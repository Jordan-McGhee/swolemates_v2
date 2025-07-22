// hook imports
import { useAuth } from "@/context/AuthProvider"
import { useFetch } from "@/hooks/useFetch"

// component imports
import ProfileHeader from "@/components/profile/ProfileHeader"


export default function Profile() {

    return (
        <div className="flex flex-row gap-4 ">
            {/* left side */}
            <div className="flex-1">
                <ProfileHeader />
            </div>

            {/* right side */}
            <div className="w-80 hidden md:block">
                <div className="bg-[var(--off-bg)] border border-[var(--accent)] rounded-xl p-4">
                    <h3 className="text-lg font-semibold mb-2">Friends</h3>
                    <p className="text-[var(--subhead-text)]">No friends yet.</p>
                </div>
            </div>
        </div>
    );
}
