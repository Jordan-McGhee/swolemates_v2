# Work Tracker

# BUGS TO COME BACK TO
- Add component for inaccessible routes
- Fix drawer opening twice on like click on mobile
- Fix nav menu on profile - on desktop, it is slightly cut off and doesn't scroll
- Adding loading page for profile
- Banner for exercises isn't displayed properly with negative margins
- Tailwind bug causing issues displaying styles?

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


## Fri Aug 1
To do:

Working On:
<!-- - Adding comment form component for posts/workouts in feed DONE -->
<!-- - Added error handling to create post DONE -->
<!-- - Changed view to add more info about post/workout user for auth and edit/delete checks DONE -->

## Mon Aug 4
To do:
- Comment/Liking Posts:
    <!-- - Sync front and backend up to accept comments on posts DONE -->
    <!-- - verify backend route is protected DONE -->
    <!-- - add to comment api on frontend DONE -->
    <!-- - sync to accept likes/unlikes on post DONE -->
    <!-- - have like count update without refreshing whole page DONE -->
    <!-- - CORS Error on liking post in PostItem.tsx DONE -->
    <!-- - Change like icon to be filled in if auth user has liked a post DONE -->
    <!-- - (add catch for if unauth user tries to like or comment) DONE -->

Working On:
<!-- - Updating postApi functions to work with what backend expects. No need to pass user_id in body if I pass token to back in DONE -->
<!-- - Adding auth checks to interact with posts DONE -->

## Thu Aug 7
To do:
<!-- - change buttons for liking/commenting DONE -->
<!-- - Add new tables to track completed workouts DONE -->
<!-- - update enums as well ^ DONE -->

Working On:
- Create Workout Form:
    - What I need:
        - List of workouts created by user
        - ability to look exercises up by name and add them
<!-- - Update backend routes/controllers for new sessions table DONE -->

## Fri Aug 8
Working On:
<!-- - Adding exercise inputs to createWorkoutForm DONE -->
<!-- - Adding create workout submission DONE -->
<!-- - Updating workoutApi functions DONE -->

## Mon Aug 11
To do:
<!-- - Adding workout and post items to view feed DONE -->
<!-- - Add hover card to workout for desktop version DONE -->
<!-- - Fix error with feed not loading DONE -->
<!-- - Create single post, workout, group, session routes and placeholders DONE -->

Working On:
<!-- - Workout and session items for feed DONE -->
<!-- - Add sessions to profile menu items DONE -->
<!-- - updating workout and session apis DONE -->

## Tue Aug 12
Working On:
<!-- - changing like/comment button stylings to allow for clicking on counts and buttons separately DONE -->
<!-- - rearranging viewpostitem page so likes appear in drawer DONE -->
<!-- - Updating views to allow for liking comments and viewing comment likes DONE -->

## Wed Aug 13
To do:
<!-- - Fix likes on view post item. When clicked, it doesn't work properly. Requires page refresh DONE -->
<!-- - Move useEffect fetch to ViewPostPage DONE -->
<!-- - Fix issues with likes not updating properly DONE -->

## Mon - Fri Aug 25 - 29
To do:
<!-- - Create ViewWorkoutPage and CreateSessionForms DONE -->
<!-- - Add workouts to createPost and ViewPostItem components DONE -->
<!-- - Add exercise target to session_exercise table? DONE -->
<!-- - Add session items to feed, view session page, connect like/comment functionality DONE -->
<!-- - Finish ViewSessionPage/Item DONE -->

## Mon - Fri Sep 8 - 12
To do:
- Work on edit post, workout, session forms
    <!-- - edit post DONE -->
    <!-- - edit workout DONE -->
    - edit session
<!-- - Update feeditems to use updated_at if it is different from created_at DONE -->
- Mobile versions of forms
- Loading state for viewPostItem
<!-- - Rework exercise inputs to match input style from creating session DONE -->
<!-- - Double check validations on workout and session form inputs. Prevent negative negative numbers and letters DONE -->
- confirm delete on exercise inputs or add undo?
<!-- - On editing workout, the index of exercises is not the same when an exercise is changed. Work on making sure the order of the workout is consistent with how it was submitted FIXED -->