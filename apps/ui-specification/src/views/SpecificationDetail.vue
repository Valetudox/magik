<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, type SpecificationDetail, type SpecificationRequirementItem, type SpecificationSection } from '../services/api'
import RequirementItem from '../components/RequirementItem.vue'

const route = useRoute()
const router = useRouter()
const specification = ref<SpecificationDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')

onMounted(() => {
  void (async () => {
    loading.value = true
    try {
      const id: string = route.params.id as string
      specification.value = await api.getSpecification(id)
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'Specification not found') {
        error.value = 'Specification not found'
      } else {
        error.value = 'Failed to load specification'
      }
      // Log error to console for debugging
      if (e instanceof Error) {
        console.error('Failed to load specification:', e.message)
      }
    } finally {
      loading.value = false
    }
  })()
})

function goBack() {
  void router.push('/')
}

// Filter requirements based on search query
const filteredRequirements = computed((): SpecificationSection[] => {
  if (!specification.value || !searchQuery.value.trim()) {
    return specification.value?.requirements ?? []
  }

  const query: string = searchQuery.value.toLowerCase()

  return specification.value.requirements
    .map((section: SpecificationSection): SpecificationSection => {
      // Filter items in this section
      const matchingItems: SpecificationRequirementItem[] = section.items.filter((item: SpecificationRequirementItem): boolean => {
        // Check if section name matches
        if (section.sectionName.toLowerCase().includes(query)) {
          return true
        }

        // Check requirement fields
        const searchableText: string = [
          item.systemName,
          item.systemResponse,
          ...(item.triggers ?? []),
          ...(item.preConditions ?? []),
          ...(item.features ?? []),
          ...(item.unwantedConditions ?? []),
        ]
          .join(' ')
          .toLowerCase()

        return searchableText.includes(query)
      })

      return {
        ...section,
        items: matchingItems,
      }
    })
    .filter((section: SpecificationSection): boolean => section.items.length > 0)
})

const hasSearchResults = computed((): boolean => {
  return searchQuery.value.trim() === '' || filteredRequirements.value.length > 0
})
</script>

<template>
  <div>
    <Teleport to="#header-title-slot">
      <div>
        <span class="clickable" @click="goBack">Specifications</span>
        <span class="mx-2">/</span>
        <span>{{ specification?.title || 'Loading...' }}</span>
      </div>
    </Teleport>

    <v-container fluid>
      <!-- Loading state -->
      <v-row
        v-if="loading"
        class="fill-height"
        align="center"
        justify="center"
      >
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="64" />
          <p class="mt-4">
            Loading specification...
          </p>
        </v-col>
      </v-row>

      <!-- Error state -->
      <v-row v-else-if="error">
        <v-col cols="12">
          <v-alert type="error" variant="tonal">
            {{ error }}
          </v-alert>
          <v-btn color="primary" class="mt-4" @click="goBack">
            <v-icon icon="mdi-arrow-left" start />
            Back to List
          </v-btn>
        </v-col>
      </v-row>

      <!-- Specification content -->
      <v-row v-else-if="specification">
        <v-col cols="12">
          <!-- Title and description -->
          <v-card class="mb-4">
            <v-card-title class="text-h4 pa-6">
              {{ specification.title }}
            </v-card-title>
            <v-card-text class="pa-6">
              <p class="text-h6 text-medium-emphasis">
                {{ specification.description }}
              </p>
            </v-card-text>
          </v-card>

          <!-- Search input -->
          <v-card class="mb-4">
            <v-card-text>
              <v-text-field
                v-model="searchQuery"
                label="Search requirements"
                prepend-inner-icon="mdi-magnify"
                clearable
                variant="outlined"
                density="comfortable"
                hide-details
                placeholder="Search by requirement text, section name, triggers, conditions..."
              />
            </v-card-text>
          </v-card>

          <!-- No results message -->
          <v-alert
            v-if="!hasSearchResults"
            type="info"
            variant="tonal"
            class="mb-4"
          >
            No matching requirements found for "{{ searchQuery }}"
          </v-alert>

          <!-- Requirements sections -->
          <v-card v-for="section in filteredRequirements" :key="section.sectionName" class="mb-4">
            <v-card-title class="text-h5 pa-4 bg-grey-lighten-4">
              {{ section.sectionName }}
            </v-card-title>
            <v-card-text class="pa-4">
              <RequirementItem
                v-for="(item, idx) in section.items"
                :key="idx"
                :requirement="item"
                :search-query="searchQuery"
              />
            </v-card-text>
          </v-card>

          <!-- Back button -->
          <v-btn color="primary" class="mt-4" @click="goBack">
            <v-icon icon="mdi-arrow-left" start />
            Back to List
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.clickable {
  cursor: pointer;
  text-decoration: underline;
}

.clickable:hover {
  opacity: 0.7;
}
</style>
