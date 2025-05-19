import React, { useState } from 'react';
// import './App.css';
// import './output.css'
import './index.css';


// rutes
import { Route, Routes } from "react-router-dom"

// nav imports

// page imports

function App() {
  const [useDarkMode, setUseDarkMode] = useState(false);

  return (
    <div className={useDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white max-w-2xl p-4">
        <button
          className="px-4 py-2 rounded bg-[#007b77] text-white dark:bg-[#e0f6f5] dark:text-black"
          onClick={() => setUseDarkMode(!useDarkMode)}
        >
          {useDarkMode ? "Dark" : "Light"}
        </button>
        <p className="mt-4">Hello World</p>
      </div>
    </div>
  );
}

export default App;
