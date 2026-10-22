'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const DropdownMenu = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <DropdownMenuPrimitive.Root>
      <div className={cn('', className)}>
        {children}
      </div>
    </DropdownMenuPrimitive.Root>
  )
}
DropdownMenu.displayName = 'DropdownMenu'

type TriggerProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  TriggerProps
>(({ className, children, ...props }, ref) => {
  return (
    <DropdownMenuPrimitive.Trigger
      ref={ref}
      {...props}
      className={cn(className)}
    >
      {children}
      <ChevronRight className="ml-1 h-4 w-4 opacity-50" />
    </DropdownMenuPrimitive.Trigger>
  )
})
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

type ContentProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  ContentProps
>(({ className, sideOffset = 4, children, ...props }, ref) => {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        {...props}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-none border border-border bg-bg-raised p-1 text-text shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
})
DropdownMenuContent.displayName = 'DropdownMenuContent'

type ItemProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  ItemProps
>(({ className, inset, children, ...props }, ref) => {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      {...props}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-none px-2 py-1.5 font-mono text-xs outline-none transition-colors focus:bg-surface-hover focus:text-green-bright data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className,
      )}
    >
      {children}
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.Item>
  )
})
DropdownMenuItem.displayName = 'DropdownMenuItem'

type SeparatorProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  SeparatorProps
>(({ className, ...props }, ref) => {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      {...props}
      className={cn('-mx-1 my-1 h-px bg-border/60', className)}
    />
  )
})
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
