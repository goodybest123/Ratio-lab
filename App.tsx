
import React, { useState, useMemo } from 'react';
import { Level } from './types';
import Level1 from './components/Level1';
import Level2 from './components/Level2';
import Level3 from './components/Level3';

const App: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<Level>(Level.LEVEL_1);

  const levels = useMemo(() => [
    { id: Level.LEVEL_1, name: 'Level 1: Exact Recipe' },
    { id: Level.LEVEL_2, name: 'Level 2: The Big Batch' },
    { id: Level.LEVEL_3, name: "Level 3: The Sphinx's Riddle" },
  ], []);

  const renderLevel = () => {
    switch (activeLevel) {
      case Level.LEVEL_1:
        return <Level1 />;
      case Level.LEVEL_2:
        return <Level2 />;
      case Level.LEVEL_3:
        return <Level3 />;
      default:
        return <Level1 />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-900 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-5xl text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-cyan-300 tracking-wider" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>
          Ratio Recipe Lab
        </h1>
        <p className="text-indigo-300 mt-2">Learn ratios by brewing magical potions!</p>
      </header>

      <nav className="w-full max-w-md bg-slate-800/50 rounded-lg p-2 flex justify-center gap-2 mb-8 backdrop-blur-sm">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => setActiveLevel(level.id)}
            className={`w-full text-center px-3 py-2 rounded-md text-sm sm:text-base font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-400 ${
              activeLevel === level.id
                ? 'bg-cyan-500 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {level.name.split(':')[0]}
          </button>
        ))}
      </nav>

      <main className="w-full max-w-5xl flex-grow">
        {renderLevel()}
      </main>
    </div>
  );
};

export default App;
