import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

// component imports
import AddWorkoutButton from "../AddWorkoutButton";

// ui imports
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Loader2, Image as ImageIcon, User as UserIcon, ArrowLeft, ThumbsUp, MessageCircle } from "lucide-react";
// import { toast } from "sonner";

// type imports
import { EditPostFormProps, Post, Workout } from "@/types/props/props-types";

// hook imports
import { useAuth } from "@/context/AuthProvider";
// import { postApi } from "@/api/postApi";


const EditPostForm: React.FC<EditPostFormProps> = ({
    post,
    selectedWorkout,
    onSubmit,
    onCancel,
    isUpdating
}) => {
    // hook destructuring
    const { user: authUser } = useAuth();

    // form state
    const [formData, setFormData] = useState({
        content: post.content,
        selectedWorkout: selectedWorkout as Workout | null,
        selectedImage: null as File | null,
        removeImage: false,
    });

    const [hasError, setHasError] = useState<string | null>(null);

    // Initialize form data when post changes
    // useEffect(() => {
    //     if (post && initialValues) {
    //         setFormData({
    //             content: initialValues.content,
    //             selectedWorkout: selectedWorkout || null,
    //             selectedImage: null,
    //             removeImage: false,
    //         });
    //     }
    // }, [post, initialValues]);

    // Check if form has changes
    const hasChanges = useMemo(() => {
        const contentChanged = formData.content !== post.content;
        const workoutChanged = formData.selectedWorkout?.workout_id !== post.workout_id;
        const imageChanged = formData.selectedImage !== null || formData.removeImage;

        return contentChanged || workoutChanged || imageChanged;
    }, [formData, post]);

    // Check if form is valid
    const isFormValid = useMemo(() => {
        return formData.content.length > 0 &&
            formData.content.length <= 1000 &&
            !hasError &&
            hasChanges;
    }, [formData.content, hasError, hasChanges]);

    // Handle text input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, files } = e.target as HTMLInputElement;

        if (name === "selectedImage" && files && files[0]) {
            // Validate image file
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                setHasError("Please select a valid image file");
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setHasError("Image size must be less than 5MB");
                return;
            }

            setFormData(prev => ({
                ...prev,
                selectedImage: file,
                removeImage: false,
            }));
            setHasError(null);
        } else {
            if (name === "content") {
                if (value.length > 1000) {
                    setHasError("Post cannot be longer than 1,000 characters!");
                } else {
                    setHasError(null);
                }
            }
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // Handle workout selection
    const handleWorkoutSelect = (workout: Workout | null) => {
        setFormData((prev) => ({
            ...prev,
            selectedWorkout: workout,
        }));
    };

    // Handle image removal
    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            selectedImage: null,
            removeImage: true,
        }));
    };

    // Handle removing new selected image
    const handleRemoveNewImage = () => {
        setFormData(prev => ({
            ...prev,
            selectedImage: null,
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        await onSubmit(formData);
    };

    // Handle cancel
    const handleCancel = () => {
        onCancel(hasChanges);
    };

    // console.log("EditPostForm render:", { formData, hasChanges, isFormValid, hasError });

    return (
        <div className="bg-white rounded-lg shadow p-4 text-left">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleCancel}
                        className="p-2 hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] rounded-lg"
                        disabled={isUpdating}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <p className="text-2xl font-bold text-[var(--accent)]">Edit Post</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Add Workout Button */}
                    <AddWorkoutButton
                        onWorkoutSelect={handleWorkoutSelect}
                        passedWorkout={selectedWorkout}
                        buttonClassName="w-full mt-4 sm:mt-0 sm:w-fit flex items-center justify-center"
                        propsClassName="truncate max-w-[12rem]"
                    />

                    {/* Add/Change Photo Button */}
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            name="selectedImage"
                            accept="image/*"
                            onChange={handleChange}
                            className="hidden"
                            disabled={isUpdating}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            className="rounded-lg flex items-center gap-1 hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] transition-colors"
                            onClick={(e) => {
                                e.preventDefault();
                                if (!isUpdating) {
                                    e.currentTarget.parentElement?.querySelector('input')?.click();
                                }
                            }}
                            disabled={isUpdating}
                        >
                            <ImageIcon className="h-5 w-5" />
                            <span className="text-sm hidden md:block">
                                {formData.selectedImage || post.image_url ? 'Change Photo' : 'Add Photo'}
                            </span>
                        </Button>
                    </label>
                </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col">
                {/* Content Textarea */}
                <textarea
                    rows={4}
                    placeholder="What's on your mind?"
                    className="resize-none w-full border border-[var(--accent-hover)] rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] transition-colors"
                    onChange={handleChange}
                    name="content"
                    value={formData.content}
                    disabled={isUpdating}
                />

                {/* Character Count and Error */}
                <div className="flex items-center justify-between mt-2">
                    {hasError && (
                        <p className="text-[var(--danger)] text-xs italic">{hasError}</p>
                    )}
                    <p
                        className={`ml-auto text-xs ${formData.content.length > 1000
                            ? "text-[var(--danger)]"
                            : "text-[var(--subhead-text)]"
                            }`}
                    >
                        {formData.content.length}/1000 characters
                    </p>
                </div>

                {/* Current Image (if exists and not removed) */}
                {/* {post.image_url && !formData.removeImage && !formData.selectedImage && (
                    <div className="mt-4 relative inline-block">
                        <img
                            src={post.image_url}
                            alt="Current post image"
                            className="max-h-48 rounded-lg border border-gray-200"
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2"
                            disabled={isUpdating}
                        >
                            Remove Image
                        </Button>
                    </div>
                )} */}

                {/* New Selected Image */}
                {/* {formData.selectedImage && (
                    <div className="mt-4 relative inline-block">
                        <img
                            src={URL.createObjectURL(formData.selectedImage)}
                            alt="New post image"
                            className="max-h-48 rounded-lg border border-gray-200"
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveNewImage}
                            className="absolute top-2 right-2"
                            disabled={isUpdating}
                        >
                            Remove New Image
                        </Button>
                    </div>
                )} */}

                {/* Selected Workout Display */}
                {/* {selectedWorkout && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Dumbbell className="h-4 w-4 text-[var(--accent)]" />
                                <span className="text-sm font-medium">
                                    {selectedWorkout?.workout_title || `Workout #${selectedWorkout?.workout_id}`}
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleWorkoutSelect(null)}
                                className="text-xs hover:bg-white"
                                disabled={isUpdating}
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                )} */}

                {/* workout info div */}

                {formData.selectedWorkout && (
                    <>
                        <p className="font-semibold text-lg">Featured Workout</p>

                        <div className="mt-2 p-4 rounded-lg border border-[var(--accent-hover)]">
                            {/* workout info */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between">
                                    <Badge className="mb-2">
                                        {formData.selectedWorkout.workout_type.toUpperCase()}
                                    </Badge>

                                    {/* like/comment count */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-[var(--subhead-text)]">
                                            <ThumbsUp className="h-4 w-4" />
                                            <span>{formData.selectedWorkout.likes?.length}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[var(--subhead-text)]">
                                            <MessageCircle className="h-4 w-4" />
                                            <span>{formData.selectedWorkout.comments?.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    to={`/workouts/${formData.selectedWorkout.workout_id}`}
                                    className="font-bold text-xl text-[var(--accent)] hover:underline hover:cursor-pointer"
                                >
                                    {formData.selectedWorkout.workout_title}
                                </Link>
                                {formData.selectedWorkout.workout_description && (
                                    <p className="text-[var(--subhead-text)] mt-1">{formData.selectedWorkout.workout_description}</p>
                                )}
                            </div>

                            {/* exercises */}
                            {formData.selectedWorkout.exercises && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-sm text-[var(--accent)]">
                                        View Exercises ({formData.selectedWorkout.exercises.length})
                                    </summary>
                                    <ul className="mt-2 space-y-1">
                                        {formData.selectedWorkout.exercises.map((exercise, idx) => {
                                            const type = exercise.exercise_type?.toLowerCase();
                                            let value;
                                            if (["strength", "plyometric", "other"].includes(type)) {
                                                value = `${exercise.sets} x ${exercise.reps}`;
                                            } else if (["cardio", "flexibility", "stretch", "balance"].includes(type)) {
                                                const minutes = exercise.duration_seconds ? Math.round(exercise.duration_seconds / 60) : 0;
                                                value = `${minutes} minutes`;
                                            } else {
                                                value = `${exercise.distance_miles} miles`;
                                            }
                                            return (
                                                <li key={idx} className="grid grid-cols-[1fr_auto] items-center gap-2 py-1 text-[var(--subhead-text)] text-sm md:text-lg">
                                                    <span className="font-semibold text-[var(--accent)]">· {exercise.title}</span>
                                                    <span className="justify-self-end px-2 rounded">{value}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </details>
                            )}
                        </div>
                    </>
                )}

                {/* Unsaved Changes Indicator */}
                {hasChanges && !isUpdating && (
                    <div className="mt-4 flex items-center justify-center">
                        <p className="text-xs text-[var(--subhead-text)] italic">
                            You have unsaved changes!
                        </p>
                    </div>
                )}


                {/* Action Buttons Section */}
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                    {/* User Avatar */}
                    {/* <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                            {authUser?.profile_pic ? (
                                <AvatarImage src={authUser.profile_pic} alt={authUser.username} />
                            ) : (
                                <AvatarFallback>
                                    <UserIcon className="h-5 w-5" />
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <span className="text-sm font-medium">{authUser?.username}</span>
                    </div> */}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">


                        {/* Cancel Button */}
                        <Button
                            type="button"
                            variant="destructiveOutline"
                            onClick={handleCancel}
                            disabled={isUpdating}
                            className="font-semibold"
                        >
                            Cancel
                        </Button>

                        {/* Update Button */}
                        <Button
                            type="submit"
                            className="bg-[var(--accent)] text-white font-semibold text-base py-2 px-4 rounded-lg hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!isFormValid || isUpdating}
                        >
                            {isUpdating && (
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            )}
                            Update Post
                        </Button>
                    </div>
                </div>


                {/* Updating Indicator */}
                {isUpdating && (
                    <div className="mt-4 flex items-center justify-center">
                        <p className="text-xs text-[var(--accent)] italic flex items-center gap-2">
                            <Loader2 className="animate-spin h-3 w-3" />
                            Updating post...
                        </p>
                    </div>
                )}
            </form>
        </div>
    );
};

export default EditPostForm;