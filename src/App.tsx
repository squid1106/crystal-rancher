import { useEffect, useState } from 'react'
import { AFFINITIES } from './data/affinities'
import { ADVENTURERS } from './data/adventurers'
import { getCrop } from './data/crops'
import { getDestination } from './data/destinations'
import { getSpecies, MONSTERS } from './data/monsters'
import { getObjective, getTamingLikelihood } from './systems/game'
import type { ExpeditionAction } from './systems/game'
import { useGameStore } from './store/gameStore'
import type { BattleAction, RanchLocationId } from './types'
import { MonsterPortrait } from './components/MonsterPortrait'
import { RanchScene } from './components/RanchScene'

function Frame({ children }: { children: React.ReactNode }) { return <main className="game-shell"><div className="game-frame">{children}</div></main> }

function ActionJournal({ messages, compact = false }: { messages: string[]; compact?: boolean }) {
  const recent = messages.slice(compact ? -3 : -5).reverse()
  return <aside className={`action-journal${compact ? ' compact' : ''}`} aria-live="polite" aria-label="Recent action results">
    <div className="action-journal-heading"><span aria-hidden="true">✦</span><div><small>ACTION COMPLETE</small><strong>What just happened</strong></div></div>
    <ol>{recent.map((message, index) => <li className={index === 0 ? 'latest' : ''} key={`${message}-${index}`}><span>{index === 0 ? 'NOW' : `${index + 1}`}</span><p>{message}</p></li>)}</ol>
  </aside>
}

function Title() {
  const { newGame, continueGame, hasSave } = useGameStore()
  return <Frame><section className="title-screen">
    <div className="stars" />
    <div className="title-mark">✦</div>
    <p className="eyebrow">A MONSTER SANCTUARY STORY</p>
    <h1><span>CRYSTAL</span>RANCHER</h1>
    <p className="tagline">A new world needs a Beastmaster.</p>
    <nav className="title-actions"><button onClick={newGame}>New Journey</button><button onClick={continueGame} disabled={!hasSave}>Continue</button></nav>
    <p className="copyright-note">Original placeholder art · Prototype build</p>
  </section></Frame>
}

function Intro() {
  const go = useGameStore((state) => state.goToStarters)
  return <Frame><section className="story-screen">
    <div className="crest">♢</div><p className="eyebrow">THE FRONTIER GUILD</p>
    <h2>“The land remembers<br />those who care for it.”</h2>
    <div className="dialogue-card"><p>Your appraisal is rare: <strong>Beastmaster.</strong></p><p>Beyond the eastern hills lies an abandoned ranch. Restore its habitats, welcome the wild creatures home, and this frontier may flourish again.</p><p className="speaker">— Guildmistress Rowan</p></div>
    <button className="primary" onClick={go}>Meet the young monsters <span>→</span></button>
  </section></Frame>
}

function StarterSelection() {
  const [selected, setSelected] = useState(MONSTERS[0].id)
  const [nickname, setNickname] = useState('')
  const choose = useGameStore((state) => state.selectStarter)
  const species = getSpecies(selected)!
  const affinity = species.affinities[0]
  return <Frame><section className="starter-screen">
    <header><div><p className="eyebrow">YOUR FIRST BOND</p><h2>Who answers your call?</h2></div><p className="step">01 / 03</p></header>
    <div className="starter-grid">{MONSTERS.map((monster) => <button key={monster.id} className={`starter-card ${selected === monster.id ? 'selected' : ''}`} onClick={() => setSelected(monster.id)}><MonsterPortrait species={monster} small /><span>{monster.name}</span><em>{AFFINITIES[monster.affinities[0].id].icon} {AFFINITIES[monster.affinities[0].id].name} {monster.affinities[0].current}</em></button>)}</div>
    <article className="inspect-panel"><MonsterPortrait species={species} /><div className="inspect-copy"><p className="eyebrow">TIER {species.tier} · YOUNGLING</p><h3>{species.name}</h3><p>{species.description}</p><div className="affinity-line"><span>{AFFINITIES[affinity.id].icon}</span><div><small>PRIMARY AFFINITY</small><strong>{AFFINITIES[affinity.id].name} {affinity.current}</strong><small>Natural potential: {affinity.cap}</small></div></div></div><div className="bond-form"><label htmlFor="nickname">Nickname <span>optional</span></label><input id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={18} placeholder={species.name} /><button className="primary" onClick={() => choose(species.id, nickname)}>Form a bond <span>✦</span></button></div></article>
  </section></Frame>
}

function Battle() {
  const save = useGameStore((state) => state.save)!
  const act = useGameStore((state) => state.battleAction)
  const monster = save.roster[0]; const species = getSpecies(monster.speciesId)!; const battle = save.battle!
  const actionLabel: Record<BattleAction, string> = { attack: 'Attack', ability: species.abilities[0].name, defend: 'Defend' }
  return <Frame><section className="battle-screen"><header><div><p className="eyebrow">STARTER CLEARING</p><h2>A friendly trial</h2></div><p className="step">02 / 03</p></header>
    <div className="battlefield"><div className="combatant ally"><MonsterPortrait species={species} /><h3>{monster.nickname ?? species.name}</h3><div className="hp"><i style={{ width: `${battle.playerHp / species.baseStats.maxHp * 100}%` }} /></div><small>HP {battle.playerHp} / {species.baseStats.maxHp}</small></div><div className="versus">✦</div><div className="combatant rival"><div className="mystery-monster">?</div><h3>Playful Rival {battle.enemyIndex + 1}</h3><div className="hp enemy"><i style={{ width: `${battle.enemyHp / battle.enemyMaxHp * 100}%` }} /></div><small>HP {battle.enemyHp} / {battle.enemyMaxHp}</small></div></div>
    <div className="battle-ui"><div className="battle-log">{battle.log.slice(-3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div><div className="commands">{(['attack', 'ability', 'defend'] as BattleAction[]).map((action) => <button key={action} onClick={() => act(action)}><span>{action === 'attack' ? '⚔' : action === 'ability' ? '✦' : '◆'}</span>{actionLabel[action]}<small>{action === 'attack' ? 'A steady strike' : action === 'ability' ? species.abilities[0].description : 'Reduce incoming damage'}</small></button>)}</div></div>
  </section></Frame>
}

function Ranch() {
  const [location, setLocation] = useState<RanchLocationId | null>(null)
  const save = useGameStore((state) => state.save)!
  const inspectGarden = useGameStore((state) => state.inspectGarden)
  const plant = useGameStore((state) => state.plantHerbs)
  const tend = useGameStore((state) => state.tendHerbs)
  const harvest = useGameStore((state) => state.harvestHerbs)
  const assign = useGameStore((state) => state.assignGarden)
  const unassign = useGameStore((state) => state.unassignMonster)
  const next = useGameStore((state) => state.nextDay)
  const speak = useGameStore((state) => state.speakWithMira)
  const recruit = useGameStore((state) => state.recruitWhiteMage)
  const talkResident = useGameStore((state) => state.talkToMira)
  const feed = useGameStore((state) => state.feed)
  const groom = useGameStore((state) => state.groom)
  const train = useGameStore((state) => state.train)
  const treat = useGameStore((state) => state.treat)
  const prepare = useGameStore((state) => state.prepareExpedition)
  const title = useGameStore((state) => state.returnToTitle)
  const monster = save.roster[0]; const species = getSpecies(monster.speciesId)!
  const hasMage = save.recruitedAdventurers.includes('mira-white-mage')
  const visitor = save.visitorIds.includes('mira-white-mage'); const spoke = save.completedEventIds.includes('spoke-mira')
  const crop = save.cropPlot.cropId ? getCrop(save.cropPlot.cropId) : null; const objective = getObjective(save)
  const noTime = save.timePeriod === 'spent'; const workerName = monster.assignedJob === 'herb-garden-assistant' ? monster.nickname ?? species.name : undefined
  const cropAction = save.cropPlot.status === 'empty' ? { label: 'Plant Restorative Herbs', action: plant, disabled: noTime || save.resources.herbSeeds < 1, reason: noTime ? 'No time remains today.' : save.resources.herbSeeds < 1 ? 'Requires 1 Restorative Herb Seed.' : '' }
    : save.cropPlot.needsTending ? { label: 'Tend Herbs', action: tend, disabled: noTime, reason: noTime ? 'No time remains today.' : '' }
    : save.cropPlot.status === 'ready' ? { label: 'Harvest Herbs', action: harvest, disabled: noTime, reason: noTime ? 'No time remains today.' : '' }
    : null
  const open = (id: RanchLocationId) => { setLocation(id); if (id === 'garden') inspectGarden() }
  return <Frame><section className="ranch-screen"><RanchScene onSelect={open} assignedMonster={workerName} showVisitor={visitor} hasMage={hasMage} />
    <header className="ranch-header"><div><p className="eyebrow">DAY {save.currentDay} · {save.timePeriod === 'spent' ? 'NIGHT' : save.timePeriod.toUpperCase()}</p><h2>Briarglen Ranch</h2></div><button className="inventory-button" onClick={() => setLocation('storage')}>Inventory</button><button className="quiet" onClick={title}>Save & title</button></header>
    <aside className="objective-card"><small>CURRENT OBJECTIVE</small><strong>{objective.title}</strong>{objective.next && <span>Next: {getObjective({ ...save, currentObjective: objective.next }).title}</span>}<div className="mini-affinity">✚ Healing {save.ranchAffinities.healing} / 5</div></aside>
    {save.queuedEvents.length > 0 && visitor && <button className="event-toast" onClick={() => open('visitor')}>✚ A White Mage is waiting at the ranch.</button>}
    {location && <div className="context-panel" role="dialog" aria-label={`${location} panel`}><button className="panel-close" onClick={() => setLocation(null)} aria-label="Close panel">×</button>
      {location === 'garden' && <><p className="panel-title">HERB GARDEN · ONE PLOT</p><h3>✿ {crop?.name ?? 'Prepared Garden Plot'}</h3><p>{crop?.description ?? 'Soft soil waits for the sanctuary’s first medicinal crop.'}</p><dl className="crop-state"><div><dt>State</dt><dd>{save.cropPlot.status.replace('-', ' ')}</dd></div><div><dt>Growth</dt><dd>{crop ? `${save.cropPlot.growthDays} / ${crop.baseGrowthDays} days` : 'Not planted'}</dd></div><div><dt>Expected yield</dt><dd>{crop ? `${crop.baseYield}+ herbs` : '—'}</dd></div></dl>{cropAction && <button className="primary" onClick={cropAction.action} disabled={cropAction.disabled}>{cropAction.label}</button>}{cropAction?.reason && <small className="disabled-reason">{cropAction.reason}</small>}{!cropAction && crop && <p className="status-note">The crop is growing. End the day to advance growth.</p>}</>}
      {location === 'habitat' && <><p className="panel-title">MONSTER HABITAT · {save.roster.length} RESIDENTS</p><div className="roster-scroll">{save.roster.map((resident) => { const residentSpecies = getSpecies(resident.speciesId)!; return <article className="roster-entry" key={resident.uniqueId}><MonsterPortrait species={residentSpecies} small /><div><h3>{resident.nickname ?? residentSpecies.name}</h3><p>{AFFINITIES[residentSpecies.affinities[0].id].name} {residentSpecies.affinities[0].current} · Lv {resident.level}</p><small>HP {resident.currentHp}/{residentSpecies.baseStats.maxHp} · Fullness {resident.satiety}% · Bond {resident.bond}</small><small>{resident.assignedJob ? 'Herb Garden Assistant' : 'Unassigned'}</small></div><div className="care-actions"><button onClick={() => feed(resident.uniqueId)} disabled={resident.satiety >= 100 || noTime}>Feed</button><button onClick={() => groom(resident.uniqueId)} disabled={resident.groomedDay === save.currentDay || noTime}>Groom</button><button onClick={() => train(resident.uniqueId, 'combat')} disabled={resident.trainedDay === save.currentDay || noTime}>Combat Train</button><button onClick={() => train(resident.uniqueId, 'affinity')} disabled={resident.trainedDay === save.currentDay || noTime}>Affinity Train</button>{resident.currentHp < residentSpecies.baseStats.maxHp && <button onClick={() => treat(resident.uniqueId)} disabled={noTime}>Treat</button>}{resident.assignedJob ? <button onClick={() => unassign(resident.uniqueId)}>Unassign</button> : <button onClick={() => assign(resident.uniqueId)}>Garden Job</button>}</div></article>})}</div></>}
      {location === 'storage' && <><p className="panel-title">RESOURCE STORAGE</p><h3>Ranch Inventory</h3><ul className="inventory-list"><li><span>Food</span><strong>{save.resources.food}</strong></li><li><span>Wood</span><strong>{save.resources.wood}</strong></li><li><span>Stone</span><strong>{save.resources.stone}</strong></li><li><span>Restorative Herb Seeds</span><strong>{save.resources.herbSeeds}</strong></li><li><span>Restorative Herbs</span><strong>{save.resources.herbs}</strong></li></ul></>}
      {location === 'house' && <><p className="panel-title">PLAYER HOUSE</p><h3>Your quiet frontier cottage</h3><p>Progress is saved after every action. Return here whenever you need a peaceful moment.</p><button onClick={title}>Save and return to title</button></>}
      {location === 'construction' && <><p className="panel-title">CONSTRUCTION PLOT</p><h3>Future Workshop Site</h3><p>This plot is reserved for a later milestone. Nothing can be built here yet.</p></>}
      {location === 'gate' && <><p className="panel-title">EXPEDITION GATE</p><h3>Briarglen Forest</h3><p>A beginner route with wood, herbs, stone, and two known wild species. Expeditions consume every remaining period and cannot begin in Evening.</p><button className="primary" onClick={prepare} disabled={save.timePeriod === 'evening' || noTime}>Prepare Expedition</button>{(save.timePeriod === 'evening' || noTime) && <small className="disabled-reason">Return tomorrow morning or afternoon.</small>}</>}
      {location === 'visitor' && <><p className="panel-title">{hasMage ? 'RANCH RESIDENT' : 'VISITING ADVENTURER'}</p><h3>Mira · White Mage</h3><p>{ADVENTURERS[0].description}</p>{hasMage ? <><span className="assigned">✚ Recovery durations reduced by 50% · Injured monsters receive nightly care</span><button className="primary" onClick={talkResident}>Talk with Mira</button></> : !spoke ? <button className="primary" onClick={speak}>Speak with Mira</button> : <><blockquote>“Let me help make Briarglen a true sanctuary.”</blockquote><button className="primary" onClick={recruit}>Invite Mira to join</button></>}</>}
    </div>}
    <ActionJournal messages={save.feedback} />
    <footer className="day-footer"><div><strong>{save.timePeriod === 'spent' ? 'No time remains today' : `${save.timePeriod[0].toUpperCase()}${save.timePeriod.slice(1)} · Choose a ranch action`}</strong><span>Ending the day grows crops and processes upkeep, but grants no affinity by itself.</span></div><button className="primary" onClick={next}>End day <span>☾</span></button></footer>
  </section></Frame>
}

function ExpeditionPrep() {
  const save = useGameStore((state) => state.save)!; const select = useGameStore((state) => state.selectParty); const depart = useGameStore((state) => state.depart); const title = useGameStore((state) => state.returnToTitle)
  const destination = getDestination('briarglen-forest')!; const eligible = save.roster.filter((monster) => monster.recoveryDays === 0)
  return <Frame><section className="prep-screen"><header><div><p className="eyebrow">EXPEDITION PREPARATION</p><h2>{destination.name}</h2></div><button className="quiet" onClick={title}>Save & title</button></header><div className="prep-grid"><article className="route-card"><p className="panel-title">DESTINATION</p><div className="forest-art">♣</div><h3>{destination.name}</h3><p>{destination.description}</p><dl><div><dt>Difficulty</dt><dd>{destination.difficulty}</dd></div><div><dt>Time</dt><dd>All remaining periods</dd></div><div><dt>Resources</dt><dd>Wood · Herbs · Stone</dd></div><div><dt>Known creatures</dt><dd>Mosswolf · Rootkin</dd></div></dl></article><article className="party-card"><p className="panel-title">CHOOSE ONE COMPANION</p>{eligible.map((monster) => { const species = getSpecies(monster.speciesId)!; return <button key={monster.uniqueId} className={save.selectedCompanionId === monster.uniqueId ? 'selected-party' : ''} onClick={() => select(monster.uniqueId, save.recruitedAdventurers.includes('mira-white-mage') ? 'mira-white-mage' : null)}><MonsterPortrait species={species} small /><span><strong>{monster.nickname ?? species.name}</strong><small>HP {monster.currentHp}/{species.baseStats.maxHp} · Bond {monster.bond}</small></span></button>})}<div className="adventurer-slot"><strong>Adventurer</strong><span>{save.selectedAdventurerId ? '✚ Mira · Cure available' : 'No adventurer selected'}</span></div><button className="primary depart" onClick={depart} disabled={!save.selectedCompanionId}>Confirm & enter forest</button></article></div></section></Frame>
}

function Expedition() {
  const save = useGameStore((state) => state.save)!; const move = useGameStore((state) => state.move); const gather = useGameStore((state) => state.gather); const home = useGameStore((state) => state.returnHome); const expedition = save.expedition!; const destination = getDestination(expedition.destinationId)!; const area = destination.areas[expedition.areaIndex]; const gathered = area.node && expedition.gatheredNodeIds.includes(area.node.id)
  const companion = save.roster.find((monster) => monster.uniqueId === expedition.companionId)!; const companionSpecies = getSpecies(companion.speciesId)!
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); if ((event.key === 'g' || event.key === 'G') && area.node && !gathered) gather(); if (event.key === 'r' || event.key === 'R') home() }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [area.node, gathered, gather, home, move])
  return <Frame><section className="forest-screen"><header><div><p className="eyebrow">BRIARGLEN FOREST · AREA {expedition.areaIndex + 1}/{destination.areas.length}</p><h2>{area.name}</h2></div><div className="field-inventory"><strong>Expedition pack</strong><span>{Object.entries(expedition.temporaryResources).map(([id, amount]) => `${id} ${amount}`).join(' · ') || 'empty'}</span></div></header><div className={`forest-area area-${expedition.areaIndex}`}><div className="tree-layer">♣ ♣ ♣<br/>♣　　♣<br/>♣ ♣ ♣</div><div className="explorer-party"><span className="tamer-sprite">♟</span><MonsterPortrait species={companionSpecies} small /><small>{companion.nickname ?? companionSpecies.name}</small></div><article><h3>{area.name}</h3><p>{area.description}</p>{area.node && <button onClick={gather} disabled={!!gathered}>{gathered ? 'Already gathered' : `Gather ${area.node.amount} ${area.node.resource}`}</button>}</article></div><footer className="forest-controls" aria-label="Forest navigation"><button aria-label="Go to previous forest area" onClick={() => move(-1)} disabled={expedition.areaIndex === 0}>← <span>Previous</span></button><button className="return-button" onClick={home}>Return <span>to ranch</span></button><button aria-label="Go to next forest area" onClick={() => move(1)} disabled={expedition.areaIndex === destination.areas.length - 1}><span>Next</span> →</button></footer><p className="control-hint">Touch the controls or use ← → · G gather · R return</p><ActionJournal messages={save.feedback} compact /></section></Frame>
}

function ExpeditionCombat() {
  const save = useGameStore((state) => state.save)!; const act = useGameStore((state) => state.expeditionAction); const e = save.expedition!; const enemy = getSpecies(e.enemySpeciesId!)!; const companion = save.roster.find((monster) => monster.uniqueId === e.companionId)!; const species = getSpecies(companion.speciesId)!; const likelihood = getTamingLikelihood(save)
  const actions: { id: ExpeditionAction; label: string; help: string; disabled?: boolean }[] = [{id:'monster-attack',label:'Attack',help:'Reliable damage; raises fear.'},{id:'monster-ability',label:species.abilities[0].name,help:species.abilities[0].description},{id:'defend',label:'Defend',help:'Reduce the next attack.'},{id:'encourage',label:'Encourage',help:'Raise trust and calm fear.'},{id:'offer-food',label:'Offer Food',help:'Use preferred food to build trust.'},{id:'tame',label:`Attempt Tame · ${likelihood}`,help:'Invite the creature to join.'},{id:'mira-cure',label:'Mira: Cure',help:'Restore 7 companion HP.',disabled:!e.adventurerId},{id:'flee',label:'Flee',help:'Return to forest exploration.'}]
  return <Frame><section className="wild-battle"><header><p className="eyebrow">WILD ENCOUNTER</p><h2>{enemy.name}</h2></header><div className="wild-combatants"><div><MonsterPortrait species={species}/><h3>{companion.nickname ?? species.name}</h3><p>HP {companion.currentHp}/{species.baseStats.maxHp}</p></div><span>VS</span><div><MonsterPortrait species={enemy}/><h3>Wild {enemy.name}</h3><p>HP {e.enemyHp}/{e.enemyMaxHp}</p><small>Trust {e.enemyTrust} · Fear {e.enemyFear} · Hunger {e.enemyHunger}</small></div></div><div className="wild-command-grid">{actions.map((action) => <button key={action.id} onClick={() => act(action.id)} disabled={action.disabled}><strong>{action.label}</strong><small>{action.help}</small></button>)}</div><div className="combat-story">{e.log.slice(-4).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div></section></Frame>
}

function ExpeditionSummaryScreen() {
  const save = useGameStore((state) => state.save)!; const close = useGameStore((state) => state.closeSummary); const summary = save.lastExpeditionSummary!
  return <Frame><section className="summary-screen"><p className="eyebrow">EXPEDITION COMPLETE</p><h2>{summary.defeated ? 'A difficult return' : 'Home before moonrise'}</h2><div className="summary-grid"><article><small>RESOURCES KEPT</small><strong>{Object.entries(summary.resources).map(([id, amount]) => `${amount} ${id}`).join(' · ') || 'None'}</strong></article><article><small>BATTLES WON</small><strong>{summary.battlesWon}</strong></article><article><small>EXPERIENCE</small><strong>+{summary.experienceGained}</strong></article><article><small>BOND</small><strong>+{summary.bondGained}</strong></article><article><small>NEW COMPANION</small><strong>{summary.tamedSpeciesId ? getSpecies(summary.tamedSpeciesId)?.name : 'None'}</strong></article></div><button className="primary" onClick={close}>Return to Briarglen Ranch</button></section></Frame>
}

export default function App() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Title />
  if (save.phase === 'intro') return <Intro />
  if (save.phase === 'starter') return <StarterSelection />
  if (save.phase === 'battle') return <Battle />
  if (save.phase === 'expedition-prep') return <ExpeditionPrep />
  if (save.phase === 'expedition') return <Expedition />
  if (save.phase === 'expedition-combat') return <ExpeditionCombat />
  if (save.phase === 'expedition-summary') return <ExpeditionSummaryScreen />
  return <Ranch />
}
