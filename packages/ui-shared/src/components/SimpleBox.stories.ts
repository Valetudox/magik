import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
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

A basic card component with a header and editable content area.

## Overview

SimpleBox provides a simple container for displaying titled content. It uses Vuetify's v-card under the hood.

## Features

- **Double-click menu**: When \`editable\` is true, double-click shows a menu with Edit and Edit with AI options
- **Hover highlight**: Content area highlights on hover when editable
- **Two edit modes**: Emits \`@edit\` for direct editing and \`@editAi\` for AI-assisted editing

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
 * Default usage with title and content. Double-click to see the edit menu.
 */
export const Default: Story = {
  args: {
    title: 'Problem Definition',
  },
  render: (args) => ({
    components: { SimpleBox },
    setup: () => {
      const content = ref('This is the content of the box. Double-click to see the edit menu.')
      return { args, content }
    },
    template: `
      <SimpleBox
        v-bind="args"
        :value="content"
        @update="content = $event"
      />
    `,
  }),
}

/**
 * Read-only mode with \`editable: false\`. Double-click menu is disabled.
 */
export const ReadOnly: Story = {
  args: {
    title: 'Read-Only Box',
    editable: false,
    value: 'This box cannot be edited. Double-click is disabled.',
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
    setup: () => {
      const problem = ref('What problem are we trying to solve?')
      const notes = ref('Additional context and notes.')
      return { problem, notes }
    },
    template: `
      <div>
        <SimpleBox
          title="Problem Definition"
          class="mb-4"
          :value="problem"
          @update="problem = $event"
        />
        <SimpleBox
          title="Notes"
          :value="notes"
          @update="notes = $event"
        />
      </div>
    `,
  }),
}
