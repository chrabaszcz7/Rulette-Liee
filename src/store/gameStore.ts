import { create } from 'zustand'
import { Game } from '@/types'

interface GameState {
  game: Game | null
  setGame: (game: Game) => void
  updateGame: (updates: Partial<Game>) => void
  clearGame: () => void
}

export const useGameStore = create<GameState>((set) => ({
  game: null,
  setGame: (game) => set({ game }),
  updateGame: (updates) => set((state) => ({
    game: state.game ? { ...state.game, ...updates } : null
  })),
  clearGame: () => set({ game: null }),
}))
