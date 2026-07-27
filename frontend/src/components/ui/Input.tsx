import { type InputHTMLAttributes, forwardRef } from 'react'
import { controlClasses } from './Field'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError, className, ...props },
  ref,
) {
  return <input ref={ref} className={controlClasses(hasError) + ' ' + (className ?? '')} {...props} />
})
