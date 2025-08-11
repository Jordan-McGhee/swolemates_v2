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
import ViewWorkout from "./pages/workouts/ViewWorkout"
import ViewSession from "./pages/sessions/ViewSession"

export default function App() {
  return (
    <div>
      <Toaster closeButton richColors />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          {/* groups */}
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:group_id" element={<div>View Group</div>} />

          {/* posts */}
          <Route path="/posts/:post_id" element={<ViewPostPage />} />
          <Route path="/posts/:post_id/edit" element={<div>Edit Post</div>} />

          {/* profile */}
          <Route path="/user/:username?" element={<Profile />} />

          {/* workouts */}
          <Route path="/workouts/create" element={<CreateWorkout />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workouts/:workout_id?" element={<ViewWorkout />} />

          {/* sessions */}
          <Route path="/session/:session_id" element={<ViewSession />} />
        </Route>
      </Routes>
    </div>
  )
}
