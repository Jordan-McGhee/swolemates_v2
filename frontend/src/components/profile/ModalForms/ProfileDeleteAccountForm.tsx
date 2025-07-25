import { useState } from "react";

// hook imports
import { useAuth } from "@/context/AuthProvider";

// ui imports
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

// type imports
import { ProfileEditFormProps } from '@/types/props/props-types';

const ProfileDeleteAccountForm = ({ onBack }: ProfileEditFormProps) => {
    const { user, handleDeleteAccount, isAuthLoading, hasError, clearError } = useAuth();
    const [confirmUsername, setConfirmUsername] = useState("");
    const [deleteError, setDeleteError] = useState("");

    const handleDelete = () => {
        if (confirmUsername !== user?.username) {
            setDeleteError("Username does not match.");
            return;
        }
        handleDeleteAccount();
    };

    return (
        <div className="w-full p-4 flex flex-col items-center justify-center gap-2 text-center">

            {/* back arrow */}
            <div className="absolute top-4 left-4">
                <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={onBack}
                    aria-label="Go back"
                    className="p-2 rounded-xl hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] hover:cursor-pointer"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
            </div>


            <p className="text-xl font-bold text-[var(--danger)] mb-2">Delete Account</p>
            <p className="text-[var(--subhead-text)] mb-4">
                Are you sure you want to delete your account? This action cannot be undone.
            </p>

            <p>Please type your username to confirm: <br /> <span className="font-semibold italic">{user?.username}</span></p>
            <input
                type="text"
                placeholder="Type your username to confirm"
                value={confirmUsername}
                onChange={(e) => {
                    setConfirmUsername(e.target.value);
                    if (hasError) clearError();
                    setDeleteError(""); // clear error on change
                }}
                onBlur={() => {
                    if (confirmUsername !== user?.username) {
                        setDeleteError("Username does not match.");
                    } else {
                        setDeleteError("");
                    }
                }}
                className={`w-full p-2 border rounded mb-2 ${
                    deleteError ? "border-[var(--danger)]" : "border-gray-300"
                }`}
            />
            {deleteError && <p className="text-sm text-[var(--danger)]">{deleteError}</p>}
            <Button
                className="w-full text-white bg-[var(--danger)] hover:bg-[#e69ea0] hover:cursor-pointer font-semibold text-base py-3 shadow transition-colors"
                onClick={handleDelete}
                disabled={isAuthLoading || confirmUsername !== user?.username}
                type="button"
            >
                {isAuthLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAuthLoading ? "Deleting..." : "Delete Account"}
            </Button>
        </div>
    );
}

export default ProfileDeleteAccountForm;