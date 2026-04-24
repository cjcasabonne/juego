import { Navigate, Route, Routes } from 'react-router-dom';
import AuthCallbackPage from './auth/pages/AuthCallbackPage';
import AuthGuard from './auth/components/AuthGuard';
import LoginPage from './auth/pages/LoginPage';
import CouplesPage from './couples/pages/CouplesPage';
import CreateCouplePage from './couples/pages/CreateCouplePage';
import JoinCouplePage from './couples/pages/JoinCouplePage';
import QuestionsPage from './questions/pages/QuestionsPage';
import NewQuestionPage from './questions/pages/NewQuestionPage';
import ImportQuestionsPage from './import/pages/ImportQuestionsPage';
import SessionRouterPage from './sessions/pages/SessionRouterPage';
import SessionSummaryPage from './sessions/pages/SessionSummaryPage';
import Phase1Page from './game/phase1/pages/Phase1Page';
import Phase2Page from './game/phase2/pages/Phase2Page';
import Phase3Page from './game/phase3/pages/Phase3Page';
import CategoriesPage from './content/pages/CategoriesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AuthGuard />}>
        <Route index element={<Navigate to="/couples" replace />} />
        <Route path="couples" element={<CouplesPage />} />
        <Route path="couples/new" element={<CreateCouplePage />} />
        <Route path="couples/join" element={<JoinCouplePage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="questions/new" element={<NewQuestionPage />} />
        <Route path="import/questions" element={<ImportQuestionsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="session/:sessionId" element={<SessionRouterPage />} />
        <Route path="session/:sessionId/phase1" element={<Phase1Page />} />
        <Route path="session/:sessionId/phase2" element={<Phase2Page />} />
        <Route path="session/:sessionId/phase3" element={<Phase3Page />} />
        <Route path="session/:sessionId/summary" element={<SessionSummaryPage />} />
      </Route>
    </Routes>
  );
}
