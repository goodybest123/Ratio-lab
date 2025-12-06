import React, { useState, useCallback, useEffect } from 'react';
import { getNewLevel2Challenge } from '../services/geminiService';
import { Level2Challenge } from '../types';
import { RefreshIcon, FireIcon, FrostIcon } from './icons';

type GameStatus = 'idle' | 'checking' | 'success' | 'failure';

const Ogre: React.FC<{ status: GameStatus }> = ({ status }) => {
    const ogreState = {
        idle: { emoji: '🙂', message: 'I need a GIANT potion!' },
        checking: { emoji: '🤔', message: 'Is that enough?' },
        success: { emoji: '🥳', message: 'WOOHOO! IT WORKS!' },
        failure: { emoji: '😞', message: 'Aww, that\'s not right...' },
    };

    return (
        <div className="text-center p-4 rounded-lg bg-slate-700/50">
            <div className="text-7xl">{ogreState[status].emoji}</div>
            <p className="mt-2 text-slate-300 font-semibold">{ogreState[status].message}</p>
        </div>
    );
}

const Level2: React.FC = () => {
    const [sliderValue, setSliderValue] = useState(1);
    const [status, setStatus] = useState<GameStatus>('idle');
    const [challenge, setChallenge] = useState<Level2Challenge | null>(null);
    const [isFetchingChallenge, setIsFetchingChallenge] = useState(true);

    const handleReset = useCallback(() => {
        setSliderValue(1);
        setStatus('idle');
    }, []);

    const fetchNewChallenge = useCallback(async (currentChallenge: Level2Challenge | null) => {
        setIsFetchingChallenge(true);
        handleReset();
        // Pass current challenge to ensure we get a fresh one
        const newChallenge = await getNewLevel2Challenge(currentChallenge);
        setChallenge(newChallenge);
        setIsFetchingChallenge(false);
    }, [handleReset]);

    useEffect(() => {
        fetchNewChallenge(null);
    }, [fetchNewChallenge]);

    const handleMix = () => {
        if (!challenge) return;
        setStatus('checking');
        setTimeout(() => {
            if (sliderValue === challenge.scaled_part_2) {
                setStatus('success');
            } else {
                setStatus('failure');
            }
        }, 1500);
    };

    const vatGlowClass = status === 'success' ? 'shadow-[0_0_30px_10px] shadow-yellow-300/80' : 'shadow-none';
    const liquidColor = status === 'success' ? 'bg-yellow-300' : status === 'failure' ? 'bg-slate-600' : 'bg-indigo-400';

    if (isFetchingChallenge && !challenge) {
        return (
            <div className="bg-slate-800/50 p-8 rounded-2xl shadow-2xl backdrop-blur-lg border border-slate-700 text-center animate-pulse">
                <h2 className="text-2xl sm:text-3xl font-bold text-cyan-300">Brewing a Big Challenge...</h2>
            </div>
        );
    }
    
    if (!challenge) {
        return <div className="text-center p-8 text-red-400">Error loading challenge. Please refresh.</div>
    }

    return (
        <div className="bg-slate-800/50 p-4 sm:p-8 rounded-2xl shadow-2xl backdrop-blur-lg border border-slate-700 animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-cyan-300">Level 2: The Big Batch</h2>
                <p className="text-indigo-300 mt-1">An Ogre needs a giant potion. Scale up the recipe!</p>
            </div>
            
             <div className="w-full max-w-lg mx-auto bg-slate-700/50 p-4 rounded-lg border border-slate-600 mb-8 relative">
                <h3 className="text-xl font-bold text-center text-yellow-300">Base Recipe: {challenge.potionName}</h3>
                <p className="text-center text-slate-200 mt-2 flex justify-center items-center gap-4">
                    <span className="flex items-center gap-2">
                        <FireIcon className="w-5 h-5 text-red-500" />
                        <span><span className="font-semibold text-amber-300">{challenge.baseRatio1}</span> {challenge.ingredient1Name}</span>
                    </span>
                    <span>&</span>
                    <span className="flex items-center gap-2">
                        <FrostIcon className="w-5 h-5 text-blue-400" />
                        <span><span className="font-semibold text-sky-300">{challenge.baseRatio2}</span> {challenge.ingredient2Name}</span>
                    </span>
                </p>
                <button 
                  onClick={() => fetchNewChallenge(challenge)} 
                  disabled={isFetchingChallenge}
                  className="absolute -top-4 -right-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold p-2 rounded-full transition duration-300 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-yellow-400"
                  aria-label="Get new challenge"
                >
                  <RefreshIcon className={`h-6 w-6 ${isFetchingChallenge ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="flex justify-center md:justify-end">
                    <Ogre status={status} />
                </div>
                
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-48 h-64 bg-slate-700 rounded-lg p-2 border-4 border-slate-600">
                        <div className={`absolute bottom-2 left-2 right-2 h-1/4 bg-amber-400 rounded-md flex items-center justify-center transition-all duration-500`}>
                            <span className="text-2xl font-bold text-amber-900 ml-2">{challenge.givenPart1}</span>
                        </div>
                        <div className={`absolute bottom-[27%] left-2 right-2 rounded-md transition-all duration-1000 ${liquidColor} ${vatGlowClass}`} style={{height: `${(sliderValue / (challenge.scaled_part_2 + 10)) * 65}%`}}>
                        </div>
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-800/50 backdrop-blur-sm px-4 py-1 rounded-full border border-slate-600">
                            <p className="font-mono text-lg text-cyan-300">{challenge.baseRatio1}:{challenge.baseRatio2} = {challenge.givenPart1}:?</p>
                        </div>
                    </div>
                    
                     <div className="w-full max-w-xs text-center">
                        <label htmlFor="moon-mist" className="font-semibold text-sky-300 flex items-center justify-center gap-2">
                            <FrostIcon className="w-6 h-6 text-blue-400" />
                            <span>{challenge.ingredient2Name}: <span className="font-mono text-xl text-white">{sliderValue}</span></span>
                        </label>
                        <input
                            id="moon-mist"
                            type="range"
                            min="1"
                            max={challenge.scaled_part_2 + 10}
                            value={sliderValue}
                            onChange={(e) => setSliderValue(Number(e.target.value))}
                            disabled={status !== 'idle' && status !== 'failure'}
                            className="w-full h-3 bg-slate-600 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 disabled:opacity-50 mt-2"
                        />
                    </div>
                    
                    {status === 'idle' && <button onClick={handleMix} disabled={isFetchingChallenge} className="w-full max-w-[200px] bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition duration-300 shadow-lg">{isFetchingChallenge ? 'Loading...' : 'Mix Giant Potion'}</button>}
                    {status === 'success' && <button onClick={() => fetchNewChallenge(challenge)} disabled={isFetchingChallenge} className="w-full max-w-[200px] bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 px-4 rounded-lg text-lg transition duration-300 shadow-lg">{isFetchingChallenge ? 'Loading...' : 'Next Challenge'}</button>}
                    {status === 'failure' && <button onClick={handleReset} className="w-full max-w-[200px] bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 px-4 rounded-lg text-lg transition duration-300 shadow-lg">Try Again</button>}

                </div>
                
                <div className="flex justify-center md:justify-start">
                    {/* Placeholder for potion pet or other elements */}
                </div>
            </div>

             {status === 'failure' && challenge && (
                <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg max-w-md mx-auto text-center">
                    <p className="font-semibold text-yellow-300">Hint:</p>
                    <p className="text-yellow-200">{challenge.hint}</p>
                </div>
            )}
             {status === 'success' && challenge && (
                <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg max-w-md mx-auto text-center">
                    <p className="font-semibold text-green-300">Awesome!</p>
                    <p className="text-green-200">You correctly scaled the recipe! The full potion has {challenge.total_units} drops.</p>
                </div>
            )}
        </div>
    );
};

export default Level2;