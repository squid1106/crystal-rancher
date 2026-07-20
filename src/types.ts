export type AffinityId = 'combat' | 'crafting' | 'harvesting' | 'harmony' | 'exploration' | 'healing'
export type ResourceId = 'food' | 'wood' | 'stone' | 'herbSeeds' | 'herbs'
export type GamePhase = 'title' | 'intro' | 'starter' | 'journey' | 'battle' | 'ranch' | 'expedition-prep' | 'expedition' | 'expedition-combat' | 'expedition-summary'
export type BattleAction = 'attack' | 'skill' | 'magic' | 'item' | 'flee'
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'spent'
export type CropStatus = 'empty' | 'planted' | 'growing' | 'needs-tending' | 'ready'
export type ObjectiveId = 'inspect-garden' | 'plant-herbs' | 'assign-assistant' | 'tend-crop' | 'harvest-crop' | 'reach-healing-five' | 'speak-with-mira' | 'recruit-mira' | 'speak-forest' | 'prepare-expedition' | 'select-companion' | 'enter-forest' | 'gather-resource' | 'win-battle' | 'attempt-tame' | 'return-ranch' | 'care-returning' | 'assign-new-monster' | 'complete'
export type RanchLocationId = 'house' | 'garden' | 'habitat' | 'storage' | 'construction' | 'gate' | 'visitor'

export interface AffinityValue { id: AffinityId; current: number; cap: number }

export interface MonsterSpecies {
  id: string
  name: string
  description: string
  tier: number
  color: string
  silhouette: 'horn' | 'gear' | 'leaf' | 'star' | 'bird'
  baseStats: { maxHp: number; attack: number; defense: number }
  affinities: AffinityValue[]
  abilities: { id: string; name: string; power: number; description: string }[]
  spells?: { id: string; name: string; power: number; healing?: boolean; element: string; minimumLevel: number; minimumTier: number; description: string }[]
  diet: ResourceId[]
  habitat: string[]
  portrait: string
  sprite: string
  spriteCell?: number
  tamingDifficulty?: number
  foodPreferences?: ResourceId[]
  workCapabilities?: string[]
}

export interface MonsterInstance {
  uniqueId: string
  speciesId: string
  nickname?: string
  experience: number
  level: number
  bond: number
  currentHp: number
  assignedJob: string | null
  recoveryDays: number
  learnedTraits: string[]
  satiety: number
  trainingProgress: Record<AffinityId, number>
  jobProgress: Record<string, { level: number; experience: number }>
  groomedDay: number | null
  trainedDay: number | null
}

export interface ExpeditionState {
  destinationId: string
  companionId: string
  adventurerId: string | null
  areaIndex: number
  temporaryResources: Partial<Record<ResourceId, number>>
  gatheredNodeIds: string[]
  encounteredAreaIds: string[]
  battlesWon: number
  tamingAttempts: number
  tamedMonsterId: string | null
  enemySpeciesId: string | null
  enemyHp: number
  enemyMaxHp: number
  enemyTrust: number
  enemyFear: number
  enemyHunger: number
  monsterDefending: boolean
  log: string[]
}

export interface ExpeditionSummary {
  resources: Partial<Record<ResourceId, number>>
  battlesWon: number
  tamedSpeciesId: string | null
  experienceGained: number
  bondGained: number
  defeated: boolean
}

export interface BattleState {
  playerHp: number
  enemyHp: number
  enemyMaxHp: number
  enemyIndex: number
  log: string[]
}

export interface CropPlot {
  cropId: string | null
  status: CropStatus
  growthDays: number
  tendedThisCycle: boolean
  needsTending: boolean
}

export interface GameEvent { id: string; kind: string; message: string; day: number }

export interface GameSave {
  schemaVersion: 3
  phase: GamePhase
  currentDay: number
  roster: MonsterInstance[]
  resources: Record<ResourceId, number>
  ranchAffinities: Record<AffinityId, number>
  buildings: string[]
  recruitedAdventurers: string[]
  discoveredSpecies: string[]
  battle: BattleState | null
  tutorialComplete: boolean
  timePeriod: TimePeriod
  cropPlot: CropPlot
  completedEventIds: string[]
  affinityLog: { eventId: string; label: string; amount: number }[]
  queuedEvents: GameEvent[]
  visitorIds: string[]
  currentObjective: ObjectiveId
  feedback: string[]
  yieldRemainder: number
  selectedCompanionId: string | null
  selectedAdventurerId: string | null
  discoveredDestinations: string[]
  expedition: ExpeditionState | null
  lastExpeditionSummary: ExpeditionSummary | null
  residentTalkDay: Record<string, number>
}
