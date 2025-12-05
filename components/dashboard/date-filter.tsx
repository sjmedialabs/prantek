"use client"

import { useState, useRef } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

export type DateRange = {
  from: Date
  to: Date
}

export type DateFilterType = "today" | "weekly" | "monthly" | "custom"

interface DateFilterProps {
  onFilterChange: (type: DateFilterType, range: DateRange) => void
  selectedFilter: DateFilterType
}

export default function DateFilter({ onFilterChange, selectedFilter }: DateFilterProps) {
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({})
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  const getFilterLabel = () => {
    switch (selectedFilter) {
      case "today":
        return "Today"
      case "weekly":
        return "This Week"
      case "monthly":
        return "This Month"
      case "custom":
        if (customRange.from && customRange.to) {
          return `${format(customRange.from, "MMM d")} - ${format(customRange.to, "MMM d")}`
        }
        return "Custom Range"
      default:
        return "Select Period"
    }
  }

  const handlePresetFilter = (type: DateFilterType) => {
    const today = new Date()
    let range: DateRange

    console.log('[DATE-FILTER] Preset filter selected:', type)

    switch (type) {
      case "today":
        const todayStart = new Date(today)
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)
        range = { from: todayStart, to: todayEnd }
        break
      case "weekly":
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        range = { from: startOfWeek, to: endOfWeek }
        break
      case "monthly":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
        range = { from: startOfMonth, to: endOfMonth }
        break
      default:
        return
    }

    console.log('[DATE-FILTER] Calling onFilterChange with:', { type, from: range.from, to: range.to })
    onFilterChange(type, range)
  }

  const handleCustomRangeSelect = (selected: { from?: Date; to?: Date } | undefined) => {
    console.log('[DATE-FILTER] Date selection changed:', selected)
    
    if (!selected) {
      setCustomRange({})
      return
    }
    
    setCustomRange(selected)
    
    // Only close and apply filter when both dates are selected AND they are different
    if (selected.from && selected.to) {
      // Check if from and to are actually different dates
      const isSameDate = selected.from.getTime() === selected.to.getTime()
      
      if (!isSameDate) {
        const fromDate = new Date(selected.from)
        fromDate.setHours(0, 0, 0, 0)
        const toDate = new Date(selected.to)
        toDate.setHours(23, 59, 59, 999)
        
        const range: DateRange = { from: fromDate, to: toDate }
        console.log('[DATE-FILTER] Custom range completed:', { from: fromDate, to: toDate })
        onFilterChange("custom", range)
        setIsCalendarOpen(false)
      }
    }
  }

  const handleCustomRangeClick = () => {
    setCustomRange({})
    setIsCalendarOpen(true)
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <div ref={triggerRef}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              {getFilterLabel()}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handlePresetFilter("today")}>
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePresetFilter("weekly")}>
              This Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePresetFilter("monthly")}>
              This Month
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCustomRangeClick}>
              Custom Range...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Popover 
        open={isCalendarOpen} 
        onOpenChange={(open) => {
          // Only allow closing when both dates are selected AND different
          if (!open) {
            if (customRange.from && customRange.to) {
              const isSameDate = customRange.from.getTime() === customRange.to.getTime()
              if (!isSameDate) {
                setIsCalendarOpen(false)
              }
            }
            // Prevent closing if dates aren't fully selected or are the same
            return
          }
          setIsCalendarOpen(open)
        }}
      >
        <PopoverTrigger asChild>
          <div style={{ position: 'absolute', pointerEvents: 'none', opacity: 0 }}>
            {triggerRef.current && <div />}
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="end" 
          side="left"
          sideOffset={10}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Prevent closing when dates aren't fully selected or are the same
            if (!customRange.from || !customRange.to) {
              e.preventDefault()
            } else {
              const isSameDate = customRange.from.getTime() === customRange.to.getTime()
              if (isSameDate) {
                e.preventDefault()
              }
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing on escape when dates aren't fully selected or are the same
            if (!customRange.from || !customRange.to) {
              e.preventDefault()
            } else {
              const isSameDate = customRange.from.getTime() === customRange.to.getTime()
              if (isSameDate) {
                e.preventDefault()
              }
            }
          }}
        >
          <CalendarComponent
            mode="range"
            selected={{ from: customRange.from, to: customRange.to }}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
