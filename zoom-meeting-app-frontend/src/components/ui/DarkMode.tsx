"use client";
import { useState, useEffect } from "react";

export default function DarkModeToggle() {
    const [darkMode, setDarkMode] = useState<boolean>(false);

    useEffect(() => {
        // Check localStorage for the dark mode preference on initial render
        const storedDarkMode = localStorage.getItem("darkMode");
        if (storedDarkMode === "true") {
            setDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    useEffect(() => {
        // Update localStorage and the document class when darkMode state changes
        if (darkMode) {
            localStorage.setItem("darkMode", "true");
            document.documentElement.classList.add("dark");
        } else {
            localStorage.setItem("darkMode", "false");
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(prevMode => !prevMode);
    };

    return (
        <button
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md text-black dark:text-white"
            onClick={toggleDarkMode}
        >
            {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
    );
}