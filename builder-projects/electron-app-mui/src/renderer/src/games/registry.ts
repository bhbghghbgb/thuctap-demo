/**
 * Game Registry — the single file to update when adding a new game.
 *
 * To add a new game:
 *  1. Build your game template project and add it under template-projects/<game-id>/
 *  2. Create your editor component at  games/<game-id>/<Name>Editor.tsx
 *  3. Import it below and add one entry to GAME_REGISTRY
 *  4. If the game needs a runtime data transform, also add it to
 *     src/main/gameRegistry.ts
 */

import type { AnyAppData } from '@shared/types'
import type { ComponentType } from 'react'

import BalloonLetterPickerEditor from './balloon-letter-picker/BalloonLetterPickerEditor'
import FindTheTreasureEditor from './find-the-treasure/FindTheTreasureEditor'
import GroupSortEditor from './group-sort/GroupSortEditor'
import JumpingFrogEditor from './jumping-frog/JumpingFrogEditor'
import LabelledDiagramEditor from './labelled-diagram/LabelledDiagramEditor'
import PairMatchingEditor from './pair-matching/PairMatchingEditor'
import QuizEditor from './plane-quiz/QuizEditor'
import WhackAMoleEditor from './whack-a-mole/WhackAMoleEditor'
import WordSearchEditor from './word-search/WordSearchEditor'
import { wrapEditor } from '@renderer/components/wrapEditor'
import { EditorWrapperHandle } from '@renderer/components/EditorWrapper'

export interface GameRegistryEntry {
  /** Editor component rendered on the ProjectPage */
  Editor: ComponentType<{
    ref: React.ForwardedRef<EditorWrapperHandle>
    initialData: AnyAppData
    projectDir: string
    onCommit: (data: AnyAppData) => void
  }>
  /** Returns a fresh, empty appData object for new projects */
  createInitialData: () => AnyAppData
}

// ── Add new games here ────────────────────────────────────────────────────────
export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  'group-sort': {
    Editor: wrapEditor(GroupSortEditor) as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      groups: [],
      items: [],
      _groupCounter: 0,
      _itemCounter: 0
    })
  },

  'plane-quiz': {
    Editor: wrapEditor(QuizEditor) as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      questions: [],
      _questionCounter: 0
    })
  },

  'balloon-letter-picker': {
    Editor: wrapEditor(BalloonLetterPickerEditor) as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      words: [],
      _wordCounter: 0
    })
  },

  'pair-matching': {
    Editor: wrapEditor(PairMatchingEditor) as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      items: [],
      minTotalPairs: 2,
      _itemCounter: 0
    })
  },

  'word-search': {
    Editor: wrapEditor(WordSearchEditor) as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      items: [],
      _itemCounter: 0
    })
  },

  'whack-a-mole': {
    Editor: wrapEditor(WhackAMoleEditor) as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      title: '',
      grade: '',
      questions: [],
      _questionCounter: 0
    })
  },

  'labelled-diagram': {
    Editor: wrapEditor(LabelledDiagramEditor) as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      imagePath: null,
      points: [],
      _pointCounter: 0
    })
  },

  'find-the-treasure': {
    Editor: wrapEditor(FindTheTreasureEditor) as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      stages: [],
      _stageCounter: 0,
      _answerCounter: 0
    })
  },

  'jumping-frog': {
    Editor: wrapEditor(JumpingFrogEditor) as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      questions: [],
      _questionCounter: 0,
      _answerCounter: 0
    })
  }
}
