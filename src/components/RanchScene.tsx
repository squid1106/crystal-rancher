import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import type { RanchLocationId } from '../types'

class RanchBackdrop extends Phaser.Scene {
  constructor() { super('RanchBackdrop') }
  create() {
    const g = this.add.graphics()
    g.fillStyle(0x9ed6bb).fillRect(0, 0, 640, 360); g.fillStyle(0x6ab07b).fillRect(0, 170, 640, 190)
    g.fillStyle(0x4f9566).fillTriangle(0, 190, 145, 48, 285, 190).fillTriangle(175, 190, 350, 35, 530, 190).fillTriangle(390, 190, 555, 68, 700, 190)
    g.fillStyle(0xe4d6a4).fillRoundedRect(54, 178, 170, 110, 8); g.fillStyle(0x6d5143).fillTriangle(40, 183, 139, 104, 239, 183); g.fillStyle(0x4a6f59).fillRect(122, 233, 34, 55)
    g.fillStyle(0x8bc271).fillRoundedRect(279, 225, 180, 88, 8); g.lineStyle(4, 0xd5b878).strokeRoundedRect(279, 225, 180, 88, 8)
    for (let x = 302; x < 445; x += 29) for (let y = 248; y < 300; y += 25) g.fillStyle(0xe9c95f).fillCircle(x, y, 4)
    g.fillStyle(0xb57c58).fillRoundedRect(485, 204, 118, 82, 8); g.fillStyle(0x725142).fillTriangle(472, 210, 544, 157, 615, 210)
    g.lineStyle(6, 0xd6bf83).lineBetween(624, 164, 624, 285); g.lineBetween(605, 181, 642, 181)
  }
}

const HOTSPOTS: { id: RanchLocationId; name: string; symbol: string; style: React.CSSProperties }[] = [
  { id: 'house', name: 'Player House', symbol: '⌂', style: { left: '13%', top: '42%' } },
  { id: 'garden', name: 'Herb Garden', symbol: '✿', style: { left: '52%', top: '61%' } },
  { id: 'habitat', name: 'Monster Habitat', symbol: '♧', style: { left: '76%', top: '48%' } },
  { id: 'storage', name: 'Resource Storage', symbol: '▣', style: { left: '25%', top: '77%' } },
  { id: 'construction', name: 'Construction Plot', symbol: '◇', style: { left: '66%', top: '79%' } },
  { id: 'gate', name: 'Expedition Gate', symbol: '⇥', style: { left: '90%', top: '34%' } },
]

export function RanchScene({ onSelect, assignedMonster, showVisitor, hasMage }: { onSelect: (id: RanchLocationId) => void; assignedMonster?: string; showVisitor: boolean; hasMage: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => { if (!host.current) return; const game = new Phaser.Game({ type: Phaser.AUTO, width: 640, height: 360, parent: host.current, backgroundColor: '#9ed6bb', pixelArt: true, scene: RanchBackdrop, render: { antialias: false } }); return () => game.destroy(true) }, [])
  return <div className="ranch-world"><div className="ranch-canvas" ref={host} aria-hidden="true" />
    {HOTSPOTS.map((spot) => <button key={spot.id} className="hotspot" style={spot.style} onClick={() => onSelect(spot.id)} aria-label={`Open ${spot.name}`}><b>{spot.symbol}</b><span>{spot.name}</span></button>)}
    {assignedMonster && <div className="worker-marker" aria-label={`${assignedMonster} is helping at the Herb Garden`}><i>●</i><span>{assignedMonster}</span></div>}
    {(showVisitor || hasMage) && <button className="visitor-marker" onClick={() => onSelect('visitor')} aria-label={hasMage ? 'Visit Mira at the habitat' : 'Speak with Mira, visiting White Mage'}><b>✚</b><span>{hasMage ? 'Mira · Resident' : 'Mira · Visitor'}</span></button>}
  </div>
}
