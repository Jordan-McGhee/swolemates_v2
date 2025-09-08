import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// component imports
import EditPostForm from '@/components/posts/EditPost/EditPostForm';

// ui imports
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// type imports
import { Post, Workout } from '@/types/props/props-types';

// hook imports
import { useAuth } from '@/context/AuthProvider';
import { postApi } from '@/api/postApi';

// util imports
import { formatDate } from '@/util/general-util';

const EditPostPage: React.FC = () => {
    // hook destructuring
    const { user: authUser, token } = useAuth();
    const { getSinglePost, editPost } = postApi();
    const navigate = useNavigate();

    // post id from url params
    const { post_id } = useParams<{ post_id?: string }>();

    // states
    const [post, setPost] = useState<Post | null>(null);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // Store initial values for comparison
    const [initialValues, setInitialValues] = useState({
        content: '',
        workout_id: null as number | null,
        image_url: null as string | null,
    });

    // Initialize initial values when post is fetched
    useEffect(() => {
        if (post) {
            const initialData = {
                content: post.content || '',
                workout_id: post.workout_id || null,
                image_url: post.image_url || null,
            };
            setInitialValues(initialData);
            console.log("Initial values set:", initialData);
        }
    }, [post]);

    // Fetch post data
    useEffect(() => {
        const fetchPost = async () => {
            if (!post_id) {
                toast.error("Invalid post ID");
                navigate('/');
                return;
            }

            if (!authUser || !token) {
                return
            }

            try {
                setIsLoading(true);

                console.log("Fetching post with ID:", post_id);
                const response = await getSinglePost(Number(post_id));

                // Check if user is authorized to edit
                if (response.post.user_id !== authUser?.user_id) {
                    toast.error("You are not authorized to edit this post");
                    navigate(`/posts/${post_id}`);
                    return;
                }

                setPost(response.post);
                setSelectedWorkout(response.workout || null);
            } catch (error: any) {
                console.error("Failed to fetch post:", error);
                toast.error(error.message || "Failed to fetch post");
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [post_id]);

    // Handle form submission
    const handleSubmit = async (formData: any) => {
        if (!post_id) return;

        try {
            setIsUpdating(true);

            // Build update payload with only changed fields
            const updateData: any = {};

            if (formData.content !== initialValues.content) {
                updateData.content = formData.content;
            }

            if (formData.selectedWorkout !== initialValues.workout_id) {
                updateData.workout_id = formData.selectedWorkout.workout_id;
            }

            // if (formData.selectedImage) {
            //     // Handle new image upload - in production, upload to storage service
            //     updateData.image_url = URL.createObjectURL(formData.selectedImage);
            else if (formData.removeImage && initialValues.image_url) {
                // Handle image removal
                updateData.image_url = null;
            }

            await editPost(Number(post_id), updateData);

            toast.success(
                <>
                    Post updated successfully.{" "}
                    {/* <a
                        href={`/posts/${post_id}`}
                        className="text-[var(--accent)] italic ml-1"
                        rel="noopener noreferrer"
                    >
                        View post
                    </a> */}
                </>
            );

            // Navigate back to post
            navigate(`/posts/${post_id}`);
        } catch (error: any) {
            console.error("Error updating post:", error);
            toast.error(error.message || "Failed to update post");
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle cancel
    const handleCancel = (hasChanges: boolean) => {
        if (hasChanges) {
            const confirmCancel = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
            if (!confirmCancel) return;
        }
        navigate(`/posts/${post_id}`);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-[var(--accent)]" />
            </div>
        );
    }

    // Not found state
    if (!post) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Post not found</p>
                    <Button
                        onClick={() => navigate('/')}
                        className="bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                    >
                        Go back home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-4 w-full min-h-screen">
            {/* Left side - Edit Form */}
            <div className="w-full lg:w-[65%] flex flex-col gap-4 overflow-y-auto h-full">
                <EditPostForm
                    post={post}
                    selectedWorkout={selectedWorkout}
                    // initialValues={initialValues}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isUpdating={isUpdating}
                />
            </div>

            {/* Right side - Post Preview or Info */}
            <div className="w-[35%] hidden lg:block overflow-y-auto h-full">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-xl font-semibold text-[var(--accent)] mb-4">Post Information</p>

                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-[var(--subhead-text)] text-lg">Original Author</p>
                            <p className='text-[var(--accent)] font-semibold'>{post.username || authUser?.username}</p>
                        </div>

                        {post.created_at && (
                            <div>
                                <p className="text-[var(--subhead-text)] text-lg">Created</p>
                                <p className='text-[var(--accent)] font-semibold'>{formatDate(post.created_at, "shortTime")}</p>
                            </div>
                        )}

                        {post.updated_at && post.updated_at !== post.created_at && (
                            <div>
                                <p className="text-[var(--subhead-text)] text-lg">Last Updated</p>
                                <p className='text-[var(--accent)] font-semibold'>{formatDate(post.updated_at, "shortTime")}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-[var(--subhead-text)] text-lg">Engagement</p>
                            <p className='text-[var(--accent)] font-semibold'>{post.likes?.length || 0} likes • {post.comments?.length || 0} comments</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditPostPage;