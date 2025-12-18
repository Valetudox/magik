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

A basic card component with a header, content area, and optional edit button.

## Overview

SimpleBox provides a simple container for displaying titled content. It uses Vuetify's v-card under the hood and supports customization via slots.

## Features

- **Hover edit button**: A pencil button appears on hover when \`editable\` is true
- **Customizable**: Control editability via props, customize header via slot

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
 * Default usage with title and content. Hover over the card to see the edit button.
 */
export const Default: Story = {
  args: {
    title: 'Problem Definition',
  },
  render: (args) => ({
    components: { SimpleBox },
    setup: () => {
      const onEdit = () => alert('Edit clicked!')
      return { args, onEdit }
    },
    template: `
      <SimpleBox v-bind="args" @edit="onEdit">
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
    setup: () => {
      const onEdit = () => alert('Edit clicked!')
      return { args, onEdit }
    },
    template: `
      <SimpleBox v-bind="args" @edit="onEdit">
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
 * Read-only mode with `editable: false`. The edit button is hidden.
 */
export const ReadOnly: Story = {
  args: {
    title: 'Read-Only Box',
    editable: false,
  },
  render: (args) => ({
    components: { SimpleBox },
    setup: () => ({ args }),
    template: `
      <SimpleBox v-bind="args">
        <p>This box cannot be edited. No edit button appears on hover.</p>
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
    setup: () => {
      const onEdit = () => alert('Edit clicked!')
      return { args, onEdit }
    },
    template: `<SimpleBox v-bind="args" @edit="onEdit" />`,
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
    setup: () => {
      const onEdit = (section: string) => alert(`Edit ${section} clicked!`)
      return { onEdit }
    },
    template: `
      <div>
        <SimpleBox title="Problem Definition" class="mb-4" @edit="onEdit('problem')">
          <p>What problem are we trying to solve?</p>
        </SimpleBox>
        <SimpleBox title="Proposal" class="mb-4" @edit="onEdit('proposal')">
          <p>Our recommended solution is...</p>
        </SimpleBox>
        <SimpleBox title="Notes" @edit="onEdit('notes')">
          <p>Additional context and notes.</p>
        </SimpleBox>
      </div>
    `,
  }),
}
