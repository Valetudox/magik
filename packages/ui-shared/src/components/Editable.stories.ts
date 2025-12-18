import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import Editable from './Editable.vue'

const meta = {
  title: 'Components/Editable',
  component: Editable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# Editable

A wrapper component that adds double-click edit functionality without adding extra DOM elements.

## Overview

Editable uses Vue 3's \`cloneVNode\` to inject event handlers directly into its child element,
similar to Angular directives. This means **no wrapper element** is added to the DOM.

## How It Works

1. Wraps a single child element
2. Clones the child's VNode and injects \`onDblclick\` handler
3. Renders the menu as a sibling (fragment), not a wrapper
4. On double-click, shows Edit / Edit with AI menu

## Features

- **No wrapper element**: Uses cloneVNode - your element IS the clickable target
- **Works with any element**: div, span, td, custom components
- **Edit menu**: Shows Edit and Edit with AI options on double-click
- **Disable support**: Set \`editable: false\` to disable

## Usage

\`\`\`vue
<Editable @edit="handleEdit" @edit-ai="handleAIEdit">
  <td>Cell content</td>
</Editable>
\`\`\`

## Constraints

- **Single child only**: Must have exactly one root element
- **Text-only not supported**: Needs an element to attach the handler to
        `,
      },
    },
  },
} satisfies Meta<typeof Editable>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Basic usage with a div. Double-click to see the edit menu.
 */
export const WithDiv: Story = {
  render: () => ({
    components: { Editable },
    setup: () => {
      const onEdit = () => alert('Edit clicked!')
      const onEditAi = () => alert('Edit with AI clicked!')
      return { onEdit, onEditAi }
    },
    template: `
      <Editable @edit="onEdit" @edit-ai="onEditAi">
        <div style="padding: 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
          Double-click me to see the edit menu
        </div>
      </Editable>
    `,
  }),
}

/**
 * Usage with a span element for inline content.
 */
export const WithSpan: Story = {
  render: () => ({
    components: { Editable },
    setup: () => {
      const onEdit = () => alert('Edit clicked!')
      const onEditAi = () => alert('Edit with AI clicked!')
      return { onEdit, onEditAi }
    },
    template: `
      <p>
        This is some text with an
        <Editable @edit="onEdit" @edit-ai="onEditAi">
          <span style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px; cursor: pointer;">
            editable inline span
          </span>
        </Editable>
        in the middle.
      </p>
    `,
  }),
}

/**
 * Usage in a table - the most common use case. Each cell is independently editable.
 */
export const InTable: Story = {
  render: () => ({
    components: { Editable },
    setup: () => {
      const data = ref([
        { id: 1, name: 'Option A', description: 'First option description', score: 'High' },
        { id: 2, name: 'Option B', description: 'Second option description', score: 'Medium' },
        { id: 3, name: 'Option C', description: '', score: 'Low' },
      ])
      const onEdit = (row: number, field: string) => alert(`Edit row ${row}, field: ${field}`)
      const onEditAi = (row: number, field: string) => alert(`Edit with AI row ${row}, field: ${field}`)
      return { data, onEdit, onEditAi }
    },
    template: `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Name</th>
            <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Description</th>
            <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Score</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data" :key="row.id">
            <td style="border: 1px solid #ccc; padding: 8px;">{{ row.name }}</td>
            <td style="border: 1px solid #ccc; padding: 0;">
              <Editable @edit="onEdit(row.id, 'description')" @edit-ai="onEditAi(row.id, 'description')">
                <div style="padding: 8px; min-height: 40px; cursor: pointer;">
                  <span v-if="row.description">{{ row.description }}</span>
                  <span v-else style="color: #999; font-style: italic;">Click to add...</span>
                </div>
              </Editable>
            </td>
            <td style="border: 1px solid #ccc; padding: 0;">
              <Editable @edit="onEdit(row.id, 'score')" @edit-ai="onEditAi(row.id, 'score')">
                <div style="padding: 8px; cursor: pointer;">{{ row.score }}</div>
              </Editable>
            </td>
          </tr>
        </tbody>
      </table>
    `,
  }),
}

/**
 * Using Editable directly on td elements (tag becomes the cell itself).
 */
export const DirectOnTd: Story = {
  render: () => ({
    components: { Editable },
    setup: () => {
      const onEdit = (cell: string) => alert(`Edit: ${cell}`)
      const onEditAi = (cell: string) => alert(`Edit with AI: ${cell}`)
      return { onEdit, onEditAi }
    },
    template: `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px;">Header</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Editable Cell</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ccc; padding: 8px;">Row 1</td>
            <Editable @edit="onEdit('cell 1')" @edit-ai="onEditAi('cell 1')">
              <td style="border: 1px solid #ccc; padding: 8px; cursor: pointer;">
                Double-click this cell
              </td>
            </Editable>
          </tr>
          <tr>
            <td style="border: 1px solid #ccc; padding: 8px;">Row 2</td>
            <Editable @edit="onEdit('cell 2')" @edit-ai="onEditAi('cell 2')">
              <td style="border: 1px solid #ccc; padding: 8px; cursor: pointer;">
                Double-click this cell too
              </td>
            </Editable>
          </tr>
        </tbody>
      </table>
    `,
  }),
}

/**
 * Disabled state - double-click is ignored when editable is false.
 */
export const Disabled: Story = {
  render: () => ({
    components: { Editable },
    setup: () => {
      const editable = ref(false)
      const toggle = () => { editable.value = !editable.value }
      const onEdit = () => alert('Edit clicked!')
      const onEditAi = () => alert('Edit with AI clicked!')
      return { editable, toggle, onEdit, onEditAi }
    },
    template: `
      <div>
        <button @click="toggle" style="margin-bottom: 16px; padding: 8px 16px;">
          Toggle editable: {{ editable ? 'ON' : 'OFF' }}
        </button>
        <Editable :editable="editable" @edit="onEdit" @edit-ai="onEditAi">
          <div style="padding: 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
            {{ editable ? 'Double-click me!' : 'Editing disabled - double-click does nothing' }}
          </div>
        </Editable>
      </div>
    `,
  }),
}

/**
 * Multiple editable areas with different handlers.
 */
export const MultipleAreas: Story = {
  render: () => ({
    components: { Editable },
    setup: () => {
      const sections = ref([
        { id: 'problem', title: 'Problem', content: 'What problem are we solving?' },
        { id: 'solution', title: 'Solution', content: 'How do we solve it?' },
        { id: 'risks', title: 'Risks', content: 'What could go wrong?' },
      ])
      const onEdit = (id: string) => alert(`Edit section: ${id}`)
      const onEditAi = (id: string) => alert(`Edit with AI: ${id}`)
      return { sections, onEdit, onEditAi }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div v-for="section in sections" :key="section.id">
          <h3 style="margin-bottom: 8px;">{{ section.title }}</h3>
          <Editable @edit="onEdit(section.id)" @edit-ai="onEditAi(section.id)">
            <div style="padding: 12px; border: 1px solid #e0e0e0; border-radius: 4px; background: #fafafa; cursor: pointer;">
              {{ section.content }}
            </div>
          </Editable>
        </div>
      </div>
    `,
  }),
}

/**
 * With Vuetify card - showing it works with component children too.
 */
export const WithVuetifyCard: Story = {
  render: () => ({
    components: { Editable },
    setup: () => {
      const onEdit = () => alert('Edit card!')
      const onEditAi = () => alert('Edit card with AI!')
      return { onEdit, onEditAi }
    },
    template: `
      <Editable @edit="onEdit" @edit-ai="onEditAi">
        <v-card style="cursor: pointer;">
          <v-card-title>Editable Card</v-card-title>
          <v-card-text>
            Double-click anywhere on this card to see the edit menu.
          </v-card-text>
        </v-card>
      </Editable>
    `,
  }),
}

/**
 * Empty content placeholder - shows how to handle empty states.
 */
export const EmptyPlaceholder: Story = {
  render: () => ({
    components: { Editable },
    setup: () => {
      const content = ref('')
      const onEdit = () => { content.value = 'Content added!' }
      const onEditAi = () => { content.value = 'AI-generated content!' }
      return { content, onEdit, onEditAi }
    },
    template: `
      <Editable @edit="onEdit" @edit-ai="onEditAi">
        <div style="padding: 16px; border: 1px dashed #ccc; border-radius: 4px; min-height: 60px; cursor: pointer;">
          <span v-if="content">{{ content }}</span>
          <span v-else style="color: #999; font-style: italic;">
            Double-click to add content...
          </span>
        </div>
      </Editable>
    `,
  }),
}
