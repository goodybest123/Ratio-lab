import React, { useState, useCallback, useEffect } from 'react';
import { getSphinxRiddle } from '../services/geminiService';
import { SphinxRiddle } from '../types';
import { ScrollIcon, RefreshIcon, FireIcon, FrostIcon } from './icons';

type RiddleStatus = 'loading' | 'active' | 'success' | 'failure';

const Sphinx: React.FC<{ status: RiddleStatus }> = ({ status }) => {
    const state = {
        loading: { emoji: '🔮', message: 'The Sphinx is composing a riddle...' },
        active: { emoji: '🦁', message: 'Solve my riddle to pass...' },
        success: { emoji: '🗝️', message: 'You are wise indeed. You may pass.' },
        failure: { emoji: '❌', message: 'Incorrect. The balance is lost.' },
    };

    return (
        <div className="text-center p-4 rounded-lg bg-slate-700/50 mb-6">
            <div className={`text-6xl mb-2 transition-transform duration-500 ${status === 'active' ? 'animate-pulse' : ''}`}>
                {state[status].emoji}
            </div>
            <p className="text-slate-300 font-serif italic text-lg">{state[status].message}</p>
        </div>
    );
};

const Level3: React.FC = () => {
    const [riddle, setRiddle] = useState<SphinxRiddle | null>(null);
    const [status, setStatus] = useState<RiddleStatus>('loading');
    const [userAnswer, setUserAnswer] = useState<number>(0);
    
    const fetchRiddle = useCallback(async (currentRiddle: SphinxRiddle | null) => {
        setStatus('loading');
        setRiddle(null);
        setUserAnswer(0);
        // Pass current riddle to get a new one
        const data = await getSphinxRiddle(currentRiddle);
        setRiddle(data);
        setStatus('active');
    }, []);

    useEffect(() => {
        fetchRiddle(null);
    }, [fetchRiddle]);

    const handleSubmit = () => {
        if (!riddle) return;
        if (userAnswer === riddle.requiredAmount) {
            setStatus('success');
        } else {
            setStatus('failure');
        }
    };

    const handleRetry = () => {
        setStatus('active');
        setUserAnswer(0);
    };

    if (status === 'loading' || !riddle) {
        return (
            <div className="bg-slate-800/50 p-8 rounded-2xl shadow-2xl backdrop-blur-lg border border-slate-700 text-center animate-fade-in">
                <Sphinx status="loading" />
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 p-4 sm:p-8 rounded-2xl shadow-2xl backdrop-blur-lg border border-slate-700 animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-cyan-300">Level 3: The Sphinx's Riddle</h2>
                <p className="text-indigo-300 mt-1">Solve the word problem to balance the magical scale!</p>
            </div>

            <Sphinx status={status} />

            <div className="max-w-2xl mx-auto">
                {/* The Scroll / Riddle Text */}
                <div className="relative bg-amber-100/90 text-amber-900 p-6 rounded-lg shadow-inner mb-8 font-serif text-lg leading-relaxed border-4 border-amber-200/50">
                    <ScrollIcon className="w-8 h-8 absolute -top-4 -left-4 text-amber-500 bg-slate-800 rounded-full p-1" />
                    <p className="italic">"{riddle.riddleText}"</p>
                    <div className="mt-4 flex gap-4 text-sm font-sans font-bold text-amber-800/60 uppercase tracking-widest border-t border-amber-800/20 pt-2">
                        <span>Ratio: {riddle.ratio1} : {riddle.ratio2}</span>
                    </div>
                </div>

                {/* The Visualization Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Left Side: Given */}
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                        <h4 className="text-slate-400 text-sm uppercase tracking-wider mb-3">I have given you:</h4>
                        <div className="text-3xl font-bold text-orange-400 mb-2">{riddle.givenAmount}</div>
                        <div className="text-orange-300 font-medium mb-4">{riddle.ingredient1Name}</div>
                        
                        <div className="flex flex-wrap justify-center gap-2 max-w-[200px]">
                            {Array.from({ length: Math.min(riddle.givenAmount, 50) }).map((_, i) => (
                                <FireIcon key={i} className="w-5 h-5 text-orange-500" />
                            ))}
                            {riddle.givenAmount > 50 && <span className="text-orange-500 text-xs">+ more</span>}
                        </div>
                    </div>

                    {/* Right Side: Required (User Input) */}
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700 flex flex-col items-center relative overflow-hidden">
                        <h4 className="text-slate-400 text-sm uppercase tracking-wider mb-3">You must offer:</h4>
                        
                        {status === 'active' || status === 'failure' ? (
                            <>
                                <div className="text-3xl font-bold text-cyan-400 mb-2">{userAnswer}</div>
                                <div className="text-cyan-300 font-medium mb-4">{riddle.ingredient2Name}</div>
                                
                                <div className="flex items-center gap-4 mb-4">
                                    <button 
                                        onClick={() => setUserAnswer(Math.max(0, userAnswer - 1))}
                                        className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center transition"
                                    >-</button>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={Math.max(20, riddle.requiredAmount * 2)} 
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(parseInt(e.target.value))}
                                        className="w-24 accent-cyan-500"
                                    />
                                    <button 
                                        onClick={() => setUserAnswer(userAnswer + 1)}
                                        className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center transition"
                                    >+</button>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 max-w-[200px]">
                                    {Array.from({ length: Math.min(userAnswer, 50) }).map((_, i) => (
                                        <FrostIcon key={i} className="w-5 h-5 text-cyan-500" />
                                    ))}
                                     {userAnswer > 50 && <span className="text-cyan-500 text-xs">+ more</span>}
                                </div>
                            </>
                        ) : (
                             <>
                                <div className="text-3xl font-bold text-green-400 mb-2">{userAnswer}</div>
                                <div className="text-green-300 font-medium mb-4">{riddle.ingredient2Name}</div>
                                <div className="flex flex-wrap justify-center gap-2 max-w-[200px] animate-pulse">
                                    {Array.from({ length: Math.min(userAnswer, 50) }).map((_, i) => (
                                        <FrostIcon key={i} className="w-5 h-5 text-green-500" />
                                    ))}
                                </div>
                             </>
                        )}
                    </div>
                </div>

                {/* Controls and Feedback */}
                <div className="flex flex-col items-center gap-4">
                    {status === 'active' && (
                        <button 
                            onClick={handleSubmit} 
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 shadow-lg hover:shadow-cyan-500/20 transform hover:-translate-y-1"
                        >
                            Offer Answer
                        </button>
                    )}

                    {status === 'success' && (
                        <div className="text-center animate-fade-in">
                            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                                <p className="text-green-300 font-bold mb-1">Correct!</p>
                                <p className="text-green-200">{riddle.explanation}</p>
                            </div>
                            <button 
                                onClick={() => fetchRiddle(riddle)} 
                                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 shadow-lg flex items-center gap-2 mx-auto"
                            >
                                <RefreshIcon className="w-5 h-5" /> New Riddle
                            </button>
                        </div>
                    )}

                    {status === 'failure' && (
                        <div className="text-center animate-fade-in w-full max-w-md">
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                                <p className="text-red-300 font-bold">Not quite.</p>
                                <p className="text-red-200 text-sm">Review the ratio in the scroll carefully.</p>
                            </div>
                            <button 
                                onClick={handleRetry} 
                                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-full transition duration-300 shadow-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Level3;