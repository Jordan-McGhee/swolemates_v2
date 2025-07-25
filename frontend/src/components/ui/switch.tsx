import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
      // Container styles
      "peer relative inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-[var(--accent)] shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
      // Background color based on checked state
      "data-[state=checked]:bg-[var(--accent)] data-[state=unchecked]:bg-[var(--subhead-text)]",
      className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        // Toggle styles: smaller than container, white, transition
        "bg-white pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 size-3 rounded-full ring-0 transition-transform",
        // Position based on checked state
        "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
      )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
