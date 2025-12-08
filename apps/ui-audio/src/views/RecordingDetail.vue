<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api, type Recording } from '../services/api'

const router = useRouter()
const route = useRoute()

const recording = ref<Recording | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const recordingId = computed(() => route.params.id as string)

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDuration(seconds?: number): string {
  if (!seconds) return 'N/A'

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
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

async function loadRecording() {
  loading.value = true
  error.value = null

  try {
    recording.value = await api.getRecording(recordingId.value)
  } catch (e: unknown) {
    error.value = (e as Error).message ?? 'Failed to load recording'
  } finally {
    loading.value = false
  }
}

function goBack() {
  void router.push('/recordings')
}

onMounted(() => {
  void loadRecording()
})
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-btn
          prepend-icon="mdi-arrow-left"
          class="mb-4"
          variant="text"
          @click="goBack"
        >
          Back to Recordings
        </v-btn>

        <v-card v-if="loading">
          <v-card-text class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="mt-4">
              Loading recording...
            </p>
          </v-card-text>
        </v-card>

        <v-alert v-else-if="error" type="error">
          {{ error }}
        </v-alert>

        <v-card v-else-if="recording">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-file-music" class="mr-2" />
            {{ recording.filename }}
            <v-spacer />
            <v-chip :color="recording.format === 'mp3' ? 'primary' : 'secondary'" class="mr-2">
              {{ recording.format.toUpperCase() }}
            </v-chip>
            <v-chip :color="recording.hasTranscript ? 'success' : 'warning'">
              {{ recording.hasTranscript ? 'Has Transcript' : 'No Transcript' }}
            </v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined">
                  <v-card-title>File Information</v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>ID</v-list-item-title>
                        <v-list-item-subtitle>{{ recording.id }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Filename</v-list-item-title>
                        <v-list-item-subtitle>{{ recording.filename }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Format</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ recording.format.toUpperCase() }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Size</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ formatSize(recording.size) }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Created At</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ formatDate(recording.createdAt) }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Modified At</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ formatDate(recording.modifiedAt) }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="outlined">
                  <v-card-title>Transcript Information</v-card-title>
                  <v-card-text>
                    <v-alert v-if="!recording.hasTranscript" type="info" variant="tonal">
                      No transcript available for this recording
                    </v-alert>
                    <v-list v-else density="compact">
                      <v-list-item>
                        <v-list-item-title>Duration</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ formatDuration(recording.transcriptMetadata?.duration) }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Language</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ recording.transcriptMetadata?.language }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Diarization</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ recording.transcriptMetadata?.diarization }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Job ID</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ recording.transcriptMetadata?.jobId }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Transcript Created</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ formatDate(recording.transcriptMetadata?.transcriptCreatedAt || '') }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
