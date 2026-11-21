import { Toaster } from 'react-hot-toast';
import { Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/common/ScrollToTop.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import ExamIntro from './pages/student/ExamIntro.jsx';
import MyResults from './pages/student/MyResults.jsx';
import Result from './pages/student/Result.jsx';
import TakeExam from './pages/student/TakeExam.jsx';
import BulkImport from './pages/teacher/BulkImport.jsx';
import CreateExam from './pages/teacher/CreateExam.jsx';
import Dashboard from './pages/teacher/Dashboard.jsx';
import ExamDetail from './pages/teacher/ExamDetail.jsx';
import QuestionBank from './pages/teacher/QuestionBank.jsx';
import QuestionBuilder from './pages/teacher/QuestionBuilder.jsx';
import TeacherRequests from './pages/teacher/TeacherRequests.jsx';
import PrivateRoute from './routes/PrivateRoute.jsx';
import PrintPaper from './pages/teacher/PrintPaper.jsx';
import { Analytics } from '@vercel/analytics/react';


export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" toastOptions={{ style: { maxWidth: 480 } }} />
      <Analytics />

      <Routes>
        {/* পরীক্ষা চলার সময় মেনু ছাড়া পরিষ্কার পেজ */}
        <Route
          path="/exam/:code/take"
          element={
            <PrivateRoute role="student">
              <TakeExam />
            </PrivateRoute>
          }
        />

        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* পরীক্ষার লিংক: লগইন ছাড়াও খোলা যায় */}
          <Route path="/exam/:code" element={<ExamIntro />} />

          <Route path="/my-results" element={<PrivateRoute role="student"><MyResults /></PrivateRoute>} />
          <Route path="/result/:id" element={<PrivateRoute><Result /></PrivateRoute>} />

          <Route path="/teacher" element={<PrivateRoute role="teacher"><Dashboard /></PrivateRoute>} />
          <Route path="/teacher/questions" element={<PrivateRoute role="teacher"><QuestionBank /></PrivateRoute>} />
          <Route path="/teacher/print" element={<PrivateRoute role="teacher"><PrintPaper /></PrivateRoute>} />
          <Route path="/teacher/questions/new" element={<PrivateRoute role="teacher"><QuestionBuilder /></PrivateRoute>} />
          <Route path="/teacher/requests" element={<PrivateRoute role="teacher" owner><TeacherRequests /></PrivateRoute>} />
          <Route path="/teacher/import" element={<PrivateRoute role="teacher"><BulkImport /></PrivateRoute>} />
          <Route path="/teacher/exams/new" element={<PrivateRoute role="teacher"><CreateExam /></PrivateRoute>} />
          <Route path="/teacher/exams/:id" element={<PrivateRoute role="teacher"><ExamDetail /></PrivateRoute>} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
