// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { WaitlistCard } from './WaitlistCard'

function Harness() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate('/dressing')}>aller</button>
      <WaitlistCard />
    </>
  )
}

describe('invitation à la file d’attente', () => {
  beforeEach(() => localStorage.clear())

  it('apparaît après deux écrans, avec le lien d’inscription, et disparaît avec « Plus tard »', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('region', { name: /file d.attente/i })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'aller' }))
    const link = await screen.findByRole('link', { name: /rejoindre la file d.attente/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('systeme.io'))

    await user.click(screen.getByRole('button', { name: /plus tard/i }))
    expect(screen.queryByRole('link', { name: /rejoindre/i })).toBeNull()
  })
})
