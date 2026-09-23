import { defineStore } from 'pinia'

export const useUiStore = defineStore('uiStore', {
  state: () => ({
    currentTestIsFocused: false,
  }),
  getters: {},
  actions: {},
})
