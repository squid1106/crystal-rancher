import type { MonsterSpecies } from '../types'

const sheetPosition = (cell: number) => `${(cell % 4) * 100 / 3}% ${Math.floor(cell / 4) * 50}%`

export function MonsterPortrait({ species, small = false }: { species: MonsterSpecies; small?: boolean }) {
  const hasSprite = species.sprite === 'original-bestiary' && species.spriteCell !== undefined
  return (
    <div className={`monster-portrait ${small ? 'small' : ''} ${hasSprite ? 'has-sprite' : ''}`} style={{ '--monster-color': species.color } as React.CSSProperties} aria-label={`${species.name} portrait`}>
      {hasSprite ? <span className="sprite-art" style={{ backgroundPosition: sheetPosition(species.spriteCell!) }} /> : <span className={`monster-shape ${species.silhouette}`}><i /><b /></span>}
    </div>
  )
}
