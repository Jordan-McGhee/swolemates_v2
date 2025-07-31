# Work Tracker

## Fri Jul 18
- Working more on authentication flow
    <!-- - updating backend for when users sign in with gmail to slugify their username to prevent duplicate entries DONE -->
    <!-- - Adding user's avatar and username to sidebar on successful login DONE -->
    <!-- - Updating auth flow to use postgres user instead of firebase user DONE -->
    <!-- - Adding user's avatar to mobile menu DONE -->

## Mon Jul 21
<!-- - Need to have login/sign up for mobile working DONE -->
<!-- - Adding modal/ability to login/signup on mobile DONE -->
<!-- - Added Ref for quicker verification of user state on refresh DONE -->

<!-- - Start on Profile Page DONE -->
<!-- - Adding Profile API to quickly query backend DONE -->
<!-- - Added util function to quickly search if user is a friend or owner of current profile DONE -->
<!-- - Added placeholder for errorModal on frontend DONE -->
<!-- - Working on adding privacy to user's page, posts, and workouts DONE -->

## Tue Jul 22
To do:
- Question for tomorrow: does it make sense to have a user state in my main profile page and pass that to any components in my profile page or manage the state in each component separately? Best to have user state in main and pass down to components, then query for additional info in them if necessary
<!-- - Work on error modal DONE -->
<!-- - Finish adding privacy in public routes and push to firebase cloud functions DONE -->

Working On:
<!-- - Changed public routes to work with username rather than user_id DONE -->
<!-- - Changed group routes to work with group name instead of group_id DONE -->
<!-- - Added helper function for group name availability on backend DONE -->

## Wed Jul 23
To do:
<!-- - Add views for profile page? DONE -->
<!-- - Figure out rendering error with ProfileHeader - initial render works as expect, on page reload, it's like auth user disappears? DONE -->
<!-- - Add limits to length of username and bio DONE -->
- Figure out why tailwind variables aren't working all the time?
- Update get single user query to pull amount of friends, workouts, posts by user

Working On:
<!-- - Adding edit profile modal to profile header DONE -->
<!-- - Added editmodal form DONE -->
<!-- - Added firebase user to context for sitewide access to token DONE -->
<!-- - Adding menu and views (Feed, Posts, Workouts, Friends, Groups) DONE -->

## Fri July 25
<!-- - test edit and delete profile functionality (edit profile removes profile pic for some reason. Delete deletes from firebase, but not from supabase) DONE -->

## Wed July 30
To do:
- Users can still access private profile despite backend supposed to block it. FIX THIS!!!!
- Sometimes firebase throws error saying the user needs a recent login? FIX THIS!!!!
    - Deleting account doesn't work because of this


Working On:
- Adding create post component that allows user to attach workouts and images
    - Placeholder for now, will add workout and image functionality after users can create a workout
<!-- - Updating post routes to pull id from auth header rather than the req and using the token to then authenticate the user and pull their id from my db DONE -->
<!-- - Updated postApi DONE -->
<!-- - Adding toasts to provide users feedback on successful submits DONE -->

## Thu July 31
To do:
<!-- - Add view to tie user info together in profile view (number of workouts, posts, friends) DONE -->
<!-- - View for user posts/workouts in order with ability to remove either for different views on frontend DONE -->

Working On:
<!-- - querying for user's feed of posts and workouts DONE -->
<!-- - adding feed query to profile feed component and making it work as profile post and profile workout component instead of having 3 separate ones DONE -->
<!-- - updating profile query to query for post/workout/friend counts DONE -->
- Adding loading page for profile
- Adding workout and post items to view feed
