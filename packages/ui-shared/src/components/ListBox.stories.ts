import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import { VCard, VCardTitle, VCardText } from 'vuetify/components'
import ListBox from './ListBox.vue'

const meta = {
  title: 'Components/ListBox',
  component: ListBox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# ListBox

A card component designed for displaying lists of items with an optional add button.

## Overview

ListBox provides a container for list items with a hover-to-reveal add button. It's ideal for sidebar sections that display collections of items.

## Features

- **Hover add button**: A + button appears on hover when \`editable\` is true
- **Empty state**: Shows placeholder text when no content is provided
- **Customizable**: Control editability and empty state text via props

## Usage

Use ListBox when you need a titled container for a list of items, such as:
- Components list
- Use cases list
- Any collection that can be added to
        `,
      },
    },
  },
} satisfies Meta<typeof ListBox>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default usage with list items. Hover over the card to see the add button.
 */
export const Default: Story = {
  args: {
    title: 'Components',
  },
  render: (args) => ({
    components: { ListBox, VCard, VCardTitle, VCardText },
    setup: () => {
      const items = ref([
        { id: '1', name: 'Auth Service', description: 'Handles user authentication' },
        { id: '2', name: 'API Gateway', description: 'Routes requests to services' },
      ])
      const onAdd = () => alert('Add clicked!')
      return { args, items, onAdd }
    },
    template: `
      <ListBox v-bind="args" @add="onAdd">
        <VCard v-for="item in items" :key="item.id" variant="outlined" class="mb-2">
          <VCardTitle class="text-subtitle-1">{{ item.name }}</VCardTitle>
          <VCardText>{{ item.description }}</VCardText>
        </VCard>
      </ListBox>
    `,
  }),
}

/**
 * Empty state when no items are provided. Shows the emptyText placeholder.
 */
export const Empty: Story = {
  args: {
    title: 'Use Cases',
    emptyText: 'No use cases yet. Click + to add one.',
  },
  render: (args) => ({
    components: { ListBox },
    setup: () => {
      const onAdd = () => alert('Add clicked!')
      return { args, onAdd }
    },
    template: `<ListBox v-bind="args" @add="onAdd" />`,
  }),
}

/**
 * Read-only mode with `editable: false`. The add button is hidden.
 */
export const ReadOnly: Story = {
  args: {
    title: 'Read-Only List',
    editable: false,
  },
  render: (args) => ({
    components: { ListBox, VCard, VCardTitle, VCardText },
    setup: () => {
      const items = ref([
        { id: '1', name: 'Item 1', description: 'This list cannot be modified' },
        { id: '2', name: 'Item 2', description: 'No add button appears on hover' },
      ])
      return { args, items }
    },
    template: `
      <ListBox v-bind="args">
        <VCard v-for="item in items" :key="item.id" variant="outlined" class="mb-2">
          <VCardTitle class="text-subtitle-1">{{ item.name }}</VCardTitle>
          <VCardText>{{ item.description }}</VCardText>
        </VCard>
      </ListBox>
    `,
  }),
}

/**
 * Multiple ListBoxes stacked vertically, as used in a sidebar.
 */
export const Stacked: Story = {
  args: {
    title: 'Components',
  },
  render: () => ({
    components: { ListBox, VCard, VCardTitle, VCardText },
    setup: () => {
      const components = ref([
        { id: '1', name: 'Auth Service', description: 'Handles authentication' },
      ])
      const useCases = ref([
        { id: '1', name: 'User Login', description: 'Authenticate users' },
        { id: '2', name: 'Password Reset', description: 'Reset forgotten passwords' },
      ])
      const onAdd = (type: string) => alert(`Add ${type} clicked!`)
      return { components, useCases, onAdd }
    },
    template: `
      <div style="width: 300px;">
        <ListBox title="Components" class="mb-4" @add="onAdd('component')">
          <VCard v-for="item in components" :key="item.id" variant="outlined" class="mb-2">
            <VCardTitle class="text-subtitle-1">{{ item.name }}</VCardTitle>
            <VCardText>{{ item.description }}</VCardText>
          </VCard>
        </ListBox>
        <ListBox title="Use Cases" @add="onAdd('use case')">
          <VCard v-for="item in useCases" :key="item.id" variant="outlined" class="mb-2">
            <VCardTitle class="text-subtitle-1">{{ item.name }}</VCardTitle>
            <VCardText>{{ item.description }}</VCardText>
          </VCard>
        </ListBox>
      </div>
    `,
  }),
}
