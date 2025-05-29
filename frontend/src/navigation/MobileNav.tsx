// imports
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

// icons
import { Bell, Home, Dumbbell, Handshake, User, Search, Plus, FileText, Pencil } from "lucide-react"

// top bar
const MobileTop = () => {
    return (
        <header className="lg:hidden fixed top-0 w-full h-16 bg-[var(--accent)] z-40">
            <div className="h-full px-4 flex items-center justify-between relative text-[var(--white)]">

                <button className="w-10 h-10 flex items-center justify-center">
                    <Search className="w-6 h-6" />
                </button>

                {/* Centered app name */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                    <h1 className="text-xl font-bold tracking-wide">
                        SWOLEMATES
                    </h1>
                </div>

                {/* Bell icon on right */}
                <button className="w-10 h-10 flex items-center justify-center">
                    <Bell className="w-6 h-6" />
                </button>
            </div>
        </header>
    )
}

// bottom nav
const MobileBottom = () => {

    const navItems = [
        { icon: Home, label: "Home", url: "/" },
        { icon: Dumbbell, label: "Workouts", url: "/workouts" },
        { icon: Handshake, label: "Groups", url: "/groups" },
        { icon: User, label: "Profile", url: "/profile" },
    ]

    const [showActions, setShowActions] = useState(false)
    const actionsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
                setShowActions(false)
            }
        }
        if (showActions) {
            document.addEventListener("mousedown", handleClickOutside)
        } else {
            document.removeEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [showActions])

    return (
        <>
            {/* Floating Action Options */}
            <AnimatePresence>
                {showActions && (
                    <motion.div
                        ref={actionsRef}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 space-y-2 text-sm"
                    >
                        <motion.a
                            href="#"
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-[var--(white)] shadow transition"
                        >
                            <Pencil className="w-4 h-4" />
                            Create Post
                        </motion.a>
                        <motion.a
                            href="#"
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-[var--(white)] shadow transition"
                        >
                            <FileText className="w-4 h-4" />
                            Create Workout
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Nav */}
            <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md shadow-lg rounded-full px-6 py-3 flex justify-between items-center lg:hidden z-50 bg-[var(--off-background)]">
                {navItems.slice(0, 2).map((item) => (
                    <a
                        key={item.label}
                        href={item.url}
                        className="flex flex-col items-center text-xs text-[var(--subhead-text)]"
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </a>
                ))}

                {/* FAB Center Button */}
                <button
                    onClick={() => setShowActions((prev) => !prev)}
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg -mt-6 bg-[var(--accent)] transition-transform"
                >
                    <motion.div
                        animate={{ rotate: showActions ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Plus className="w-6 h-6 text-white" />
                    </motion.div>
                </button>

                {navItems.slice(2).map((item) => (
                    <a
                        key={item.label}
                        href={item.url}
                        className="flex flex-col items-center text-xs text-[var(--subhead-text)]"
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </a>
                ))}
            </nav>
        </>
    )
}

export { MobileTop, MobileBottom }
