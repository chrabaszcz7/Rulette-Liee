import { create } from 'zustand'
import { Room } from '@/types'

interface RoomState {
  room: Room | null
  setRoom: (room: Room) => void
  updateRoom: (updates: Partial<Room>) => void
  clearRoom: () => void
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  setRoom: (room) => set({ room }),
  updateRoom: (updates) => set((state) => ({
    room: state.room ? { ...state.room, ...updates } : null
  })),
  clearRoom: () => set({ room: null }),
}))
