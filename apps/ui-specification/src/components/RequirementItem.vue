<script setup lang="ts">
import { computed } from 'vue'
import type { SpecificationRequirementItem } from '../services/api'

interface Props {
  requirement: SpecificationRequirementItem
  searchQuery?: string
}

const props = defineProps<Props>()

// Helper function to wrap text in a highlighted span
const highlight = (text: string, className = 'highlight-dynamic'): string => {
  return `<span class="${className}">${text}</span>`
}

// Helper function to highlight search matches
const highlightSearch = (text: string, query?: string): string => {
  if (!query || query.trim() === '') return text
  const regex = new RegExp(`(${query.trim()})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const formattedRequirement = computed((): string => {
  const req: SpecificationRequirementItem = props.requirement
  const hl = highlight
  const search = (text: string): string => highlightSearch(text, props.searchQuery)

  let result = ''

  switch (req.type) {
    case 'ubiquitous':
      result = `The ${hl(search(req.systemName))} shall ${hl(search(req.systemResponse))}`
      break

    case 'event-driven': {
      const triggers: string = req.triggers?.map((t: string) => search(t)).join(', ') ?? ''
      result = `When ${hl(triggers, 'highlight-trigger')}, the ${hl(search(req.systemName))} shall ${hl(search(req.systemResponse))}`
      break
    }

    case 'state-driven': {
      const preConditions: string = req.preConditions?.map((p: string) => search(p)).join(' and ') ?? ''
      result = `While ${hl(preConditions, 'highlight-precondition')}, the ${hl(search(req.systemName))} shall ${hl(search(req.systemResponse))}`
      break
    }

    case 'optional-feature': {
      const features: string = req.features?.map((f: string) => search(f)).join(', ') ?? ''
      result = `Where ${hl(features, 'highlight-feature')}, the ${hl(search(req.systemName))} shall ${hl(search(req.systemResponse))}`
      break
    }

    case 'unwanted-behaviour': {
      const unwantedConditions: string = req.unwantedConditions?.map((u: string) => search(u)).join(', ') ?? ''
      result = `If ${hl(unwantedConditions, 'highlight-unwanted')}, then the ${hl(search(req.systemName))} shall ${hl(search(req.systemResponse))}`
      break
    }

    case 'complex': {
      const parts: string[] = []
      if (req.preConditions) {
        const pc: string = req.preConditions.map((p: string) => search(p)).join(' and ')
        parts.push(`While ${hl(pc, 'highlight-precondition')}`)
      }
      if (req.triggers) {
        const tr: string = req.triggers.map((t: string) => search(t)).join(', ')
        parts.push(`when ${hl(tr, 'highlight-trigger')}`)
      }
      if (req.features) {
        const ft: string = req.features.map((f: string) => search(f)).join(', ')
        parts.push(`where ${hl(ft, 'highlight-feature')}`)
      }
      if (req.unwantedConditions) {
        const uc: string = req.unwantedConditions.map((u: string) => search(u)).join(', ')
        parts.push(`if ${hl(uc, 'highlight-unwanted')}`)
      }
      parts.push(`the ${hl(search(req.systemName))} shall ${hl(search(req.systemResponse))}`)
      result = parts.join(', ')
      break
    }

    default:
      result = `The ${hl(search(req.systemName))} shall ${hl(search(req.systemResponse))}`
  }

  return result
})

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    ubiquitous: 'blue',
    'event-driven': 'green',
    'state-driven': 'orange',
    'optional-feature': 'purple',
    'unwanted-behaviour': 'red',
    complex: 'grey',
  }
  return colors[type] || 'grey'
}

const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    ubiquitous: 'mdi-earth',
    'event-driven': 'mdi-lightning-bolt',
    'state-driven': 'mdi-state-machine',
    'optional-feature': 'mdi-feature-search',
    'unwanted-behaviour': 'mdi-alert',
    complex: 'mdi-puzzle',
  }
  return icons[type] || 'mdi-file'
}

const getTypeLabel = (type: string): string => {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<template>
  <v-card variant="outlined" :color="getTypeColor(requirement.type)" class="requirement-item">
    <v-card-text class="d-flex align-start">
      <v-chip
        :color="getTypeColor(requirement.type)"
        variant="flat"
        size="small"
        class="mr-3 flex-shrink-0"
      >
        <v-icon :icon="getTypeIcon(requirement.type)" start size="small" />
        {{ getTypeLabel(requirement.type) }}
      </v-chip>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="flex-grow-1 requirement-text" v-html="formattedRequirement" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.requirement-item {
  margin-bottom: 12px;
}

.requirement-text {
  line-height: 1.6;
  word-wrap: break-word;
}

/* Dynamic value highlighting */
.requirement-text :deep(.highlight-dynamic) {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}

.requirement-text :deep(.highlight-trigger) {
  font-weight: 600;
  color: rgb(var(--v-theme-success));
  background-color: rgba(var(--v-theme-success), 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}

.requirement-text :deep(.highlight-precondition) {
  font-weight: 600;
  color: rgb(var(--v-theme-warning));
  background-color: rgba(var(--v-theme-warning), 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}

.requirement-text :deep(.highlight-feature) {
  font-weight: 600;
  color: rgb(96, 60, 186);
  background-color: rgba(96, 60, 186, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}

.requirement-text :deep(.highlight-unwanted) {
  font-weight: 600;
  color: rgb(var(--v-theme-error));
  background-color: rgba(var(--v-theme-error), 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}

/* Search match highlighting */
.requirement-text :deep(mark) {
  background-color: yellow;
  font-weight: bold;
  padding: 0;
}
</style>
