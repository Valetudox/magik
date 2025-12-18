<script setup lang="ts">
import { computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { useDetailPage } from '../composables/useDetailPage'
import type { DetailPageConfig } from '../types/detail-page.schema'

interface Props {
  config: DetailPageConfig
}

const props = defineProps<Props>()

const {
  loading,
  error,
  subtitle,
  showUpdateNotification,
  agentPrompt,
  agentProcessing,
  submitAgentPrompt,
  appendToAgentPrompt,
} = useDetailPage(props.config)

const breadcrumbItems = computed(() => [
  { title: props.config.pageTitle, href: props.config.goBackUrl },
  { title: subtitle.value, disabled: true },
])

const agentPlaceholder = computed(() => {
  if (props.config.agent?.enabled) {
    return props.config.agent.placeholder ?? 'Ask the AI to help...'
  }
  return ''
})

defineExpose({
  appendToAgentPrompt,
})
</script>

<template>
  <div>
    <AppHeader>
      <template #title>
        <v-breadcrumbs :items="breadcrumbItems" density="compact" class="pa-0" />
      </template>
      <template #title-actions>
        <slot name="title-actions" />
      </template>
    </AppHeader>

    <v-container fluid>
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-4">Loading...</p>
      </div>

      <!-- Error state -->
      <v-alert v-else-if="error" type="error" variant="tonal">
        {{ error }}
      </v-alert>

      <!-- Content -->
      <v-row v-else>
        <v-col cols="2">
          <slot name="sidebar" />
        </v-col>
        <v-col cols="10">
          <slot />
        </v-col>
      </v-row>
    </v-container>

    <!-- Agent Input -->
    <div v-if="config.agent?.enabled" class="agent-input-container">
      <v-textarea
        v-model="agentPrompt"
        :placeholder="agentPlaceholder"
        variant="outlined"
        hide-details
        auto-grow
        rows="1"
        :loading="agentProcessing"
        :disabled="agentProcessing"
        @keyup.ctrl.enter="submitAgentPrompt"
        @keyup.meta.enter="submitAgentPrompt"
      >
        <template #append-inner>
          <v-btn
            icon="mdi-send"
            variant="text"
            :loading="agentProcessing"
            :disabled="!agentPrompt.trim() || agentProcessing"
            @click="submitAgentPrompt"
          />
        </template>
      </v-textarea>
    </div>

    <!-- Update notification -->
    <v-snackbar v-model="showUpdateNotification" :timeout="3000" color="success" location="top">
      <v-icon start>mdi-refresh</v-icon>
      Updated in real-time
    </v-snackbar>
  </div>
</template>

<style scoped>
.agent-input-container {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 1500px;
  max-width: 90vw;
  z-index: 100;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
}
</style>
