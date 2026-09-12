'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { X, ChevronRight, Check } from 'lucide-react'
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

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, { className?: string; children: React.ReactNode }>(
  ({ className, children }, ref) => {
    return (
      <DropdownMenuPrimitive.Trigger
        ref={ref as any}
        className={cn('', className)}
      >
        {children}
        <ChevronRight className="ml-1 h-4 w-4 opacity-50" />
      </DropdownMenuPrimitive.Trigger>
    )
  }
)
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuContent = React.forwardRef<HTMLDivElement, { className?: string; sideOffset?: number; children: React.ReactNode }>(
  ({ className, sideOffset = 4, children }, ref) => {
    return (
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          ref={ref as any}
          sideOffset={sideOffset}
          className={cn(
            'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-bg p-1 text-text shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className,
          )}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    )
  }
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<HTMLDivElement, { className?: string; inset?: boolean; children: React.ReactNode; onClick?: () => void }>(
  ({ className, inset, children, onClick }, ref) => {
    return (
      <DropdownMenuPrimitive.Item
        ref={ref as any}
        onClick={onClick}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
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
  }
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => {
    return (
      <DropdownMenuPrimitive.Separator
        ref={ref as any}
        className={cn('-mx-1 my-1 h-px bg-border', className)}
      />
    )
  }
)
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}