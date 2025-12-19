import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import BoxSection from './BoxSection.vue'
import SectionedBox from './SectionedBox.vue'

const meta = {
  title: 'Components/SectionedBox',
  component: SectionedBox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# SectionedBox

A card component that contains multiple editable sections.

## Overview

SectionedBox provides a container for multiple BoxSection components, each with its own edit functionality. Use it when you need a single card with multiple independently editable areas.

## Features

- **Multiple sections**: Contains BoxSection children with automatic dividers
- **Double-click menu**: Each section shows Edit/Edit with AI menu on double-click
- **Footer slot**: Optional footer area for additional content
- **Two edit modes**: Each section emits \`@edit\` and \`@editAi\` events

## Usage

Use SectionedBox when you need:
- A card with multiple editable areas (e.g., Proposal with description + reasoning)
- Grouped related content with independent edit actions
        `,
      },
    },
  },
} satisfies Meta<typeof SectionedBox>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default usage with multiple sections. Double-click each section to see the edit menu.
 */
export const Default: Story = {
  args: {
    title: 'Proposal',
  },
  render: (args) => ({
    components: { SectionedBox, BoxSection },
    setup: () => {
      const description = ref('This is the main description. Double-click to edit.')
      const reasoning = ref(['First reason for this proposal', 'Second reason with more details'])

      const handleDescUpdate = (value: string) => {
        description.value = value
      }
      const handleReasoningUpdate = (value: string[]) => {
        reasoning.value = value
      }

      return { args, description, reasoning, handleDescUpdate, handleReasoningUpdate }
    },
    template: `
      <SectionedBox v-bind="args">
        <BoxSection
          type="text"
          :value="description"
          @update="handleDescUpdate"
        />
        <BoxSection
          title="Reasoning"
          type="list"
          :items="reasoning"
          @update="handleReasoningUpdate"
        />
      </SectionedBox>
    `,
  }),
}

/**
 * With a footer slot for additional content like status chips.
 */
export const WithFooter: Story = {
  args: {
    title: 'Proposal',
  },
  render: (args) => ({
    components: { SectionedBox, BoxSection },
    setup: () => {
      const description = ref('Our recommended approach is to use the new architecture pattern.')
      const reasoning = ref(['Better scalability', 'Easier maintenance'])

      return { args, description, reasoning }
    },
    template: `
      <SectionedBox v-bind="args">
        <BoxSection
          type="text"
          :value="description"
          @update="description = $event"
        />
        <BoxSection
          title="Reasoning"
          type="list"
          :items="reasoning"
          @update="reasoning = $event"
        />
        <template #footer>
          <v-chip color="success" variant="tonal">
            <v-icon start>mdi-check-circle</v-icon>
            Approved
          </v-chip>
        </template>
      </SectionedBox>
    `,
  }),
}

/**
 * Read-only sections with editable: false.
 */
export const ReadOnly: Story = {
  args: {
    title: 'Summary',
  },
  render: (args) => ({
    components: { SectionedBox, BoxSection },
    setup: () => ({ args }),
    template: `
      <SectionedBox v-bind="args">
        <BoxSection
          type="text"
          value="This content cannot be edited."
          :editable="false"
        />
        <BoxSection
          title="Details"
          type="text"
          value="This section is also read-only."
          :editable="false"
        />
      </SectionedBox>
    `,
  }),
}

/**
 * Multiple sections with different content types.
 */
export const MultipleSections: Story = {
  args: {
    title: 'Project Overview',
  },
  render: (args) => ({
    components: { SectionedBox, BoxSection },
    setup: () => {
      const summary = ref('A brief summary of the project goals.')
      const features = ref(['Feature one', 'Feature two'])
      const timeline = ref('Q1 2025 - Q3 2025')

      return { args, summary, features, timeline }
    },
    template: `
      <SectionedBox v-bind="args">
        <BoxSection
          type="text"
          :value="summary"
          @update="summary = $event"
        />
        <BoxSection
          title="Key Features"
          type="list"
          :items="features"
          @update="features = $event"
        />
        <BoxSection
          title="Timeline"
          type="text"
          :value="timeline"
          @update="timeline = $event"
        />
      </SectionedBox>
    `,
  }),
}
