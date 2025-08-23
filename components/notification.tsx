"use client"

import { useState, useCallback, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export type NotificationType = "success" | "error" | "info"

interface NotificationState {
  message: string
  type: NotificationType
  isVisible: boolean
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "success",
    isVisible: false,
  })

  const showNotification = useCallback((message: string, type: NotificationType = "success") => {
    setNotification({ message, type, isVisible: true })
  }, [])

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isVisible: false }))
  }, [])

  /* auto-close após 3 s */
  useEffect(() => {
    if (!notification.isVisible) return
    const id = setTimeout(() => hideNotification(), 3000)
    return () => clearTimeout(id)
  }, [notification.isVisible, hideNotification])

  return { notification, showNotification, hideNotification }
}

export function Notification({
  message,
  type,
  isVisible,
  onClose,
}: {
  message: string
  type: NotificationType
  isVisible: boolean
  onClose: () => void
}) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-4 rounded-lg px-6 py-4 shadow-lg text-white",
          type === "success" && "bg-emerald-600",
          type === "error" && "bg-red-600",
          type === "info" && "bg-blue-600",
        )}
      >
        <span className="font-medium">{message}</span>
        <button aria-label="Fechar notificação" className="ml-2 hover:opacity-80" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
