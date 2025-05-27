import { useState } from "react"
import "./index.css"
import DesktopNav from "./navigation/DesktopNav"

export default function App() {
  const [useDarkMode, setUseDarkMode] = useState(false)

  return (
    <div className={useDarkMode ? "dark" : ""}>
      <DesktopNav>
        <div className="bg-light-off-bg text-light-black dark:bg-dark-background dark:text-dark-white transition-colors duration-300 min-h-screen px-4">
          <div className="w-full max-w-[120rem] mx-auto text-center space-y-4 border border-light-accent p-4">
            <button
              className="px-4 py-2 rounded bg-light-accent text-light-white hover:bg-light-accent-hover dark:bg-dark-accent dark:text-dark-background dark:hover:bg-dark-accent-hover"
              onClick={() => setUseDarkMode(!useDarkMode)}
            >
              Toggle {useDarkMode ? "Dark" : "Light"} Mode
            </button>

            <p className="text-light-subhead-text dark:text-dark-subhead-text text-lg">
              Hello World! This is the {useDarkMode ? "Dark" : "Light"} theme.
            </p>
          </div>
        </div>
      </DesktopNav>
    </div>
  )
}
