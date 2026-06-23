import React, { useState } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { PixelChessPiece } from './PixelChessPiece';
import { audioEngine } from './AudioEngine';
import { RefreshCw, Skull, Sparkles, Wand2 } from 'lucide-react';

interface RetroBoardProps {
  boardFen: string;
  game: Chess;
  onMove: (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => void;
  playerColor: 'w' | 'b';
  isFlipped: boolean;
  theme: 'classic' | 'gameboy' | 'neon' | 'cyberpunk';
  isAiThinking: boolean;
}

export const RetroBoard: React.FC<RetroBoardProps> = ({
  boardFen,
  game,
  onMove,
  playerColor,
  isFlipped,
  theme,
  isAiThinking
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);

  // Parse current layout from FEN
  const board = game.board();
  const squares = isFlipped 
    ? board.slice().reverse() // Flip ranks
    : board;

  // Track captured pieces
  const getCapturedPieces = () => {
    const startPieces: Record<string, number> = {
      p: 8, n: 2, b: 2, r: 2, q: 1, k: 1,
      P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1
    };

    // Count currently alive pieces
    const alivePieces: Record<string, number> = {
      p: 0, n: 0, b: 0, r: 0, q: 0, k: 0,
      P: 0, N: 0, B: 0, R: 0, Q: 0, K: 0
    };

    game.board().forEach(row => {
      row.forEach(square => {
        if (square) {
          const char = square.color === 'w' ? square.type.toUpperCase() : square.type.toLowerCase();
          alivePieces[char] = (alivePieces[char] || 0) + 1;
        }
      });
    });

    const capturedWhite: string[] = [];
    const capturedBlack: string[] = [];

    // White pieces captured by Black (lowercase in startPieces indicates Black, Uppercase is White)
    // Capital letters are White pieces
    Object.keys(startPieces).forEach(char => {
      const diff = startPieces[char] - (alivePieces[char] || 0);
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          if (char === char.toUpperCase()) {
            capturedWhite.push(char.toLowerCase()); // White pieces lost (render as white pieces in inventory)
          } else {
            capturedBlack.push(char.toLowerCase()); // Black pieces lost
          }
        }
      }
    });

    return { capturedWhite, capturedBlack };
  };

  const { capturedWhite, capturedBlack } = getCapturedPieces();

  // Find if a square has a check on its king
  const isKingInCheck = (rowIdx: number, colIdx: number): boolean => {
    if (!game.inCheck()) return false;
    
    // Convert current tile to square coordinate
    const rIdx = isFlipped ? rowIdx : 7 - rowIdx;
    const cIdx = isFlipped ? 7 - colIdx : colIdx;
    
    const rank = (rIdx + 1).toString();
    const file = String.fromCharCode(97 + cIdx);
    const sq = (file + rank) as Square;

    const piece = game.get(sq);
    return !!(piece && piece.type === 'k' && piece.color === game.turn());
  };

  // Convert board indices and flip coordinates to standard coordinate map
  const getSquareCoord = (rowIdx: number, colIdx: number): Square => {
    // Standard view: white on bottom, Rank 8 at top, Rank 1 at bottom
    // Row 0 is Rank 8, Row 7 is Rank 1
    // Col 0 is File a, Col 7 is File h
    const r = isFlipped ? rowIdx : 7 - rowIdx;
    const c = isFlipped ? 7 - colIdx : colIdx;
    
    const rank = (r + 1).toString();
    const file = String.fromCharCode(97 + c);
    return (file + rank) as Square;
  };

  // Click handler
  const handleSquareClick = (sq: Square) => {
    if (isAiThinking || promotionPending) return;

    const piece = game.get(sq);

    // If a valid destination is clicked
    if (selectedSquare && validMoves.includes(sq)) {
      // Check if this is a pawn promotion move
      const selectedPiece = game.get(selectedSquare);
      const isPawn = selectedPiece?.type === 'p';
      const isWhitePromoting = selectedPiece?.color === 'w' && selectedSquare[1] === '7' && sq[1] === '8';
      const isBlackPromoting = selectedPiece?.color === 'b' && selectedSquare[1] === '2' && sq[1] === '1';

      if (isPawn && (isWhitePromoting || isBlackPromoting)) {
        audioEngine.playClick();
        setPromotionPending({ from: selectedSquare, to: sq });
      } else {
        onMove(selectedSquare, sq);
        setSelectedSquare(null);
        setValidMoves([]);
      }
      return;
    }

    // Otherwise, select own piece
    if (piece && piece.color === playerColor) {
      audioEngine.playClick();
      setSelectedSquare(sq);
      // Generate legal moves for this square
      const moves = game.moves({ square: sq, verbose: true }) as Move[];
      setValidMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const handlePromotionSelect = (promoPiece: 'q' | 'r' | 'b' | 'n') => {
    if (promotionPending) {
      audioEngine.playVictory();
      onMove(promotionPending.from, promotionPending.to, promoPiece);
      setPromotionPending(null);
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Grid style definitions
  const THEME_CLASSES = {
    classic: {
      light: 'bg-[#222] border-neutral-800/40 text-[#33ff33]',
      dark: 'bg-[#333] border-neutral-800/40 text-white',
      border: 'border-[#1a1a1a]',
      header: 'bg-[#111] border-[#1a1a1a] text-[#33ff33]',
      highlightSelf: 'ring-4 ring-[#33ff33] ring-inset bg-[#33ff33]/20',
      highlightTarget: 'after:content-[""] after:w-3.5 after:h-3.5 after:bg-[#33ff33] after:rounded-none after:animate-pulse shadow-[0_0_8px_#33ff33]'
    },
    gameboy: {
      light: 'bg-[#8bac0f] border-[#8bac0f] text-[#0f380f]',
      dark: 'bg-[#306230] border-[#306230] text-[#9bbc0f]',
      border: 'border-[#0f380f]',
      header: 'bg-[#0f380f] border-[#0f380f] text-[#9bbc0f]',
      highlightSelf: 'ring-4 ring-[#9bbc0f] ring-inset bg-[#9bbc0f]/40',
      highlightTarget: 'after:content-[""] after:w-3 after:h-3 after:bg-[#0f380f] after:rounded-none'
    },
    neon: {
      light: 'bg-[#00f0ff]/10 border-cyan-800 text-cyan-200',
      dark: 'bg-cyan-950/60 border-cyan-800 text-cyan-400',
      border: 'border-cyan-500',
      header: 'bg-cyan-950 border-cyan-500 text-cyan-400',
      highlightSelf: 'ring-4 ring-pink-500 ring-inset bg-pink-500/20',
      highlightTarget: 'after:content-[""] after:w-4 after:h-4 after:border-2 after:border-pink-500 after:animate-ping'
    },
    cyberpunk: {
      light: 'bg-[#fff000]/15 border-yellow-700 text-yellow-300',
      dark: 'bg-[#340068]/50 border-purple-900 text-purple-400',
      border: 'border-yellow-500',
      header: 'bg-[#1e003a] border-yellow-500 text-yellow-500',
      highlightSelf: 'ring-4 ring-yellow-400 ring-inset bg-yellow-400/20',
      highlightTarget: 'after:content-[""] after:w-3 after:h-3 after:bg-[#fff000]'
    }
  };

  const selectedTheme = THEME_CLASSES[theme];

  // Helper arrays for drawing headers
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const files = isFlipped ? cols.slice().reverse() : cols;
  const ranks = isFlipped 
    ? ['1', '2', '3', '4', '5', '6', '7', '8'] 
    : ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Last moves highlighter
  const history = game.history({ verbose: true }) as Move[];
  const lastMove = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className={`flex flex-col border-4 ${selectedTheme.border} bg-[#0a0a0a] p-3 font-mono shadow-[0_0_30px_rgba(0,0,0,0.8)] relative`}>
      
      {/* CAPTURED BLACK pieces tray running above the board */}
      <div className="flex items-center justify-between border-b-2 border-[#1a1a1a] pb-2 mb-2 px-1 text-[10px] uppercase font-bold text-[#33ff33]/70">
        <span className="flex items-center gap-1 select-none">
          🛡️ GEMMA PIECES TAKEN:
        </span>
        <div className="flex gap-0.5 h-6 items-center">
          {capturedBlack.length === 0 ? (
            <span className="text-[9px] text-[#666] italic font-medium">[NONE]</span>
          ) : (
            capturedBlack.map((type, idx) => (
              <div key={idx} className="w-5 h-5 shrink-0 transform scale-90">
                <PixelChessPiece type={type as any} color="b" theme={theme} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Board Grid wrapper containing rank/file coordinates */}
      <div className="relative flex">
        {/* Left Ranks headers */}
        <div className="flex flex-col justify-around w-5 text-center text-[10px] font-black text-[#666] pr-1 select-none">
          {ranks.map(r => (
            <span key={r} className="h-full flex items-center justify-center">{r}</span>
          ))}
        </div>

        {/* Board 8x8 Container */}
        <div className={`grid grid-cols-8 grid-rows-8 border-2 ${selectedTheme.border} aspect-square flex-1 relative bg-[#050505]`}>
          {squares.map((row, rowIdx) => {
            const displayRow = isFlipped ? squares.length - 1 - rowIdx : rowIdx;
            const rowSquares = isFlipped ? row.slice().reverse() : row;

            return rowSquares.map((piece, colIdx) => {
              const displayCol = isFlipped ? squares.length - 1 - colIdx : colIdx;
              const sq = getSquareCoord(rowIdx, colIdx);

              const isLight = (displayRow + displayCol) % 2 === 0;
              const squareBg = isLight ? selectedTheme.light : selectedTheme.dark;
              const isSelected = selectedSquare === sq;
              const isValidTarget = validMoves.includes(sq);
              const inCheck = isKingInCheck(rowIdx, colIdx);

              // Analyze if this square was part of the last move
              const isLastMoveSrc = lastMove?.from === sq;
              const isLastMoveDst = lastMove?.to === sq;

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  className={`
                    relative flex items-center justify-center aspect-square cursor-pointer transition-colors border-[1px] border-black/10 select-none
                    ${squareBg}
                    ${isSelected ? selectedTheme.highlightSelf : ''}
                    ${inCheck ? 'bg-red-600 border-red-700 font-extrabold animate-shiver text-white z-10' : ''}
                    ${isLastMoveSrc || isLastMoveDst ? 'after:content-[""] after:absolute after:inset-0 after:border-2 after:border-dashed after:border-amber-400 after:pointer-events-none' : ''}
                    ${isValidTarget ? 'after:absolute after:inset-0 after:flex after:items-center after:justify-center ' + selectedTheme.highlightTarget : ''}
                  `}
                  title={sq}
                >
                  {/* Visual Skull Alert background for Check */}
                  {inCheck && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 select-none pointer-events-none text-white font-extrabold text-lg animate-bounce">
                      💀
                    </div>
                  )}

                  {piece && (
                    <div 
                      className={`
                        w-11/12 h-11/12 transform active:scale-95 transition-transform shrink-0 select-none
                        ${isAiThinking && piece.color === 'b' ? 'animate-pulse' : ''}
                      `}
                    >
                      <PixelChessPiece 
                        type={piece.type} 
                        color={piece.color} 
                        theme={theme} 
                      />
                    </div>
                  )}
                </div>
              );
            });
          })}

          {/* Promotion Custom 8-bit popup menu overlay */}
          {promotionPending && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center z-50 p-4 font-mono">
              <div className="border-4 border-yellow-500 bg-zinc-900 p-4 text-center max-w-[280px] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 justify-center mb-1">
                  <Wand2 className="w-3.5 h-3.5" />
                  Pawn Promotion
                </span>
                <p className="text-[9px] text-zinc-400 leading-normal mb-3 font-semibold uppercase">
                  Select your upgraded piece
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'q', desc: 'Queen' },
                    { id: 'r', desc: 'Rook' },
                    { id: 'b', desc: 'Bishop' },
                    { id: 'n', desc: 'Knight' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePromotionSelect(p.id as any)}
                      className="p-1 border-2 border-zinc-700 hover:border-yellow-400 bg-zinc-800 hover:bg-zinc-700 flex flex-col items-center gap-1 transition-all rounded-none"
                    >
                      <div className="w-8 h-8">
                        <PixelChessPiece type={p.id as any} color={playerColor} theme={theme} />
                      </div>
                      <span className="text-[8px] font-black uppercase text-zinc-300">{p.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ranks indexes at the bottom */}
      <div className="flex ml-5 mt-1 select-none pr-1">
        {files.map(f => (
          <span key={f} className="flex-1 text-center text-[10px] font-black text-[#666] uppercase">{f}</span>
        ))}
      </div>

      {/* CAPTURED WHITE pieces tray running below the board */}
      <div className="flex items-center justify-between border-t-2 border-[#1a1a1a] pt-2 mt-2 px-1 text-[10px] uppercase font-bold text-[#33ff33]/70">
        <span className="flex items-center gap-1">
          🥋 PLAYER PIECES TAKEN:
        </span>
        <div className="flex gap-0.5 h-6 items-center">
          {capturedWhite.length === 0 ? (
            <span className="text-[9px] text-[#666] italic font-medium">[NONE]</span>
          ) : (
            capturedWhite.map((type, idx) => (
              <div key={idx} className="w-5 h-5 shrink-0 transform scale-90">
                <PixelChessPiece type={type as any} color="w" theme={theme} />
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
};
