// Garde-fou de CLAUDE.md (règle 3) : le domaine reste pur, sans React, Supabase, horloge ni hasard.
import { describe, expect, it } from 'vitest'

const sources = import.meta.glob<string>(['./*.ts', '!./*.test.ts'], { query: '?raw', import: 'default', eager: true })

/** Retire les commentaires pour ne pas signaler une mention dans la documentation. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

const FORBIDDEN: [string, RegExp][] = [
  ['import de React', /from\s+['"]react/],
  ['import de Supabase', /from\s+['"]@supabase/],
  ['import hors du domaine', /from\s+['"]\.\.\//],
  ['horloge (Date.now)', /Date\.now\s*\(/],
  ['horloge (new Date() sans argument)', /new Date\(\s*\)/],
  ['hasard (Math.random)', /Math\.random\s*\(/],
  ['stockage du navigateur', /\b(localStorage|sessionStorage|indexedDB)\b/],
  ['variables d’environnement', /import\.meta\.env/],
]

describe('pureté de src/domain', () => {
  it('trouve les fichiers du domaine', () => {
    expect(Object.keys(sources).length).toBeGreaterThanOrEqual(8)
  })

  it.each(Object.entries(sources))('%s ne dépend ni de React, ni de Supabase, ni de l’horloge, ni du hasard', (_, source) => {
    const body = code(source)
    const found = FORBIDDEN.filter(([, pattern]) => pattern.test(body)).map(([label]) => label)
    expect(found).toEqual([])
  })
})
