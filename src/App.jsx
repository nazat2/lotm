import { Suspense, lazy } from 'react'
import './App.css'
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import World from './components/World';
import useLenis from './hooks/useLenis';

// Below-the-fold sections are code-split so the initial bundle mobile has to
// parse/execute before it can paint the hero is as small as possible.
const Pathways = lazy(() => import('./components/Pathways'));
const IWasHere = lazy(() => import('./components/IWasHere'));
const TarotReading = lazy(() => import('./components/TarotReading'));
const Footer = lazy(() => import('./components/Footer'));

function App() {
  useLenis();
  return (
    <div className="bg-void">
      <Navbar />
      <Hero />
      <World />
      <Suspense fallback={<div className="min-h-[400px] bg-void" />}>
        <Pathways />
        <IWasHere />
        <TarotReading />
        <Footer />
      </Suspense>
      {/* more sections will go below */}
    </div>
  );
}

export default App;
