import * as React from "react";

// component imports
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";

// icon imports
import { Home, FileText, Dumbbell, CircleCheck, Users, Handshake } from "lucide-react";

// types import
import { ProfileMenuBarProps, ProfileMenuItem } from "@/types/props/props-types";

const menuItems: { key: ProfileMenuItem; label: string; icon: React.ReactNode }[] = [
    { key: "feed", label: "Feed", icon: <Home size={24} className="mr-1" /> },
    { key: "posts", label: "Posts", icon: <FileText size={24} className="mr-1" /> },
    { key: "workouts", label: "Workouts", icon: <Dumbbell size={24} className="mr-1" /> },
    { key: "sessions", label: "Sessions", icon: <CircleCheck size={24} className="mr-1" /> },
    { key: "friends", label: "Friends", icon: <Users size={24} className="mr-1" /> },
    { key: "groups", label: "Groups", icon: <Handshake size={24} className="mr-1" /> },
];

export const ProfileMenuBar: React.FC<ProfileMenuBarProps> = ({
    selectedMenuItem,
    onMenuItemClick
}) => (
    <Menubar
        className="flex h-fit items-center rounded-lg overflow-x-auto whitespace-nowrap bg-transparent border-none p-0 no-scrollbar"
        style={{ width: "auto", minWidth: "0", scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
        {menuItems.map(item => (
            <MenubarMenu key={item.key}>
                <MenubarTrigger
                    style={
                        selectedMenuItem === item.key
                            ? {
                                background: "var(--accent-hover)",
                                color: "var(--accent)",
                            }
                            : {
                                background: "transparent",
                                color: "var(--subhead-text)",
                            }
                    }
                    className="text-sm px-3 py-2 text-center flex items-center justify-center rounded-lg transition-colors duration-150 hover:cursor-pointer"
                    onClick={() => onMenuItemClick(item.key)}
                >
                    {item.icon}
                    {item.label}
                </MenubarTrigger>
            </MenubarMenu>
        ))}
    </Menubar>
);