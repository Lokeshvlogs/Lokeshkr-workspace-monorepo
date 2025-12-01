'use client'

import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost'
}

export default function Button({ variant = 'default', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium ' 
  const variantClass = variant === 'default' ? 'bg-brand-500 text-white hover:opacity-95' : 'bg-transparent border'
  return (
    <button className={`${base} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
