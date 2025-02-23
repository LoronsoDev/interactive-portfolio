import { useEffect, useRef, useState, createContext, useContext } from 'react'
import nipplejs from 'nipplejs'

// Create a context for mobile controls
const MobileControlsContext = createContext(null)

// Create a provider component
export function MobileControlsProvider({ children }) {
  const [controls, setControls] = useState({
    forward: false,
    back: false,
    left: 0,  // Changed to number (0 to 1)
    right: 0, // Changed to number (0 to 1)
    brake: false,
    turbo: false,
    reset: false
  })

  return (
    <MobileControlsContext.Provider value={{ controls, setControls }}>
      {children}
    </MobileControlsContext.Provider>
  )
}

// Hook to use mobile controls
export const useMobileControls = () => {
  const context = useContext(MobileControlsContext)
  if (!context) {
    throw new Error('useMobileControls must be used within a MobileControlsProvider')
  }
  return context.controls
}

export default function MobileControls() {
  const acceleratorRef = useRef()
  const steeringRef = useRef()
  const context = useContext(MobileControlsContext)
  if (!context) return null
  const { setControls } = context

  useEffect(() => {
    if (!('ontouchstart' in window)) return

    const accelerator = nipplejs.create({
      zone: acceleratorRef.current,
      mode: 'static',
      position: { left: '50px', bottom: '80px' },
      color: 'white',
      size: 80,
    })

    const steering = nipplejs.create({
      zone: steeringRef.current,
      mode: 'static',
      position: { right: '50px', bottom: '80px' },
      color: 'white',
      size: 80,
    })

    accelerator.on('move', (evt, data) => {
      const y = data?.vector?.y || 0
      setControls(prev => ({
        ...prev,
        forward: y > 0.3,
        back: y < -0.3
      }))
    })

    accelerator.on('end', () => {
      setControls(prev => ({
        ...prev,
        forward: false,
        back: false
      }))
    })

    steering.on('move', (evt, data) => {
      const x = data?.vector?.x || 0
      const steeringSensitivity = 0.6
      const normalizedX = x * steeringSensitivity // Will be between -0.6 and 0.6

      setControls(prev => ({
        ...prev,
        left: Math.max(0, -normalizedX),  // Convert negative values to left
        right: Math.max(0, normalizedX)   // Convert positive values to right
      }))
    })

    steering.on('end', () => {
      setControls(prev => ({
        ...prev,
        left: 0,
        right: 0
      }))
    })

    return () => {
      accelerator.destroy()
      steering.destroy()
    }
  }, [])

  // Only render on touch devices
  if (!('ontouchstart' in window)) return null

  const handleReset = () => {
    setControls(prev => ({ ...prev, reset: true }))
    // Reset the reset flag after a short delay
    setTimeout(() => {
      setControls(prev => ({ ...prev, reset: false }))
    }, 100)
  }

  const commonStyles = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
  }

  const joystickStyle = {
    ...commonStyles,
    position: 'fixed',
    width: 80,
    height: 80,
    bottom: 20,
  }

  const labelStyle = {
    ...commonStyles,
    position: 'fixed',
    color: 'white',
    fontSize: '12px',
    textAlign: 'center',
    width: '80px',
    bottom: '110px',
    textShadow: '1px 1px 2px black',
  }

  const resetButtonStyle = {
    ...commonStyles,
    position: 'fixed',
    right: 20,
    top: 20,
    background: 'rgba(255, 255, 255, 0.3)',
    border: '2px solid white',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    backdropFilter: 'blur(5px)',
    cursor: 'pointer',
  }

  return (
    <>
      <div ref={acceleratorRef} style={{ ...joystickStyle, left: 20 }} />
      <div style={{ ...labelStyle, left: 20 }}>THROTTLE</div>
      
      <div ref={steeringRef} style={{ ...joystickStyle, right: 20 }} />
      <div style={{ ...labelStyle, right: 20 }}>STEERING</div>
      <button 
        onClick={handleReset}
        style={resetButtonStyle}
      >
        RESET
      </button>
    </>
  )
} 