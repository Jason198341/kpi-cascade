export type CoachMode = 'analyze' | 'suggest' | 'report'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  contextNodeId?: string
}

export interface CoachContext {
  mode: CoachMode
  nodeId?: string
  orgSummary?: string
}
