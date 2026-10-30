import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { MotionGlobalConfig } from 'motion/react'
import { afterEach } from 'vitest'

// Tests : animations instantanées, pour ne pas attendre les transitions entre écrans.
MotionGlobalConfig.skipAnimations = true
// Les écrans changent après une transition : sur une machine chargée, findBy* attend jusqu'à 3 s au lieu d'1.
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  if (typeof document !== 'undefined') cleanup()
})
