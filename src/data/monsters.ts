import type { MonsterSpecies } from '../types'

export const MONSTERS: MonsterSpecies[] = [
  {
    id: 'bramblehorn', name: 'Bramblehorn', description: 'A brave little forest guardian who never backs away from a challenge.', tier: 1, color: '#cf715d', silhouette: 'horn',
    baseStats: { maxHp: 28, attack: 7, defense: 4 }, affinities: [{ id: 'combat', current: 3, cap: 4 }],
    abilities: [{ id: 'headlong', name: 'Headlong', power: 9, description: 'A bold horn-first charge.' }], diet: ['food'], habitat: ['meadow'], portrait: 'original-bestiary', sprite: 'original-bestiary', spriteCell: 2,
  },
  {
    id: 'cogling', name: 'Cogling', description: 'A bright-eyed tinkerer with clever hands and a pocket full of useful scraps.', tier: 1, color: '#d6974f', silhouette: 'gear',
    baseStats: { maxHp: 24, attack: 5, defense: 6 }, affinities: [{ id: 'crafting', current: 3, cap: 4 }],
    abilities: [{ id: 'wrench-toss', name: 'Wrench Toss', power: 7, description: 'A surprisingly accurate improvised attack.' }], diet: ['food'], habitat: ['workshop'], portrait: 'original-bestiary', sprite: 'original-bestiary', spriteCell: 3,
  },
  {
    id: 'sprigbud', name: 'Sprigbud', description: 'A sunny garden spirit that can coax life from even tired soil.', tier: 1, color: '#71aa61', silhouette: 'leaf',
    baseStats: { maxHp: 26, attack: 5, defense: 5 }, affinities: [{ id: 'harvesting', current: 3, cap: 4 }],
    abilities: [{ id: 'vine-snap', name: 'Vine Snap', power: 7, description: 'A quick crack of a springy vine.' }], diet: ['herbs'], habitat: ['garden'], portrait: 'original-bestiary', sprite: 'original-bestiary', spriteCell: 1,
  },
  {
    id: 'glimmer', name: 'Glimmer', description: 'A gentle wandering sprite whose song makes the ranch feel like home.', tier: 1, color: '#a783c9', silhouette: 'star',
    baseStats: { maxHp: 22, attack: 4, defense: 5 }, affinities: [{ id: 'harmony', current: 3, cap: 4 }],
    abilities: [{ id: 'echo-note', name: 'Echo Note', power: 6, description: 'A clear note that rattles an opponent.' }], diet: ['herbs'], habitat: ['grove'], portrait: 'original-bestiary', sprite: 'original-bestiary', spriteCell: 5,
  },
  {
    id: 'trailbeak', name: 'Trailbeak', description: 'A curious golden chick with an uncanny sense for safe roads and hidden paths.', tier: 1, color: '#e6be56', silhouette: 'bird',
    baseStats: { maxHp: 27, attack: 6, defense: 4 }, affinities: [{ id: 'exploration', current: 3, cap: 4 }],
    abilities: [{ id: 'beak-dash', name: 'Beak Dash', power: 8, description: 'A blur of feathers and determined pecking.' }], diet: ['food'], habitat: ['stable'], portrait: 'original-bestiary', sprite: 'original-bestiary', spriteCell: 4,
  },
  {
    id: 'mosswolf', name: 'Mosswolf', description: 'A keen forest hunter with fern-soft fur and a loyal heart.', tier: 1, color: '#5f8f72', silhouette: 'horn',
    baseStats: { maxHp: 25, attack: 7, defense: 4 }, affinities: [{ id: 'combat', current: 3, cap: 4 }],
    abilities: [{ id: 'bramble-rush', name: 'Bramble Rush', power: 8, description: 'A swift rush through the undergrowth.' }], diet: ['food'], habitat: ['forest'], portrait: 'original-bestiary', sprite: 'original-bestiary', spriteCell: 0, tamingDifficulty: 45, foodPreferences: ['food'], workCapabilities: ['guarding'],
  },
  {
    id: 'rootkin', name: 'Rootkin', description: 'A bashful walking sprout that responds warmly to patient caretakers.', tier: 1, color: '#77a85d', silhouette: 'leaf',
    baseStats: { maxHp: 20, attack: 4, defense: 4 }, affinities: [{ id: 'harvesting', current: 3, cap: 4 }],
    abilities: [{ id: 'seed-pop', name: 'Seed Pop', power: 6, description: 'A startling burst of hard seeds.' }], diet: ['herbs'], habitat: ['forest', 'garden'], portrait: 'original-bestiary', sprite: 'original-bestiary', spriteCell: 1, tamingDifficulty: 30, foodPreferences: ['herbs'], workCapabilities: ['herb-garden-assistant'],
  },
]

export const getSpecies = (id: string) => MONSTERS.find((monster) => monster.id === id)
