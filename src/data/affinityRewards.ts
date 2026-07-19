import type { AffinityId } from '../types'

export interface AffinityRewardDefinition { id: string; label: string; affinity: AffinityId; amount: number; once: boolean }

export const AFFINITY_REWARDS: AffinityRewardDefinition[] = [
  { id: 'first-herb-plant', label: 'First Restorative Herbs planted', affinity: 'healing', amount: 1, once: true },
  { id: 'first-herb-tend', label: 'First crop tended', affinity: 'healing', amount: 1, once: true },
  { id: 'herb-harvest', label: 'Restorative Herbs harvested', affinity: 'healing', amount: 2, once: false },
  { id: 'garden-introduction', label: 'Herb garden restored', affinity: 'healing', amount: 1, once: true },
]

export const getAffinityReward = (id: string) => AFFINITY_REWARDS.find((reward) => reward.id === id)
