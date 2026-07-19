import type { ResourceId } from '../types'

export interface DestinationDefinition {
  id: string; name: string; description: string; difficulty: string; commonResources: ResourceId[]; knownSpecies: string[]; recommendedSupplies: string; areas: { id: string; name: string; description: string; node?: { id: string; resource: ResourceId; amount: number }; encounterSpeciesId?: string }[]
}

export const DESTINATIONS: DestinationDefinition[] = [{
  id: 'briarglen-forest', name: 'Briarglen Forest', description: 'A gentle old woodland bordering the sanctuary.', difficulty: 'Beginner', commonResources: ['wood', 'herbs', 'stone'], knownSpecies: ['mosswolf', 'rootkin'], recommendedSupplies: 'Food for befriending hungry creatures',
  areas: [
    { id: 'sunlit-path', name: 'Sunlit Path', description: 'A bright trail scattered with fallen branches.', node: { id: 'fallen-branches', resource: 'wood', amount: 2 } },
    { id: 'herb-glade', name: 'Herb Glade', description: 'Medicinal plants grow beneath the filtered light.', node: { id: 'wild-herbs', resource: 'herbs', amount: 2 } },
    { id: 'stone-crossing', name: 'Stone Crossing', description: 'A wary creature guards the old stepping stones.', node: { id: 'loose-stone', resource: 'stone', amount: 2 }, encounterSpeciesId: 'mosswolf' },
    { id: 'root-hollow', name: 'Root Hollow', description: 'A curious plant creature watches from an ancient root.', encounterSpeciesId: 'rootkin' },
    { id: 'forest-exit', name: 'Ranch Trail', description: 'The familiar road home lies ahead.' },
  ],
}]

export const getDestination = (id: string) => DESTINATIONS.find((destination) => destination.id === id)
