import { ADVENTURERS } from '../data/adventurers'
import { getAffinityReward } from '../data/affinityRewards'
import { getCrop } from '../data/crops'
import { getDestination } from '../data/destinations'
import { JOBS } from '../data/jobs'
import { getSpecies, MONSTERS } from '../data/monsters'
import { OBJECTIVES } from '../data/objectives'
import type { AffinityId, BattleAction, ExpeditionSummary, GameEvent, GameSave, MonsterInstance, ObjectiveId, ResourceId, TimePeriod } from '../types'

export const SAVE_KEY = 'ff-rancher-save-v3'
export const LEGACY_SAVE_KEY = 'ff-rancher-save-v2'
export const OLDEST_SAVE_KEY = 'ff-rancher-save-v1'

const emptyAffinities = (): Record<AffinityId, number> => ({ combat: 0, crafting: 0, harvesting: 0, harmony: 0, exploration: 0, healing: 0 })
const emptyPlot = () => ({ cropId: null, status: 'empty' as const, growthDays: 0, tendedThisCycle: false, needsTending: false })
const feedback = (save: GameSave, ...messages: string[]): GameSave => ({ ...save, feedback: [...save.feedback, ...messages].slice(-8) })
const nextPeriod: Record<TimePeriod, TimePeriod> = { morning: 'afternoon', afternoon: 'evening', evening: 'spent', spent: 'spent' }
const periodName = (period: TimePeriod) => period === 'spent' ? 'Night' : `${period[0].toUpperCase()}${period.slice(1)}`

export const createNewGame = (): GameSave => ({
  schemaVersion: 3, phase: 'intro', currentDay: 1, timePeriod: 'morning', roster: [],
  resources: { food: 8, wood: 4, stone: 2, herbSeeds: 2, herbs: 0 }, ranchAffinities: emptyAffinities(),
  buildings: ['cottage', 'herb-garden'], recruitedAdventurers: [], discoveredSpecies: MONSTERS.map((monster) => monster.id),
  battle: null, tutorialComplete: false, cropPlot: emptyPlot(), completedEventIds: [], affinityLog: [], queuedEvents: [], visitorIds: [],
  currentObjective: 'inspect-garden', feedback: ['Welcome to Briarglen Ranch. Inspect the herb garden to begin.'], yieldRemainder: 0,
  selectedCompanionId: null, selectedAdventurerId: null, discoveredDestinations: ['briarglen-forest'], expedition: null, lastExpeditionSummary: null, residentTalkDay: {},
})

export const createMonster = (speciesId: string, nickname?: string): MonsterInstance => {
  const species = getSpecies(speciesId)
  if (!species) throw new Error(`Unknown monster species: ${speciesId}`)
  return { uniqueId: `${speciesId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, speciesId, nickname: nickname?.trim() || undefined, experience: 0, level: 1, bond: 10, currentHp: species.baseStats.maxHp, assignedJob: null, recoveryDays: 0, learnedTraits: [], satiety: 70, trainingProgress: emptyAffinities(), jobProgress: {}, groomedDay: null, trainedDay: null }
}

export const chooseStarter = (save: GameSave, speciesId: string, nickname?: string): GameSave => {
  const monster = createMonster(speciesId, nickname); const species = getSpecies(speciesId)!
  const affinities = { ...save.ranchAffinities }; species.affinities.forEach(({ id, current }) => { affinities[id] += current })
  return { ...save, roster: [monster], ranchAffinities: affinities, phase: 'battle', battle: { playerHp: monster.currentHp, enemyHp: 18, enemyMaxHp: 18, enemyIndex: 0, defending: false, log: [`${monster.nickname ?? species.name} steps forward!`] } }
}

export const resolveBattleTurn = (save: GameSave, action: BattleAction): GameSave => {
  if (!save.battle || !save.roster[0]) return save
  const species = getSpecies(save.roster[0].speciesId)!; const battle = { ...save.battle, log: [...save.battle.log] }; let damage = 0
  if (action === 'attack') damage = Math.max(2, species.baseStats.attack - 2)
  if (action === 'ability') damage = species.abilities[0].power
  if (action === 'defend') battle.defending = true
  battle.enemyHp = Math.max(0, battle.enemyHp - damage); battle.log.push(action === 'defend' ? `${species.name} braces for the next strike.` : `${species.name} deals ${damage} damage!`)
  if (battle.enemyHp === 0) { battle.enemyIndex += 1; if (battle.enemyIndex >= 2) return feedback({ ...save, phase: 'ranch', battle: null }, 'The friendly trial is complete. Welcome home!'); battle.enemyHp = battle.enemyMaxHp; battle.log.push('Another friendly rival bounds into the clearing!') }
  const incoming = battle.enemyHp > 0 ? Math.max(1, 5 - (battle.defending ? 3 : 0)) : 0; battle.playerHp = Math.max(0, battle.playerHp - incoming)
  if (incoming) battle.log.push(`The rival answers for ${incoming} damage.`); battle.defending = false
  if (battle.playerHp === 0) return { ...feedback(save, `${species.name} needs time to recover.`), roster: save.roster.map((monster, index) => index === 0 ? { ...monster, currentHp: 0, recoveryDays: getRecoveryDuration(save, 2) } : monster), phase: 'ranch', battle: null }
  return { ...save, battle }
}

export const spendResource = (save: GameSave, id: ResourceId, amount: number): GameSave | null => {
  if (amount < 0 || save.resources[id] < amount) return null
  return { ...save, resources: { ...save.resources, [id]: save.resources[id] - amount } }
}

export const addResource = (save: GameSave, id: ResourceId, amount: number): GameSave => ({ ...save, resources: { ...save.resources, [id]: Math.max(0, save.resources[id] + amount) } })

const grantAffinity = (save: GameSave, rewardId: string): GameSave => {
  const reward = getAffinityReward(rewardId)
  if (!reward || (reward.once && save.completedEventIds.includes(reward.id))) return save
  const completedEventIds = reward.once ? [...save.completedEventIds, reward.id] : save.completedEventIds
  return feedback({ ...save, completedEventIds, ranchAffinities: { ...save.ranchAffinities, [reward.affinity]: save.ranchAffinities[reward.affinity] + reward.amount }, affinityLog: [...save.affinityLog, { eventId: reward.id, label: reward.label, amount: reward.amount }] }, `Healing Affinity increased to ${save.ranchAffinities[reward.affinity] + reward.amount}.`)
}

const consumeTime = (save: GameSave, actionMessage: string): GameSave => {
  if (save.timePeriod === 'spent') return feedback(save, 'No usable time remains today.')
  const timePeriod = nextPeriod[save.timePeriod]
  return feedback({ ...save, timePeriod }, actionMessage, timePeriod === 'spent' ? 'Evening has passed. No time remains today.' : `${periodName(save.timePeriod)} has passed. It is now ${periodName(timePeriod)}.`)
}

export const inspectGarden = (save: GameSave): GameSave => {
  if (save.currentObjective !== 'inspect-garden') return feedback(save, 'The herb garden has one prepared plot.')
  return grantAffinity({ ...feedback(save, 'You clear the old garden beds and find one usable plot.'), currentObjective: 'plant-herbs' }, 'garden-introduction')
}

export const plantCrop = (save: GameSave, cropId: string): GameSave => {
  const crop = getCrop(cropId)
  if (!crop || save.cropPlot.status !== 'empty' || save.timePeriod === 'spent') return feedback(save, 'The crop cannot be planted right now.')
  const paid = spendResource(save, crop.seedResource, crop.seedCost)
  if (!paid) return feedback(save, `You need ${crop.seedCost} Restorative Herb Seed.`)
  let result = consumeTime({ ...paid, cropPlot: { cropId, status: 'planted', growthDays: 0, tendedThisCycle: false, needsTending: false }, currentObjective: save.currentObjective === 'plant-herbs' ? 'assign-assistant' : save.currentObjective }, `You planted ${crop.name}, spending ${crop.seedCost} Restorative Herb Seed. Growth is now 0/${crop.baseGrowthDays} days; the plot will need tending before harvest.`)
  result = grantAffinity(result, 'first-herb-plant')
  return queueRecruitment(result)
}

export const assignJob = (save: GameSave, monsterId: string, jobId: string | null): GameSave => {
  if (jobId && !JOBS.some((job) => job.id === jobId)) return save
  const monster = save.roster.find((candidate) => candidate.uniqueId === monsterId)
  const displayName = monster?.nickname ?? (monster ? getSpecies(monster.speciesId)?.name : undefined) ?? 'Your monster'
  const objective = jobId === 'herb-garden-assistant' && save.currentObjective === 'assign-assistant' ? 'tend-crop' : jobId && save.currentObjective === 'assign-new-monster' ? 'complete' : save.currentObjective
  const jobProgress = jobId ? { ...monster?.jobProgress, [jobId]: monster?.jobProgress[jobId] ?? { level: 1, experience: 0 } } : monster?.jobProgress
  const result = { ...save, roster: save.roster.map((item) => ({ ...item, assignedJob: item.uniqueId === monsterId ? jobId : item.assignedJob === jobId ? null : item.assignedJob, jobProgress: item.uniqueId === monsterId && jobProgress ? jobProgress : item.jobProgress })), currentObjective: objective as ObjectiveId }
  return feedback(result, jobId ? `${displayName} was assigned as Herb Garden Assistant. Their matching affinity will improve the next completed harvest; assigning a job consumed no time.` : `${displayName} was removed from ranch work and is now available for care, training, or expeditions. Reassignment consumed no time.`)
}

export const tendCrop = (save: GameSave): GameSave => {
  if (save.timePeriod === 'spent' || !save.cropPlot.cropId || !save.cropPlot.needsTending || save.cropPlot.status === 'ready') return feedback(save, 'The crop does not need tending right now.')
  const result = consumeTime({ ...save, cropPlot: { ...save.cropPlot, needsTending: false, tendedThisCycle: true, status: 'growing' }, currentObjective: save.currentObjective === 'tend-crop' ? 'harvest-crop' : save.currentObjective }, 'You tended the Restorative Herbs. The crop no longer needs attention today and its full harvest yield is protected.')
  return queueRecruitment(grantAffinity(result, 'first-herb-tend'))
}

const matchingAffinity = (save: GameSave): number => {
  const worker = save.roster.find((monster) => monster.assignedJob === 'herb-garden-assistant' && monster.recoveryDays === 0)
  if (!worker) return 0
  const job = JOBS.find((item) => item.id === worker.assignedJob); const species = getSpecies(worker.speciesId)
  return species?.affinities.find((affinity) => affinity.id === job?.affinity)?.current ?? 0
}
const affinityMultiplier: Record<number, number> = { 0: 0, 1: .1, 2: .2, 3: .35, 4: .5, 5: .75 }

export const harvestCrop = (save: GameSave): GameSave => {
  const crop = save.cropPlot.cropId ? getCrop(save.cropPlot.cropId) : undefined
  if (!crop || save.cropPlot.status !== 'ready' || save.timePeriod === 'spent') return feedback(save, 'The crop is not ready to harvest.')
  const affinity = matchingAffinity(save); const rawYield = crop.baseYield * (1 + (affinityMultiplier[affinity] ?? 0)) + save.yieldRemainder
  const tendingPenalty = save.cropPlot.tendedThisCycle ? 1 : .67; const adjusted = rawYield * tendingPenalty; const yieldCount = Math.max(1, Math.floor(adjusted)); const remainder = adjusted - yieldCount
  let result = addResource({ ...save, cropPlot: emptyPlot(), yieldRemainder: remainder, currentObjective: save.currentObjective === 'harvest-crop' ? 'reach-healing-five' : save.currentObjective }, 'herbs', yieldCount)
  result = consumeTime(result, `Harvested ${yieldCount} Restorative Herbs${affinity ? ` with an Affinity ${affinity} assistant bonus` : ''}.`)
  result = grantAffinity(result, 'herb-harvest')
  if (result.ranchAffinities.healing >= 5 && result.currentObjective === 'reach-healing-five') result = { ...result, currentObjective: 'speak-with-mira' }
  return queueRecruitment(result)
}

const queueRecruitment = (save: GameSave): GameSave => {
  const id = 'mira-white-mage'; const alreadyKnown = save.visitorIds.includes(id) || save.recruitedAdventurers.includes(id) || save.queuedEvents.some((event) => event.id === 'mira-arrival')
  if (!alreadyKnown && canRecruit(save, id)) {
    const event: GameEvent = { id: 'mira-arrival', kind: 'visitor', message: 'A White Mage has arrived at the ranch gate.', day: save.currentDay }
    return feedback({ ...save, queuedEvents: [...save.queuedEvents, event], visitorIds: [...save.visitorIds, id], currentObjective: 'speak-with-mira' }, event.message)
  }
  return save
}

export const advanceDay = (save: GameSave): GameSave => {
  let cropPlot = { ...save.cropPlot }
  if (cropPlot.cropId) {
    const crop = getCrop(cropPlot.cropId)!
    cropPlot.growthDays += 1
    if (cropPlot.growthDays >= crop.baseGrowthDays) cropPlot = { ...cropPlot, status: 'ready', needsTending: false }
    else cropPlot = { ...cropPlot, status: 'needs-tending', needsTending: true }
  }
  const foodCost = save.roster.filter((monster) => monster.recoveryDays === 0).length
  const hasHealer = save.recruitedAdventurers.some((id) => ADVENTURERS.find((adventurer) => adventurer.id === id)?.ranchBonus.kind === 'recoveryMultiplier')
  const injured = save.roster.filter((monster) => monster.currentHp < getSpecies(monster.speciesId)!.baseStats.maxHp).sort((a, b) => a.currentHp / getSpecies(a.speciesId)!.baseStats.maxHp - b.currentHp / getSpecies(b.speciesId)!.baseStats.maxHp)[0]
  const result = { ...save, currentDay: save.currentDay + 1, timePeriod: 'morning' as const, cropPlot, resources: { ...save.resources, food: Math.max(0, save.resources.food - foodCost) }, roster: save.roster.map((monster) => ({ ...monster, satiety: Math.max(0, monster.satiety - 15), recoveryDays: Math.max(0, monster.recoveryDays - 1), currentHp: Math.min(getSpecies(monster.speciesId)!.baseStats.maxHp, monster.recoveryDays === 1 ? getSpecies(monster.speciesId)!.baseStats.maxHp : monster.currentHp + (hasHealer && injured?.uniqueId === monster.uniqueId ? 3 : 0)) })) }
  return feedback(queueRecruitment(result), `Day ${result.currentDay} begins. It is Morning.`, cropPlot.status === 'ready' ? 'The Restorative Herbs are ready to harvest.' : cropPlot.needsTending ? 'The growing herbs need tending today.' : 'The ranch rests quietly overnight.')
}

export const canRecruit = (save: GameSave, adventurerId: string): boolean => {
  const adventurer = ADVENTURERS.find((candidate) => candidate.id === adventurerId)
  return !!adventurer && adventurer.recruitmentRequirements.every((requirement) => requirement.test(save))
}

export const speakWithVisitor = (save: GameSave, adventurerId: string): GameSave => {
  if (!save.visitorIds.includes(adventurerId)) return save
  return feedback({ ...save, currentObjective: save.currentObjective === 'speak-with-mira' ? 'recruit-mira' : save.currentObjective, completedEventIds: save.completedEventIds.includes('spoke-mira') ? save.completedEventIds : [...save.completedEventIds, 'spoke-mira'] }, 'Mira: “You are building something precious here. I would be honored to help these creatures recover.”')
}

export const getRecoveryDuration = (save: GameSave, baseDays: number): number => {
  const multiplier = save.recruitedAdventurers.map((id) => ADVENTURERS.find((adventurer) => adventurer.id === id)?.ranchBonus).filter((bonus) => bonus?.kind === 'recoveryMultiplier').reduce((value, bonus) => value * (bonus?.value ?? 1), 1)
  return Math.max(1, Math.ceil(baseDays * multiplier))
}

export const recruitAdventurer = (save: GameSave, adventurerId: string): GameSave => {
  if (!canRecruit(save, adventurerId) || !save.visitorIds.includes(adventurerId) || !save.completedEventIds.includes('spoke-mira') || save.recruitedAdventurers.includes(adventurerId)) return save
  const adventurer = ADVENTURERS.find((candidate) => candidate.id === adventurerId)!; const multiplier = adventurer.ranchBonus.kind === 'recoveryMultiplier' ? adventurer.ranchBonus.value : 1
  return feedback({ ...save, recruitedAdventurers: [...save.recruitedAdventurers, adventurerId], visitorIds: save.visitorIds.filter((id) => id !== adventurerId), tutorialComplete: true, currentObjective: 'speak-forest', roster: save.roster.map((monster) => ({ ...monster, recoveryDays: monster.recoveryDays > 0 ? Math.max(1, Math.ceil(monster.recoveryDays * multiplier)) : 0 })) }, `${adventurer.name} joined the sanctuary. Monster recovery time is now halved.`)
}

export const talkToResident = (save: GameSave, adventurerId: string): GameSave => {
  if (!save.recruitedAdventurers.includes(adventurerId)) return save
  const firstForestTalk = save.currentObjective === 'speak-forest'
  return feedback({ ...save, residentTalkDay: { ...save.residentTalkDay, [adventurerId]: save.currentDay }, currentObjective: firstForestTalk ? 'prepare-expedition' : save.currentObjective }, firstForestTalk ? 'Mira marks a safe route through Briarglen Forest and offers to accompany you.' : 'Mira: “The forest changes every day. Listen before you act.”')
}

export const feedMonster = (save: GameSave, monsterId: string): GameSave => {
  const monster = save.roster.find((item) => item.uniqueId === monsterId)
  if (!monster || monster.satiety >= 100 || save.timePeriod === 'spent') return feedback(save, monster?.satiety === 100 ? 'That monster is already full.' : 'Feeding is unavailable.')
  const paid = spendResource(save, 'food', 1); if (!paid) return feedback(save, 'You need 1 Food.')
  const result = { ...paid, roster: paid.roster.map((item) => item.uniqueId === monsterId ? { ...item, satiety: Math.min(100, item.satiety + 35), bond: Math.min(100, item.bond + 2) } : item), currentObjective: save.currentObjective === 'care-returning' ? (save.roster.length > 1 ? 'assign-new-monster' : 'complete') : save.currentObjective }
  return consumeTime(result, `${monster.nickname ?? getSpecies(monster.speciesId)!.name} ate a hearty meal. Food −1; fullness ${monster.satiety}% → ${Math.min(100, monster.satiety + 35)}%; bond ${monster.bond} → ${Math.min(100, monster.bond + 2)}.`)
}

export const groomMonster = (save: GameSave, monsterId: string): GameSave => {
  const monster = save.roster.find((item) => item.uniqueId === monsterId)
  if (!monster || monster.groomedDay === save.currentDay || save.timePeriod === 'spent') return feedback(save, 'Grooming is unavailable or already completed today.')
  const result = { ...save, roster: save.roster.map((item) => item.uniqueId === monsterId ? { ...item, bond: Math.min(100, item.bond + 4), groomedDay: save.currentDay } : item), currentObjective: save.currentObjective === 'care-returning' ? (save.roster.length > 1 ? 'assign-new-monster' : 'complete') : save.currentObjective }
  return consumeTime(result, `${monster.nickname ?? getSpecies(monster.speciesId)!.name} was groomed and looks refreshed. Bond ${monster.bond} → ${Math.min(100, monster.bond + 4)}; grooming is now complete for Day ${save.currentDay}.`)
}

export const trainMonster = (save: GameSave, monsterId: string, kind: 'combat' | 'affinity'): GameSave => {
  const monster = save.roster.find((item) => item.uniqueId === monsterId); if (!monster || monster.trainedDay === save.currentDay || save.timePeriod === 'spent' || monster.recoveryDays > 0) return feedback(save, 'Training is unavailable or already completed today.')
  const species = getSpecies(monster.speciesId)!; let updated = { ...monster, experience: monster.experience + (kind === 'combat' ? 6 : 2), trainedDay: save.currentDay, trainingProgress: { ...monster.trainingProgress } }
  if (kind === 'affinity') { const affinity = species.affinities[0]; updated.trainingProgress[affinity.id] += 10 }
  return consumeTime({ ...save, roster: save.roster.map((item) => item.uniqueId === monsterId ? updated : item) }, kind === 'combat' ? `${monster.nickname ?? species.name} completed Combat Training. Experience ${monster.experience} → ${updated.experience}; training is now complete for Day ${save.currentDay}.` : `${monster.nickname ?? species.name} completed Affinity Training. Experience ${monster.experience} → ${updated.experience}; ${species.affinities[0].id} training progress increased by 10 without exceeding the species cap.`)
}

export const treatMonster = (save: GameSave, monsterId: string): GameSave => {
  const monster = save.roster.find((item) => item.uniqueId === monsterId); if (!monster || save.timePeriod === 'spent') return save
  const species = getSpecies(monster.speciesId)!; if (monster.currentHp >= species.baseStats.maxHp && monster.recoveryDays === 0) return feedback(save, 'That monster does not need treatment.')
  const bonus = save.recruitedAdventurers.length ? 2 : 0
  const healedHp = Math.min(species.baseStats.maxHp, monster.currentHp + 4 + bonus); const recoveryDays = Math.max(0, monster.recoveryDays - (bonus ? 2 : 1))
  return consumeTime({ ...save, roster: save.roster.map((item) => item.uniqueId === monsterId ? { ...item, currentHp: healedHp, recoveryDays } : item) }, `${monster.nickname ?? species.name} received treatment${bonus ? ' with Mira’s resident bonus' : ''}. HP ${monster.currentHp} → ${healedHp}; recovery ${monster.recoveryDays} → ${recoveryDays} days.`)
}

export const openExpeditionPrep = (save: GameSave): GameSave => {
  if (save.timePeriod === 'evening' || save.timePeriod === 'spent') return feedback(save, 'Expeditions may begin only during Morning or Afternoon.')
  return { ...feedback(save, 'Choose a companion and review the forest route.'), phase: 'expedition-prep', currentObjective: save.currentObjective === 'prepare-expedition' ? 'select-companion' : save.currentObjective }
}

export const selectExpeditionParty = (save: GameSave, companionId: string, adventurerId: string | null): GameSave => {
  const companion = save.roster.find((monster) => monster.uniqueId === companionId && monster.recoveryDays === 0)
  if (!companion || (adventurerId && !save.recruitedAdventurers.includes(adventurerId))) return save
  return { ...save, selectedCompanionId: companionId, selectedAdventurerId: adventurerId, currentObjective: save.currentObjective === 'select-companion' ? 'enter-forest' : save.currentObjective }
}

export const beginExpedition = (save: GameSave, destinationId: string): GameSave => {
  if (!save.selectedCompanionId || !getDestination(destinationId) || save.timePeriod === 'evening' || save.timePeriod === 'spent') return feedback(save, 'Select an eligible companion before leaving.')
  return feedback({ ...save, phase: 'expedition', timePeriod: 'spent', currentObjective: save.currentObjective === 'enter-forest' ? 'gather-resource' : save.currentObjective, expedition: { destinationId, companionId: save.selectedCompanionId, adventurerId: save.selectedAdventurerId, areaIndex: 0, temporaryResources: {}, gatheredNodeIds: [], encounteredAreaIds: [], battlesWon: 0, tamingAttempts: 0, tamedMonsterId: null, enemySpeciesId: null, enemyHp: 0, enemyMaxHp: 0, enemyTrust: 10, enemyFear: 20, enemyHunger: 60, monsterDefending: false, log: ['The party enters Briarglen Forest.'] } }, 'The expedition consumes the rest of the day.')
}

export const gatherNode = (save: GameSave): GameSave => {
  if (!save.expedition) return save; const destination = getDestination(save.expedition.destinationId)!; const area = destination.areas[save.expedition.areaIndex]; const node = area.node
  if (!node || save.expedition.gatheredNodeIds.includes(node.id)) return feedback(save, 'Nothing more can be gathered here this expedition.')
  const temporaryResources = { ...save.expedition.temporaryResources, [node.resource]: (save.expedition.temporaryResources[node.resource] ?? 0) + node.amount }
  return feedback({ ...save, currentObjective: save.currentObjective === 'gather-resource' ? 'win-battle' : save.currentObjective, expedition: { ...save.expedition, temporaryResources, gatheredNodeIds: [...save.expedition.gatheredNodeIds, node.id] } }, `You gathered ${node.amount} ${node.resource}. The expedition pack now holds ${temporaryResources[node.resource]} ${node.resource}; it will transfer to ranch storage after a safe return.`)
}

export const moveExpedition = (save: GameSave, direction: 1 | -1): GameSave => {
  if (!save.expedition || save.phase !== 'expedition') return save; const destination = getDestination(save.expedition.destinationId)!; const areaIndex = Math.max(0, Math.min(destination.areas.length - 1, save.expedition.areaIndex + direction)); const area = destination.areas[areaIndex]
  let expedition = { ...save.expedition, areaIndex }
  const encounteredAreaIds = expedition.encounteredAreaIds ?? []
  if (area.encounterSpeciesId && !encounteredAreaIds.includes(area.id)) { const species = getSpecies(area.encounterSpeciesId)!; expedition = { ...expedition, encounteredAreaIds: [...encounteredAreaIds, area.id], enemySpeciesId: species.id, enemyHp: species.baseStats.maxHp, enemyMaxHp: species.baseStats.maxHp, enemyTrust: 10, enemyFear: 20, enemyHunger: 60, log: [...expedition.log, `A wild ${species.name} appears!`] }; return { ...save, phase: 'expedition-combat', expedition, discoveredSpecies: save.discoveredSpecies.includes(species.id) ? save.discoveredSpecies : [...save.discoveredSpecies, species.id] } }
  return { ...save, expedition }
}

export type ExpeditionAction = 'monster-attack' | 'monster-ability' | 'defend' | 'mira-cure' | 'encourage' | 'offer-food' | 'tame' | 'flee'
export const getTamingChance = (save: GameSave): number => {
  const enemySpeciesId = save.expedition?.enemySpeciesId
  if (!save.expedition || !enemySpeciesId) return 0
  const e = save.expedition; const species = getSpecies(enemySpeciesId)!
  const hpAdvantage = (1 - e.enemyHp / e.enemyMaxHp) * 25
  const rawChance = 8 + e.enemyTrust * .45 + hpAdvantage - e.enemyFear * .25 - (species.tamingDifficulty ?? 40) * .35
  return Math.max(3, Math.min(85, Math.round(rawChance)))
}
export const expeditionCombatAction = (save: GameSave, action: ExpeditionAction): GameSave => {
  if (!save.expedition?.enemySpeciesId) return save; const enemyId = save.expedition.enemySpeciesId; const expedition = { ...save.expedition, log: [...save.expedition.log] }; const companion = save.roster.find((monster) => monster.uniqueId === expedition.companionId)!; const companionSpecies = getSpecies(companion.speciesId)!; const enemy = getSpecies(enemyId)!; let roster = [...save.roster]
  if (action === 'monster-attack' || action === 'monster-ability') { const damage = action === 'monster-ability' ? companionSpecies.abilities[0].power : Math.max(2, companionSpecies.baseStats.attack - 2); expedition.enemyHp = Math.max(0, expedition.enemyHp - damage); expedition.enemyFear += 8; expedition.log.push(`${companionSpecies.name} deals ${damage} damage.`) }
  if (action === 'defend') { expedition.monsterDefending = true; expedition.log.push(`${companionSpecies.name} defends.`) }
  if (action === 'encourage') { expedition.enemyTrust += 18; expedition.enemyFear = Math.max(0, expedition.enemyFear - 8); expedition.log.push(`Your calm voice earns a little trust.`) }
  if (action === 'offer-food') { const preferred = enemy.foodPreferences?.[0] ?? 'food'; const paid = spendResource({ ...save, roster }, preferred, 1); if (!paid) { const message = `You cannot offer food: the ranch inventory has 0 ${preferred}. Gather or bring at least 1 ${preferred} first.`; expedition.log.push(message); return feedback({ ...save, expedition }, message) } roster = paid.roster; expedition.enemyTrust = Math.min(100, expedition.enemyTrust + 25); expedition.enemyHunger = Math.max(0, expedition.enemyHunger - 35); expedition.log.push(`${enemy.name} eagerly accepts 1 ${preferred}. Trust rises and hunger falls.`); save = paid }
  if (action === 'mira-cure' && expedition.adventurerId) { roster = roster.map((monster) => monster.uniqueId === companion.uniqueId ? { ...monster, currentHp: Math.min(companionSpecies.baseStats.maxHp, monster.currentHp + 7) } : monster); expedition.log.push('Mira casts Cure for 7 HP.') }
  if (action === 'tame') { expedition.tamingAttempts += 1; const chance = getTamingChance({ ...save, expedition }); const success = Math.random() * 100 < chance; if (success) { const tamed = createMonster(enemy.id); expedition.tamedMonsterId = tamed.uniqueId; expedition.enemySpeciesId = null; roster = [...roster, tamed]; expedition.log.push(`${enemy.name} chooses to join the sanctuary! The attempt succeeded, but taming was never guaranteed.`); return feedback({ ...save, roster, phase: 'expedition', currentObjective: save.currentObjective === 'attempt-tame' ? 'return-ranch' : save.currentObjective, expedition }, `${enemy.name} was successfully tamed.`) } expedition.enemyFear = Math.min(100, expedition.enemyFear + 6); expedition.log.push(`The taming attempt fails. ${enemy.name} resists and becomes more frightened.`) }
  if (action === 'flee') return { ...save, roster, phase: 'expedition', expedition: { ...expedition, enemySpeciesId: null } }
  if (expedition.enemyHp === 0) { expedition.battlesWon += 1; expedition.enemySpeciesId = null; roster = roster.map((monster) => monster.uniqueId === companion.uniqueId ? { ...monster, experience: monster.experience + 8, bond: Math.min(100, monster.bond + 1) } : monster); return feedback({ ...save, roster, phase: 'expedition', currentObjective: save.currentObjective === 'win-battle' ? 'attempt-tame' : save.currentObjective, expedition }, 'The wild monster retreats. Battle won!') }
  const fleeChance = (expedition.enemyHp / expedition.enemyMaxHp <= .35 ? 30 : 0) + (expedition.enemyFear >= 70 ? 25 : 0)
  if (fleeChance > 0 && Math.random() * 100 < fleeChance) { expedition.enemySpeciesId = null; expedition.log.push(`${enemy.name} panics and flees into the forest. The encounter is over.`); return feedback({ ...save, roster, phase: 'expedition', expedition }, `${enemy.name} fled before it could be tamed.`) }
  const enemyDamage = Math.max(2, enemy.baseStats.attack - Math.floor(companionSpecies.baseStats.defense / 2) - (expedition.monsterDefending ? 4 : 0)); expedition.monsterDefending = false; roster = roster.map((monster) => monster.uniqueId === companion.uniqueId ? { ...monster, currentHp: Math.max(0, monster.currentHp - enemyDamage) } : monster); expedition.log.push(`${enemy.name} strikes back for ${enemyDamage} damage.`)
  const after = roster.find((monster) => monster.uniqueId === companion.uniqueId)!; if (after.currentHp === 0) return returnFromExpedition({ ...save, roster, expedition }, true)
  return { ...save, roster, expedition }
}

export const getTamingLikelihood = (save: GameSave): string => {
  const chance = getTamingChance(save)
  return chance >= 70 ? 'Very Likely' : chance >= 50 ? 'Likely' : chance >= 30 ? 'Possible' : chance >= 15 ? 'Unlikely' : 'Very Unlikely'
}

export const returnFromExpedition = (save: GameSave, defeated = false): GameSave => {
  if (!save.expedition) return save; const ratio = defeated ? .5 : 1; let resources = { ...save.resources }; const transferred: Partial<Record<ResourceId, number>> = {}
  Object.entries(save.expedition.temporaryResources).forEach(([id, amount]) => { const kept = Math.floor((amount ?? 0) * ratio); resources[id as ResourceId] += kept; transferred[id as ResourceId] = kept })
  const companion = save.roster.find((monster) => monster.uniqueId === save.expedition!.companionId)!; const summary: ExpeditionSummary = { resources: transferred, battlesWon: save.expedition.battlesWon, tamedSpeciesId: save.expedition.tamedMonsterId ? save.roster.find((monster) => monster.uniqueId === save.expedition!.tamedMonsterId)?.speciesId ?? null : null, experienceGained: save.expedition.battlesWon * 8, bondGained: defeated ? 0 : 2, defeated }
  const roster = save.roster.map((monster) => monster.uniqueId === companion.uniqueId ? { ...monster, bond: Math.min(100, monster.bond + summary.bondGained), recoveryDays: defeated ? getRecoveryDuration(save, 2) : monster.recoveryDays } : monster)
  return feedback({ ...save, roster, resources, phase: 'expedition-summary', lastExpeditionSummary: summary, currentObjective: save.currentObjective === 'return-ranch' ? 'care-returning' : save.currentObjective, expedition: null }, defeated ? 'The party was forced home with half its gathered resources.' : 'The expedition returned safely to Briarglen Ranch.')
}

export const closeExpeditionSummary = (save: GameSave): GameSave => ({ ...save, phase: 'ranch' })

export const getObjective = (save: GameSave) => OBJECTIVES[save.currentObjective]
export const serializeSave = (save: GameSave) => JSON.stringify(save)

export const migrateSave = (value: Record<string, unknown>): GameSave => {
  if (value.schemaVersion === 3) return value as unknown as GameSave
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2) throw new Error('Unsupported save data')
  const old = value as any; const oldResources = old.resources ?? {}
  const base = createNewGame()
  return { ...base, ...old, schemaVersion: 3, phase: ['expedition-prep','expedition','expedition-combat','expedition-summary'].includes(old.phase) ? 'ranch' : old.phase === 'recruitment' ? 'ranch' : old.phase, resources: { food: oldResources.food ?? 8, wood: oldResources.wood ?? 4, stone: oldResources.stone ?? 2, herbSeeds: oldResources.herbSeeds ?? 2, herbs: oldResources.herbs ?? 0 }, timePeriod: old.timePeriod ?? 'morning', cropPlot: old.cropPlot ?? emptyPlot(), completedEventIds: old.completedEventIds ?? (old.recruitedAdventurers?.includes('mira-white-mage') ? ['mira-arrival', 'spoke-mira'] : []), affinityLog: old.affinityLog ?? [], queuedEvents: old.queuedEvents ?? [], visitorIds: old.visitorIds ?? [], currentObjective: old.currentObjective === 'complete' && old.recruitedAdventurers?.includes('mira-white-mage') ? 'speak-forest' : old.currentObjective ?? 'inspect-garden', feedback: ['Your ranch save was safely updated.'], yieldRemainder: old.yieldRemainder ?? 0, roster: (old.roster ?? []).map((monster: MonsterInstance) => ({ ...createMonster(monster.speciesId, monster.nickname), ...monster, assignedJob: monster.assignedJob === 'herb-garden' ? 'herb-garden-assistant' : monster.assignedJob })) }
}

export const deserializeSave = (raw: string): GameSave => {
  const value = JSON.parse(raw) as Record<string, unknown>
  if (!value.resources || !value.ranchAffinities || !value.roster) throw new Error('Invalid save data')
  return queueRecruitment(migrateSave(value))
}
