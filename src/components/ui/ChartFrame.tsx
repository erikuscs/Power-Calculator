import { cloneElement, useEffect, useRef, useState, type ReactElement } from 'react'

interface ChartFrameProps {
  height: number
  className?: string
  children: ReactElement<{ width?: number; height?: number }>
}

export function ChartFrame({ height, className, children }: ChartFrameProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const updateWidth = () => {
      setWidth(Math.max(0, Math.floor(el.getBoundingClientRect().width)))
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className} style={{ height, minWidth: 0, minHeight: height }}>
      {width > 0 ? cloneElement(children, { width, height }) : null}
    </div>
  )
}
