import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import type { School } from '../../../shared/types'

export const useUiStore = defineStore('uiStore', {
  state: () => ({
    currentTestIsFocused: false,
    title: 'Assessment Helper',

    search: {
      input: '' as string,
    },
  }),
  getters: {
    searchSchools(state): School[] | undefined {
      const authStore = useAuthStore()
      const query = state.search.input.toLowerCase().trim()
      console.log(query.length)
      if (!query) return []

      return authStore.schools.filter((school) => {
        // const queryLength = query.length
        const matchesName = query.length >= 4 ? school.name?.toLowerCase().includes(query) : false
        const matchesShortName = school.shortName?.toLowerCase() === query
        return matchesShortName || matchesName
      })
    },
    searchResults(state): School[] | string[] {
      const input = state.search.input
      if (!input || typeof input !== 'string') return []

      const results = this.searchSchools
      if (!results) return []
      if (results.length > 15) {
        return ['']
      } else {
        return results
      }
    },
  },
  actions: {},
})
