// import * as React from 'react'

// import { cn } from '@/lib/utils'

// function Input({ className,min, type, ...props }: React.ComponentProps<'input'>) {
//   return (
//     <input
//       type={type}
//       min={type === "number" ? min ?? 0 : min}
//       data-slot="input"
//       className={cn(
//         'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-12 w-full min-w-0 rounded-xl border bg-white px-4 py-3 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
//         'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-4',
//         'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
//         className,
//       )}
//       {...props}
//     />
//   )
// }

// export { Input }
import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, min, type, onKeyDown, onWheel, ...props }: React.ComponentProps<"input">) {
  const isNumber = type === "number"

  return (
    <input
      type={type}
      min={isNumber ? min ?? 0 : min}
      data-slot="input"
      onWheel={(e) => {
        if (isNumber) {
          e.currentTarget.blur() // prevent scroll change
        }
        onWheel?.(e)
      }}
      onKeyDown={(e) => {
        if (isNumber && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
          e.preventDefault() // prevent arrow key change
        }
        onKeyDown?.(e)
      }}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-12 w-full min-w-0 rounded-xl border bg-white px-4 py-3 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-4",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }