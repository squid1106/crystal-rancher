import type { AffinityId } from '../types'

export const AFFINITIES: Record<AffinityId, { name: string; icon: string; description: string }> = {
  combat: { name: 'Combat', icon: '⚔', description: 'Training and ranch defense.' },
  crafting: { name: 'Crafting', icon: '⚒', description: 'Making tools and useful materials.' },
  harvesting: { name: 'Harvesting', icon: '♨', description: 'Tending crops and gathering food.' },
  harmony: { name: 'Harmony', icon: '✦', description: 'Helping wild monsters feel welcome.' },
  exploration: { name: 'Exploration', icon: '➶', description: 'Finding paths and expedition rewards.' },
  healing: { name: 'Healing', icon: '✚', description: 'Restoring weary monsters.' },
}
