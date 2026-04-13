import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DiscoverPage from './pages/index'
import BrainstormPage from './pages/brainstorm'
import WorkflowPage from './pages/workflow'
import SharedWorkflowPage from './pages/share/token'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/brainstorm" element={<BrainstormPage />} />
        <Route path="/workflow/:workflowId" element={<WorkflowPage />} />
        <Route path="/share/:token" element={<SharedWorkflowPage />} />
      </Routes>
    </BrowserRouter>
  )
}
