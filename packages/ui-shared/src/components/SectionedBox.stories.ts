import type { Meta, StoryObj } from '@storybook/vue3'
import SectionedBox from './SectionedBox.vue'
import BoxSection from './BoxSection.vue'

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
      const onEditDesc = () => alert('Edit description!')
      const onEditDescAi = () => alert('Edit description with AI!')
      const onEditReasoning = () => alert('Edit reasoning!')
      const onEditReasoningAi = () => alert('Edit reasoning with AI!')
      return { args, onEditDesc, onEditDescAi, onEditReasoning, onEditReasoningAi }
    },
    template: `
      <SectionedBox v-bind="args">
        <BoxSection @edit="onEditDesc" @edit-ai="onEditDescAi">
          <p>This is the main description. Double-click to see the edit menu.</p>
        </BoxSection>
        <BoxSection title="Reasoning" @edit="onEditReasoning" @edit-ai="onEditReasoningAi">
          <ul>
            <li>First reason for this proposal</li>
            <li>Second reason with more details</li>
          </ul>
        </BoxSection>
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
      const onEdit = (section: string) => alert(`Edit ${section}!`)
      const onEditAi = (section: string) => alert(`Edit ${section} with AI!`)
      return { args, onEdit, onEditAi }
    },
    template: `
      <SectionedBox v-bind="args">
        <BoxSection @edit="onEdit('description')" @edit-ai="onEditAi('description')">
          <p>Our recommended approach is to use the new architecture pattern.</p>
        </BoxSection>
        <BoxSection title="Reasoning" @edit="onEdit('reasoning')" @edit-ai="onEditAi('reasoning')">
          <ul>
            <li>Better scalability</li>
            <li>Easier maintenance</li>
          </ul>
        </BoxSection>
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
        <BoxSection :editable="false">
          <p>This content cannot be edited.</p>
        </BoxSection>
        <BoxSection title="Details" :editable="false">
          <p>This section is also read-only.</p>
        </BoxSection>
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
      const onEdit = (section: string) => alert(`Edit ${section}!`)
      const onEditAi = (section: string) => alert(`Edit ${section} with AI!`)
      return { args, onEdit, onEditAi }
    },
    template: `
      <SectionedBox v-bind="args">
        <BoxSection @edit="onEdit('summary')" @edit-ai="onEditAi('summary')">
          <p>A brief summary of the project goals.</p>
        </BoxSection>
        <BoxSection title="Key Features" @edit="onEdit('features')" @edit-ai="onEditAi('features')">
          <ul>
            <li>Feature one</li>
            <li>Feature two</li>
          </ul>
        </BoxSection>
        <BoxSection title="Timeline" @edit="onEdit('timeline')" @edit-ai="onEditAi('timeline')">
          <p>Q1 2025 - Q3 2025</p>
        </BoxSection>
      </SectionedBox>
    `,
  }),
}
