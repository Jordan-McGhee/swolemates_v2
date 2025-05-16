/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class", // Enables dark mode via the 'dark' class
    theme: {
        screens: {
            mobile: "0px",     // everything is mobile-first by default
            tablet: "768px",   // tablets and up
            desktop: "1024px", // desktops and up
        },
        extend: {
            colors: {
                // Light theme colors
                accent: "#007b77",
                "accent-hover": "#e0f6f5",
                white: "#ffffff",
                "off-bg": "#f4f4f4",
                "subhead-text": "#616a73",
                black: "#000000",
                danger: "#c15052",

                // Dark theme overrides
                dark: {
                    accent: "#4cd1cb",
                    "accent-hover": "#9aebe7",
                    background: "#1a1a1a",
                    "off-bg": "#2a2a2a",
                    "subhead-text": "#9ca3af",
                    white: "#ffffff",
                    danger: "#e63c4d",
                },
            },
        },
    },
    plugins: [],
};
