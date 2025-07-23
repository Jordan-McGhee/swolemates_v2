import React, { useState, useEffect } from "react";

// hook imports
import { useAuth } from "@/context/AuthProvider";

// ui imports
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// component imports
import { Modal } from "../ui/modal";
import ProfileEditModalForm from "./ModalForms/ProfileEditModalForm";
import ProfileDeleteAccountForm from "./ModalForms/ProfileDeleteAccountForm";

// types imports
import { ProfileEditModalProps } from "@/types/props/props-types";

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { user, handleLogout } = useAuth();
    const [step, setStep] = useState<"options" | "edit" | "deleteConfirm">("options");

    useEffect(() => {
        if (isOpen) {
            setStep("options");
        }
    }, [isOpen, user]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {/* Render the options step: avatar, username, and action buttons */}
            {step === "options" && (
                <div className="flex flex-col gap-4 items-center p-8">
                    {/* User avatar */}
                    <Avatar className="size-24">
                        {/* Profile picture if available */}
                        <AvatarImage src={user?.profile_pic} alt={user?.username} />
                        {/* Fallback: first letter of username */}
                        <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    {/* Display username */}
                    <p className="text-xl font-medium mb-1">{user?.username}</p>
                    {/* Modal title */}
                    <p className="text-3xl font-bold mb-2">Profile Settings</p>
                    {/* Button to switch to edit profile step */}
                    <Button
                        onClick={() => setStep("edit")}
                        className="w-full rounded-md bg-[var(--accent)] text-white font-semibold text-base py-3 shadow hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] hover:cursor-pointer transition-colors"
                    >
                        Edit Profile
                    </Button>
                    {/* Button to log out */}
                    <Button
                        onClick={handleLogout}
                        className="w-full rounded-md border-2 border-[var(--danger)] text-[var(--danger)] font-semibold text-base py-3 shadow bg-transparent hover:bg-[var(--danger)] hover:text-white hover:cursor-pointer transition-colors"
                    >
                        Logout
                    </Button>
                    
                    <hr className="w-full border-t border-subhead-text opacity-50 my-4" />

                    {/* Button to switch to delete account confirmation step */}
                    <Button
                        onClick={() => setStep("deleteConfirm")}
                        className="w-full rounded-md bg-[#e69ea0] hover:bg-[var(--danger)] text-white font-semibold text-base py-3 shadow  hover:text-[var(--white)] hover:cursor-pointer transition-colors"
                    >
                        Delete Account
                    </Button>
                </div>
            )}

            {/* Render the edit profile form when step is "edit" */}
            {step === "edit" && (
                <ProfileEditModalForm
                    // Callback to go back to options step
                    onBack={() => setStep("options")}
                />
            )}

            {/* Render the delete account confirmation form when step is "deleteConfirm" */}
            {step === "deleteConfirm" && (
                <ProfileDeleteAccountForm
                    // Callback to go back to options step
                    onBack={() => setStep("options")}
                />
            )}
        </Modal>
    );
};

export default ProfileEditModal;