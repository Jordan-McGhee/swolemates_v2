import { Route, Routes } from "react-router-dom"

import "./index.css"
import Layout from "./navigation/NavLayout"

// ui imports
import { Toaster } from "@/components/ui/sonner"

// page imports
import Home from "./pages/Home"
import Profile from "./pages/Profile"
import Workouts from "./pages/workouts/Workouts"
import CreateWorkout from "./pages/workouts/CreateWorkout"
import Groups from "./pages/groups/Groups"

export default function App() {
  return (
    <div>
      <Toaster closeButton richColors />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/user/:username?" element={<Profile />} />
          <Route path="/workouts/:workout_id?" element={<Workouts />} />
          <Route path="/workouts/create" element={<CreateWorkout />} />
          <Route path="/groups" element={<Groups />} />
        </Route>
      </Routes>
    </div>
  )
}
