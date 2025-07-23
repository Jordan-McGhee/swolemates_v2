/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class", // enables dark mode via the 'dark' class
    theme: {
        screens: {
            mobile: "0px",
            tablet: "768px",
            desktop: "1024px",
        },
        extend: {
            colors: {
                // Light theme colors
                "light-accent": "#007b77",
                "light-accent-hover": "#e0f6f5",
                "light-background": "#ffffff",
                "light-off-bg": "#f4f4f4",
                "light-subhead-text": "#616a73",
                "light-black": "#000000",
                "light-danger": "#c15052",
                "light-danger-hover": "#e69ea0",

                // Dark theme colors
                "dark-accent": "#4cd1cb",
                "dark-accent-hover": "#9aebe7",
                "dark-background": "#1a1a1a",
                "dark-off-bg": "#2a2a2a",
                "dark-subhead-text": "#9ca3af",
                "dark-black": "#000000",
                "dark-danger": "#e63c4d",
                "dark-danger-hover": "#e06571",
            },
        },
    },
    plugins: [],
};