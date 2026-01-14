import * as React from "react"

import { cn } from "@/lib/utils"

type TabsContextValue = {
  value: string
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string
  defaultValue: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = controlledValue ?? uncontrolledValue

  const setValue = React.useCallback(
    (next: string) => {
      if (controlledValue === undefined) setUncontrolledValue(next)
      onValueChange?.(next)
    },
    [controlledValue, onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md bg-muted/30 p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({
  value,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs.")
  const active = ctx.value === value

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
        className
      )}
      onClick={() => ctx.setValue(value)}
      {...props}
    />
  )
}

export function TabsContent({
  value,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsContent must be used within Tabs.")
  if (ctx.value !== value) return null
  return <div className={cn("mt-4", className)} {...props} />
}
