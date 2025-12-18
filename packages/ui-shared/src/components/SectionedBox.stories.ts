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
- **Footer slot**: Optional footer area for additional content
- **Flexible**: Each section can have its own title and edit handler

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
 * Default usage with multiple sections. Hover over each section to see the edit button.
 */
export const Default: Story = {
  args: {
    title: 'Proposal',
  },
  render: (args) => ({
    components: { SectionedBox, BoxSection },
    setup: () => {
      const onEditDesc = () => alert('Edit description clicked!')
      const onEditReasoning = () => alert('Edit reasoning clicked!')
      return { args, onEditDesc, onEditReasoning }
    },
    template: `
      <SectionedBox v-bind="args">
        <BoxSection @edit="onEditDesc">
          <p>This is the main description of the proposal. It explains what we're proposing and why.</p>
        </BoxSection>
        <BoxSection title="Reasoning" @edit="onEditReasoning">
          <ul>
            <li>First reason for this proposal</li>
            <li>Second reason with more details</li>
            <li>Third supporting argument</li>
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
      const onEditDesc = () => alert('Edit description clicked!')
      const onEditReasoning = () => alert('Edit reasoning clicked!')
      return { args, onEditDesc, onEditReasoning }
    },
    template: `
      <SectionedBox v-bind="args">
        <BoxSection @edit="onEditDesc">
          <p>Our recommended approach is to use the new architecture pattern.</p>
        </BoxSection>
        <BoxSection title="Reasoning" @edit="onEditReasoning">
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
 * Single section without title - edit button appears inline.
 */
export const SingleSection: Story = {
  args: {
    title: 'Notes',
  },
  render: (args) => ({
    components: { SectionedBox, BoxSection },
    setup: () => {
      const onEdit = () => alert('Edit clicked!')
      return { args, onEdit }
    },
    template: `
      <SectionedBox v-bind="args">
        <BoxSection @edit="onEdit">
          <p>These are some notes about the project. They can be edited by hovering and clicking the pencil icon.</p>
        </BoxSection>
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
 * Multiple sections stacked with different content types.
 */
export const MultipleSections: Story = {
  args: {
    title: 'Project Overview',
  },
  render: (args) => ({
    components: { SectionedBox, BoxSection },
    setup: () => {
      const onEdit = (section: string) => alert(`Edit ${section} clicked!`)
      return { args, onEdit }
    },
    template: `
      <SectionedBox v-bind="args">
        <BoxSection @edit="onEdit('summary')">
          <p>A brief summary of the project goals and objectives.</p>
        </BoxSection>
        <BoxSection title="Key Features" @edit="onEdit('features')">
          <ul>
            <li>Feature one</li>
            <li>Feature two</li>
            <li>Feature three</li>
          </ul>
        </BoxSection>
        <BoxSection title="Timeline" @edit="onEdit('timeline')">
          <p>Q1 2025 - Q3 2025</p>
        </BoxSection>
        <BoxSection title="Team" @edit="onEdit('team')">
          <p>Engineering, Design, Product</p>
        </BoxSection>
      </SectionedBox>
    `,
  }),
}
