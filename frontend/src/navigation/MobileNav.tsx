import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Home, Dumbbell, Handshake, User, Search, Plus, Pencil } from "lucide-react"
import { useLocation, Link } from "react-router-dom"

const MobileTop = () => {
    return (
        <header className="lg:hidden fixed top-0 w-full h-16 bg-[var(--accent)] z-40">
            <div className="h-full px-4 flex items-center justify-between relative text-[var(--white)]">
                <button className="w-10 h-10 flex items-center justify-center">
                    <Search className="w-6 h-6" />
                </button>
                <div
                    className="absolute left-1/2 transform -translate-x-1/2"
                >
                    <Link
                        to={"/"}
                        className="text-xl font-bold tracking-wide"
                    >
                        SWOLEMATES
                    </Link>
                </div>
                <button className="w-10 h-10 flex items-center justify-center">
                    <Bell className="w-6 h-6" />
                </button>
            </div>
        </header>
    )
}

const MobileBottom = () => {
    const navItems = [
        { icon: Home, label: "Home", url: "/" },
        { icon: Dumbbell, label: "Workouts", url: "/workouts" },
        { icon: Handshake, label: "Groups", url: "/groups" },
        { icon: User, label: "Profile", url: "/profile" },
    ]

    const [showActions, setShowActions] = useState(false)
    const actionsRef = useRef<HTMLDivElement>(null)
    const fabRef = useRef<HTMLButtonElement>(null)
    const location = useLocation()

    const isActive = (url: string) => location.pathname === url

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                actionsRef.current &&
                !actionsRef.current.contains(target) &&
                fabRef.current &&
                !fabRef.current.contains(target)
            ) {
                setShowActions(false)
            }
        }

        if (showActions) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showActions])

    return (
        <>
            {/* Floating Action Buttons */}
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
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--white)] shadow transition"
                            onClick={() => setShowActions(false)}
                        >
                            <Pencil className="w-4 h-4" />
                            Create Post
                        </motion.a>
                        <motion.a
                            href="#"
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--white)] shadow transition"
                            onClick={() => setShowActions(false)}
                        >
                            <Dumbbell className="w-4 h-4" />
                            Create Workout
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Nav */}
            <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md shadow-lg rounded-xl p-2 flex items-center justify-between lg:hidden z-50 bg-[var(--white)]">
                {navItems.slice(0, 2).map((item) => (
                    <Link
                        key={item.label}
                        to={item.url}
                        className={`flex flex-1 flex-col items-center justify-center text-xs py-2 rounded-md transition-colors
                            ${isActive(item.url)
                                ? "bg-[var(--accent-hover)] text-[var(--accent)]"
                                : "text-[var(--subhead-text)]"}`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </Link>
                ))}

                {/* FAB */}
                <button
                    ref={fabRef}
                    onClick={() => setShowActions((prev) => !prev)}
                    className="size-14 mx-2 rounded-full flex items-center justify-center shadow-lg -mt-6 bg-[var(--accent)] transition-transform"
                >
                    <motion.div
                        animate={{ rotate: showActions ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Plus className="w-6 h-6 text-white" />
                    </motion.div>
                </button>

                {navItems.slice(2).map((item) => (
                    <Link
                        key={item.label}
                        to={item.url}
                        className={`flex flex-1 flex-col items-center justify-center text-xs py-2 rounded-md transition-colors
                            ${isActive(item.url)
                                ? "bg-[var(--accent-hover)] text-[var(--accent)]"
                                : "text-[var(--subhead-text)]"}`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </>
    )
}

export { MobileTop, MobileBottom }
