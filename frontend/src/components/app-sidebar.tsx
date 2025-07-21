import { Handshake, Home, Dumbbell, Bell, User, Users, LogOut } from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { useAuth } from "@/context/AuthProvider"

// types import
import { AppSidebarProps } from "@/types/props/props-types"

// ui components
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


const items = [
    { title: "Home", url: "/", icon: Home },
    { title: "Friends", url: "#", icon: Users },
    { title: "Workouts", url: "/workouts", icon: Dumbbell },
    { title: "Groups", url: "/groups", icon: Handshake },
]

export function AppSidebar({ onLoginClick }: AppSidebarProps) {
    const location = useLocation()
    const isActive = (url: string) => location.pathname === url

    // get user from auth context
    const { user, handleLogout } = useAuth()

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <Link
                            to={"/"}
                            className="text-xl font-bold tracking-wide text-[var(--accent)]"
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
                    {user ? (
                        <>
                            {/* Profile (with avatar + username) */}
                            <SidebarMenuItem key="profile">
                                <SidebarMenuButton
                                    asChild
                                    tooltip="Profile"
                                    className={`group w-full ${isActive("/profile")
                                        ? "bg-[var(--accent-hover)] text-[var(--accent)]"
                                        : "text-[var(--subhead-text)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)]"
                                        }`}
                                >
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full"
                                    >
                                        <Avatar className="w-5 h-5 object-cover">
                                            <AvatarImage src={user.profile_pic ?? ""} alt={user.username} />
                                            <AvatarFallback>
                                                <User className="w-5 h-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{user.username}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* Notifications */}
                            <SidebarMenuItem key="Notifications">
                                <SidebarMenuButton
                                    asChild
                                    tooltip="Notifications"
                                    className={`group w-full ${isActive("#")
                                        ? "bg-[var(--accent-hover)] text-[var(--accent)]"
                                        : "text-[var(--subhead-text)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)]"
                                        }`}
                                >
                                    <Link to="#" className="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full">
                                        <Bell className="w-5 h-5" />
                                        <span>Notifications</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* Logout */}
                            <SidebarMenuItem key="Logout">
                                <SidebarMenuButton
                                    asChild
                                    tooltip="Logout"
                                    onClick={handleLogout}
                                    className="group w-full text-[var(--subhead-text)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)]"
                                >
                                    <div className="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full cursor-pointer">
                                        <LogOut className="w-5 h-5" />
                                        <span>Logout</span>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </>
                    ) : (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                tooltip="Login"
                                className="group w-full text-[var(--subhead-text)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent)]"
                                onClick={onLoginClick}
                            >
                                <div className="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full cursor-pointer">
                                    <User className="w-5 h-5" />
                                    <span>Login</span>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarFooter>

        </Sidebar>
    )
}
