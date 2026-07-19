import type { ObjectiveId } from '../types'

export const OBJECTIVES: Record<ObjectiveId, { title: string; next: ObjectiveId | null }> = {
  'inspect-garden': { title: 'Inspect the herb garden', next: 'plant-herbs' },
  'plant-herbs': { title: 'Plant Restorative Herbs', next: 'assign-assistant' },
  'assign-assistant': { title: 'Assign your monster to the garden', next: 'tend-crop' },
  'tend-crop': { title: 'Tend the growing crop', next: 'harvest-crop' },
  'harvest-crop': { title: 'Harvest the mature herbs', next: 'reach-healing-five' },
  'reach-healing-five': { title: 'Reach Healing Affinity 5', next: 'speak-with-mira' },
  'speak-with-mira': { title: 'Speak with the visiting White Mage', next: 'recruit-mira' },
  'recruit-mira': { title: 'Invite Mira to join the sanctuary', next: 'speak-forest' },
  'speak-forest': { title: 'Speak with Mira about the forest', next: 'prepare-expedition' },
  'prepare-expedition': { title: 'Prepare an expedition', next: 'select-companion' },
  'select-companion': { title: 'Select a companion monster', next: 'enter-forest' },
  'enter-forest': { title: 'Enter Briarglen Forest', next: 'gather-resource' },
  'gather-resource': { title: 'Gather one natural resource', next: 'win-battle' },
  'win-battle': { title: 'Win one forest battle', next: 'attempt-tame' },
  'attempt-tame': { title: 'Attempt to tame a wild monster', next: 'return-ranch' },
  'return-ranch': { title: 'Return to Briarglen Ranch', next: 'care-returning' },
  'care-returning': { title: 'Feed or tend the returning companion', next: 'assign-new-monster' },
  'assign-new-monster': { title: 'Assign a newly acquired monster', next: 'complete' },
  complete: { title: 'Briarglen’s daily rhythm is thriving', next: null },
}
