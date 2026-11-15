import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { Canonical } from './Canonical'

afterEach(() => document.head.querySelector('link[rel="canonical"]')?.remove())

describe('Canonical', () => {
  it("points every page at the same path on the restaurant's own domain", () => {
    render(
      <MemoryRouter initialEntries={['/boka-bord']}>
        <Canonical origin="https://roma.se" />
      </MemoryRouter>,
    )
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://roma.se/boka-bord')
  })

  it('adds nothing before the restaurant has its own domain', () => {
    render(
      <MemoryRouter>
        <Canonical origin="" />
      </MemoryRouter>,
    )
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
  })
})
