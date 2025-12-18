import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { DetailPageConfig } from '../types/detail-page.schema'

export function useDetailPage<T>(config: DetailPageConfig<T>) {
  // Core state
  const entity = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Socket state
  const socketUnsubscribe = ref<(() => void) | null>(null)
  const showUpdateNotification = ref(false)

  // Agent state
  const agentPrompt = ref('')
  const agentProcessing = ref(false)

  // Computed
  const subtitle = computed(() => {
    if (!entity.value) return 'Loading...'
    return config.getSubtitle(entity.value)
  })

  // Load entity
  const loadEntity = async () => {
    loading.value = true
    error.value = null
    try {
      const result = await config.getEntity(config.entityId)
      entity.value = result
      config.onLoad(result)
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) {
        error.value = 'Entity not found'
      } else {
        error.value = 'Failed to load. Make sure the backend is running.'
      }
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // Setup socket listener
  const setupSocketListener = () => {
    if (!config.socket?.enabled) return

    if (config.socket.initSocket) {
      config.socket.initSocket()
    }

    socketUnsubscribe.value = config.socket.onUpdated(
      (data: { id: string; [key: string]: unknown }) => {
        if (data.id === config.entityId) {
          // Find the entity property in the data (excluding 'id')
          const entityKey = Object.keys(data).find((k) => k !== 'id')
          if (entityKey) {
            const updatedEntity = data[entityKey] as T
            entity.value = updatedEntity
            config.onLoad(updatedEntity)
            showUpdateNotification.value = true
          }
        }
      }
    )
  }

  // Agent submit
  const submitAgentPrompt = async () => {
    if (!agentPrompt.value.trim()) return
    if (!config.agent?.enabled) return

    agentProcessing.value = true
    try {
      await config.agent.onSubmit(agentPrompt.value.trim())
      agentPrompt.value = ''
    } finally {
      agentProcessing.value = false
    }
  }

  const appendToAgentPrompt = (text: string) => {
    agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${text}` : text
  }

  // Lifecycle
  onMounted(() => {
    setupSocketListener()
    void loadEntity()
  })

  onUnmounted(() => {
    socketUnsubscribe.value?.()
  })

  return {
    // State
    entity,
    loading,
    error,
    subtitle,
    showUpdateNotification,

    // Agent
    agentPrompt,
    agentProcessing,
    submitAgentPrompt,
    appendToAgentPrompt,

    // Methods
    loadEntity,
  }
}
