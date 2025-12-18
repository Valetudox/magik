import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import RatingDialog from './RatingDialog.vue'
import type { RatingDecoratorInput } from '../types/detail-table.schema'

const meta = {
  title: 'Components/RatingDialog',
  component: RatingDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# RatingDialog

A generic dialog for selecting ratings with configurable levels and colors.

## Features

- **Configurable levels**: Define any number of rating options
- **Custom colors**: Use Vuetify theme colors or custom CSS colors
- **Optional icons**: Add MDI icons to rating chips
- **Empty option**: Optionally allow "Not rated" selection

## RatingConfig Interface

\`\`\`ts
interface RatingConfig {
  key: string
  levels: {
    key: string      // e.g., 'high', 'critical'
    label: string    // Display label
    color: string    // Vuetify color or CSS hex
    icon?: string    // MDI icon
  }[]
  allowEmpty?: boolean   // Default: true
  emptyLabel?: string    // Default: 'Not rated'
}
\`\`\`

## Usage

\`\`\`vue
<RatingDialog
  v-model="dialogOpen"
  title="Change Rating"
  subtitle="Option A / Performance"
  :current-rating="currentRating"
  :config="ratingConfig"
  @save="handleSave"
/>
\`\`\`
        `,
      },
    },
  },
} satisfies Meta<typeof RatingDialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Standard evaluation rating (High/Medium/Low).
 */
export const EvaluationRating: Story = {
  args: {
    title: 'Change Rating',
    subtitle: 'Option A / Performance',
    currentRating: 'medium',
    config: {
      key: 'evaluation',
      levels: [
        { key: 'high', label: 'High', color: 'success' },
        { key: 'medium', label: 'Medium', color: 'warning' },
        { key: 'low', label: 'Low', color: 'error' },
      ],
      allowEmpty: true,
      emptyLabel: 'Not rated',
    },
  },
  render: (args) => ({
    components: { RatingDialog },
    setup: () => {
      const open = ref(true)
      const handleSave = (rating: string | null) => {
        console.log('Selected:', rating)
        alert(`Selected: ${rating ?? 'Not rated'}`)
      }
      return { args, open, handleSave }
    },
    template: `
      <div>
        <v-btn @click="open = true">Open Dialog</v-btn>
        <RatingDialog
          v-model="open"
          :title="args.title"
          :subtitle="args.subtitle"
          :current-rating="args.currentRating"
          :config="args.config"
          @save="handleSave"
        />
      </div>
    `,
  }),
}

/**
 * Priority rating with custom colors and icons.
 */
export const PriorityRating: Story = {
  args: {
    title: 'Set Priority',
    subtitle: 'Task: Fix login bug',
    currentRating: 'high',
    config: {
      key: 'priority',
      levels: [
        { key: 'critical', label: 'Critical', color: '#d32f2f', icon: 'mdi-alert-circle' },
        { key: 'high', label: 'High', color: '#f57c00', icon: 'mdi-arrow-up-bold' },
        { key: 'medium', label: 'Medium', color: '#fbc02d', icon: 'mdi-minus' },
        { key: 'low', label: 'Low', color: '#388e3c', icon: 'mdi-arrow-down-bold' },
      ],
      allowEmpty: false,
    },
  },
  render: (args) => ({
    components: { RatingDialog },
    setup: () => {
      const open = ref(true)
      const handleSave = (rating: string | null) => {
        console.log('Selected:', rating)
      }
      return { args, open, handleSave }
    },
    template: `
      <div>
        <v-btn @click="open = true">Open Dialog</v-btn>
        <RatingDialog
          v-model="open"
          :title="args.title"
          :subtitle="args.subtitle"
          :current-rating="args.currentRating"
          :config="args.config"
          @save="handleSave"
        />
      </div>
    `,
  }),
}

/**
 * Effort estimation rating.
 */
export const EffortRating: Story = {
  args: {
    title: 'Estimate Effort',
    currentRating: null,
    config: {
      key: 'effort',
      levels: [
        { key: 'xl', label: 'XL (weeks)', color: '#7b1fa2' },
        { key: 'l', label: 'L (days)', color: '#1976d2' },
        { key: 'm', label: 'M (hours)', color: '#388e3c' },
        { key: 's', label: 'S (minutes)', color: '#fbc02d' },
      ],
      allowEmpty: true,
      emptyLabel: 'Not estimated',
    },
  },
  render: (args) => ({
    components: { RatingDialog },
    setup: () => {
      const open = ref(true)
      const handleSave = (rating: string | null) => {
        console.log('Selected:', rating)
      }
      return { args, open, handleSave }
    },
    template: `
      <div>
        <v-btn @click="open = true">Open Dialog</v-btn>
        <RatingDialog
          v-model="open"
          :title="args.title"
          :current-rating="args.currentRating"
          :config="args.config"
          @save="handleSave"
        />
      </div>
    `,
  }),
}

/**
 * Star rating (1-5 stars).
 */
export const StarRating: Story = {
  args: {
    title: 'Rate this item',
    currentRating: '3',
    config: {
      key: 'stars',
      levels: [
        { key: '5', label: '5 Stars', color: '#ffc107', icon: 'mdi-star' },
        { key: '4', label: '4 Stars', color: '#ffc107', icon: 'mdi-star' },
        { key: '3', label: '3 Stars', color: '#ffc107', icon: 'mdi-star' },
        { key: '2', label: '2 Stars', color: '#ffc107', icon: 'mdi-star' },
        { key: '1', label: '1 Star', color: '#ffc107', icon: 'mdi-star' },
      ],
      allowEmpty: true,
      emptyLabel: 'No rating',
    },
  },
  render: (args) => ({
    components: { RatingDialog },
    setup: () => {
      const open = ref(true)
      const handleSave = (rating: string | null) => {
        console.log('Selected:', rating)
      }
      return { args, open, handleSave }
    },
    template: `
      <div>
        <v-btn @click="open = true">Open Dialog</v-btn>
        <RatingDialog
          v-model="open"
          :title="args.title"
          :current-rating="args.currentRating"
          :config="args.config"
          @save="handleSave"
        />
      </div>
    `,
  }),
}
