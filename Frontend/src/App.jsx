import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import Dashboard from "./components/Dashboard";
import CrosswalksList from "./pages/CrosswalksList";
import CrosswalkDetails from "./pages/CrosswalkDetails";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";
import { Activity, MapPin, Home, TrendingUp } from "lucide-react";
import { AlertsProvider } from "./context/AlertsContext";
import "./App.css";
import "./index.css";

function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
              <Activity className="text-white" size={20} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-xl font-bold text-gray-900">Smart Crosswalk</h1>
              <p className="text-xs text-gray-500">מערכת ניהול מעברי חצייה חכמים</p>
            </div>
            <h1 className="sm:hidden text-base font-bold text-gray-900">Smart Crosswalk</h1>
          </div>
          
          <div className="flex gap-1 sm:gap-2">
            <Link
              to="/"
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-xs sm:text-base ${
                isActive('/') && location.pathname === '/'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home size={18} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">לוח בקרה</span>
            </Link>
            <Link
              to="/crosswalks"
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-xs sm:text-base ${
                isActive('/crosswalks') || isActive('/crosswalk/')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MapPin size={18} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">מעברי חצייה</span>
            </Link>
            <Link
              to="/statistics"
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-xs sm:text-base ${
                isActive('/statistics')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp size={18} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">סטטיסטיקות</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <Motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Dashboard />
          </Motion.div>
        } />
        <Route path="/crosswalks" element={
          <Motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CrosswalksList />
          </Motion.div>
        } />
        <Route path="/crosswalk/:id" element={
          <Motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CrosswalkDetails />
          </Motion.div>
        } />
        <Route path="/statistics" element={
          <Motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Statistics />
          </Motion.div>
        } />
        <Route path="*" element={
          <Motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <NotFound />
          </Motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AlertsProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <AnimatedRoutes />
        </div>
      </AlertsProvider>
    </Router>
  );
}

export default App;
