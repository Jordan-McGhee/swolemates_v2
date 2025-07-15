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

<!-- AUTH -->
- Sign up:
    - check if username is available after user unfocuses and enters acceptable name
    - check if email is already in use
- Login:
    -on entered username that is in db, grab profile pic and user info to display



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