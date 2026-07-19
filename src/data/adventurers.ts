import type { GameSave } from '../types'

export interface AdventurerDefinition {
  id: string
  name: string
  job: string
  description: string
  recruitmentRequirements: { label: string; test: (save: GameSave) => boolean }[]
  ranchBonus: { kind: 'recoveryMultiplier'; value: number }
  expeditionAbilities: string[]
}

export const ADVENTURERS: AdventurerDefinition[] = [
  {
    id: 'mira-white-mage', name: 'Mira', job: 'White Mage', description: 'A travelling healer drawn by the sanctuary’s flourishing herb garden.',
    recruitmentRequirements: [{ label: 'Healing Affinity 5', test: (save) => save.ranchAffinities.healing >= 5 }],
    ranchBonus: { kind: 'recoveryMultiplier', value: 0.5 }, expeditionAbilities: ['Cure'],
  },
]
