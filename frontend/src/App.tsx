import { Route, Routes } from "react-router-dom"

import "./index.css"
import Layout from "./navigation/NavLayout"

// ui imports
import { Toaster } from "@/components/ui/sonner"

// page imports
import Home from "./pages/Home"
import Profile from "./pages/Profile"
import Groups from "./pages/groups/Groups"
import ViewPostPage from "./pages/posts/ViewPostPage"
import Workouts from "./pages/workouts/Workouts"
import CreateWorkout from "./pages/workouts/CreateWorkout"
import ViewWorkoutPage from "./pages/workouts/ViewWorkoutPage"
import CreateSession from "./pages/sessions/CreateSession"
import ViewSessionPage from "./pages/sessions/ViewSessionPage"

export default function App() {
  return (
    <div>
      <Toaster closeButton richColors />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          {/* groups */}
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/create" element={<div>Create Group</div>} />
          <Route path="/groups/:group_id" element={<div>View Group</div>} />
          <Route path="/groups/:group_id/edit" element={<div>Edit Group</div>} />

          {/* posts */}
          <Route path="/posts/:post_id" element={<ViewPostPage />} />
          <Route path="/posts/:post_id/edit" element={<div>Edit Post</div>} />

          {/* profile */}
          <Route path="/user/:username?" element={<Profile />} />

          {/* workouts */}
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workouts/create" element={<CreateWorkout />} />
          <Route path="/workouts/:workout_id?" element={<ViewWorkoutPage />} />
          <Route path="/workouts/:workout_id/edit" element={<div>Edit Workout</div>} />

          {/* sessions */}
          <Route path="/sessions" element={<div>View Sessions</div>} />
          <Route path="/sessions/create" element={<CreateSession />} />
          <Route path="/sessions/:session_id" element={<ViewSessionPage />} />
          <Route path="/sessions/:session_id/edit" element={<div>Edit Session</div>} />

        </Route>
      </Routes>
    </div>
  )
}
