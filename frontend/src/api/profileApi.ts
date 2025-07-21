// api/profileApi.ts

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

// Single user URL
export const getSingleUserURL = (userId: string) => `${BACKEND_URL}/public/user/${userId}`;

// User's friends URL
export const getUserFriendsURL = (userId: string) => `${BACKEND_URL}/public/user/${userId}/friends`;

// User's posts URL
export const getUserPostsURL = (userId: string) => `${BACKEND_URL}/public/post/user/${userId}`;

// User's workouts URL
export const getUserWorkoutsURL = (userId: string) => `${BACKEND_URL}/public/workout/user/${userId}`;

// User's groups URL
export const getUserGroupsURL = (userId: string) => `${BACKEND_URL}/public/user/${userId}/groups`;