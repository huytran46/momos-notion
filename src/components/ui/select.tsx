"use client"

import * as SelectPrimitive from "@radix-ui/react-select"
import * as React from "react"
import { cn } from "@/lib/utils"

const SelectRoot = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "px-2 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text text-left inline-flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  >
    {children}
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("hidden", className)}
    {...props}
  />
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("hidden", className)}
    {...props}
  />
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(
  (
    {
      className,
      children,
      position = "popper",
      collisionPadding = 8,
      ...props
    },
    ref
  ) => (
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "bg-white border border-hn-border shadow-none max-h-[300px]",
        className
      )}
      position={position}
      collisionPadding={collisionPadding}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1 overflow-y-auto",
          position === "popper" && "min-w-(--radix-select-trigger-width)"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  )
)
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = SelectPrimitive.Label

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer",
      className
    )}
    {...props}
  >
    {children}
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-hn-border", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

const SelectIcon = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Icon>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Icon>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Icon
    ref={ref}
    className={cn("text-hn-text-secondary shrink-0", className)}
    {...props}
  >
    ▼
  </SelectPrimitive.Icon>
))
SelectIcon.displayName = SelectPrimitive.Icon.displayName

// Export Viewport and Portal for cases where custom content structure is needed
const SelectViewport = SelectPrimitive.Viewport
const SelectPortal = SelectPrimitive.Portal
const SelectItemText = SelectPrimitive.ItemText

export const Select = {
  Root: SelectRoot,
  Group: SelectGroup,
  Value: SelectValue,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Label: SelectLabel,
  Item: SelectItem,
  ItemText: SelectItemText,
  Separator: SelectSeparator,
  ScrollUpButton: SelectScrollUpButton,
  ScrollDownButton: SelectScrollDownButton,
  Icon: SelectIcon,
  Viewport: SelectViewport,
  Portal: SelectPortal,
}
