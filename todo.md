# DEPLOYMENT
- set up github actions for autodeploy
<!-- - new firebase project name for better looking url? DONE -->
- Supabase or Firebase authentication for users

# DATABASE
- Views to make:
    - getAllUserPosts - view tying posts to workouts?
    - likes/comments on posts
    - likes/comments on workouts
    <!-- - workout with exercies DONE -->






# FRONTEND
<!-- GENERAL -->
### NPM RUN BUILD AND DEPLOY TO FIREBASE

CHANGE LOGO COLOR
- Add ability to change profile pics

<!-- AUTH -->
<!-- - Sign up: -->
<!-- - check if username is available after user unfocuses and enters acceptable name DONE -->
<!-- - check if email is already in use DONE -->

- Login:
    -on entered username that is in db, grab profile pic and user info to display
    
- Error flow for sign in
<!-- - Success flow for sign in DONE -->

<!-- - Use functions for checking username/email availability DONE -->

<!-- - Left off with issue: FIXED -->
<!-- - username/email availability checks return 401 unauthorized -->

<!-- - Test login in and signup with google DONE -->
- Add indication for logging out

- Profile Feed functionality: revisit following code:
<!-- import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// hook imports
import { useFetch } from '@/hooks/useFetch';

// api imports
import { getSingleUserFeed } from '@/api/profileApi';

// component imports
import ErrorModal from '../ErrorModal';
import PostItem from '../posts/PostItem';
import WorkoutItem from '../workouts/WorkoutItem';
import SessionItem from '../sessions/SessionItem';

// types imports
import { ProfileFeedProps, Feed, Post, Workout, WorkoutSession } from '@/types/props/props-types';
import { Button } from '../ui/button';

// Constants
const PAGE_SIZE = 20;
const INTERSECTION_THRESHOLD = 0.5;

// Custom hook for infinite scroll
const useInfiniteScroll = (
  isLoading: boolean,
  hasMore: boolean,
  onLoadMore: () => void
) => {
  const observer = useRef<IntersectionObserver | null>(null);

  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: INTERSECTION_THRESHOLD }
    );

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, onLoadMore]);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return lastItemRef;
};

// Custom hook for feed data management
const useFeedData = (username: string) => {
  const { sendRequest, isLoading, hasError, clearError } = useFetch();
  const [feed, setFeed] = useState<Feed>([]);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (reset = false) => {
    try {
      clearError();
      const offset = reset ? 0 : feed.length;

      const data = await sendRequest({
        url: getSingleUserFeed(username, PAGE_SIZE, offset),
        method: 'GET'
      });

      const newItems = data.feed.length > 0 ? data.feed[0].feed_items : [];

      if (reset) {
        setFeed(newItems);
      } else {
        setFeed(prev => [...prev, ...newItems]);
      }

      setHasMore(newItems.length === PAGE_SIZE);

    } catch (err) {
      console.error('Feed fetch error:', err);
    }
  }, [username, feed.length, sendRequest, clearError]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchFeed(false);
    }
  }, [fetchFeed, isLoading, hasMore]);

  const refresh = useCallback(() => {
    setFeed([]);
    setHasMore(true);
    clearError();
    fetchFeed(true);
  }, [fetchFeed, clearError]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [username]); // Only depend on username, not refresh

  return {
    feed,
    isLoading,
    hasError,
    hasMore,
    loadMore,
    refresh,
    clearError
  };
};

export const ProfileFeed = ({ user, feedType }: ProfileFeedProps) => {
  const username = user?.username || '';
  
  const {
    feed,
    isLoading,
    hasError,
    hasMore,
    loadMore,
    refresh,
    clearError
  } = useFeedData(username);

  const lastItemRef = useInfiniteScroll(isLoading, hasMore, loadMore);

  // Memoized filtered feed to avoid recalculation on every render
  const displayFeed = useMemo(() => {
    switch (feedType) {
      case 'posts':
        return feed.filter((item): item is Post => item.type === 'post');
      case 'workouts':
        return feed.filter((item): item is Workout => item.type === 'workout');
      case 'sessions':
        return feed.filter((item): item is WorkoutSession => item.type === 'session');
      default:
        return feed;
    }
  }, [feed, feedType]);

  const getItemKey = (item: Post | Workout | WorkoutSession) => {
    switch (item.type) {
      case 'post':
        return `post-${(item as Post).post_id}`;
      case 'workout':
        return `workout-${(item as Workout).workout_id}`;
      case 'session':
        return `session-${(item as WorkoutSession).session_id}`;
      default:
        return `${item.type}-${Date.now()}`;
    }
  };

  const renderFeedItem = (item: Post | Workout | WorkoutSession) => {
    switch (item.type) {
      case 'post':
        return <PostItem user={user} post={item as Post} />;
      case 'workout':
        return <WorkoutItem user={user} workout={item as Workout} />;
      case 'session':
        return <SessionItem user={user} session={item as WorkoutSession} />;
      default:
        return null;
    }
  };

  const LoadingSpinner = () => (
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  );

  const EmptyState = () => (
    <div className="text-center py-12 text-gray-500">
      <div className="text-6xl mb-4">📝</div>
      <p className="text-lg">No {feedType === 'all' ? 'posts or workouts' : feedType} yet</p>
      <p className="text-sm">Check back later for updates from {username}</p>
    </div>
  );

  const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
    <div className="text-center py-4 text-red-500">
      <p className="text-sm">Failed to load content: {hasError}</p>
      <button
        onClick={onRetry}
        disabled={isLoading}
        className="mt-2 px-4 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Loading...' : 'Retry'}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Refresh Button */}
      <div className="mb-4 text-center">
        <Button
          onClick={refresh}
          disabled={isLoading && feed.length === 0}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--white)] rounded-lg hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] hover:cursor-pointer disabled:opacity-50 transition-colors"
        >
          {isLoading && feed.length === 0 ? 'Loading...' : 'Refresh Feed'}
        </Button>
      </div>

      {/* Feed Items */}
      {displayFeed.length > 0 && (
        <div className="space-y-4 w-full">
          {displayFeed.map((item, index) => {
            const isLast = index === displayFeed.length - 1;
            const itemKey = getItemKey(item);

            return (
              <div
                key={itemKey}
                ref={isLast ? lastItemRef : null}
              >
                {renderFeedItem(item)}
              </div>
            );
          })}
        </div>
      )}

      {/* Loading States */}
      {isLoading && feed.length > 0 && (
        <div className="text-center py-6">
          <LoadingSpinner />
          <p className="text-gray-600 mt-2">Loading more items...</p>
        </div>
      )}

      {isLoading && feed.length === 0 && (
        <div className="text-center py-12">
          <LoadingSpinner />
          <p className="text-gray-600 mt-2">Loading feed...</p>
        </div>
      )}

      {/* End of feed message */}
      {!hasMore && feed.length > 0 && !isLoading && (
        <div className="text-center py-6 text-gray-500">
          <div className="border-t pt-4">
            <p>You've reached the end of {username}'s {feedType === 'all' ? '' : feedType} feed!</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && feed.length === 0 && !hasError && <EmptyState />}

      {/* Error states */}
      {hasError && feed.length === 0 && (
        <ErrorState onRetry={refresh} />
      )}
      
      {hasError && feed.length > 0 && (
        <ErrorState onRetry={() => loadMore()} />
      )}
    </div>
  );
}; -->


# BACKEND

### MAKE SURE PROMOTE/DEMOTE MODERATOR AND ADMIN FUNCTIONS ARE WORKING PROPERLY WITH USER IDS AND MEMBER IDS!!!!

<!-- GENERAL -->
### ANYTIME YOU CHANGE FUNCTIONS — DEPLOY TO FIREBASE
- When deleting workout or group, make sure to delete the link in workout_exercises and group_members tables
     <!-- - Deleting workout deletes link to workout_exercise DONE -->

<!-- TESTING -->
- POSTMAN:
    - Post Routes:
        - Edit Post: check that adding an image and workout to a post that didn't have either before works

<!-- USER -->
    - Add profile picture option (includes route/controller to update it) and figure out where to store images
    - Update Password: Make user type in current password and add checks for that first
    - On deleting account, do I delete all workouts/posts? Or make the user_id null and have it show up as "DELETED USER"?

<!-- POST -->
<!-- - Update getSinglePost to pull all likes and comments on that post DONE -->
    - Update getAllUserPosts
<!-- - to check that user is in db before querying for posts DONE -->
        - to pull like and comment counts

<!-- WORKOUTS/EXERCISES -->
    - Verify that edit workout is functioning properly
    - Update getAllUserWorkouts
<!-- - to check that user is in db before querying for workouts DONE -->
        - to pull like and comment counts

<!-- NOTIFICATIONS -->
    - Verify that changeNotificationReadStatus works once frontend is built
<!-- - update different types of notifications? DONE -->

<!-- FRIEND REQUESTS -->
<!-- - TEST ALL ROUTES AND ENSURE THEY WORK PROPERLY DONE -->
<!-- - ALSO TEST getUserFriends in userControllers DONE -->

<!-- GROUPS -->
    - TEST ALL ROUTES
    - Check if I need duplicate routes as some are accessible without authenticating
<!-- - Make it where group names are unique? DONE -->
    - Revisit getAllGroups and its search capabilites
<!-- - delete join requests after denied request or left group? DONE -->
<!-- - ability to remove admin status? DONE -->
<!-- - add remove request to join DONE -->

TESTING
- Group tests: Test manage moderators routes
- Post tests: getAllUsers, getSingle
- Friend tests: getAllFriends, getAllSent/ReceivedRequsts
- Workout tests: getWorkoutsByUser, getSingleWorkout, 





# WISHLIST / NICE TO HAVES
- Ability to tag other user workouts in a post