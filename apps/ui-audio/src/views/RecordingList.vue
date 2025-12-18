<script setup lang="ts">
import { h } from 'vue'
import { VChip, VIcon } from 'vuetify/components'
import {
  EntityListPage,
  type ListPageConfig,
  formatDate,
  formatFileSize,
  formatDuration,
} from '@magik/ui-shared'
import type { Recording } from '@magik/backend-audio-client'
import { api } from '../services/api'

const config: ListPageConfig<Recording> = {
  pageTitle: 'Audio Recordings',
  entityId: 'id',
  entityName: 'Recording',
  entityNamePlural: 'Recordings',

  fields: [
    {
      key: 'filename',
      title: 'Filename',
      sortable: true,
      align: 'start',
    },
    {
      key: 'format',
      title: 'Format',
      sortable: true,
      align: 'center',
      renderer: (value: string) =>
        h(
          VChip,
          {
            color: value === 'mp3' ? 'primary' : 'secondary',
            size: 'small',
          },
          () => value.toUpperCase()
        ),
    },
    {
      key: 'size',
      title: 'Size',
      sortable: true,
      align: 'end',
      formatter: (value: number) => formatFileSize(value),
    },
    {
      key: 'transcriptMetadata',
      title: 'Duration',
      sortable: false,
      align: 'end',
      formatter: (_value, item: Recording) =>
        formatDuration(item.transcriptMetadata?.duration),
    },
    {
      key: 'transcriptMetadata',
      title: 'Language',
      sortable: false,
      align: 'center',
      formatter: (_value, item: Recording) =>
        item.transcriptMetadata?.language?.toUpperCase() ?? '-',
    },
    {
      key: 'hasTranscript',
      title: 'Transcript',
      sortable: true,
      align: 'center',
      renderer: (value: boolean) =>
        h(VIcon, {
          icon: value ? 'mdi-check-circle' : 'mdi-close-circle',
          color: value ? 'success' : 'error',
        }),
    },
    {
      key: 'modifiedAt',
      title: 'Modified',
      sortable: true,
      align: 'start',
      formatter: (value: string) => formatDate(value),
    },
  ],

  rowActions: [
    {
      type: 'view',
      icon: 'mdi-eye',
      title: 'View Details',
      color: 'primary',
    },
  ],

  // No bulk actions for audio (read-only list)
  bulkActions: undefined,

  // No create action for audio (recordings come from file system)
  createAction: undefined,

  endpoints: {
    list: async () => {
      return await api.getRecordings()
    },
    // No create or delete endpoints
    create: undefined,
    delete: undefined,
  },

  pageUrls: {
    edit: (item: Recording) => `/${encodeURIComponent(item.id)}`,
  },

  // No Socket.IO for audio
  socket: undefined,

  enableSelection: false, // No bulk operations
  enableSearch: true,
  itemsPerPage: 25,
  defaultSort: [{ key: 'modifiedAt', order: 'desc' }],
}
</script>

<template>
  <div>
    <EntityListPage :config="config" />
  </div>
</template>
