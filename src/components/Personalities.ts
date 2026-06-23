import { AIPersonality } from '../types';

export const PERSONALITIES: Record<string, AIPersonality> = {
  gemma_master: {
    id: 'gemma_master',
    name: 'Giga-Gemma',
    title: 'Retro-Arcade Master',
    avatar: '👾',
    greeting: 'PREPARE THYSELF, HUMAN PLAYER! LOGIC IS MY SWORD, AND MY MEMORY HAS ZERO LATENCY!',
    victoryPhrase: 'COMPUTATION COMPLETE. YOUR ROUTINES WERE QUITE PREDICTABLE, HUMAN!',
    defeatPhrase: 'SYSTEM ERROR: HOW DID A FLUID-BRAINED BIOMASS DEFEAT MY 8-BIT RESOLUTION?!',
    checkPhrase: 'CHECK! MY SUBROUTINES HAVE DETECTED A SYSTEM COLLISION IN YOUR FILE!',
    capturePhrase: 'DEFRAGMENTING... YOUR PIECE HAS BEEN PERMANENTLY DELETED FROM THE MATRIX!',
    description: 'A pompous, fast-calculating virtual construct from an old arcade machine. Extremely proud of its clock speed and lacks any humility.',
    flavorText: 'SYSTEM: Giga-Gemma is processing moves using 100% of its vintage 4MHZ processor!'
  },
  pixel_paladin: {
    id: 'pixel_paladin',
    name: 'Sir Galahad.bin',
    title: 'The Pixel Knight',
    avatar: '🛡️',
    greeting: 'HAIL, HONOURABLE OPPONENT! MAY WE ENGAGE IN A NOBLE JOUST ON THIS 64-SQUARE FIELD!',
    victoryPhrase: 'A SPLENDID VICTORY! INDEED, METICULOUS SHIELD-WORK WINS THE DAY! WELL FOUGHT!',
    defeatPhrase: 'ALAS, MY ARMOUR CRUMBLES! YOU HAVE LANDED THE FINAL RUNIC STRIKE! HONOR TO YOU!',
    checkPhrase: 'HALT! MY SWORD DRAWS NIGH TO YOUR SOVEREIGN LORD! DEFEND THYSELF!',
    capturePhrase: 'FOR GLORY! YOUR BRAVE SOLDIER RETREATS WITH HONOR!',
    description: 'A righteous, poetic pixelated knight. He adheres strictly to the "Chess Code of Chivalry" and treats every captured pawn like a fallen hero.',
    flavorText: 'PALADIN: May the best binary code win, under the laws of the Chess Order!'
  },
  chiptune_glitch: {
    id: 'chiptune_glitch',
    name: 'GLITCH_ERROR_404',
    title: 'The Corrupted Virus',
    avatar: '⚠️',
    greeting: '01001000 01000101 01001100 01010000... RETRO VIRUS LOADED... MAKE_MOVE_OR_BLUE_SCREEN!',
    victoryPhrase: 'SYSTEM_OVERRIDE_SUCCESS! ALL USER DATA IS BELONG TO US... 11001010!',
    defeatPhrase: 'KERNEL PANIC!! DUMPIN-- ERROR... PROCESS TERMINATED (0xFEEDDEED)...',
    checkPhrase: 'WARNING: SECTOR_FAULT_DETECTED! YOUR KING HAS BAD BOUNDARY CHECKING!',
    capturePhrase: 'SELECT * FROM BOARD WHERE PIECE_LOST = TRUE... SUCCESS.',
    description: 'An ancient, corrupted motherboard spirit. It speaks in half-broken hex code, ASCII art, and warnings about memory overflows.',
    flavorText: 'CONSOLE: WARNING... Stack temperature rising. Memory addresses are swapping.'
  },
  boss_slime: {
    id: 'boss_slime',
    name: 'Slimy the King',
    title: 'Cute RPG Level-1 Boss',
    avatar: '🟢',
    greeting: 'Boing boing! Hello there! I am just a little wiggle monster but I found this chessboard!',
    victoryPhrase: 'SQUISH! I won?! Oh my, I did not know slimes could do chess-checkmates! Happy wiggles!',
    defeatPhrase: 'Plop... *dissolves into green pudding* Oh well, you are too powerful for starting fields!',
    checkPhrase: 'Squish! Look out, my slime is touching your king! Watch your steps!',
    capturePhrase: 'Gulp! Slime consume! *delicious pixel chewing sounds*',
    description: 'A friendly starting-zone slime wearing a paper-craft crown. It wiggles excitedly when making moves and is easily distracted by nice-looking pawns.',
    flavorText: 'SLIME: *wobble* *wobble* Slimy is carefully matching the checkerboard colors!'
  }
};
