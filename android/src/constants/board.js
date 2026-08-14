"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_PIECES = exports.BOARD_SIZE = exports.FIXED_BOARD = void 0;
const game_1 = require("../types/game");
exports.FIXED_BOARD = [
    [3, 2, 1, 3, 3, 1, 2, 3],
    [2, 1, 3, 2, 2, 3, 1, 2],
    [1, 3, 2, 1, 1, 2, 3, 1],
    [3, 2, 1, 3, 3, 1, 2, 3],
    [3, 2, 1, 3, 3, 1, 2, 3],
    [1, 3, 2, 1, 1, 2, 3, 1],
    [2, 1, 3, 2, 2, 3, 1, 2],
    [3, 2, 1, 3, 3, 1, 2, 3],
];
exports.BOARD_SIZE = 8;
exports.INITIAL_PIECES = [
    // Player 2 (Top, Ebony/Silver)
    {
        id: 'p2_scout1',
        type: game_1.PieceType.SCOUT,
        player: 2,
        position: { row: 0, col: 1 },
    },
    {
        id: 'p2_jumper1',
        type: game_1.PieceType.JUMPER,
        player: 2,
        position: { row: 0, col: 2 },
    },
    {
        id: 'p2_rider1',
        type: game_1.PieceType.RIDER,
        player: 2,
        position: { row: 0, col: 3 },
    },
    {
        id: 'p2_rider2',
        type: game_1.PieceType.RIDER,
        player: 2,
        position: { row: 0, col: 4 },
    },
    {
        id: 'p2_jumper2',
        type: game_1.PieceType.JUMPER,
        player: 2,
        position: { row: 0, col: 5 },
    },
    {
        id: 'p2_scout2',
        type: game_1.PieceType.SCOUT,
        player: 2,
        position: { row: 0, col: 6 },
    },
    // Player 1 (Bottom, Ivory/Gold)
    {
        id: 'p1_scout1',
        type: game_1.PieceType.SCOUT,
        player: 1,
        position: { row: 7, col: 1 },
    },
    {
        id: 'p1_jumper1',
        type: game_1.PieceType.JUMPER,
        player: 1,
        position: { row: 7, col: 2 },
    },
    {
        id: 'p1_rider1',
        type: game_1.PieceType.RIDER,
        player: 1,
        position: { row: 7, col: 3 },
    },
    {
        id: 'p1_rider2',
        type: game_1.PieceType.RIDER,
        player: 1,
        position: { row: 7, col: 4 },
    },
    {
        id: 'p1_jumper2',
        type: game_1.PieceType.JUMPER,
        player: 1,
        position: { row: 7, col: 5 },
    },
    {
        id: 'p1_scout2',
        type: game_1.PieceType.SCOUT,
        player: 1,
        position: { row: 7, col: 6 },
    },
];
