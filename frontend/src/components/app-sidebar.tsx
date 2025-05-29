import { Handshake, Home, Dumbbell, Bell, User, Users, LogOut } from "lucide-react"

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

// Menu items.
const items = [
    {
        title: "Home",
        url: "/",
        icon: Home,
    },
    {
        title: "Friends",
        url: "#",
        icon: Users,
    },
    {
        title: "Workouts",
        url: "/workouts",
        icon: Dumbbell,
    },
    {
        title: "Groups",
        url: "/groups",
        icon: Handshake,
    }
]

const footerItems = [
    {
        title: "Profile",
        url: "/profile",
        icon: User,
    },
    {
        title: "Notifications",
        url: "#",
        icon: Bell,
    },
    {
        title: "Logout",
        url: "#",
        icon: LogOut,
    }
]

export function AppSidebar() {
    return (
        <div>
            <Sidebar collapsible="icon">
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-2xl uppercase">Swolemates</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                    >
                                            <a href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        {footerItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                >
                                    <a href={item.url}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
        </div>
    )
}
