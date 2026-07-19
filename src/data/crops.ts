import type { AffinityId, ResourceId } from '../types'

export interface CropDefinition {
  id: string
  name: string
  description: string
  seedResource: ResourceId
  seedCost: number
  baseGrowthDays: number
  baseYield: number
  compatibleAffinity: AffinityId
  affinityRewardOnFirstPlant: number
  affinityRewardOnSuccessfulHarvest: number
  sprite: string
}

export const CROPS: CropDefinition[] = [{
  id: 'restorative-herbs',
  name: 'Restorative Herbs',
  description: 'Fragrant frontier herbs prized by healers for soothing monster fatigue.',
  seedResource: 'herbSeeds',
  seedCost: 1,
  baseGrowthDays: 2,
  baseYield: 3,
  compatibleAffinity: 'healing',
  affinityRewardOnFirstPlant: 1,
  affinityRewardOnSuccessfulHarvest: 2,
  sprite: 'placeholder/restorative-herbs',
}]

export const getCrop = (id: string) => CROPS.find((crop) => crop.id === id)
