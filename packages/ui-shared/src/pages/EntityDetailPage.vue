<script setup lang="ts">
import { ref, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'

interface Props {
  title: string
  subtitle: string
  goBackUrl: string
  onAgentSubmit?: (prompt: string) => Promise<void>
  agentPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  agentPlaceholder: 'Ask the AI to help...',
})

const breadcrumbItems = computed(() => [
  { title: props.title, href: props.goBackUrl },
  { title: props.subtitle, disabled: true },
])

// Agent input state
const agentPrompt = ref('')
const agentProcessing = ref(false)

const submitAgentPrompt = async () => {
  if (!agentPrompt.value.trim() || !props.onAgentSubmit) return
  agentProcessing.value = true
  try {
    await props.onAgentSubmit(agentPrompt.value.trim())
    agentPrompt.value = ''
  } finally {
    agentProcessing.value = false
  }
}

const appendToAgentPrompt = (text: string) => {
  agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${text}` : text
}

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
      <v-row>
        <v-col cols="2">
          <slot name="sidebar" />
        </v-col>
        <v-col cols="10">
          <slot />
        </v-col>
      </v-row>
    </v-container>

    <!-- Agent Input -->
    <div v-if="onAgentSubmit" class="agent-input-container">
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
