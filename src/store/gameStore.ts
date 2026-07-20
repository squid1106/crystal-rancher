import { create } from 'zustand'
import { advanceDay, assignJob, beginExpedition, beginTutorialBattle, chooseStarter, closeExpeditionSummary, createNewGame, deserializeSave, expeditionCombatAction, feedMonster, gatherNode, groomMonster, harvestCrop, inspectGarden, LEGACY_SAVE_KEY, moveExpedition, OLDEST_SAVE_KEY, openExpeditionPrep, plantCrop, recruitAdventurer, resolveBattleTurn, returnFromExpedition, SAVE_KEY, selectExpeditionParty, serializeSave, speakWithVisitor, talkToResident, tendCrop, trainMonster, treatMonster } from '../systems/game'
import type { ExpeditionAction } from '../systems/game'
import type { BattleAction, GameSave } from '../types'

interface GameStore {
  save: GameSave | null; hasSave: boolean
  newGame: () => void; continueGame: () => void; goToStarters: () => void; selectStarter: (speciesId: string, nickname?: string) => void; beginTutorialBattle: () => void
  battleAction: (action: BattleAction) => void; inspectGarden: () => void; plantHerbs: () => void; tendHerbs: () => void; harvestHerbs: () => void
  assignGarden: (monsterId: string) => void; unassignMonster: (monsterId: string) => void; nextDay: () => void
  speakWithMira: () => void; recruitWhiteMage: () => void; returnToTitle: () => void
  talkToMira: () => void; feed: (id: string) => void; groom: (id: string) => void; train: (id: string, kind: 'combat' | 'affinity') => void; treat: (id: string) => void
  prepareExpedition: () => void; selectParty: (companionId: string, adventurerId: string | null) => void; depart: () => void; gather: () => void; move: (direction: 1 | -1) => void; expeditionAction: (action: ExpeditionAction) => void; returnHome: () => void; closeSummary: () => void
}

const getStored = () => localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(LEGACY_SAVE_KEY) ?? localStorage.getItem(OLDEST_SAVE_KEY)
const persist = (save: GameSave) => { localStorage.setItem(SAVE_KEY, serializeSave(save)); return save }
const mutate = (set: (value: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void, fn: (save: GameSave) => GameSave) => set(({ save }) => save ? { save: persist(fn(save)) } : {})

export const useGameStore = create<GameStore>((set) => ({
  save: null, hasSave: typeof localStorage !== 'undefined' && !!getStored(),
  newGame: () => set({ save: persist(createNewGame()), hasSave: true }),
  continueGame: () => set(() => { const raw = getStored(); return raw ? { save: persist(deserializeSave(raw)), hasSave: true } : { save: persist(createNewGame()), hasSave: true } }),
  goToStarters: () => mutate(set, (save) => ({ ...save, phase: 'starter' })),
  selectStarter: (speciesId, nickname) => mutate(set, (save) => chooseStarter(save, speciesId, nickname)),
  beginTutorialBattle: () => mutate(set, beginTutorialBattle),
  battleAction: (action) => mutate(set, (save) => resolveBattleTurn(save, action)),
  inspectGarden: () => mutate(set, inspectGarden), plantHerbs: () => mutate(set, (save) => plantCrop(save, 'restorative-herbs')),
  tendHerbs: () => mutate(set, tendCrop), harvestHerbs: () => mutate(set, harvestCrop),
  assignGarden: (monsterId) => mutate(set, (save) => assignJob(save, monsterId, 'herb-garden-assistant')),
  unassignMonster: (monsterId) => mutate(set, (save) => assignJob(save, monsterId, null)), nextDay: () => mutate(set, advanceDay),
  speakWithMira: () => mutate(set, (save) => speakWithVisitor(save, 'mira-white-mage')),
  recruitWhiteMage: () => mutate(set, (save) => recruitAdventurer(save, 'mira-white-mage')),
  talkToMira: () => mutate(set, (save) => talkToResident(save, 'mira-white-mage')),
  feed: (id) => mutate(set, (save) => feedMonster(save, id)), groom: (id) => mutate(set, (save) => groomMonster(save, id)), train: (id, kind) => mutate(set, (save) => trainMonster(save, id, kind)), treat: (id) => mutate(set, (save) => treatMonster(save, id)),
  prepareExpedition: () => mutate(set, openExpeditionPrep), selectParty: (companionId, adventurerId) => mutate(set, (save) => selectExpeditionParty(save, companionId, adventurerId)), depart: () => mutate(set, (save) => beginExpedition(save, 'briarglen-forest')),
  gather: () => mutate(set, gatherNode), move: (direction) => mutate(set, (save) => moveExpedition(save, direction)), expeditionAction: (action) => mutate(set, (save) => expeditionCombatAction(save, action)), returnHome: () => mutate(set, (save) => returnFromExpedition(save)), closeSummary: () => mutate(set, closeExpeditionSummary),
  returnToTitle: () => set({ save: null, hasSave: !!getStored() }),
}))
