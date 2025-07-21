import { Outlet } from "react-router-dom"
import { useState } from "react"

// component imports
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { MobileTop, MobileBottom } from "@/navigation/MobileNav"
import AuthModal from "@/components/auth/AuthModal"

export default function Layout() {
    const [useDarkMode, setUseDarkMode] = useState(false)
    const [authModalOpen, setAuthModalOpen] = useState(false)


    return (
        <div className={useDarkMode ? "dark" : ""}>
            <SidebarProvider>
                <div className="hidden w-full md:flex bg-light-off-bg text-light-black dark:bg-dark-background dark:text-dark-white transition-colors duration-300">
                    {/* Sidebar */}
                    <AppSidebar onLoginClick={() => setAuthModalOpen(true)} />

                    {/* Main Content */}
                    <main className="flex-1 flex flex-col relative -mt-1.5 w-full">
                        <div className="p-4">
                            <SidebarTrigger className="text-[var(--subhead-text)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)] hover:cursor-pointer" />
                        </div>

                        <div className="pb-24 w-full max-w-[120rem] mx-auto px-4 flex-1">
                            <button
                                className="mb-4 px-4 py-2 rounded bg-[var(--accent)] text-[var(--white)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)]"
                                onClick={() => setUseDarkMode(!useDarkMode)}
                            >
                                Toggle {useDarkMode ? "Light" : "Dark"} Mode
                            </button>

                            <Outlet />
                        </div>
                    </main>
                </div>

                {/* Modal */}
                {authModalOpen && (
                    <AuthModal onClose={() => setAuthModalOpen(false)} isOpen={authModalOpen} />
                )}

                {/* 📱 Mobile Layout */}
                <div className="md:hidden flex flex-col bg-[var(--off-bg)] transition-colors duration-300">
                    {/* Top Navigation */}
                    <div className="fixed top-0 w-full z-40">
                        <MobileTop />
                    </div>

                    <main className="pt-20 pb-24 px-4 flex-1 w-full max-w-[120rem] mx-auto text-center">
                        <button
                            className="mb-4 px-4 py-2 rounded bg-[var(--accent)] text-[var(--white)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)]"
                            onClick={() => setUseDarkMode(!useDarkMode)}
                        >
                            Toggle {useDarkMode ? "Dark" : "Light"} Mode
                        </button>

                        <Outlet />
                    </main>

                    {/* Bottom Navigation */}
                    <MobileBottom  onLoginClick={() => setAuthModalOpen(true)} />
                </div>
            </SidebarProvider>
        </div>
    )
}
