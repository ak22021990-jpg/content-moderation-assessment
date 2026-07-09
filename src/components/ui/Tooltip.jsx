import { useState, useRef, useId, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const GAP = 8
const VIEWPORT_PAD = 8

function computePosition(triggerRect, tooltipRect, placement) {
  let top = 0
  let left = 0

  switch (placement) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - GAP
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'bottom':
      top = triggerRect.bottom + GAP
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'left':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.left - tooltipRect.width - GAP
      break
    case 'right':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.right + GAP
      break
    default:
      top = triggerRect.top - tooltipRect.height - GAP
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
  }

  const maxLeft = window.innerWidth - tooltipRect.width - VIEWPORT_PAD
  const maxTop = window.innerHeight - tooltipRect.height - VIEWPORT_PAD

  return {
    top: Math.max(VIEWPORT_PAD, Math.min(top, maxTop)),
    left: Math.max(VIEWPORT_PAD, Math.min(left, maxLeft)),
  }
}

export default function Tooltip({ children, content, placement = 'top', delay = 150 }) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)
  const tooltipId = useId()
  const reduce = useReducedMotion()
  const showTimer = useRef(null)

  function show() {
    if (showTimer.current) clearTimeout(showTimer.current)
    showTimer.current = setTimeout(() => {
      setVisible(true)
    }, delay)
  }

  function hide() {
    if (showTimer.current) clearTimeout(showTimer.current)
    showTimer.current = null
    setVisible(false)
  }

  useLayoutEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    setCoords(computePosition(triggerRect, tooltipRect, placement))
  }, [visible, placement])

  useLayoutEffect(() => {
    if (!visible) return
    function onScroll() {
      if (!triggerRef.current || !tooltipRef.current) return
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      setCoords(computePosition(triggerRect, tooltipRect, placement))
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [visible, placement])

  return (
    <>
      <span
        ref={triggerRef}
        aria-describedby={visible ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: 'inline-block' }}
      >
        {children}
      </span>
      {createPortal(
        <AnimatePresence>
          {visible && (
            <motion.div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="cma-tooltip"
              data-placement={placement}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.92, y: reduce ? 0 : placement === 'top' ? 6 : placement === 'bottom' ? -6 : 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
              transition={{ duration: reduce ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            >
              <div className="cma-tooltip__content">{content}</div>
              <span className="cma-tooltip__arrow" aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
