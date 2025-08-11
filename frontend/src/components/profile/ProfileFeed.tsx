import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from "react-router-dom";

// hook imports
import { useFetch } from '@/hooks/useFetch';

// api imports
import { getSingleUserFeed } from '@/api/profileApi';

// component imports
import ErrorModal from '../ErrorModal';
import PostItem from '../posts/PostItem';
import WorkoutItem from '../workouts/WorkoutItem';

// types imports
import { ProfileFeedProps, Feed, Post, Workout, WorkoutSession } from '@/types/props/props-types';
import { Button } from '../ui/button';

export const ProfileFeed = ({ user, feedType }: ProfileFeedProps) => {

    // consts needed for profile feed
    const username = user?.username || '';
    const { sendRequest, isLoading, hasError, clearError } = useFetch();

    // states for feed data
    const [feed, setFeed] = useState<Feed>([])
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    // Fix for useRef - provide initial value
    const observer = useRef<IntersectionObserver | null>(null);

    const lastItemRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !isLoading) {
                loadMoreFeed();
            }
        }, {
            threshold: 0.1
        });

        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);


    const fetchFeed = async (currentOffset: number, reset = false) => {
        try {
            clearError(); // Clear any previous errors

            const data = await sendRequest({
                url: getSingleUserFeed(username || '', 20, currentOffset),
                method: 'GET'
            });

            // Extract feed items and user stats from the response
            const newItems = data.feed.length > 0 ? data.feed[0].feed_items : [];

            if (reset) {
                setFeed(newItems);
                setOffset(newItems.length);
            } else {
                setFeed(prev => [...prev, ...newItems]);
                setOffset(currentOffset + newItems.length);
            }

            // Check if we've reached the end
            setHasMore(newItems.length === 20);

        } catch (err) {
            // Error is already handled by useFetch hook
            console.error('Feed fetch error:', err);
        }
    };

    const loadMoreFeed = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchFeed(offset);
        }
    }, [offset, isLoading, hasMore, username]);

    // Initial load when component mounts or username changes
    useEffect(() => {
        setOffset(0);
        setFeed([]);
        setHasMore(true);
        clearError();
        fetchFeed(0, true);
    }, [username]);

    // Pull to refresh
    const handleRefresh = () => {
        setOffset(0);
        setFeed([]);
        setHasMore(true);
        clearError();
        fetchFeed(0, true);
    };

    // Cleanup observer on unmount
    useEffect(() => {
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, []);


    const posts: Post[] = feed.filter((item): item is Post => item.type === 'post');
    const workouts: Workout[] = feed.filter((item): item is Workout => item.type === 'workout');
    const sessions: WorkoutSession[] = feed.filter((item): item is WorkoutSession => item.type === 'session');
    const displayFeed =
        feedType === 'posts'
            ? posts
            : feedType === 'workouts'
            ? workouts
            : feedType === 'sessions'
            ? sessions
            : feed;

    return (
        <>
            <div className="flex flex-col items-center justify-center w-full">
                {/* Refresh Button */}
                <div className="mb-4 text-center">
                    <Button
                        onClick={handleRefresh}
                        disabled={isLoading && feed.length === 0}
                        className="px-4 py-2 bg-[var(--accent)] text-[var(--white)] rounded-lg hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] hover:cursor-pointer disabled:opacity-50 transition-colors"
                    >
                        {isLoading && feed.length === 0 ? 'Loading...' : 'Refresh Feed'}
                    </Button>
                </div>

                {/* Feed Items */}
                <div className="space-y-4 w-full">
                    {displayFeed.map((item, index) => {
                        const isLast = index === feed.length - 1;
                        const itemKey = item.type === 'post' ? `post-${item.post_id}` : `workout-${item.workout_id}`;

                        return (
                            <div
                                key={itemKey}
                                ref={isLast ? lastItemRef : null}
                            >
                                {item.type === 'post' ? (
                                    <PostItem
                                        user={user}
                                        post={item}
                                    />
                                ) : item.type === 'workout' ? (
                                    <WorkoutItem
                                        user={user}
                                        workout={item}
                                    />
                                ) : item.type === 'session' ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                SESSION
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-gray-800">
                                            <h3 className="font-semibold mb-2">Session Placeholder</h3>
                                            {/* Add more session rendering logic here */}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div >

                {/* Loading indicator for more items */}
                {
                    isLoading && feed.length > 0 && (
                        <div className="text-center py-6">
                            < div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            < p className="text-gray-600 mt-2">Loading more items...</p>
                        </div >
                    )
                }

                {/* Initial loading state */}
                {
                    isLoading && feed.length === 0 && (
                        <div className="text-center py-12">
                            < div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            < p className="text-gray-600 mt-2">Loading feed...</p>
                        </div >
                    )
                }

                {/* End of feed message */}
                {
                    !hasMore && feed.length > 0 && !isLoading && (
                        <div className="text-center py-6 text-gray-500">
                            < div className="border-t pt-4">
                                < p > You've reached the end of {username}'s feed!</p >
                            </div >
                        </div >
                    )
                }

                {/* Empty state */}
                {
                    !isLoading && feed.length === 0 && !hasError && (
                        <div className="text-center py-12 text-gray-500">
                            < div className="text-6xl mb-4">📝</div>
                            < p className="text-lg">No posts or workouts yet</p>
                            < p className="text-sm">Check back later for updates from {username}</p>
                        </div >
                    )
                }

                {/* Error message for subsequent loads */}
                {
                    hasError && feed.length > 0 && (
                        <div className="text-center py-4 text-red-500">
                            < p className="text-sm">Failed to load more items: {hasError}</p>
                            < button
                                onClick={() => fetchFeed(offset)
                                }
                                disabled={isLoading}
                                className="mt-2 px-4 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                                {isLoading ? 'Loading...' : 'Retry'}
                            </button >
                        </div >
                    )}

            </div>
        </>
    );
};