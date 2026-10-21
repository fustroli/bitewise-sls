"use client"

import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"

import { useToast } from "@/app/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/app/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            {props.variant === "success" && (
              <CircleCheck aria-hidden className="size-5 shrink-0" />
            )}
            {(props.variant === "error" ||
              props.variant === "destructive") && (
              <CircleAlert aria-hidden className="size-5 shrink-0" />
            )}
            {props.variant === "warning" && (
              <TriangleAlert aria-hidden className="size-5 shrink-0" />
            )}
            {(!props.variant || props.variant === "default") && (
              <Info aria-hidden className="size-5 shrink-0" />
            )}
            <div className="grid flex-1 gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
