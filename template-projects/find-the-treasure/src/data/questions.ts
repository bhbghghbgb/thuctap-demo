import type { Stage } from '../types'

type RecordValue = Record<string, unknown>

type RuntimeWindow = Window &
  typeof globalThis & {
    __MY_APP_DATA__?: unknown
    MY_APP_DATA?: unknown
    APP_DATA?: unknown
    win?: {
      DATA?: unknown
    }
  }

const defaultStages: Stage[] = [
  {
    id: 'sunny-shore',
    location: 'Sunny Shore',
    story: 'A warm beach opens the first clue with a shell-covered signpost.',
    prompt: 'What do plants need from the sun to make their own food?',
    options: ['Moonlight', 'Solar energy', 'Sand'],
    correctAnswer: 1,
    explanation:
      'Plants use sunlight as energy during photosynthesis, which helps them make food.',
    points: 10,
  },
  {
    id: 'echo-cave',
    location: 'Echo Cave',
    story: 'The cave walls repeat every answer, so the team must listen closely.',
    prompt: 'Which fraction is equal to one-half?',
    options: ['2/6', '3/6', '5/12'],
    correctAnswer: 1,
    explanation: 'Three-sixths can be simplified by dividing top and bottom by 3.',
    points: 10,
  },
  {
    id: 'misty-falls',
    location: 'Misty Falls',
    story: 'A bridge appears only when the best reading clue is chosen.',
    prompt: 'Which word is a synonym for "rapid"?',
    options: ['Slow', 'Quick', 'Quiet'],
    correctAnswer: 1,
    explanation: '"Rapid" means fast or quick, so "Quick" is the closest synonym.',
    points: 10,
  },
  {
    id: 'jungle-gate',
    location: 'Jungle Gate',
    story: 'Ancient stones glow when the correct geography answer is spoken.',
    prompt: 'What is the name of the large body of water between continents?',
    options: ['River', 'Ocean', 'Pond'],
    correctAnswer: 1,
    explanation:
      'An ocean is a vast body of salt water that separates continents.',
    points: 10,
  },
  {
    id: 'treasure-cove',
    location: 'Treasure Cove',
    story: 'The final lock opens with one last pattern clue from the map.',
    prompt: 'What number comes next in the pattern 5, 10, 15, 20, ...?',
    options: ['24', '25', '30'],
    correctAnswer: 1,
    explanation:
      'The pattern adds 5 each time, so the next number after 20 is 25.',
    points: 15,
  },
]

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null
}

function readString(record: RecordValue, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

function readNumber(record: RecordValue, key: string): number | undefined {
  const value = record[key]

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function readBoolean(record: RecordValue, key: string): boolean | undefined {
  const value = record[key]
  return typeof value === 'boolean' ? value : undefined
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeOptionsFromAnswers(
  stageRecord: RecordValue,
): { options: string[]; correctAnswer: number | undefined } {
  const answers = stageRecord.answers

  if (!Array.isArray(answers)) {
    return {
      options: [],
      correctAnswer: undefined,
    }
  }

  const optionEntries = answers
    .map((answer) => {
      if (!isRecord(answer)) {
        return null
      }

      const text = readString(answer, 'text')

      if (!text) {
        return null
      }

      return {
        text,
        isCorrect: readBoolean(answer, 'isCorrect') ?? false,
      }
    })
    .filter((entry): entry is { text: string; isCorrect: boolean } => {
      return entry !== null
    })

  const correctAnswer = optionEntries.findIndex((entry) => entry.isCorrect)

  return {
    options: optionEntries.map((entry) => entry.text),
    correctAnswer: correctAnswer >= 0 ? correctAnswer : undefined,
  }
}

function normalizeOptionsFromStage(
  stageRecord: RecordValue,
): { options: string[]; correctAnswer: number } {
  const optionsFromStage = Array.isArray(stageRecord.options)
    ? stageRecord.options.filter((option): option is string => typeof option === 'string')
    : []
  const answersData = normalizeOptionsFromAnswers(stageRecord)
  const options =
    optionsFromStage.length > 0 ? optionsFromStage : answersData.options
  const explicitCorrectAnswer = readNumber(stageRecord, 'correctAnswer')
  const rawCorrectAnswer =
    explicitCorrectAnswer ?? answersData.correctAnswer ?? 0
  const boundedCorrectAnswer =
    options.length > 0
      ? clamp(Math.round(rawCorrectAnswer), 0, options.length - 1)
      : 0

  return {
    options,
    correctAnswer: boundedCorrectAnswer,
  }
}

function normalizeStage(stage: unknown, index: number): Stage | null {
  if (!isRecord(stage)) {
    return null
  }

  const { options, correctAnswer } = normalizeOptionsFromStage(stage)
  const id = readString(stage, 'id') ?? `stage-${index + 1}`
  const location = readString(stage, 'location') ?? readString(stage, 'stageName')
  const story = readString(stage, 'story') ?? readString(stage, 'stageText')
  const prompt = readString(stage, 'prompt') ?? readString(stage, 'question')
  const explanation =
    readString(stage, 'explanation') ?? readString(stage, 'stageDescription')
  const points = readNumber(stage, 'points') ?? readNumber(stage, 'stageValue') ?? 0

  return {
    id,
    location: location?.trim() || `Location ${index + 1}`,
    story: story?.trim() || 'A new clue appears on this island.',
    prompt: prompt?.trim() || 'Choose the best answer to continue the adventure.',
    options,
    correctAnswer,
    explanation:
      explanation?.trim() || 'Check the stage setup in the editor for the explanation.',
    points: Math.max(0, Math.round(points)),
  }
}

function normalizeRuntimeData(runtimeData: unknown): Stage[] | null {
  if (!runtimeData) {
    return null
  }

  const stageSource = Array.isArray(runtimeData)
    ? runtimeData
    : isRecord(runtimeData) && Array.isArray(runtimeData.stages)
      ? runtimeData.stages
      : null

  if (!stageSource) {
    return null
  }

  return stageSource
    .map((stage, index) => normalizeStage(stage, index))
    .filter((stage): stage is Stage => stage !== null)
}

function getRuntimeData(): unknown {
  if (typeof window === 'undefined') {
    return undefined
  }

  const runtimeWindow = window as RuntimeWindow

  return (
    runtimeWindow.__MY_APP_DATA__ ??
    runtimeWindow.MY_APP_DATA ??
    runtimeWindow.APP_DATA ??
    runtimeWindow.win?.DATA
  )
}

function getAppData(): Stage[] {
  const runtimeStages = normalizeRuntimeData(getRuntimeData())
  return runtimeStages ?? defaultStages
}

export const MY_APP_DATA: Stage[] = getAppData()
