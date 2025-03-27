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

# BACKEND

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
