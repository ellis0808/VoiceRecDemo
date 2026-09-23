import { defineStore } from 'pinia'
import type { UserLoadedAudio, UserTestDataObject } from '../../../shared/types'

export const useUserStore = defineStore('userStore', {
  state: () => ({
    user: {
      username: 'Taro' as string,
      assessments: [] as UserTestDataObject[] | null,
      assessmentAudio: [] as UserLoadedAudio[] | null,
    },
  }),
  getters: {
    // userAssessmentWordData(state) {
    //   if (state.user.assessments) {
    //     Object.keys(state.user.assessments[0].).
    //   }
    // }
  },
  actions: {
    getAllStudents() {
      const schoolId = 1
      try {
      } catch (error) {
        console.error("There was an error getting students' information")
      }
    },
  },
})
