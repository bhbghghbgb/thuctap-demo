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

export interface EditorRef {
  getValue: () => AnyAppData
  setValue: (data: AnyAppData) => void
}

export interface EditorProps {
  initialData: AnyAppData
  projectDir: string
  onCommit: (data: AnyAppData) => void
}

export type OldEditorProps = {
  appData: AnyAppData
  projectDir: string
  onChange: (data: AnyAppData) => void
}

export interface GameRegistryEntry {
  /** Editor component rendered on the ProjectPage */
  Editor: ComponentType<EditorProps & { ref?: React.Ref<EditorRef> }>
  /** Alternative for legacy editors */
  OldEditor?: ComponentType<OldEditorProps>
  /** Returns a fresh, empty appData object for new projects */
  createInitialData: () => AnyAppData
}

import { EditorWrapper } from '@renderer/components/EditorWrapper'
import { forwardRef } from 'react'

// ── Add new games here ────────────────────────────────────────────────────────
export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  'group-sort': {
    Editor: forwardRef((props, ref) => (
      <EditorWrapper {...props} ref={ref} OldEditor={GroupSortEditor} />
    )),
    createInitialData: () => ({
      groups: [],
      items: [],
      _groupCounter: 0,
      _itemCounter: 0
    })
  },

  'plane-quiz': {
    Editor: QuizEditor as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      questions: [],
      _questionCounter: 0
    })
  },

  'balloon-letter-picker': {
    Editor: forwardRef((props, ref) => (
      <EditorWrapper {...props} ref={ref} OldEditor={BalloonLetterPickerEditor} />
    )),
    createInitialData: () => ({
      words: [],
      _wordCounter: 0
    })
  },

  'pair-matching': {
    Editor: forwardRef((props, ref) => (
      <EditorWrapper {...props} ref={ref} OldEditor={PairMatchingEditor} />
    )),
    createInitialData: () => ({
      items: [],
      minTotalPairs: 2,
      _itemCounter: 0
    })
  },

  'word-search': {
    Editor: forwardRef((props, ref) => (
      <EditorWrapper {...props} ref={ref} OldEditor={WordSearchEditor} />
    )),
    createInitialData: () => ({
      items: [],
      _itemCounter: 0
    })
  },

  'whack-a-mole': {
    Editor: forwardRef((props, ref) => (
      <EditorWrapper {...props} ref={ref} OldEditor={WhackAMoleEditor} />
    )),
    createInitialData: () => ({
      title: '',
      grade: '',
      questions: [],
      _questionCounter: 0
    })
  },

  'labelled-diagram': {
    Editor: forwardRef((props, ref) => (
      <EditorWrapper {...props} ref={ref} OldEditor={LabelledDiagramEditor} />
    )),
    createInitialData: () => ({
      imagePath: null,
      points: [],
      _pointCounter: 0
    })
  },

  'find-the-treasure': {
    Editor: forwardRef((props, ref) => (
      <EditorWrapper {...props} ref={ref} OldEditor={FindTheTreasureEditor} />
    )),
    createInitialData: () => ({
      stages: [],
      _stageCounter: 0,
      _answerCounter: 0
    })
  },

  'jumping-frog': {
    Editor: forwardRef((props, ref) => (
      <EditorWrapper {...props} ref={ref} OldEditor={JumpingFrogEditor} />
    )),
    createInitialData: () => ({
      questions: [],
      _questionCounter: 0,
      _answerCounter: 0
    })
  }
}
