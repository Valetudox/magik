<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api, type Recording } from '../services/api'

const router = useRouter()
const recordings = ref<Recording[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')

const headers = [
  { title: 'Filename', key: 'filename', sortable: true },
  { title: 'Format', key: 'format', sortable: true, align: 'center' as const },
  { title: 'Size', key: 'size', sortable: true },
  { title: 'Duration', key: 'duration', sortable: true },
  { title: 'Language', key: 'language', sortable: true },
  { title: 'Transcript', key: 'hasTranscript', sortable: true, align: 'center' as const },
  { title: 'Modified', key: 'modifiedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
]

const filteredRecordings = computed(() => {
  if (!search.value) return recordings.value

  const searchLower = search.value.toLowerCase()
  return recordings.value.filter(
    (r) =>
      r.filename.toLowerCase().includes(searchLower) ||
      r.id.toLowerCase().includes(searchLower) ||
      (r.transcriptMetadata?.language ?? '').toLowerCase().includes(searchLower)
  )
})

async function loadRecordings() {
  loading.value = true
  error.value = null

  try {
    recordings.value = await api.getRecordings()
  } catch (e: unknown) {
    error.value = (e instanceof Error ? e.message : String(e)) ?? 'Failed to load recordings'
  } finally {
    loading.value = false
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '-'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }
  return `${minutes}m ${secs}s`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString()
}

function viewRecording(recording: Recording) {
  router.push(`/${encodeURIComponent(recording.id)}`)
}

onMounted(() => {
  void loadRecordings()
})
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-music-box-multiple" class="mr-2" />
            Audio Recordings
            <v-spacer />
            <v-btn
              icon="mdi-refresh"
              :loading="loading"
              variant="text"
              @click="loadRecordings"
            />
          </v-card-title>

          <v-card-text>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search recordings"
              single-line
              hide-details
              clearable
              class="mb-4"
            />

            <v-alert v-if="error" type="error" class="mb-4">
              {{ error }}
            </v-alert>

            <v-data-table
              :headers="headers"
              :items="filteredRecordings"
              :loading="loading"
              :items-per-page="25"
              class="elevation-1"
              hover
              @click:row="(event, { item }) => viewRecording(item)"
            >
              <template v-slot:item.format="{ item }">
                <v-chip size="small" :color="item.format === 'mp3' ? 'primary' : 'secondary'">
                  {{ item.format.toUpperCase() }}
                </v-chip>
              </template>

              <template v-slot:item.size="{ item }">
                {{ formatSize(item.size) }}
              </template>

              <template v-slot:item.duration="{ item }">
                {{ formatDuration(item.transcriptMetadata?.duration) }}
              </template>

              <template v-slot:item.language="{ item }">
                {{ item.transcriptMetadata?.language ?? '-' }}
              </template>

              <template v-slot:item.hasTranscript="{ item }">
                <v-icon
                  :icon="item.hasTranscript ? 'mdi-check-circle' : 'mdi-close-circle'"
                  :color="item.hasTranscript ? 'success' : 'error'"
                />
              </template>

              <template v-slot:item.modifiedAt="{ item }">
                {{ formatDate(item.modifiedAt) }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  @click.stop="viewRecording(item)"
                />
              </template>

              <template v-slot:no-data>
                <v-alert type="info" class="ma-4">
                  No recordings found
                </v-alert>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
