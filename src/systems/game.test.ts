import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addResource, advanceDay, assignJob, beginExpedition, canRecruit, chooseStarter, createNewGame, deserializeSave, expeditionCombatAction, feedMonster, gatherNode, getRecoveryDuration, groomMonster, harvestCrop, inspectGarden, migrateSave, moveExpedition, openExpeditionPrep, plantCrop, recruitAdventurer, resolveBattleTurn, returnFromExpedition, selectExpeditionParty, serializeSave, speakWithVisitor, spendResource, talkToResident, tendCrop, trainMonster } from './game'
import type { GameSave } from '../types'

const ranchGame = (): GameSave => ({ ...chooseStarter(createNewGame(), 'sprigbud', 'Fern'), phase: 'ranch', battle: null })
const plantedGame = () => plantCrop(inspectGarden(ranchGame()), 'restorative-herbs')

describe('playable ranch day simulation', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1000))

  it('creates and round-trips a versioned save', () => {
    const save = createNewGame()
    expect(save.schemaVersion).toBe(3)
    expect(deserializeSave(serializeSave(save))).toEqual(save)
  })

  it('advances a time period after a meaningful action', () => {
    const save = plantedGame()
    expect(save.timePeriod).toBe('afternoon')
    expect(save.feedback.some((message) => message.includes('Afternoon'))).toBe(true)
  })

  it('reports exact visible consequences for monster care actions', () => {
    const save = ranchGame(); const monster = save.roster[0]
    const fed = feedMonster(save, monster.uniqueId)
    expect(fed.feedback.at(-2)).toContain('Food −1')
    expect(fed.feedback.at(-2)).toContain(`fullness ${monster.satiety}%`)
    expect(fed.feedback.at(-2)).toContain(`bond ${monster.bond}`)
    expect(fed.feedback.at(-1)).toContain('Afternoon')
  })

  it('resets time to Morning and advances the day', () => {
    const save = advanceDay(plantedGame())
    expect(save.currentDay).toBe(2)
    expect(save.timePeriod).toBe('morning')
  })

  it('does not grant free affinity or herbs for ending an empty day', () => {
    const before = ranchGame(); const after = advanceDay(before)
    expect(after.ranchAffinities).toEqual(before.ranchAffinities)
    expect(after.resources.herbs).toBe(before.resources.herbs)
  })

  it('charges planting cost and never permits negative resources', () => {
    const planted = plantedGame()
    expect(planted.resources.herbSeeds).toBe(1)
    const empty = { ...ranchGame(), resources: { ...ranchGame().resources, herbSeeds: 0 } }
    expect(plantCrop(empty, 'restorative-herbs').resources.herbSeeds).toBe(0)
    expect(spendResource(empty, 'herbSeeds', 1)).toBeNull()
    expect(addResource(empty, 'wood', -99).resources.wood).toBe(0)
  })

  it('grows over multiple days and requires tending before maturity', () => {
    let save = advanceDay(plantedGame())
    expect(save.cropPlot.status).toBe('needs-tending')
    save = tendCrop(save)
    expect(save.cropPlot.tendedThisCycle).toBe(true)
    save = advanceDay(save)
    expect(save.cropPlot.status).toBe('ready')
  })

  it('harvests inventory and clears the plot', () => {
    let save = plantedGame(); save = advanceDay(save); save = tendCrop(save); save = advanceDay(save); save = harvestCrop(save)
    expect(save.resources.herbs).toBeGreaterThanOrEqual(3)
    expect(save.cropPlot.status).toBe('empty')
  })

  it('applies the matching-affinity assistant yield bonus generically', () => {
    let save = plantedGame(); save = assignJob(save, save.roster[0].uniqueId, 'herb-garden-assistant'); save = advanceDay(save); save = tendCrop(save); save = advanceDay(save); save = harvestCrop(save)
    expect(save.resources.herbs).toBe(4)
    expect(save.yieldRemainder).toBeCloseTo(.05)
  })

  it('grants one-time event affinity only once', () => {
    const once = inspectGarden(ranchGame()); const twice = inspectGarden(once)
    expect(once.ranchAffinities.healing).toBe(1)
    expect(twice.ranchAffinities.healing).toBe(1)
  })

  it('queues White Mage arrival at five without recruiting her', () => {
    let save = plantedGame(); save = advanceDay(save); save = tendCrop(save); save = advanceDay(save); save = harvestCrop(save)
    expect(save.ranchAffinities.healing).toBe(5)
    expect(save.visitorIds).toContain('mira-white-mage')
    expect(save.recruitedAdventurers).not.toContain('mira-white-mage')
    expect(save.queuedEvents.filter((event) => event.id === 'mira-arrival')).toHaveLength(1)
  })

  it('requires conversation before recruitment and applies the general recovery modifier', () => {
    let save: GameSave = { ...ranchGame(), ranchAffinities: { ...ranchGame().ranchAffinities, healing: 5 }, visitorIds: ['mira-white-mage'], roster: [{ ...ranchGame().roster[0], recoveryDays: 4 }] }
    expect(canRecruit(save, 'mira-white-mage')).toBe(true)
    expect(recruitAdventurer(save, 'mira-white-mage').recruitedAdventurers).toEqual([])
    save = speakWithVisitor(save, 'mira-white-mage'); save = recruitAdventurer(save, 'mira-white-mage')
    expect(save.roster[0].recoveryDays).toBe(2)
    expect(getRecoveryDuration(save, 4)).toBe(2)
  })

  it('migrates v1 saves while preserving important progress', () => {
    const current = ranchGame()
    const legacy: any = { ...current, schemaVersion: 1, resources: { food: 5, wood: 8, stone: 3, materials: 2, herbs: 7 } }
    delete legacy.timePeriod; delete legacy.cropPlot; delete legacy.currentObjective
    const migrated = migrateSave(legacy)
    expect(migrated).toMatchObject({ schemaVersion: 3, currentDay: current.currentDay, timePeriod: 'morning' })
    expect(migrated.roster[0].nickname).toBe('Fern')
    expect(migrated.resources.herbs).toBe(7)
  })

  it('advances objectives only from valid state-changing events', () => {
    let save: GameSave = ranchGame()
    expect(save.currentObjective).toBe('inspect-garden')
    save = inspectGarden(save); expect(save.currentObjective).toBe('plant-herbs')
    save = plantCrop(save, 'restorative-herbs'); expect(save.currentObjective).toBe('assign-assistant')
    save = assignJob(save, save.roster[0].uniqueId, 'herb-garden-assistant'); expect(save.currentObjective).toBe('tend-crop')
  })

  it('keeps the existing tutorial battle behavior', () => {
    const save = chooseStarter(createNewGame(), 'bramblehorn')
    const attacked = resolveBattleTurn(save, 'attack'); const defended = resolveBattleTurn(save, 'defend')
    expect(attacked.battle!.enemyHp).toBeLessThan(save.battle!.enemyHp)
    expect(defended.battle!.playerHp).toBeGreaterThan(attacked.battle!.playerHp)
  })

  it('feeds, grooms, and trains with costs and daily limits', () => {
    let save = ranchGame(); const id = save.roster[0].uniqueId
    save = feedMonster(save, id); expect(save.resources.food).toBe(7); expect(save.roster[0].satiety).toBe(100); expect(save.timePeriod).toBe('afternoon')
    const repeated = feedMonster(save, id); expect(repeated.timePeriod).toBe('afternoon')
    save = groomMonster(save, id); expect(save.roster[0].groomedDay).toBe(save.currentDay)
    const before = save.roster[0].experience; save = trainMonster(save, id, 'combat'); expect(save.roster[0].experience).toBe(before + 6)
    expect(trainMonster(save, id, 'combat').roster[0].experience).toBe(before + 6)
  })

  it('prepares an expedition and consumes all remaining time', () => {
    let save: GameSave = { ...ranchGame(), recruitedAdventurers: ['mira-white-mage'], currentObjective: 'speak-forest' }
    save = talkToResident(save, 'mira-white-mage'); save = openExpeditionPrep(save); save = selectExpeditionParty(save, save.roster[0].uniqueId, 'mira-white-mage'); save = beginExpedition(save, 'briarglen-forest')
    expect(save.phase).toBe('expedition'); expect(save.timePeriod).toBe('spent'); expect(save.currentObjective).toBe('gather-resource')
  })

  it('gathers into temporary inventory and transfers it only on return', () => {
    let save: GameSave = { ...ranchGame(), recruitedAdventurers: ['mira-white-mage'], currentObjective: 'prepare-expedition' }
    save = openExpeditionPrep(save); save = selectExpeditionParty(save, save.roster[0].uniqueId, 'mira-white-mage'); save = beginExpedition(save, 'briarglen-forest'); const woodBefore = save.resources.wood
    save = gatherNode(save); expect(save.expedition!.temporaryResources.wood).toBe(2); expect(save.resources.wood).toBe(woodBefore)
    save = returnFromExpedition(save); expect(save.resources.wood).toBe(woodBefore + 2); expect(save.phase).toBe('expedition-summary')
  })

  it('supports combat, Mira Cure, and taming state changes', () => {
    let save: GameSave = { ...ranchGame(), recruitedAdventurers: ['mira-white-mage'], currentObjective: 'gather-resource' }
    save = openExpeditionPrep(save); save = selectExpeditionParty(save, save.roster[0].uniqueId, 'mira-white-mage'); save = beginExpedition(save, 'briarglen-forest'); save = gatherNode(save); save = moveExpedition(save, 1); save = moveExpedition(save, 1)
    expect(save.phase).toBe('expedition-combat')
    const hp = save.roster[0].currentHp; save = expeditionCombatAction(save, 'encourage'); expect(save.expedition!.enemyTrust).toBeGreaterThan(10); expect(save.roster[0].currentHp).toBeLessThan(hp)
    save = expeditionCombatAction(save, 'mira-cure'); expect(save.roster[0].currentHp).toBeGreaterThan(0)
    const attempts = save.expedition!.tamingAttempts; save = expeditionCombatAction(save, 'tame'); expect(save.expedition!.tamingAttempts).toBe(attempts + 1)
  })

  it('migrates v2 monster care and expedition fields without resetting progress', () => {
    const old: any = { ...ranchGame(), schemaVersion: 2 }; delete old.selectedCompanionId; delete old.expedition; old.roster = old.roster.map(({ satiety: _s, trainingProgress: _t, jobProgress: _j, groomedDay: _g, trainedDay: _d, ...monster }: any) => monster)
    const migrated = migrateSave(old); expect(migrated.schemaVersion).toBe(3); expect(migrated.roster[0].satiety).toBe(70); expect(migrated.discoveredDestinations).toContain('briarglen-forest')
  })
})
