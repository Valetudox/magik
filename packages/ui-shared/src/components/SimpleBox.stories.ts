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

A basic card component with a header and editable content area.

## Overview

SimpleBox provides a simple container for displaying titled content. It uses Vuetify's v-card under the hood.

## Features

- **Double-click to edit**: When \`editable\` is true, double-click the content area to trigger edit
- **Hover highlight**: Content area highlights on hover when editable
- **Customizable**: Control editability via props

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
 * Default usage with title and content. Double-click the content to edit.
 */
export const Default: Story = {
  args: {
    title: 'Problem Definition',
  },
  render: (args) => ({
    components: { SimpleBox },
    setup: () => {
      const onEdit = () => alert('Edit triggered! (double-click)')
      return { args, onEdit }
    },
    template: `
      <SimpleBox v-bind="args" @edit="onEdit">
        <p>This is the content of the box. Double-click to edit.</p>
      </SimpleBox>
    `,
  }),
}

/**
 * Read-only mode with \`editable: false\`. Double-click is disabled.
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
        <p>This box cannot be edited. Double-click is disabled.</p>
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
      const onEdit = () => alert('Edit triggered!')
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
      const onEdit = (section: string) => alert(`Edit ${section}!`)
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
