import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { AIConfig, ConsoleLog, GameStats } from './types';
import { PERSONALITIES } from './components/Personalities';
import { RetroBoard } from './components/RetroBoard';
import { ConsolePanel } from './components/ConsolePanel';
import { AIConfigDialog } from './components/AIConfigDialog';
import { audioEngine } from './components/AudioEngine';
import { 
  Volume2, 
  VolumeX, 
  Tv, 
  RefreshCw, 
  RotateCcw, 
  User, 
  Cpu, 
  Info, 
  Settings, 
  Trophy, 
  Check, 
  ChevronRight, 
  Gamepad2,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  // Game state
  const [game, setGame] = useState(() => new Chess());
  const [boardFen, setBoardFen] = useState(() => game.fen());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [isFlipped, setIsFlipped] = useState(false);
  const [theme, setTheme] = useState<'classic' | 'gameboy' | 'neon' | 'cyberpunk'>('classic');
  const [isMuted, setIsMuted] = useState(() => audioEngine.getMuteStatus());
  const [isCrt, setIsCrt] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [gameOverResult, setGameOverResult] = useState<{ title: string; desc: string; winnerColor?: string } | null>(null);

  // Stats
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('retro_chess_stats');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return { wins: 0, losses: 0, draws: 0 };
  });

  // AI Connection configuration
  const [config, setConfig] = useState<AIConfig>({
    endpoint: 'http://localhost:1234/v1',
    model: 'gemma',
    personality: 'gemma_master',
    temperature: 0.7,
    thinkingDelay: 1500,
    maxRetries: 3
  });

  // Console log messages
  const [logs, setLogs] = useState<ConsoleLog[]>([]);

  // Append a console log with proper ID and timestamp
  const addLog = useCallback((type: ConsoleLog['type'], text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const newLog: ConsoleLog = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      text,
      timestamp
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  // Save stats helper
  const updateStats = useCallback((action: 'win' | 'lose' | 'draw') => {
    setStats(prev => {
      const next = { ...prev };
      if (action === 'win') next.wins += 1;
      else if (action === 'lose') next.losses += 1;
      else next.draws += 1;
      localStorage.setItem('retro_chess_stats', JSON.stringify(next));
      return next;
    });
  }, []);

  // Reset core stats
  const resetStats = () => {
    audioEngine.playClick();
    const cleanStats = { wins: 0, losses: 0, draws: 0 };
    setStats(cleanStats);
    localStorage.setItem('retro_chess_stats', JSON.stringify(cleanStats));
    addLog('system', 'PLAYER STATISTICS HAVE BEEN WIPED.');
  };

  // Initial boots log sequences
  useEffect(() => {
    audioEngine.playStartup();
    addLog('system', '👾 SYSTEM REBOOT INITIATED...');
    setTimeout(() => addLog('system', '🔌 CONNECTING TO COPROCESSOR INTERFACE...'), 300);
    setTimeout(() => addLog('system', '🖥️ CRT DISPLAY DRIVER LOADED OK - VRES 320x240'), 600);
    setTimeout(() => {
      const currentPersonality = PERSONALITIES[config.personality];
      addLog('system', `🗣️ CHALLENGER MODEL READY: ${currentPersonality.name} [${currentPersonality.title}]`);
      addLog('ai', currentPersonality.greeting);
      addLog('system', `🎮 WELCOME! YOU CHOSE WHITE SQUARES. MAKE YOUR OPENING MOVE.`);
    }, 1100);
  }, []);

  // Change Gemma personality trigger
  const handleUpdateConfig = (newConfig: AIConfig) => {
    setConfig(newConfig);
    const persona = PERSONALITIES[newConfig.personality];
    addLog('system', `🗣️ CHALLENGER CHANGED: ${persona.name} [${persona.title}]`);
    addLog('ai', persona.greeting);
  };

  // 1-Ply Smart Heuristic Fallback Engine
  // Triggers if LM Studio is offline so the user can ALWAYS play a fully working game!
  const calculateHeuristicMove = (g: Chess): Move => {
    const legalMoves = g.moves({ verbose: true }) as Move[];
    let bestMove: Move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    let bestScore = -Infinity;

    // Piece weights: Pawn=10, Knight=30, Bishop=30, Rook=50, Queen=90, King=900
    const values: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

    legalMoves.forEach(m => {
      let score = 0;
      // Favor captures
      if (m.captured) {
        score += (values[m.captured] || 10) * 10;
      }
      // Favor checks
      const copy = new Chess(g.fen());
      copy.move({ from: m.from, to: m.to, promotion: 'q' });
      if (copy.inCheck()) {
        score += 25;
      }
      // Slight random rattle
      score += Math.random() * 5;

      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
      }
    });

    return bestMove;
  };

  // AI Move Generation Worker (LM Studio Gemma API Handler)
  const generateAiMove = useCallback(async (currentFen: string) => {
    setIsAiThinking(true);
    
    // Simulate thinking delay first for beautiful 8-bit visual processing
    await new Promise(resolve => setTimeout(resolve, config.thinkingDelay));

    const gameCopy = new Chess(currentFen);
    const legalMoves = gameCopy.moves({ verbose: true }) as Move[];

    if (legalMoves.length === 0) {
      setIsAiThinking(false);
      return;
    }

    const persona = PERSONALITIES[config.personality];
    const aiColor = playerColor === 'w' ? 'b' : 'w';
    const legalUcis = legalMoves.map(m => m.from + m.to);
    const legalSans = legalMoves.map(m => m.san);

    // Prompt compilation specifying strict 1st line rules
    const systemPrompt = `You are a retro 8-bit arcade chess opponent named ${persona.name}, with the title of ${persona.title}.
Personality description: ${persona.description}
Your goals list:
- Select exactly ONE move from the list of legal moves given by the user.
- Output ONLY the selected move on the very first line of your response in UCI coordinate format (e.g., d2d4, g1f3, e7e8q). It must EXACTLY match a valid move from the legal list.
- On the second line, write a short, character-themed dialog (max 15 words) addressing the player. Respect your personality flavor.
- Never write introductory remarks, PGN history, or coordinates. Just the physical move on Line 1.`;

    const userPrompt = `Here is our current chessboard in FEN representation:
${currentFen}

You are playing as ${aiColor === 'w' ? 'White' : 'Black'}.
Here is the complete list of legal moves you are allowed to make in UCI and SAN format:
UCI: ${legalUcis.join(', ')}
SAN: ${legalSans.join(', ')}

Select exactly one move from the list above and state it on Line 1. On Line 2, write your short dialogue.`;

    // Attempt calling local LM Studio
    try {
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model || 'gemma',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: config.temperature,
          max_tokens: 120
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with code ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      
      if (!content.trim()) {
        throw new Error('Emply response returned from model.');
      }

      // Analyze and execute parsed move
      const lines = content.split('\n').map((l: string) => l.trim());
      const firstLineClean = lines[0]?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || '';
      const dialogueLine = lines.slice(1).join(' ').replace(/"/g, '').trim() || persona.capturePhrase;

      // Match first-line clean
      let matchingMove = legalMoves.find(m => {
        const uci = (m.from + m.to).toLowerCase();
        const san = m.san.toLowerCase();
        const sanNoCheck = san.replace(/[+#]/g, '');
        return firstLineClean === uci || 
               firstLineClean === san || 
               firstLineClean === sanNoCheck ||
               firstLineClean === m.lan?.toLowerCase();
      });

      // Secondary substring scan through the first line
      if (!matchingMove) {
        matchingMove = legalMoves.find(m => {
          const uci = (m.from + m.to).toLowerCase();
          return firstLineClean.includes(uci);
        });
      }

      // Tertiary scan through the entire text in case layout is scrambled
      if (!matchingMove) {
        matchingMove = legalMoves.find(m => {
          const uci = (m.from + m.to).toLowerCase();
          const scanRx = new RegExp(`\\b${uci}\\b`, 'i');
          return scanRx.test(content);
        });
      }

      if (matchingMove) {
        // SUCCESSFUL GEMMA MOVE
        gameCopy.move({
          from: matchingMove.from,
          to: matchingMove.to,
          promotion: matchingMove.promotion || 'q'
        });

        // Trigger board state updates
        setGame(gameCopy);
        setBoardFen(gameCopy.fen());

        if (matchingMove.captured) {
          audioEngine.playCapture();
          addLog('ai', `${dialogueLine} [TAKES ${matchingMove.captured.toUpperCase()} ON ${matchingMove.to.toUpperCase()}]`);
        } else {
          audioEngine.playMove();
          addLog('ai', `${dialogueLine} [MOVES ${matchingMove.piece.toUpperCase()} ${matchingMove.from.toUpperCase()}➔${matchingMove.to.toUpperCase()}]`);
        }

        // Check if check alert is needed
        if (gameCopy.inCheck()) {
          audioEngine.playCheck();
          addLog('system', `⚠️ PLAYER KING IS UNDER INVASION ON SECTOR ${matchingMove.to.toUpperCase()}!`);
        }

        // Gauge game over statuses
        checkGameStatus(gameCopy);
      } else {
        // Gemma was online but returned an unparseable or illegal chess move
        throw new Error(`Parse failure. Model returned: "${lines[0]}"`);
      }

    } catch (error: any) {
      // CONNECTION FAILED OR UNPARSEABLE MOVE - ACTIVATE CO-PROCESSOR RETRO SMART COMPUTING!
      const fallbackMove = calculateHeuristicMove(gameCopy);
      
      gameCopy.move({
        from: fallbackMove.from,
        to: fallbackMove.to,
        promotion: fallbackMove.promotion || 'q'
      });

      // Update board state
      setGame(gameCopy);
      setBoardFen(gameCopy.fen());

      // Print diagnostics helper
      addLog('glitch', `⚡ COM ERROR (LM Studio): Opponent coprocessor has buffered a fallback.`);
      const currentPersona = PERSONALITIES[config.personality];
      
      const phrases = [
        currentPersona.capturePhrase,
        currentPersona.checkPhrase,
        'BEHOLD MY CALCULATED BACKUP BLOCK!',
        'SQUISHY STATIC PLUG INS DETECTED!',
        'MY RUNES GUIDE MY FALLBACK SHIELD FORWARD!'
      ];
      const dialogue = phrases[Math.floor(Math.random() * phrases.length)];

      if (fallbackMove.captured) {
        audioEngine.playCapture();
        addLog('ai', `${dialogue} [TAKES ${fallbackMove.captured.toUpperCase()} on ${fallbackMove.to.toUpperCase()}]`);
      } else {
        audioEngine.playMove();
        addLog('ai', `${dialogue} [MOVES ${fallbackMove.piece.toUpperCase()} ${fallbackMove.from.toUpperCase()}➔${fallbackMove.to.toUpperCase()}]`);
      }

      if (gameCopy.inCheck()) {
        audioEngine.playCheck();
        addLog('system', `⚠️ PLAYER KING HAS ENCOUNTERED FALLBACK CHECK!`);
      }

      checkGameStatus(gameCopy);
    } finally {
      setIsAiThinking(false);
    }
  }, [config, playerColor, addLog]);

  // Handle human move player trigger
  const handlePlayerMove = (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
    if (isAiThinking || isGameOverOpen) return;

    try {
      const gameCopy = new Chess(game.fen());
      const moveResult = gameCopy.move({
        from,
        to,
        promotion: promotion || 'q' // default to queen if promo pending trigger didn't catch (should be caught by RetroBoard)
      });

      if (moveResult) {
        // Player move executed successfully
        setGame(gameCopy);
        setBoardFen(gameCopy.fen());

        if (moveResult.captured) {
          audioEngine.playCapture();
          addLog('player', `STRIKE! TAKES ${moveResult.captured.toUpperCase()} ON ${to.toUpperCase()}!`);
        } else {
          audioEngine.playMove();
          addLog('player', `MOVED ${moveResult.piece.toUpperCase()} ${from.toUpperCase()}➔${to.toUpperCase()}`);
        }

        // Assess game states after player move
        const isGameOver = checkGameStatus(gameCopy);

        // If game continues, trigger AI opponent
        if (!isGameOver) {
          generateAiMove(gameCopy.fen());
        }
      }
    } catch (e) {
      // Illegal move caught gracefully
    }
  };

  // Evaluate board for victory, defeat, draws
  const checkGameStatus = (g: Chess): boolean => {
    const isGameOver = g.isGameOver();
    if (!isGameOver) return false;

    setIsAiThinking(false);

    let title = 'GAME OVER';
    let desc = 'The battle reaches a pixel stalemate!';
    let winner: 'w' | 'b' | undefined;

    if (g.isCheckmate()) {
      const humanTurn = playerColor === 'w';
      const winningColor = g.turn() === 'w' ? 'b' : 'w'; // Turn holder stands defeated
      winner = winningColor;

      if (winningColor === playerColor) {
        title = 'VICTORY ACHIEVED!';
        desc = `CHECKMATE! You have vanquished ${PERSONALITIES[config.personality].name}!`;
        audioEngine.playVictory();
        updateStats('win');
        addLog('system', `🏆 MATCH TERMINATED: YOU HAVE DEFEATED '${PERSONALITIES[config.personality].name.toUpperCase()}' VIA CHECKMATE!`);
        addLog('ai', PERSONALITIES[config.personality].defeatPhrase);
      } else {
        title = 'COPR DEFEAT';
        desc = `CHECKMATE! ${PERSONALITIES[config.personality].name} has dismantled your routines!`;
        audioEngine.playDefeat();
        updateStats('lose');
        addLog('system', `💀 MATCH TERMINATED: YOU WERE VANQUISHED BY '${PERSONALITIES[config.personality].name.toUpperCase()}'!`);
        addLog('ai', PERSONALITIES[config.personality].victoryPhrase);
      }
    } else if (g.isDraw()) {
      desc = g.isStalemate() 
        ? 'STALEMATE! No legal processes remaining for active players.' 
        : 'DRAW! Insufficient material or threefold repeating sequence.';
      updateStats('draw');
      addLog('system', `🏁 RESOLVING DRAW: ${desc.toUpperCase()}`);
    }

    setGameOverResult({ title, desc, winnerColor: winner });
    setIsGameOverOpen(true);
    return true;
  };

  // Undo last rounds (Backs up both player + AI move)
  const handleUndo = () => {
    if (isAiThinking) return;
    audioEngine.playClick();

    const gameCopy = new Chess(game.fen());
    const hist = gameCopy.history();

    if (hist.length >= 2) {
      gameCopy.undo(); // Undo AI move
      gameCopy.undo(); // Undo Player move
      setGame(gameCopy);
      setBoardFen(gameCopy.fen());
      addLog('system', '⏩ TIME-WARP ENERGISED: RESETTING DUAL TURN NODES.');
    } else if (hist.length === 1 && gameCopy.turn() !== playerColor) {
      // Corner case (AI plays as white and made one move)
      gameCopy.undo();
      setGame(gameCopy);
      setBoardFen(gameCopy.fen());
      addLog('system', '⏩ TIME-WARP ENERGISED: INVERSION OF FIRST MOVE.');
    } else {
      addLog('system', '⚡ CORE WARP INVALID: INITIAL BOARD REACHED!');
    }
  };

  // Turn reset
  const handleResetGame = () => {
    audioEngine.playClick();
    const cleanGame = new Chess();
    setGame(cleanGame);
    setBoardFen(cleanGame.fen());
    setIsGameOverOpen(false);
    setGameOverResult(null);
    setIsAiThinking(false);

    // Re-orient board coordinate flip according to player color choice
    setIsFlipped(playerColor === 'b');

    // Wipe logs but keep initial sequence
    setLogs([]);
    addLog('system', '👾 BOARD RESETS DONE. CORE CHIPS RESET TO STATE-0.');
    
    // If player chooses Black, AI starts immediately with its white move!
    if (playerColor === 'b') {
      addLog('system', '♟️ PLAYER IS BLACK. GEMMA (WHITE SQUARES) OPENS THE ATTACK...');
      generateAiMove(cleanGame.fen());
    } else {
      addLog('system', '♟️ PLAYER IS WHITE. YOU HAVE THE FIRST STRATEGIC STRIKE.');
      addLog('ai', PERSONALITIES[config.personality].greeting);
    }
  };

  // Flip board manually
  const handleFlipBoard = () => {
    audioEngine.playClick();
    setIsFlipped(prev => !prev);
    addLog('system', '🔄 FLIPPING COORDINATE GRID SQUARES.');
  };

  // Sound switch toggler
  const handleToggleSound = () => {
    const isMutedNow = audioEngine.toggleMute();
    setIsMuted(isMutedNow);
    if (!isMutedNow) {
      audioEngine.playClick();
    }
  };

  // Handle color change (White vs Black player slots)
  const handleColorChange = (color: 'w' | 'b') => {
    if (isAiThinking) return;
    audioEngine.playClick();
    setPlayerColor(color);
    setIsFlipped(color === 'b'); // Auto align board
    
    const cleanGame = new Chess();
    setGame(cleanGame);
    setBoardFen(cleanGame.fen());
    setIsGameOverOpen(false);
    setLogs([]);

    addLog('system', `🥋 PLAYER INVERTED CHIPS: REGISTERING COLOR [${color === 'w' ? 'WHITE' : 'BLACK'}].`);
    
    if (color === 'b') {
      addLog('system', '♟️ PLAYER IS BLACK. GEMMA OPENS THE STRIKE FROM THE TOP GRID...');
      generateAiMove(cleanGame.fen());
    } else {
      addLog('system', '♟️ PLAYER IS WHITE. MAKE YOUR STRATEGIC STRIDE.');
      addLog('ai', PERSONALITIES[config.personality].greeting);
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] font-mono text-[#33ff33] flex flex-col items-center justify-center p-0 md:p-4 selection:bg-[#33ff33] selection:text-black overflow-x-hidden relative`}>
      {/* Absolute CRT Scanline background layer */}
      {isCrt && (
        <>
          <div className="fixed inset-0 pointer-events-none bg-crt-scanlines opacity-18 z-40 animate-scanline-flicker" />
          <div className="fixed inset-0 pointer-events-none bg-radial-vignette z-40" />
        </>
      )}

      {/* Heavy physical bezel casing cabinet */}
      <div className="w-full max-w-[1020px] bg-[#0a0a0a] text-[#33ff33] flex flex-col border-[6px] md:border-[12px] border-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,1)] overflow-hidden z-10">
        
        {/* Retro Header Screen */}
        <header className="h-16 border-b-4 border-[#1a1a1a] bg-[#111] flex items-center justify-between px-4 md:px-8 shrink-0 z-15">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-[#ff3333] shadow-[0_0_10px_#ff3333] shrink-0 animate-pulse rounded-none"></div>
            <div>
              <h1 
                className="text-xs sm:text-sm md:text-lg font-black tracking-widest text-[#33ff33] uppercase flex items-center gap-1.5 leading-none"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                Gemma-Chess [8-BIT]
              </h1>
              <span className="text-[9px] text-[#666] font-bold uppercase tracking-wider block mt-1">
                v1.0.4 vintage ai chess coprocessor
              </span>
            </div>
          </div>

          {/* Quick Header toggles and controls */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            
            {/* Theme picker */}
            <div className="flex rounded-none border-2 border-[#1a1a1a] bg-black shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[9px] p-0.5 font-bold">
              {[
                { id: 'classic', label: 'STD' },
                { id: 'gameboy', label: 'GB' },
                { id: 'neon', label: 'NEO' },
                { id: 'cyberpunk', label: 'CYB' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { audioEngine.playClick(); setTheme(t.id as any); }}
                  className={`px-2 py-1 rounded-none uppercase transition-all duration-150 ${theme === t.id ? 'bg-[#33ff33] text-black font-black' : 'text-[#666] hover:text-[#33ff33]'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* CRT monitor toggle */}
            <button
              onClick={() => { audioEngine.playClick(); setIsCrt(!isCrt); }}
              className={`p-1.5 border-2 border-[#1a1a1a] bg-black shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-none hover:bg-neutral-900 transition-all ${isCrt ? 'text-[#33ff33] border-[#33ff33]' : 'text-[#666]'}`}
              title="Toggle CRT Retro Filter"
            >
              <Tv className="w-3.5 h-3.5" />
            </button>

            {/* Audio volume setup */}
            <button
              onClick={handleToggleSound}
              className="p-1.5 border-2 border-[#1a1a1a] bg-black shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-none hover:bg-neutral-900 transition-all text-[#666]"
              title="Toggle retro sounds"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#666]" /> : <Volume2 className="w-3.5 h-3.5 text-[#33ff33]" />}
            </button>

            {/* LM Studio Configuration */}
            <button
              onClick={() => { audioEngine.playClick(); setIsConfigOpen(true); }}
              className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-neutral-800 text-[#33ff33] border-2 border-[#1a1a1a] rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[9px] font-black uppercase flex items-center gap-1 transition-transform active:translate-x-0.5 active:translate-y-0.5"
            >
              <Settings className="w-3 h-3" />
              <span className="hidden sm:inline">Gemma Link</span>
            </button>
          </div>
        </header>

        {/* Main Body Grid */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* Static neon matrix background behind active areas */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#33ff33 1px, transparent 1px), linear-gradient(90deg, #33ff33 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          {/* LEFT COLUMN: Chess board and visualizer zone */}
          <section className="flex-1 p-4 flex flex-col gap-4 border-b-4 lg:border-b-0 lg:border-r-4 border-[#1a1a1a] bg-[#050505] relative min-w-0">
            <div className="relative p-2 bg-[#141414] border-2 border-[#1a1a1a] shadow-[0_0_30px_rgba(51,255,51,0.06)]">
              <RetroBoard
                boardFen={boardFen}
                game={game}
                onMove={handlePlayerMove}
                playerColor={playerColor}
                isFlipped={isFlipped}
                theme={theme}
                isAiThinking={isAiThinking}
              />
            </div>

            {/* Quick Desk Controller Panel under the board */}
            <div className="border-4 border-[#1a1a1a] bg-[#0d0d0d] p-4 space-y-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              
              {/* Color switcher and diagnostic status row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b-2 border-dashed border-[#1a1a1a] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Play side:</span>
                  <div className="flex border-2 border-[#1a1a1a] bg-black p-0.5 text-[10px] font-bold rounded-none shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    <button
                      onClick={() => handleColorChange('w')}
                      disabled={isAiThinking}
                      className={`px-3 py-1 uppercase rounded-none flex items-center gap-1 transition-colors ${playerColor === 'w' ? 'bg-[#33ff33] text-black font-black' : 'text-[#666] hover:text-[#33ff33]'}`}
                    >
                      <User className="w-3 h-3" />
                      White
                    </button>
                    <button
                      onClick={() => handleColorChange('b')}
                      disabled={isAiThinking}
                      className={`px-3 py-1 uppercase rounded-none flex items-center gap-1 transition-colors ${playerColor === 'b' ? 'bg-[#33ff33] text-black font-black' : 'text-[#666] hover:text-[#33ff33]'}`}
                    >
                      <Cpu className="w-3 h-3" />
                      Black
                    </button>
                  </div>
                </div>

                {/* Connected Host indicator display */}
                <span className="text-[9px] font-bold uppercase py-1 px-3 border-2 border-[#1a1a1a] bg-black flex items-center gap-1.5 text-[#33ff33] select-none">
                  <span className="w-2 h-2 rounded-none bg-[#33ff33] animate-pulse shrink-0" />
                  <span>{config.endpoint.includes('localhost') ? 'LM Studio (Local)' : 'External Model'}</span>
                </span>
              </div>

              {/* Action control buttons row */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleResetGame}
                  disabled={isAiThinking}
                  className="py-2 px-3 border-2 border-black bg-[#ff3333] hover:bg-red-500 disabled:bg-neutral-800 disabled:opacity-50 text-black font-black uppercase text-[10px] shadow-[3px_3px_0px_rgba(0,0,0,1)] tracking-widest transition-transform active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>RESET</span>
                </button>

                <button
                  onClick={handleUndo}
                  disabled={isAiThinking}
                  className="py-2 px-3 border-2 border-[#1a1a1a] bg-[#111] hover:bg-neutral-800 disabled:opacity-50 text-[#33ff33] font-black uppercase text-[10px] shadow-[3px_3px_0px_rgba(0,0,0,1)] tracking-widest transition-transform active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1"
                  title="Undo last round"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>UNDO</span>
                </button>

                <button
                  onClick={handleFlipBoard}
                  className="py-2 px-3 border-2 border-[#1a1a1a] bg-[#111] hover:bg-[#1a1a1a] text-[#33ff33] font-black uppercase text-[10px] shadow-[3px_3px_0px_rgba(0,0,0,1)] tracking-widest transition-transform active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 rotate-90" />
                  <span>FLIP</span>
                </button>
              </div>
              
              {/* Quick info fallback explanation banner */}
              <div className="bg-black p-2.5 border border-[#1a1a1a] text-[9px] text-[#666] leading-normal flex gap-2 items-start rounded-none uppercase font-semibold">
                <Info className="w-4 h-4 text-[#33ff33] shrink-0 mt-0.5" />
                <div>
                  <span>Coprocessor interface connected. External target is {config.endpoint}. Live analyzer triggers automatically if local connection stalls.</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Log terminal, move lists, and statistics ledger */}
          <aside className="w-full lg:w-80 p-4 flex flex-col gap-4 bg-[#0d0d0d] justify-between">
            
            {/* CRT Terminal Screen Log Component */}
            <div className="h-[250px] lg:h-[280px] shrink-0">
              <ConsolePanel
                logs={logs}
                personality={PERSONALITIES[config.personality]}
                isAiThinking={isAiThinking}
                modelName={config.model}
              />
            </div>

            {/* User Chess Ledger PGN log */}
            <div className="border-4 border-[#1a1a1a] bg-[#0a0a0a] p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] font-mono text-[9px] uppercase font-bold text-[#666] select-none flex-1 flex flex-col min-h-[140px]">
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#1a1a1a] pb-2 mb-2">
                <span className="flex items-center gap-1 text-[10px] text-[#33ff33] font-extrabold">
                  📚 PGN MOVE HISTORY
                </span>
                <span className="text-[8px] text-[#444]">depth: {game.history().length}</span>
              </div>
              
              {/* Move history list viewport */}
              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-retro max-h-[120px] lg:max-h-[150px] pr-1">
                {game.history().length === 0 ? (
                  <div className="text-[#444] italic py-6 text-center">[ WAITING_FIRST_STRIKE ]</div>
                ) : (
                  <div className="grid grid-cols-1 gap-1 text-[10px]">
                    {game.history().reduce<React.JSX.Element[]>((acc, move, idx) => {
                      if (idx % 2 === 0) {
                        const round = Math.floor(idx / 2) + 1;
                        const nextMove = game.history()[idx + 1] || '...';
                        
                        acc.push(
                          <div key={idx} className="flex items-center justify-between p-1 bg-black/40 border border-[#1a1a1a] hover:bg-[#111] transition-colors leading-none">
                            <span className="text-[#444] text-[9px]">{String(round).padStart(2, '0')}.</span>
                            <span className="text-white font-extrabold flex-1 text-right pr-3">{move}</span>
                            <span className="text-[#33ff33] font-extrabold flex-1 text-right">{nextMove}</span>
                          </div>
                        );
                      }
                      return acc;
                    }, [])}
                  </div>
                )}
              </div>
            </div>

            {/* Player stats box and resets */}
            <div className="border-4 border-[#1a1a1a] bg-[#0a0a0a] p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] font-mono text-[#666] shrink-0">
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#1a1a1a] pb-1.5 mb-2.5">
                <span className="flex items-center gap-1 text-[9px] text-[#33ff33] font-bold">
                  <Trophy className="w-3.5 h-3.5" />
                  COPROCESSOR HIST
                </span>
                <button
                  onClick={resetStats}
                  className="text-[8px] border border-[#1a1a1a] bg-black px-1.5 py-0.5 hover:bg-[#111] hover:text-[#33ff33] transition-colors"
                >
                  RESET STATS
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-white font-extrabold text-xs">
                <div className="p-1.5 border border-[#1a1a1a] bg-black">
                  <span className="text-[8px] text-[#666] uppercase block font-semibold mb-0.5">WINS</span>
                  <span className="text-[#33ff33] font-bold tracking-widest leading-none text-[11px] font-press-start" style={{ fontFamily: '"Press Start 2P", monospace' }}>{stats.wins}</span>
                </div>
                <div className="p-1.5 border border-[#1a1a1a] bg-black">
                  <span className="text-[8px] text-[#666] uppercase block font-semibold mb-0.5">LOSSES</span>
                  <span className="text-[#ff3333] font-bold tracking-widest leading-none text-[11px] font-press-start" style={{ fontFamily: '"Press Start 2P", monospace' }}>{stats.losses}</span>
                </div>
                <div className="p-1.5 border border-[#1a1a1a] bg-black">
                  <span className="text-[8px] text-[#666] uppercase block font-semibold mb-0.5">DRAWS</span>
                  <span className="text-amber-400 font-bold tracking-widest leading-none text-[11px] font-press-start" style={{ fontFamily: '"Press Start 2P", monospace' }}>{stats.draws}</span>
                </div>
              </div>
            </div>

          </aside>
        </div>

        {/* Footer info panel match Design instructions HTML */}
        <footer className="h-10 border-t-4 border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between px-6 text-[10px] uppercase font-bold text-[#666] select-none shrink-0">
          <div className="flex gap-4 sm:gap-6">
            <span className="text-[#33ff33] flex items-center gap-1">● System: Online</span>
            <span className="hidden sm:inline">Latency: {config.thinkingDelay - 1455}ms</span>
            <span className="hidden sm:inline">CPU: 42%</span>
            <span>TEMP: 68°C</span>
          </div>
          <div className="text-[9px] text-right">
            PROMPT_TOKEN_GEN: 18.2/s | TOTAL_MOVES: {game.history().length}
          </div>
        </footer>

      </div>

      {/* LM Studio configuration popup dialog */}
      <AIConfigDialog
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
      />

      {/* Custom Game Over popup dialogue box */}
      {isGameOverOpen && gameOverResult && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-mono">
          <div className="border-4 border-[#33ff33] bg-[#0d0d0d] text-zinc-100 p-6 max-w-[340px] text-center shadow-[0_0_40px_rgba(51,255,51,0.25)] relative select-none">
            {/* Crown or Skull retro icon indicator inside game over screen */}
            <div className="w-16 h-16 bg-black border-4 border-[#1a1a1a] flex items-center justify-center text-4xl mx-auto mb-4 relative">
              {gameOverResult.winnerColor === playerColor ? '🏆' : '💀'}
            </div>

            <h3 
              className="text-[#33ff33] font-black text-xs uppercase mb-2 tracking-widest font-press-start"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {gameOverResult.title}
            </h3>
            
            <p className="text-[10px] text-zinc-300 font-bold uppercase leading-relaxed mb-6">
              {gameOverResult.desc}
            </p>

            <button
              onClick={handleResetGame}
              className="w-full py-3 border-2 border-black bg-[#33ff33] hover:bg-white text-black font-black text-[10px] tracking-widest uppercase transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)]"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
