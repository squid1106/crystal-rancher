import type { AffinityId, ResourceId } from '../types'

export interface RanchJob { id: string; name: string; affinity: AffinityId; produces: ResourceId; icon: string; description: string }

export const JOBS: RanchJob[] = [
  { id: 'herb-garden-assistant', name: 'Herb Garden Assistant', affinity: 'harvesting', produces: 'herbs', icon: '✿', description: 'Assists with tending and improves the harvest yield.' },
]
