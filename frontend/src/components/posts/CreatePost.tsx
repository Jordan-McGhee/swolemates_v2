import React, { useState } from "react";

// hook imports
import { useAuth } from "@/context/AuthProvider";
import { useFetch } from "@/hooks/useFetch";
import { postApi } from "@/api/postApi";

// ui imports
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dumbbell, Loader2, Image as ImageIcon, User as UserIcon } from "lucide-react";

// types imports
import { CreatePostProps, Workout } from "@/types/props/props-types";
import { toast } from "sonner";

const CreatePost: React.FC<CreatePostProps> = ({ workouts }) => {

    // hook destructuring
    const { token, user } = useAuth();
    const { sendRequest, isLoading, hasError, clearError } = useFetch();
    const { createPost, isLoadingPost } = postApi();

    // state for form data
    const [formData, setFormData] = useState<{
        content: string;
        selectedWorkout: Workout | null;
        selectedImage: File | null;
    }>({
        content: "",
        selectedWorkout: null,
        selectedImage: null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, files } = e.target as HTMLInputElement;
        if (name === "selectedImage" && files && files[0]) {
            setFormData((prev) => ({
                ...prev,
                selectedImage: files[0],
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const postData = {
                user_id: user?.user_id || 0,
                content: formData.content,
                image_url: formData.selectedImage ? URL.createObjectURL(formData.selectedImage) : undefined,
                workout_id: formData.selectedWorkout ? formData.selectedWorkout.workout_id : undefined,
            };

            console.log("Creating post with data:", postData);
            console.log("token:", token);

            createPost(postData)
                .then((response) => {
                    console.log("Post created successfully:", response);
                    setFormData({
                        content: "",
                        selectedWorkout: null,
                        selectedImage: null,
                    });

                    const new_post_id = response?.post.post_id || response?.id;
                    console.log("New post ID:", new_post_id);

                    toast.success(
                        <>
                            Post created successfully.{" "}
                            <a
                                href={`/user/${user?.username}`}
                                className="text-[var(-accent)] italic ml-1"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View post
                            </a>
                        </>
                    );
                })
                .catch((error) => {
                    console.error("Error creating post:", error);
                });

        } catch (error) {

        }
    };

    const isFormValid = formData.content.length > 0 && formData.content.length <= 1000

    return (
        <>
            {
                user && (

                    <form onSubmit={handleSubmit} className="w-full bg-white rounded-lg shadow p-4 flex flex-col">
                        <textarea
                            rows={2}
                            placeholder={`What's on your mind, ${user.username.split(" ")[0]}?`}
                            className="resize-none w-full border border-[var(--accent-hover)] rounded-lg p-2"
                            onChange={handleChange}
                            name="content"
                            value={formData.content}
                        />

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                                <Avatar className="size-8 object-cover rounded-lg">
                                    {user.profile_pic ? (
                                        <AvatarImage src={user.profile_pic} alt={user.username} />
                                    ) : (
                                        <AvatarFallback>
                                            <UserIcon className="h-5 w-5" />
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="rounded-lg flex items-center gap-1 hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] hover:cursor-pointer"
                                    tabIndex={-1}
                                >
                                    <Dumbbell className="h-5 w-5" />
                                    <span className="text-sm hidden md:block">Add Workout</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="rounded-lg flex items-center gap-1 hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] hover:cursor-pointer"
                                    tabIndex={-1}
                                >
                                    <ImageIcon className="h-5 w-5" />
                                    <span className="text-sm hidden md:block">Add Photo</span>
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[var(--accent)] text-white font-semibold text-base py-2 px-4 rounded-lg hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] hover:cursor-pointer transition-colors"
                                    disabled={!isFormValid}
                                >
                                    {isLoading && (
                                        <Loader2 className="animate-spin h-4 w-4" />
                                    )}
                                    Post
                                </Button>
                            </div>
                        </div>
                    </form>
                )
            }
        </>
    );
};

export default CreatePost;