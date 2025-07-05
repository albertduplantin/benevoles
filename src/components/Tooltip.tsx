// eslint-disable-next-line @typescript-eslint/no-unused-expressions
'use client'
import type { ReactNode } from 'react'
import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  return (
    <Tippy
      content={content}
      delay={[100, 0]}
      arrow={true}
      placement={placement}
      className="text-sm leading-tight"
      asChild
    >
      {/* `asChild` permet d’utiliser l’élément enfant comme trigger sans wrapper supplémentaire */}
      {children as any}
    </Tippy>
  )
} 