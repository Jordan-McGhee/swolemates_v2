import { Handshake, Home, Dumbbell, Bell, User, Users, LogOut } from "lucide-react"
import { useLocation, Link } from "react-router-dom"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
    { title: "Home", url: "/", icon: Home },
    { title: "Friends", url: "#", icon: Users },
    { title: "Workouts", url: "/workouts", icon: Dumbbell },
    { title: "Groups", url: "/groups", icon: Handshake },
]

const footerItems = [
    { title: "Profile", url: "/profile", icon: User },
    { title: "Notifications", url: "#", icon: Bell },
    { title: "Logout", url: "#", icon: LogOut },
]

export function AppSidebar() {
    const location = useLocation()
    const isActive = (url: string) => location.pathname === url
    // broader matching option:
    // const isActive = (url: string) => location.pathname.startsWith(url)

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <Link
                            to={"/"}
                            className="text-xl font-bold tracking-wide"
                        >
                            SWOLEMATES
                        </Link>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                const active = isActive(item.url)
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            className={`group w-full ${active
                                                ? "bg-[var(--accent-hover)] text-[var(--accent)]"
                                                : "text-[var(--subhead-text)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)]"
                                                }`}
                                        >
                                            <Link to={item.url} className="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full">
                                                <item.icon className="w-5 h-5" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    {footerItems.map((item) => {
                        const active = isActive(item.url)
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    className={`group w-full ${active
                                        ? "bg-[var(--accent-hover)] text-[var(--accent)]"
                                        : "text-[var(--subhead-text)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)]"
                                        }`}
                                >
                                    <Link to={item.url} className="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full">
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
