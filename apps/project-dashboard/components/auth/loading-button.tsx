import { LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean
  loadingLabel?: string
}

export function LoadingButton({
  children,
  isLoading = false,
  loadingLabel,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {isLoading ? loadingLabel ?? children : children}
    </Button>
  )
}
