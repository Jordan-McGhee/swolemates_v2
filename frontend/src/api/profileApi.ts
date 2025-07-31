// api/profileApi.ts

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

// Single user URL
export const getSingleUserURL = (username: string) => `${BACKEND_URL}/public/user/${username}`;

// User's feed URL
export const getSingleUserFeed = (username: string, limit: number, offset: number) => `${BACKEND_URL}/public/user/${username}/feed?limit=${limit}&offset=${offset}`;

// User's friends URL
export const getUserFriendsURL = (username: string) => `${BACKEND_URL}/public/user/${username}/friends`;

// User's posts URL
export const getUserPostsURL = (username: string) => `${BACKEND_URL}/public/post/user/${username}`;

// User's workouts URL
export const getUserWorkoutsURL = (username: string) => `${BACKEND_URL}/public/workout/user/${username}`;

// User's groups URL
export const getUserGroupsURL = (username: string) => `${BACKEND_URL}/public/user/${username}/groups`;