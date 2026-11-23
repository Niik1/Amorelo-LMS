"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-slate-200 data-checked:bg-[#1A73E8] data-[state=checked]:bg-[#1A73E8] dark:bg-slate-700 dark:data-checked:bg-blue-500 dark:data-[state=checked]:bg-blue-500",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-md ring-0 transition-transform data-checked:translate-x-5 data-[state=checked]:translate-x-5 data-unchecked:translate-x-0 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
