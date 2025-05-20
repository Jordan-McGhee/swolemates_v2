import React, { useState } from "react";
import "./index.css";
import { Route, Routes } from "react-router-dom";

// context import

// hook imports

// nav import
import DesktopNav from "./navigation/DesktopNav";

// page imports

function App() {
  const [useDarkMode, setUseDarkMode] = useState(false);

  return (
    <div className={useDarkMode ? "dark" : ""}>

      {/* whole app */}
      <div className="flex items-center justify-center bg-light-off-bg text-light-black dark:bg-dark-background dark:text-dark-white px-4 transition-colors duration-300">

        <DesktopNav>

          {/* desktop classes */}
          <div className="w-full max-w-[120rem] min-h-screen text-center space-y-4 border border-light-accent">
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
        </DesktopNav>
      </div>
    </div>
  );
}

export default App;
