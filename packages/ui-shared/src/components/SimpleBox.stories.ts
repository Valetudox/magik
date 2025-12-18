import type { Meta, StoryObj } from '@storybook/vue3'
import SimpleBox from './SimpleBox.vue'

const meta = {
  title: 'Components/SimpleBox',
  component: SimpleBox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# SimpleBox

A basic card component with a header and content area.

## Overview

SimpleBox provides a simple container for displaying titled content. It uses Vuetify's v-card under the hood and supports customization via slots.

## Usage

Use SimpleBox when you need a simple titled container for content, such as:
- Information panels
- Summary sections
- Sidebar content boxes
        `,
      },
    },
  },
} satisfies Meta<typeof SimpleBox>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default usage with title and content.
 */
export const Default: Story = {
  args: {
    title: 'Problem Definition',
  },
  render: (args) => ({
    components: { SimpleBox },
    setup: () => ({ args }),
    template: `
      <SimpleBox v-bind="args">
        <p>This is the content of the box. It can contain any text or components.</p>
      </SimpleBox>
    `,
  }),
}

/**
 * Override the header with custom content using the #header slot.
 */
export const WithCustomHeader: Story = {
  args: {
    title: 'Custom Header',
  },
  render: (args) => ({
    components: { SimpleBox },
    setup: () => ({ args }),
    template: `
      <SimpleBox v-bind="args">
        <template #header>
          <v-icon start>mdi-information</v-icon>
          <span>Custom Header Content</span>
        </template>
        <p>Box content here.</p>
      </SimpleBox>
    `,
  }),
}

/**
 * Empty box with no content.
 */
export const Empty: Story = {
  args: {
    title: 'Empty Box',
  },
  render: (args) => ({
    components: { SimpleBox },
    setup: () => ({ args }),
    template: `<SimpleBox v-bind="args" />`,
  }),
}

/**
 * Multiple boxes stacked vertically.
 */
export const Stacked: Story = {
  args: {
    title: 'First Box',
  },
  render: () => ({
    components: { SimpleBox },
    template: `
      <div>
        <SimpleBox title="Problem Definition" class="mb-4">
          <p>What problem are we trying to solve?</p>
        </SimpleBox>
        <SimpleBox title="Proposal" class="mb-4">
          <p>Our recommended solution is...</p>
        </SimpleBox>
        <SimpleBox title="Notes">
          <p>Additional context and notes.</p>
        </SimpleBox>
      </div>
    `,
  }),
}
