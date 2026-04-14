import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const checkHealth = () => api.get('/health')

export const brainstormStart = (rawIdea, platforms = []) =>
  api.post('/api/brainstorm/start', { raw_idea: rawIdea, platforms })

export const brainstormRespond = (sessionId, answer) =>
  api.post('/api/brainstorm/respond', { session_id: sessionId, answer })

export const generateWorkflow = (sessionId) =>
  api.post('/api/workflow/generate', { session_id: sessionId })

export const refineWorkflow = (workflowId, message) =>
  api.post('/api/workflow/refine', { workflow_id: workflowId, message })

export const getWorkflow = (workflowId) =>
  api.get(`/api/workflow/${workflowId}`)

export const shareWorkflow = (workflowId) =>
  api.post(`/api/workflow/${workflowId}/share`)

export const exportWorkflow = (workflowId) =>
  api.get(`/api/workflow/${workflowId}/export`, { responseType: 'blob' })

export const getWorkflowByToken = (token) =>
  api.get(`/api/workflow/share/${token}`)

export const getExamples = () => api.get('/api/content/examples')

export const getIdeas = () => api.get('/api/content/ideas')

export const getStats = () => api.get('/api/content/stats')

export const getPromptSuggestions = (platforms) =>
  api.post('/api/content/prompt-suggestions', { platforms })
