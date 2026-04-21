import type { AnyAppData, GameAppDataMap } from '@shared/types'
import type { ComponentType } from 'react'

import BalloonLetterPickerEditor from './balloon-letter-picker/BalloonLetterPickerEditor'
import FindTheTreasureEditor from './find-the-treasure/FindTheTreasureEditor'
import GroupSortEditor from './group-sort/GroupSortEditor'
import JumpingFrogEditor from './jumping-frog/JumpingFrogEditor'
import LabelledDiagramEditor from './labelled-diagram/LabelledDiagramEditor'
import LabelledDiagramEditorV2 from './labelled-diagram-v2/LabelledDiagramEditor'
import PairMatchingEditor from './pair-matching/PairMatchingEditor'
import QuizEditor from './plane-quiz/QuizEditor'
import WhackAMoleEditor from './whack-a-mole/WhackAMoleEditor'
import WordSearchEditor from './word-search/WordSearchEditor'
import { wrapEditor } from '@renderer/components/wrapEditor'
import { EditorWrapperHandle } from '@renderer/components/EditorWrapper'

export interface GameRegistryEntry<T extends AnyAppData> {
  /**
   * Editor component rendered on the ProjectPage.
   *
   * This can be either:
   * - A legacy editor wrapped with `wrapEditor()` (uses EditorWrapper shim internally)
   * - A natively migrated TanStack Form editor that implements getValue/setValue itself
   *
   * Both expose the same external contract: initialData / projectDir / onCommit / ref.
   */
  Editor: ComponentType<
    {
      initialData: T
      projectDir: string
      onCommit: (data: T) => void
    } & React.RefAttributes<EditorWrapperHandle<T>>
  >
  /** Returns a fresh, empty appData object for new projects */
  createInitialData: () => T
  /**
   * Normalizes possibly partial or old data into a complete, current-version AppData object.
   * This is called before passing data to the editor.
   */
  normalize: (data: AnyAppData) => T
}

/**
 * Type-safe registry map.
 * This avoids 'any' by using the GameAppDataMap to ensure each key has the correct T.
 */
export type GameRegistry = {
  [K in keyof GameAppDataMap]: GameRegistryEntry<GameAppDataMap[K]>
}

// ── Add new games here ────────────────────────────────────────────────────────
export const GAME_REGISTRY: GameRegistry = {
  'group-sort': {
    Editor: wrapEditor(GroupSortEditor),
    createInitialData: () => ({
      groups: [],
      items: [],
      _groupCounter: 0,
      _itemCounter: 0
    }),
    normalize: (d) => {
      const g = d as GameAppDataMap['group-sort']
      return {
        ...g,
        groups: g.groups ?? [],
        items: g.items ?? [],
        _groupCounter: g._groupCounter ?? 0,
        _itemCounter: g._itemCounter ?? 0
      }
    }
  },

  'plane-quiz': {
    Editor: QuizEditor,
    createInitialData: () => ({
      questions: [],
      _questionCounter: 0
    }),
    normalize: (d) => {
      const q = d as GameAppDataMap['plane-quiz']
      return {
        ...q,
        questions: (q.questions ?? []).map((question) => ({
          ...question,
          answers: question.answers ?? [],
          _answerCounter: question._answerCounter ?? 0
        })),
        _questionCounter: q._questionCounter ?? 0
      }
    }
  },

  'balloon-letter-picker': {
    Editor: wrapEditor(BalloonLetterPickerEditor),
    createInitialData: () => ({
      words: [],
      _wordCounter: 0
    }),
    normalize: (d) => {
      const b = d as GameAppDataMap['balloon-letter-picker']
      return {
        ...b,
        words: b.words ?? [],
        _wordCounter: b._wordCounter ?? 0
      }
    }
  },

  'pair-matching': {
    Editor: wrapEditor(PairMatchingEditor),
    createInitialData: () => ({
      items: [],
      minTotalPairs: 2,
      _itemCounter: 0
    }),
    normalize: (d) => {
      const p = d as GameAppDataMap['pair-matching']
      return {
        ...p,
        items: p.items ?? [],
        minTotalPairs: p.minTotalPairs ?? 2,
        _itemCounter: p._itemCounter ?? 0
      }
    }
  },

  'word-search': {
    Editor: wrapEditor(WordSearchEditor),
    createInitialData: () => ({
      items: [],
      _itemCounter: 0
    }),
    normalize: (d) => {
      const w = d as GameAppDataMap['word-search']
      return {
        ...w,
        items: w.items ?? [],
        _itemCounter: w._itemCounter ?? 0
      }
    }
  },

  'whack-a-mole': {
    Editor: wrapEditor(WhackAMoleEditor),
    createInitialData: () => ({
      title: '',
      grade: '',
      questions: [],
      _questionCounter: 0
    }),
    normalize: (d) => {
      const w = d as GameAppDataMap['whack-a-mole']
      return {
        ...w,
        title: w.title ?? '',
        grade: w.grade ?? '',
        questions: w.questions ?? [],
        _questionCounter: w._questionCounter ?? 0
      }
    }
  },

  'labelled-diagram': {
    Editor: wrapEditor(LabelledDiagramEditor),
    createInitialData: () => ({
      imagePath: null,
      points: [],
      _pointCounter: 0
    }),
    normalize: (d) => {
      const l = d as GameAppDataMap['labelled-diagram']
      return {
        ...l,
        imagePath: l.imagePath ?? null,
        points: l.points ?? [],
        _pointCounter: l._pointCounter ?? 0
      }
    }
  },

  'labelled-diagram-v2': {
    Editor: wrapEditor(LabelledDiagramEditorV2),
    createInitialData: () => ({
      imagePath: null,
      points: [],
      _pointCounter: 0
    }),
    normalize: (d) => {
      const l = d as GameAppDataMap['labelled-diagram-v2']
      return {
        ...l,
        imagePath: l.imagePath ?? null,
        points: l.points ?? [],
        _pointCounter: l._pointCounter ?? 0
      }
    }
  },

  'find-the-treasure': {
    Editor: wrapEditor(FindTheTreasureEditor),
    createInitialData: () => ({
      stages: [],
      _stageCounter: 0,
      _answerCounter: 0
    }),
    normalize: (d) => {
      const f = d as GameAppDataMap['find-the-treasure']
      return {
        ...f,
        stages: (f.stages ?? []).map((s) => ({
          ...s,
          answers: s.answers ?? []
        })),
        _stageCounter: f._stageCounter ?? 0,
        _answerCounter: f._answerCounter ?? 0
      }
    }
  },

  'jumping-frog': {
    Editor: wrapEditor(JumpingFrogEditor),
    createInitialData: () => ({
      questions: [],
      _questionCounter: 0,
      _answerCounter: 0
    }),
    normalize: (d) => {
      const j = d as GameAppDataMap['jumping-frog']
      return {
        ...j,
        questions: (j.questions ?? []).map((q) => ({
          ...q,
          answers: q.answers ?? []
        })),
        _questionCounter: j._questionCounter ?? 0,
        _answerCounter: j._answerCounter ?? 0
      }
    }
  }
}
