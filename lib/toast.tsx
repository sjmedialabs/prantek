"use client"

import { createRoot } from "react-dom/client"
import { Toast, ToastContainer, type ToastProps } from "@/components/ui/toast"

let toastContainer: HTMLDivElement | null = null
let toastRoot: ReturnType<typeof createRoot> | null = null
const activeToasts = new Map<string, ToastProps>()

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    document.body.appendChild(toastContainer)
    toastRoot = createRoot(toastContainer)
  }
  return { container: toastContainer, root: toastRoot! }
}

function renderToasts() {
  const { root } = getToastContainer()
  root.render(
    <ToastContainer>
      {Array.from(activeToasts.values()).map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </ToastContainer>,
  )
}

export function toast({ title, description, type = "success", duration = 4000 }: Omit<ToastProps, "id" | "onClose">) {
  const id = Math.random().toString(36).substring(7)

  const removeToast = () => {
    activeToasts.delete(id)
    renderToasts()
  }

  const toastProps: ToastProps = {
    id,
    title,
    description,
    type,
    duration,
    onClose: removeToast,
  }

  activeToasts.set(id, toastProps)
  renderToasts()

  if (duration > 0) {
    setTimeout(removeToast, duration)
  }

  return id
}

toast.success = (title: string, description?: string) => toast({ title, description, type: "success" })
toast.error = (title: string, description?: string) => toast({ title, description, type: "error" })
toast.info = (title: string, description?: string) => toast({ title, description, type: "info" })
toast.warning = (title: string, description?: string) => toast({ title, description, type: "warning" })
