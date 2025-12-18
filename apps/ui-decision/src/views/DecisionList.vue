<script setup lang="ts">
import { h, ref } from 'vue'
import { useRouter } from 'vue-router'
import { VChip, VIcon } from 'vuetify/components'
import { EntityListPage, BulkOperationDialog, formatDate, type ListPageConfig, type BulkOperationConfig, type BulkOperationResult } from '@magik/ui-shared'
import { api, type DecisionSummary } from '../services/api'
import {
  initSocket,
  onDecisionUpdated,
  onDecisionAdded,
  onDecisionDeleted,
} from '../services/socket'
import CreateDecisionDialog from '../components/CreateDecisionDialog.vue'

const router = useRouter()

// Dialog state
const showBulkPushDialog = ref(false)
const bulkPushItems = ref<DecisionSummary[]>([])

// Bulk push to Confluence configuration
const bulkPushConfig: BulkOperationConfig<DecisionSummary> = {
  title: 'Pushing to Confluence',
  resultsTitle: 'Push to Confluence Results',
  operation: async (item: DecisionSummary): Promise<BulkOperationResult> => {
    if (!item.confluenceLink) {
      return {
        success: false,
        id: item.id,
        name: item.name,
        error: 'No Confluence link configured',
      }
    }

    try {
      await api.pushToConfluence(item.id, item.confluenceLink)
      return {
        success: true,
        id: item.id,
        name: item.name,
      }
    } catch (error: unknown) {
      return {
        success: false,
        id: item.id,
        name: item.name,
        error: (error as Error).message ?? 'Unknown error',
      }
    }
  },
}

// Handle bulk push to Confluence
const handleBulkPush = (selectedIds: string[], items: DecisionSummary[]) => {
  bulkPushItems.value = items
  showBulkPushDialog.value = true
}

// Handle decision created
const handleDecisionCreated = (result: { id: string; [key: string]: any }) => {
  // Navigate to the new decision detail page
  void router.push(`/${result.id}`)
}

// Configuration
const config: ListPageConfig<DecisionSummary> = {
  pageTitle: 'Decision Documents',
  entityId: 'id',
  entityName: 'Decision',
  entityNamePlural: 'Decisions',

  fields: [
    {
      key: 'selectedOption',
      title: 'Status',
      sortable: true,
      align: 'center',
      renderer: (value) =>
        value
          ? h(VChip, { color: 'success', variant: 'tonal', size: 'small' }, () => [
              h(VIcon, { start: true, size: 'small' }, () => 'mdi-check-circle'),
              'Decided',
            ])
          : h('span', { class: 'text-grey' }, 'Pending'),
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      renderer: (value) => h('span', { class: 'font-weight-medium' }, value),
    },
    {
      key: 'directory',
      title: 'Directory',
      sortable: true,
      formatter: (value) => value || '(root)',
      renderer: (value) => h('span', { class: 'text-grey' }, value || '(root)'),
    },
    {
      key: 'problemDefinition',
      title: 'Problem Definition',
      sortable: false,
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      formatter: formatDate,
    },
    {
      key: 'updatedAt',
      title: 'Updated',
      sortable: true,
      formatter: formatDate,
    },
  ],

  rowActions: [
    {
      type: 'view',
      icon: 'mdi-pencil',
      title: 'Edit',
    },
    {
      type: 'custom',
      icon: 'mdi-content-copy',
      title: 'Copy Confluence URL',
      onClick: async (item) => {
        if (item.confluenceLink) {
          try {
            await navigator.clipboard.writeText(item.confluenceLink)
          } catch (err) {
            console.error('Failed to copy URL:', err)
            alert('Failed to copy URL to clipboard')
          }
        }
      },
      disabled: (item) => !item.confluenceLink,
    },
    {
      type: 'custom',
      icon: 'mdi-open-in-new',
      title: 'Open in Confluence',
      onClick: (item) => {
        if (item.confluenceLink) {
          window.open(item.confluenceLink, '_blank')
        }
      },
      disabled: (item) => !item.confluenceLink,
    },
    {
      type: 'delete',
      icon: 'mdi-delete',
      title: 'Delete',
      color: 'error',
    },
  ],

  bulkActions: [
    {
      type: 'delete',
      label: 'Delete',
      icon: 'mdi-delete',
      color: 'error',
    },
    {
      type: 'custom',
      label: 'Push to Confluence',
      icon: 'mdi-upload',
      onClick: handleBulkPush,
      disabled: (selectedIds, items) => items.some((item) => !item.confluenceLink),
    },
  ],

  createAction: {
    enabled: true,
    label: 'New Decision',
    useDialog: true,
    dialogTitle: 'Create New Decision',
  },

  endpoints: {
    list: () => api.getDecisions(),
    delete: (id) => api.deleteDecision(id),
  },

  pageUrls: {
    edit: (item) => `/${item.id}`,
  },

  socket: {
    enabled: true,
    initSocket: initSocket,
    handlers: {
      onUpdated: (callback) => {
        return onDecisionUpdated(({ id, decision }) => {
          callback({
            id,
            problemDefinition: decision.problemDefinition,
            selectedOption: decision.selectedOption,
            confluenceLink: decision.confluenceLink,
            updatedAt: new Date().toISOString(),
          })
        })
      },
      onAdded: (callback) => {
        return onDecisionAdded(({ id, decision }) => {
          if (!id || !decision) return

          const parts = id.split('/')
          const lastPart = parts[parts.length - 1]
          const name = lastPart ? lastPart.replace(/-/g, ' ') : 'Untitled'
          const directory = parts.length > 1 ? parts.slice(0, -1).join('/') : ''
          const now = new Date().toISOString()

          callback({
            id,
            name,
            directory,
            problemDefinition: decision.problemDefinition,
            selectedOption: decision.selectedOption,
            confluenceLink: decision.confluenceLink,
            createdAt: now,
            updatedAt: now,
          })
        })
      },
      onDeleted: (callback) => {
        return onDecisionDeleted(({ id }) => {
          callback({ id })
        })
      },
    },
  },

  enableSelection: true,
  enableSearch: true,
  itemsPerPage: 50,
  defaultSort: [{ key: 'name', order: 'asc' }],
}
</script>

<template>
  <div>
    <EntityListPage :config="config">
      <!-- Custom create dialog using slot -->
      <template #create-dialog="{ show, onClose }">
        <CreateDecisionDialog
          :model-value="show"
          @update:model-value="(value) => !value && onClose()"
          @created="handleDecisionCreated"
        />
      </template>
    </EntityListPage>

    <!-- Bulk push to Confluence dialog -->
    <BulkOperationDialog
      v-model="showBulkPushDialog"
      :selected-items="bulkPushItems"
      :config="bulkPushConfig"
    />
  </div>
</template>
