// Achats détectés : ajouter ou ignorer d'un geste les achats trouvés (e-mails, tickets). Simulé dans le MVP.
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useWardrobe } from '../../app/WardrobeProvider'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { GarmentTile } from '../../components/GarmentTile'
import { Icon } from '../../components/Icon'
import { SubScreenHeader } from '../../components/SubScreenHeader'
import { useToast } from '../../components/Toast'
import type { PurchaseCandidate } from '../../data/repository'
import { daysBetween } from '../../domain/dates'
import { agree, formatDuration, plural } from '../../domain/wording'

const NBSP = ' '
const ERROR_MESSAGE = 'Ça n’a pas marché. Réessaie.'

const addButtonId = (purchaseId: string) => `purchase-add-${purchaseId}`

export function PurchasesScreen() {
  const { data, run } = useWardrobe()
  const { showToast } = useToast()
  const navigate = useNavigate()
  // Garde contre le double clic pendant une action (sans désactiver les boutons, pour ne pas perdre le focus).
  const busy = useRef(false)
  // Élément à focaliser une fois la liste rechargée : bouton Ajouter suivant, ou le titre.
  const focusAfterReload = useRef<string | null>(null)

  const purchases = data.purchases
  const count = purchases.length

  useEffect(() => {
    const target = focusAfterReload.current
    if (!target) return
    focusAfterReload.current = null
    document.getElementById(target)?.focus()
  }, [purchases])

  function nextFocusId(id: string): string {
    const index = purchases.findIndex((p) => p.id === id)
    const rest = purchases.filter((p) => p.id !== id)
    if (!rest.length) return 'screen-title'
    return addButtonId(rest[Math.min(Math.max(index, 0), rest.length - 1)].id)
  }

  async function handle(purchase: PurchaseCandidate, action: 'add' | 'ignore') {
    if (busy.current) return
    busy.current = true
    focusAfterReload.current = nextFocusId(purchase.id)
    try {
      if (action === 'add') {
        await run((r) => r.acceptPurchase(purchase.id))
        showToast(`${purchase.name}${NBSP}: ${agree(purchase.agreement, 'ajouté')} au dressing.`)
      } else {
        await run((r) => r.ignorePurchase(purchase.id))
        showToast(`${purchase.name}${NBSP}: ${agree(purchase.agreement, 'ignoré')}.`)
      }
    } catch {
      // L'achat reste dans la liste : le focus reste sur son bouton.
      focusAfterReload.current = null
      showToast(ERROR_MESSAGE)
    } finally {
      busy.current = false
    }
  }

  async function addAll() {
    if (busy.current) return
    busy.current = true
    const ids = purchases.map((p) => p.id)
    try {
      await run(async (r) => {
        for (const id of ids) await r.acceptPurchase(id)
      })
      showToast(`${ids.length} ${plural(ids.length, 'pièce ajoutée', 'pièces ajoutées')} au dressing.`)
      navigate('/dressing')
    } catch {
      showToast(ERROR_MESSAGE)
    } finally {
      busy.current = false
    }
  }

  return (
    <>
      <SubScreenHeader
        title="Achats détectés"
        subtitle={`Trouvés dans tes e-mails de confirmation et tes tickets. Rien à saisir${NBSP}: confirme ou ignore.`}
        backTo="/dressing"
        backLabel="Retour au dressing"
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border border-line bg-surface py-1 pr-1.5 pl-4">
          <span className="flex min-w-0 items-center gap-2.5 text-sm">
            <span className="flex flex-none" aria-hidden="true">
              <Icon name="mail" size={20} />
            </span>
            <span>Sources actives{NBSP}: e-mails, tickets</span>
          </span>
          <button
            type="button"
            className="min-h-11 flex-none rounded-xl px-3.5 text-sm font-bold text-accent-ink"
            onClick={() => showToast(`Sources${NBSP}: e-mails et tickets de caisse (exemple).`)}
          >
            Gérer
          </button>
        </div>
        {/* CLAUDE.md règle 6 : les données d'exemple sont signalées comme telles. */}
        <p className="m-0 px-1 text-[13px] leading-snug text-pretty text-muted">
          Achats d’exemple, simulés pour la démo{NBSP}: l’appli ne lit pas encore tes vrais e-mails.
        </p>
      </div>

      {count === 0 ? (
        <>
          <EmptyState title="Rien à confirmer">Les prochains achats arriveront ici.</EmptyState>
          <div className="mt-auto">
            <Button size="lg" onClick={() => navigate('/dressing')}>
              Retour au dressing
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            <h2 className="m-0 text-[13px] font-bold tracking-[0.04em] text-muted uppercase">
              À ajouter · {count}
            </h2>
            {purchases.map((p) => {
              const days = Math.max(0, daysBetween(p.detectedAt, data.today))
              return (
                <Card as="article" tight key={p.id}>
                  <div className="flex min-w-0 items-center gap-3">
                    <GarmentTile garment={p} size="sm" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h3 className="m-0 text-base leading-tight font-bold">{p.name}</h3>
                      <p className="m-0 text-[13px] text-muted">
                        {p.sourceLabel} · il y a {formatDuration(days)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      id={addButtonId(p.id)}
                      variant="primary"
                      size="sm"
                      className="flex-[1.4]"
                      aria-label={`Ajouter ${p.name}`}
                      onClick={() => handle(p, 'add')}
                    >
                      Ajouter
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      aria-label={`Ignorer ${p.name}`}
                      onClick={() => handle(p, 'ignore')}
                    >
                      Ignorer
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          <div className="mt-auto flex flex-col gap-2.5">
            <p className="m-0 text-center text-[13px] leading-snug text-pretty text-muted">
              Pour démarrer, pas d’inventaire{NBSP}: valide simplement ce que tu portes cette semaine.
            </p>
            <Button variant="solid" size="lg" onClick={addAll}>
              Tout ajouter ({count})
            </Button>
          </div>
        </>
      )}
    </>
  )
}
