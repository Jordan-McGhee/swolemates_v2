import { Outlet } from "react-router-dom"
import { useState } from "react"

// component imports
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileTop, MobileBottom } from "@/navigation/MobileNav"
import AuthModal from "@/components/auth/AuthModal"

export default function Layout() {
    // const [useDarkMode, setUseDarkMode] = useState(false)
    const [authModalOpen, setAuthModalOpen] = useState(false)


    return (
        <div>
            <SidebarProvider>
                <div className="hidden w-full md:flex bg-[#f4f4f4] text-[var(--subhead-text)] transition-colors duration-300">
                    {/* Sidebar */}
                    <AppSidebar onLoginClick={() => setAuthModalOpen(true)} />

                    {/* Main Content */}
                    <main className="flex-1 flex flex-col relative -mt-1.5 w-full">

                        <div className="pt-8 pb-24 w-full max-w-[120rem] mx-auto px-4 flex-1">
                            {/* light/dark toggle */}
                            {/* <button
                                className="mb-4 px-4 py-2 rounded bg-[var(--accent)] text-[var(--white)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)]"
                                onClick={() => setUseDarkMode(!useDarkMode)}
                            >
                                Toggle {useDarkMode ? "Light" : "Dark"} Mode
                            </button> */}

                            <Outlet />
                        </div>
                    </main>
                </div>

                {/* Modal */}
                {authModalOpen && (
                    <AuthModal onClose={() => setAuthModalOpen(false)} isOpen={authModalOpen} />
                )}

                {/* Mobile Layout */}
                <div className="md:hidden flex flex-col bg-[#f4f4f4] w-full transition-colors duration-300">
                    {/* Top Navigation */}
                    <div className="fixed top-0 w-full z-40">
                        <MobileTop />
                    </div>

                    <main className="pt-20 pb-24 px-4 flex-1 w-full max-w-[120rem] mx-auto text-center">

                        {/* light/dark toggle */}
                        {/* <button
                            className="mb-4 px-4 py-2 rounded bg-[var(--accent)] text-[var(--white)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)]"
                            onClick={() => setUseDarkMode(!useDarkMode)}
                        >
                            Toggle {useDarkMode ? "Dark" : "Light"} Mode
                        </button> */}

                        <Outlet />
                    </main>

                    {/* Bottom Navigation */}
                    <MobileBottom  onLoginClick={() => setAuthModalOpen(true)} />
                </div>
            </SidebarProvider>
        </div>
    )
}
