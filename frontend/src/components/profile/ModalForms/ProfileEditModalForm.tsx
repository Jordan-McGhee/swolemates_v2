import React, { use, useState } from 'react';

// icon/asset imports
import { Loader2 } from 'lucide-react';

// hooks
import { useAuth } from '@/context/AuthProvider';

// ui imports
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

// components
import AuthInput from "../../auth/AuthInput";

// validation utils
import { validateUsername, validateBio } from '@/util/input-validators';

// type imports
import { ProfileEditFormProps } from '@/types/props/props-types';

const ProfileEditModalForm = ({ onBack }: ProfileEditFormProps) => {

    // pull auth functions from context
    const {
        user,
        // firebaseUser,
        checkUsernameAvailability,
        handleUpdateUserProfile,
        isAuthLoading,
        hasError,
        clearError
    } = useAuth();

    // state for form data
    const [formData, setFormData] = useState({
        username: `${user?.username || ''}`,
        bio: `${user?.bio || ''}`,
        is_private: user?.is_private || false
    });

    // other states
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [usernameCheck, setUsernameCheck] = useState<{
        isLoading: boolean;
        isAvailable: boolean | null;
    }>({
        isLoading: false,
        isAvailable: null,
    });

    // handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        if (hasError) clearError();
    };

    const handleUsernameBlur = async () => {
        const error = validateUsername(formData.username);
        if (error) {
            setErrors((prev) => ({ ...prev, username: error }));
            setUsernameCheck({ isLoading: false, isAvailable: null });
            return;
        }

        setUsernameCheck({ isLoading: true, isAvailable: null });
        const available = await checkUsernameAvailability(formData.username);

        console.log("Checking username availability:", formData.username);
        console.log("Username availability:", available);
        setUsernameCheck({ isLoading: false, isAvailable: available });

        if (!available) {
            setErrors((prev) => ({
                ...prev,
                username: "Username is already taken.",
            }));
        }
    };

    const handleBioBlur = () => {
        const error = validateBio(formData.bio);
        setErrors((prev) => ({ ...prev, bio: error || "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        newErrors.username = validateUsername(formData.username) || "";
        newErrors.bio = validateBio(formData.bio) || "";
        if (usernameCheck.isAvailable === false) {
            newErrors.username = "Username is already taken.";
        }

        setErrors(newErrors);
        const hasAnyError = Object.values(newErrors).some((e) => e);
        if (hasAnyError) return;

        try {

            // Log the form data for debugging
            console.log(`Updating ${user?.username}'s account!`, formData);

            await handleUpdateUserProfile(formData);

            // // close modal on success
            // onAuthSuccess?.();
        } catch (err) {
            // Handle error if needed
        }
    };

    const isFormValid = formData.username.trim() && !errors.username && !errors.bio

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">

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
            
            <div className='flex flex-col items-center mb-4'>
                <Avatar className="w-16 h-16 mb-2">
                    <AvatarImage src={user?.profile_pic || ""} alt={user?.username || "profile"} />
                    <AvatarFallback className="bg-gray-300 w-full h-full rounded-full" />
                </Avatar>
                <p className='text-xl font-semibold text-[var(--accent)]'>Update Profile</p>
            </div>

            {/* Username Input */}
            <AuthInput
                name="username"
                label="Username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleUsernameBlur}
                validate={(value) => {
                    const error = validateUsername(value);
                    setErrors((prev) => ({ ...prev, username: error || "" }));
                    // Reset check when typing
                    setUsernameCheck({ isLoading: false, isAvailable: null });
                    return error;
                }}
                error={errors.username}
                isLoading={usernameCheck.isLoading}
                isAvailable={usernameCheck.isAvailable}
            />

            {/* Bio Input */}
            <AuthInput
                name="bio"
                label="Bio"
                type="textarea"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleChange}
                onBlur={handleBioBlur}
                validate={(value) => {
                    const error = validateBio(value);
                    setErrors((prev) => ({ ...prev, bio: error || "" }));
                    return error;
                }}
                error={errors.bio}
            />

            {/* Privacy Setting */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="profile-privacy-switch">Profile Privacy</Label>
                <div className="flex items-center gap-3">
                    <span>Public</span>
                    <Switch
                        id="profile-privacy-switch"
                        checked={formData.is_private}
                        onCheckedChange={(checked: boolean) =>
                            setFormData((prev) => ({
                                ...prev,
                                is_private: checked,
                            }))
                        }
                    />
                    <span>Private</span>
                </div>
            </div>

            {/* Submit Button */}
            <Button
                variant="outline"
                disabled={isAuthLoading || !isFormValid}
                className="w-full bg-[var(--accent)] text-[var(--white)] hover:bg-[var(--white)] hover:text-[var(--accent)] hover:cursor-pointer"
                type="submit"
            >
                {isAuthLoading && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Update Profile
            </Button>

        </form>
    )
}

export default ProfileEditModalForm;