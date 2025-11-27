import React, { useState, useCallback, useEffect } from 'react';
import { getLevel1Hint, getNewRecipe } from '../services/geminiService';
import { DropperIcon, RefreshIcon } from './icons';

type PotionStatus = 'idle' | 'success' | 'failure' | 'mixing';

const PotionPet: React.FC<{ status: PotionStatus }> = ({ status }) => {
    const petState = {
        idle: { emoji: '🤔', message: 'Waiting for the potion...' },
        mixing: { emoji: '😮', message: 'What are you brewing?' },
        success: { emoji: '🥳', message: 'Yummy! I love it!' },
        failure: { emoji: '🤢', message: 'Ew, that\'s not right!' },
    };
    return (
        <div className={`text-center p-4 rounded-lg transition-all duration-500 ${status === 'success' ? 'bg-green-500/20' : status === 'failure' ? 'bg-red-500/20' : 'bg-slate-700/50'}`}>
            <div className={`text-6xl transition-transform duration-500 ${status === 'success' ? 'animate-bounce' : ''}`}>{petState[status].emoji}</div>
            <p className="mt-2 text-slate-300 font-semibold">{petState[status].message}</p>
        </div>
    );
};

const Cauldron: React.FC<{ status: PotionStatus, greenDrops: number, purpleDrops: number }> = ({ status, greenDrops, purpleDrops }) => {
    const totalDrops = greenDrops + purpleDrops;
    const greenPercent = totalDrops > 0 ? (greenDrops / totalDrops) * 100 : 0;
    
    const fillPercentage = Math.min(100, (totalDrops / 20) * 75);
    const showSeparateColors = status === 'idle' || status === 'mixing';

    return (
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto">
            {/* Cauldron body */}
            <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gray-800 rounded-t-full border-4 border-gray-600"></div>
            
            {/* Liquid container */}
            <div className="absolute bottom-0 left-0 right-0 h-3/4 rounded-t-full overflow-hidden">
                <div 
                    className={`absolute bottom-0 w-full flex transition-all duration-500 ease-in-out ${status === 'mixing' ? 'animate-ping opacity-75' : ''}`}
                    style={{ height: `${fillPercentage}%` }}
                >
                    {showSeparateColors ? (
                        <>
                            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${greenPercent}%` }}></div>
                            <div className="h-full bg-purple-600 transition-all duration-500" style={{ width: `${100 - greenPercent}%` }}></div>
                        </>
                    ) : status === 'success' ? (
                        <div className="h-full w-full bg-gradient-to-br from-green-400 to-purple-500 animate-pulse"></div>
                    ) : status === 'failure' ? (
                        <div className="h-full w-full bg-gradient-to-br from-yellow-800 to-stone-700"></div>
                    ) : null}
                </div>
                {status === 'success' && (
                     <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl animate-ping">✨</span>
                    </div>
                )}
            </div>

            {/* Cauldron rim */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110%] h-8 bg-gray-700 rounded-full border-4 border-gray-600"></div>
        </div>
    );
};

const Level1: React.FC = () => {
    const [recipe, setRecipe] = useState<{ potionName: string; green: number; purple: number } | null>(null);
    const [greenDrops, setGreenDrops] = useState(0);
    const [purpleDrops, setPurpleDrops] = useState(0);
    const [status, setStatus] = useState<PotionStatus>('idle');
    const [hint, setHint] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingRecipe, setIsFetchingRecipe] = useState(true);

    const handleReset = useCallback(() => {
        setGreenDrops(0);
        setPurpleDrops(0);
        setStatus('idle');
        setHint('');
        setIsLoading(false);
    }, []);
    
    const fetchNewRecipe = useCallback(async (currentRecipe: typeof recipe | null) => {
        setIsFetchingRecipe(true);
        handleReset();
        const newRecipe = await getNewRecipe(currentRecipe || undefined);
        setRecipe(newRecipe);
        setIsFetchingRecipe(false);
    }, [handleReset]);
    
    useEffect(() => {
        fetchNewRecipe(null);
    }, [fetchNewRecipe]);

    const handleMix = useCallback(async () => {
        if (!recipe) return;

        setIsLoading(true);
        setStatus('mixing');
        setHint('');

        setTimeout(async () => {
            // Check for the RATIO, not the exact number.
            // green / purple === recipe.green / recipe.purple  => green * recipe.purple === purple * recipe.green
            if (greenDrops > 0 && greenDrops * recipe.purple === purpleDrops * recipe.green) {
                setStatus('success');
            } else {
                setStatus('failure');
                const aiHint = await getLevel1Hint(greenDrops, purpleDrops, recipe.green, recipe.purple);
                setHint(aiHint);
            }
            setIsLoading(false);
        }, 1500);

    }, [greenDrops, purpleDrops, recipe]);
    
    const DropControl: React.FC<{color: 'green' | 'purple', drops: number, setDrops: (val: number) => void}> = ({color, drops, setDrops}) => {
        const colorClasses = color === 'green' 
            ? { bg: 'bg-green-500', text: 'text-green-300', ring: 'focus:ring-green-400' } 
            : { bg: 'bg-purple-500', text: 'text-purple-300', ring: 'focus:ring-purple-400' };

        return (
            <div className="flex flex-col items-center gap-3 p-4 bg-slate-800 rounded-xl">
                 <div className={`w-16 h-16 rounded-full ${colorClasses.bg} flex items-center justify-center`}>
                    <DropperIcon className="w-8 h-8 text-white"/>
                </div>
                <h3 className={`font-bold text-lg ${colorClasses.text}`}>{color === 'green' ? 'Green Slime' : 'Purple Goo'}</h3>
                <input
                    type="number"
                    min="0"
                    value={drops}
                    onChange={(e) => setDrops(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    disabled={isLoading || status !== 'idle'}
                    className={`w-28 p-2 text-center text-2xl font-mono bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:outline-none disabled:opacity-50 ${colorClasses.ring}`}
                    aria-label={`Number of ${color} drops`}
                />
            </div>
        )
    };

     if (isFetchingRecipe && !recipe) {
        return (
            <div className="bg-slate-800/50 p-8 rounded-2xl shadow-2xl backdrop-blur-lg border border-slate-700 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-cyan-300 animate-pulse">Conjuring a New Recipe...</h2>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 p-4 sm:p-8 rounded-2xl shadow-2xl backdrop-blur-lg border border-slate-700 animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-cyan-300">Level 1: Potion Apprentice</h2>
                <p className="text-indigo-300 mt-1">Follow the recipe's ratio to brew a perfect potion!</p>
            </div>
            
            <div className="w-full max-w-lg mx-auto bg-slate-700/50 p-4 rounded-lg border border-slate-600 mb-6 relative">
                 <h3 className="text-xl font-bold text-center text-yellow-300">{recipe?.potionName}</h3>
                <p className="text-center text-slate-200 mt-2">
                    Ratio: <span className="text-green-400 font-semibold">{recipe?.green} drops</span> Green Slime to <span className="text-purple-400 font-semibold">{recipe?.purple} drops</span> Purple Goo
                </p>
                <button 
                  onClick={() => fetchNewRecipe(recipe)} 
                  disabled={isFetchingRecipe}
                  className="absolute -top-4 -right-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold p-2 rounded-full transition duration-300 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-yellow-400"
                  aria-label="Get new recipe"
                >
                  <RefreshIcon className={`h-6 w-6 ${isFetchingRecipe ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {recipe && (
                <div className="w-full max-w-xs mx-auto bg-slate-900/50 p-3 rounded-md border-2 border-slate-600 mb-8 shadow-inner">
                    <p className="text-center text-3xl font-mono text-slate-300 tracking-wider">
                        <span className="font-bold text-green-400">{recipe.green}</span>
                        <span className="mx-3">:</span>
                        <span className="font-bold text-purple-400">{recipe.purple}</span>
                    </p>
                </div>
            )}

            <div className="mt-8 p-4 sm:p-6 rounded-2xl border-2 border-indigo-500/50 shadow-inner bg-slate-900/20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                    <DropControl color="green" drops={greenDrops} setDrops={setGreenDrops} />

                    <div className="flex flex-col items-center gap-4">
                        <Cauldron status={status} greenDrops={greenDrops} purpleDrops={purpleDrops} />
                        {status === 'idle' && <button onClick={handleMix} disabled={isLoading || isFetchingRecipe} className="w-full max-w-[200px] bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition duration-300 shadow-lg">Mix Potion</button>}
                        {status === 'success' && <button onClick={() => fetchNewRecipe(recipe)} disabled={isFetchingRecipe} className="w-full max-w-[200px] bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 px-4 rounded-lg text-lg transition duration-300 shadow-lg">{isFetchingRecipe ? 'Loading...' : 'Next Recipe'}</button>}
                        {status === 'failure' && <button onClick={handleReset} className="w-full max-w-[200px] bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 px-4 rounded-lg text-lg transition duration-300 shadow-lg">Try Again</button>}
                    </div>

                    <DropControl color="purple" drops={purpleDrops} setDrops={setPurpleDrops} />
                </div>
            </div>

            <div className="mt-8 text-center min-h-[6rem] flex flex-col justify-center items-center">
                <PotionPet status={status} />
                 {isLoading && <p className="text-lg text-cyan-300 animate-pulse mt-4">Mixing...</p>}
                 {hint && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg max-w-md mx-auto">
                        <p className="font-semibold text-yellow-300">Potion Master's Hint:</p>
                        <p className="text-yellow-200">{hint}</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default Level1;