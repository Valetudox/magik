<script setup lang="ts">
import { SectionedBox, BoxSection } from '@magik/ui-shared'

export interface Proposal {
  description: string
  reasoning: string[]
}

defineProps<{
  proposal: Proposal
}>()

defineEmits<{
  'update:description': [value: string]
  'update:reasoning': [value: string[]]
  'edit-ai:description': []
  'edit-ai:reasoning': []
}>()
</script>

<template>
  <SectionedBox title="Proposal">
    <BoxSection
      type="text"
      :value="proposal.description"
      empty-text="Double-click to add proposal description..."
      @update="$emit('update:description', $event as string)"
      @edit-ai="$emit('edit-ai:description')"
    />
    <BoxSection
      title="Reasoning"
      type="list"
      :items="proposal.reasoning"
      empty-text="Double-click to add reasoning..."
      @update="$emit('update:reasoning', $event as string[])"
      @edit-ai="$emit('edit-ai:reasoning')"
    />
  </SectionedBox>
</template>
