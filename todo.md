# DEPLOYMENT
- set up github actions for autodeploy
<!-- - new firebase project name for better looking url? DONE -->
- Supabase or Firebase authentication for users

# FRONTEND
<!-- GENERAL -->
### NPM RUN BUILD AND DEPLOY TO FIREBASE

# BACKEND

<!-- GENERAL -->
### ANYTIME YOU CHANGE FUNCTIONS — DEPLOY TO FIREBASE
- When deleting workout or group, make sure to delete the link in workout_exercises and group_members tables

<!-- TESTING -->
- POSTMAN:
    - Post Routes:
        - Edit Post: check that adding an image and workout to a post that didn't have either before works

<!-- USER -->
    - Add profile picture option (includes route/controller to update it) and figure out where to store images
    - Update Password: Make user type in current password and add checks for that first

<!-- POST -->
    - Update getSinglePost to pull all likes and comments on that post DONE
    -