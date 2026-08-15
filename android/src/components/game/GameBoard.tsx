import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { FIXED_BOARD, BOARD_SIZE } from '../../constants/board';
import { COLORS } from '../../constants/colors';
import { Piece, Player, Position } from '../../types/game';
import Tile from './Tile';
import AnimatedPiece from './AnimatedPiece';

interface GameBoardProps {
  pieces: Piece[];
  selectedPieceId: string | null;
  legalMoves: Position[];
  activePlayer: Player;
  isBotThinking: boolean;
  onTileClick: (row: number, col: number) => void;
  animatingPieceId: string | null;
  onAnimationComplete: (pieceId: string) => void;
}

export default function GameBoard({
  pieces,
  selectedPieceId,
  legalMoves,
  activePlayer,
  isBotThinking,
  onTileClick,
  animatingPieceId,
  onAnimationComplete,
}: GameBoardProps) {
  const [parentDimensions, setParentDimensions] = useState({ width: 0, height: 0 });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setParentDimensions((prev) =>
        Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1
          ? prev
          : { width, height }
      );
    }
  }, []);

  const boardSize = Math.min(parentDimensions.width, parentDimensions.height);
  const cellWidth = boardSize > 0 ? (boardSize - 8) / BOARD_SIZE : 0;

  // O(1) piece lookup instead of Array.find inside a double loop.
  const pieceMap = useMemo(() => {
    const map = new Map<string, Piece>();
    for (const p of pieces) map.set(`${p.position.row},${p.position.col}`, p);
    return map;
  }, [pieces]);

  const legalMoveSet = useMemo(() => {
    const set = new Set<string>();
    for (const m of legalMoves) set.add(`${m.row},${m.col}`);
    return set;
  }, [legalMoves]);

  const tileGrid = useMemo(() => {
    const grid = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const rowTiles = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const value = FIXED_BOARD[r][c];
        const pieceAtTile = pieceMap.get(`${r},${c}`);
        const isSelected = selectedPieceId !== null && pieceAtTile?.id === selectedPieceId;
        const isLegal = legalMoveSet.has(`${r},${c}`);
        const isEnemy = pieceAtTile ? pieceAtTile.player !== activePlayer : false;

        rowTiles.push(
          <Tile
            key={`${r}-${c}`}
            row={r}
            col={c}
            value={value}
            isSelected={isSelected}
            isLegalTarget={isLegal}
            isEnemyOccupied={isEnemy}
            onTileClick={onTileClick}
          />
        );
      }
      grid.push(
        <View key={r} style={styles.row}>
          {rowTiles}
        </View>
      );
    }
    return grid;
  }, [pieceMap, legalMoveSet, selectedPieceId, activePlayer, onTileClick]);

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      {boardSize > 100 && (
        <View style={[styles.boardContainer, { width: boardSize, height: boardSize }]}>
          <View style={styles.gridContainer}>{tileGrid}</View>

          {pieces.map((piece) => (
            <AnimatedPiece
              key={piece.id}
              piece={piece}
              cellWidth={cellWidth}
              isSelected={selectedPieceId === piece.id}
              onTileClick={onTileClick}
              animatingPieceId={animatingPieceId}
              onAnimationComplete={onAnimationComplete}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  boardContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLORS.glow1,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  gridContainer: {
    flex: 1,
    padding: 2,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
});
