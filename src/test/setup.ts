import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { MotionGlobalConfig } from 'motion/react'
import { afterEach } from 'vitest'

// Tests : animations instantanées, pour ne pas attendre les transitions entre écrans.
MotionGlobalConfig.skipAnimations = true

afterEach(() => {
  if (typeof document !== 'undefined') cleanup()
})
