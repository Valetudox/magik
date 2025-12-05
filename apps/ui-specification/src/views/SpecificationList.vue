<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api, type SpecificationSummary } from '../services/api'

const router = useRouter()
const specifications = ref<SpecificationSummary[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')

// Group specifications by project
const groupedSpecifications = computed(() => {
  const groups = new Map<string, SpecificationSummary[]>()

  specifications.value.forEach(spec => {
    const project = spec.project
    if (!groups.has(project)) {
      groups.set(project, [])
    }
    groups.get(project)!.push(spec)
  })

  // Convert to array and sort by project name
  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([project, specs]) => ({ project, specs }))
})

// Filter specifications based on search
const filteredGroups = computed(() => {
  if (!search.value) {
    return groupedSpecifications.value
  }

  const searchLower = search.value.toLowerCase()
  return groupedSpecifications.value
    .map(group => ({
      project: group.project,
      specs: group.specs.filter(spec =>
        spec.title.toLowerCase().includes(searchLower) ||
        spec.description.toLowerCase().includes(searchLower) ||
        spec.project.toLowerCase().includes(searchLower)
      )
    }))
    .filter(group => group.specs.length > 0)
})

onMounted(async () => {
  loading.value = true
  try {
    specifications.value = await api.getSpecifications()
  } catch (e: unknown) {
    error.value =
      'Failed to load specifications. Make sure the backend is running on http://localhost:4002'
    // eslint-disable-next-line no-console
    console.error(e)
  } finally {
    loading.value = false
  }
})

function goToDetail(spec: SpecificationSummary) {
  router.push(`/${spec.id}`)
}
</script>

<template>
  <div>
    <Teleport to="#header-title-slot">
      <div>Specifications</div>
    </Teleport>

    <v-container fluid>
      <!-- Loading state -->
      <v-row v-if="loading" class="fill-height" align="center" justify="center">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="64" />
          <p class="mt-4">Loading specifications...</p>
        </v-col>
      </v-row>

      <!-- Error state -->
      <v-row v-else-if="error">
        <v-col cols="12">
          <v-alert type="error" variant="tonal">
            {{ error }}
          </v-alert>
        </v-col>
      </v-row>

      <!-- Specifications grouped by project -->
      <v-row v-else>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-text-field
                v-model="search"
                label="Search specifications"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </v-card-title>

            <v-card-text v-if="filteredGroups.length === 0">
              <v-alert type="info" variant="text">
                No specifications found
              </v-alert>
            </v-card-text>

            <v-card-text v-else>
              <div v-for="group in filteredGroups" :key="group.project" class="mb-6">
                <h2 class="text-h5 mb-3 text-capitalize">
                  {{ group.project.replace(/-/g, ' ') }}
                </h2>
                <v-list lines="two" class="specification-list">
                  <v-list-item
                    v-for="spec in group.specs"
                    :key="spec.id"
                    class="specification-item"
                    @click="goToDetail(spec)"
                  >
                    <v-list-item-title class="text-h6 mb-1">
                      {{ spec.title }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ spec.description }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.specification-item {
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 8px;
}

.specification-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.specification-list {
  background: transparent;
}
</style>
