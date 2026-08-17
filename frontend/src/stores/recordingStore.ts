import { defineStore } from 'pinia'

export const useRecordingStore = defineStore('recordings', {
  state: () => ({
    recordingArray: [] as Blob[],
  }),
})
