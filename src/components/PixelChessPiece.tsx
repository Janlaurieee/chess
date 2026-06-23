import React from 'react';

interface PixelChessPieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  size?: number | string;
  theme?: 'classic' | 'gameboy' | 'neon' | 'cyberpunk';
}

// 12x12 Pixel Map Designs for 8-bit chess pieces
const PIXEL_MAPS: Record<string, string[]> = {
  p: [
    "....####....",
    "...#XXXX#...",
    "..#XXIIXX#..",
    "..#XXIIXX#..",
    "...#XXXX#...",
    "....####....",
    "...#XXXX#...",
    "..#XXXXXX#..",
    ".#XXXXXXXX#.",
    ".#XXIIIIXX#.",
    ".#XXXXXXXX#.",
    ".##########."
  ],
  n: [
    "....#####...",
    "...#XXXXI#..",
    "..#XXXXIII#.",
    ".#XX#####...",
    ".#XXXX#.....",
    "#XXXXX#.....",
    "#XXXXI#####.",
    "#XXXXXXXXXX#",
    "#XXIIIIXXXX#",
    "#XXXXXXXXXX#",
    ".#XXXXXXXX#.",
    "..########.."
  ],
  b: [
    "....####....",
    "...#XX##XX#.",
    "..#XX####XX#",
    "..#XXIIIIXX#",
    "...#XXXX#...",
    "...#XXXX#...",
    "...#XXII#...",
    "..#XXXXXX#..",
    ".#XXXXXXXX#.",
    ".#XXIIIIXX#.",
    ".#XXXXXXXX#.",
    ".##########."
  ],
  r: [
    "#..##..##..#",
    "############",
    "#XXXXXXXXXX#",
    "#XXIIIIIIXX#",
    ".#XXXXXXXX#.",
    "..#XXXXXX#..",
    "..#XXXXXX#..",
    ".#XXXXXXXX#.",
    "#XXXXXXXXXX#",
    "#XXIIIIIIXX#",
    "#XXXXXXXXXX#",
    "############"
  ],
  q: [
    "#.#..##..#.#",
    "############",
    "#XXXXXXXXXX#",
    "#XXIIIIIIXX#",
    ".#XXXXXXXX#.",
    ".#XXIIIIXX#.",
    "..#XXXXXX#..",
    "..#XXXXXX#..",
    ".#XXXXXXXX#.",
    "#XXXXXXXXXX#",
    "#XXIIIIIIXX#",
    "############"
  ],
  k: [
    "....####....",
    "....#XX#....",
    "..########..",
    ".#XXIIIIXX#.",
    ".#X######X#.",
    ".#XXXXXXXX#.",
    ".#XXIIIIXX#.",
    ".#XXXXXXXX#.",
    ".#XXIIIIXX#.",
    ".#XXXXXXXX#.",
    "..#XXXXXX#..",
    "...######..."
  ]
};

// Color palettes based on the theme
const COLOR_SCHEME = {
  classic: {
    w: {
      outline: '#18181b', // zinc-900
      main: '#f4f4f5',    // zinc-100
      accent: '#a1a1aa'   // zinc-400 (shadow)
    },
    b: {
      outline: '#09090b', // zinc-950
      main: '#3f3f46',    // zinc-700
      accent: '#71717a'   // zinc-500 (highlight)
    }
  },
  gameboy: {
    w: {
      outline: '#0f380f', // darkest green
      main: '#9bbc0f',    // light green
      accent: '#8bac0f'   // mid light green
    },
    b: {
      outline: '#0f380f', // darkest green
      main: '#306230',    // dark green
      accent: '#8bac0f'   // mid green highlight
    }
  },
  neon: {
    w: {
      outline: '#000000',
      main: '#00f0ff',    // electric cyan
      accent: '#008a99'   // dark cyan
    },
    b: {
      outline: '#000000',
      main: '#ff007f',    // hot pink
      accent: '#99004c'   // dark pink
    }
  },
  cyberpunk: {
    w: {
      outline: '#1e003a',
      main: '#fff000',    // neon yellow
      accent: '#e2d000'   // dark yellow
    },
    b: {
      outline: '#1e003a',
      main: '#7b2cbf',    // neon purple
      accent: '#9d4edd'   // light purple shadow
    }
  }
};

export const PixelChessPiece: React.FC<PixelChessPieceProps> = ({
  type,
  color,
  size = '100%',
  theme = 'classic'
}) => {
  const pixelMap = PIXEL_MAPS[type];
  if (!pixelMap) return null;

  const palette = COLOR_SCHEME[theme][color];

  // Map representation character to color code
  const getPixelColor = (char: string): string | null => {
    switch (char) {
      case '#':
        return palette.outline;
      case 'X':
        return palette.main;
      case 'I':
        return palette.accent;
      case '.':
      default:
        return null; // transparent
    }
  };

  const gridRows = 12;
  const gridCols = 12;

  // Let's optimize by rendering consecutive active pixels in each row as a single rectangle
  const rects: React.JSX.Element[] = [];

  for (let r = 0; r < gridRows; r++) {
    const row = pixelMap[r];
    let col = 0;
    while (col < gridCols) {
      const char = row[col];
      const colorVal = getPixelColor(char);
      if (colorVal) {
        // Find how many consecutive pixels have the same color
        let width = 1;
        while (col + width < gridCols && row[col + width] === char) {
          width++;
        }
        rects.push(
          <rect
            key={`${r}-${col}`}
            x={col}
            y={r}
            width={width}
            height={1}
            fill={colorVal}
          />
        );
        col += width;
      } else {
        col++;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${gridCols} ${gridRows}`}
      width={size}
      height={size}
      style={{
        shapeRendering: 'crispEdges',
        imageRendering: 'pixelated',
        display: 'block'
      }}
      id={`pixel-piece-${color}-${type}`}
    >
      {rects}
    </svg>
  );
};
