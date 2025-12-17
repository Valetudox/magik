import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ListPageConfig } from '../types/list-page.types'

export function useListPage<T extends Record<string, any>>(config: ListPageConfig<T>) {
  const router = useRouter()

  // Core state
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')

  // Selection state
  const selectedIds = ref<string[]>([])

  // Dialog state
  const showCreateDialog = ref(false)
  const showDeleteDialog = ref(false)
  const deleteTarget = ref<{ id: string; item: T } | null>(null)
  const deleting = ref(false)

  // Bulk operations state
  const bulkOperationInProgress = ref(false)
  const bulkOperationProgress = ref(0)

  // Socket.IO cleanup functions
  const socketUnsubscribers = ref<Array<() => void>>([])

  // Computed
  const selectedItems = computed(() =>
    items.value.filter(item => selectedIds.value.includes(item[config.entityId]))
  )

  // Load items
  const loadItems = async () => {
    loading.value = true
    error.value = null
    try {
      const result = await config.endpoints.list()
      items.value = result as T[]
    } catch (e) {
      error.value = `Failed to load ${config.entityNamePlural}`
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // Create item
  const createItem = async (data: any) => {
    if (!config.endpoints.create) return

    try {
      const result = await config.endpoints.create(data)
      showCreateDialog.value = false

      // Navigate to detail page if URL configured
      if (config.pageUrls?.edit) {
        await router.push(config.pageUrls.edit(result as unknown as T))
      }

      // Trigger onCreate callback
      if (config.createAction?.onCreate) {
        await config.createAction.onCreate(result)
      }
    } catch (e) {
      throw new Error(`Failed to create ${config.entityName}`)
    }
  }

  // Delete single item
  const deleteItem = async (id: string) => {
    if (!config.endpoints.delete) return

    deleting.value = true
    try {
      await config.endpoints.delete(id)
      // Remove from local list
      const index = items.value.findIndex(item => item[config.entityId] === id)
      if (index !== -1) {
        items.value.splice(index, 1)
      }
      showDeleteDialog.value = false
      deleteTarget.value = null
    } catch (e) {
      throw new Error(`Failed to delete ${config.entityName}`)
    } finally {
      deleting.value = false
    }
  }

  // Bulk delete
  const bulkDelete = async () => {
    if (!config.endpoints.delete) return

    bulkOperationInProgress.value = true
    bulkOperationProgress.value = 0

    const toDelete = [...selectedIds.value]
    let successCount = 0

    for (let i = 0; i < toDelete.length; i++) {
      try {
        await config.endpoints.delete(toDelete[i])
        const index = items.value.findIndex(item => item[config.entityId] === toDelete[i])
        if (index !== -1) {
          items.value.splice(index, 1)
        }
        successCount++
      } catch {
        console.error(`Failed to delete item ${toDelete[i]}`)
      }
      bulkOperationProgress.value = Math.round(((i + 1) / toDelete.length) * 100)
    }

    bulkOperationInProgress.value = false
    selectedIds.value = []
    showDeleteDialog.value = false
    deleteTarget.value = null
  }

  // Confirm delete (single or bulk)
  const confirmDelete = (item?: T) => {
    if (item) {
      deleteTarget.value = { id: item[config.entityId], item }
    } else {
      deleteTarget.value = null // Indicates bulk delete
    }
    showDeleteDialog.value = true
  }

  // Handle delete action
  const handleDelete = async () => {
    if (deleteTarget.value) {
      await deleteItem(deleteTarget.value.id)
    } else {
      await bulkDelete()
    }
  }

  // Navigate to detail
  const navigateToDetail = (item: T) => {
    if (config.pageUrls?.edit) {
      void router.push(config.pageUrls.edit(item))
    }
  }

  // Setup Socket.IO listeners
  const setupSocketListeners = () => {
    if (!config.socket?.enabled || !config.socket.handlers) return

    if (config.socket.initSocket) {
      config.socket.initSocket()
    }

    const { onUpdated, onAdded, onDeleted } = config.socket.handlers

    if (onUpdated) {
      const unsubscribe = onUpdated((data) => {
        const index = items.value.findIndex(item => item[config.entityId] === data.id)
        if (index !== -1) {
          items.value[index] = { ...items.value[index], ...data }
        }
      })
      socketUnsubscribers.value.push(unsubscribe)
    }

    if (onAdded) {
      const unsubscribe = onAdded((data) => {
        const exists = items.value.find(item => item[config.entityId] === data.id)
        if (!exists) {
          items.value.push(data as unknown as T)
        }
      })
      socketUnsubscribers.value.push(unsubscribe)
    }

    if (onDeleted) {
      const unsubscribe = onDeleted((data) => {
        const index = items.value.findIndex(item => item[config.entityId] === data.id)
        if (index !== -1) {
          items.value.splice(index, 1)
        }
      })
      socketUnsubscribers.value.push(unsubscribe)
    }
  }

  // Lifecycle
  onMounted(() => {
    setupSocketListeners()
    void loadItems()
  })

  onUnmounted(() => {
    socketUnsubscribers.value.forEach(unsubscribe => unsubscribe())
  })

  return {
    // State
    items,
    loading,
    error,
    search,
    selectedIds,
    selectedItems,
    showCreateDialog,
    showDeleteDialog,
    deleteTarget,
    deleting,
    bulkOperationInProgress,
    bulkOperationProgress,

    // Methods
    loadItems,
    createItem,
    deleteItem,
    bulkDelete,
    confirmDelete,
    handleDelete,
    navigateToDetail,
  }
}
