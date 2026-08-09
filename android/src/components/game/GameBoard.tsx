import React, { useState } from 'react';
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
}

export default function GameBoard({
  pieces,
  selectedPieceId,
  legalMoves,
  activePlayer,
  isBotThinking,
  onTileClick,
}: GameBoardProps) {
  const [parentDimensions, setParentDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setParentDimensions({ width, height });
    }
  };

  const boardSize = Math.min(parentDimensions.width, parentDimensions.height);
  
  // Calculate cellWidth based on the grid area (subtracting 4px borders and 4px paddings = 8px total)
  const cellWidth = boardSize > 0 ? (boardSize - 8) / BOARD_SIZE : 0;

  // Helper to check if a tile is a legal move target
  const checkIsLegal = (row: number, col: number) => {
    return legalMoves.some((m) => m.row === row && m.col === col);
  };

  // Generate grid rows and columns
  const renderTiles = () => {
    const grid = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const rowTiles = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const value = FIXED_BOARD[r][c];
        
        // Find if there is a piece at this coordinate
        const pieceAtTile = pieces.find((p) => p.position.row === r && p.position.col === c);
        const isSelected = selectedPieceId !== null && pieceAtTile?.id === selectedPieceId;
        const isLegal = checkIsLegal(r, c);
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
            onPress={() => onTileClick(r, c)}
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
  };

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      {boardSize > 100 && (
        <View 
          style={[
            styles.boardContainer,
            {
              width: boardSize,
              height: boardSize,
            }
          ]}
        >
          {/* Render the background board tiles grid */}
          <View style={styles.gridContainer}>
            {renderTiles()}
          </View>

          {/* Overlay the animated pieces relative to the boardContainer */}
          {pieces.map((piece) => {
            const isSelected = selectedPieceId === piece.id;
            
            return (
              <AnimatedPiece
                key={piece.id}
                piece={piece}
                cellWidth={cellWidth}
                isSelected={isSelected}
                onPress={() => onTileClick(piece.position.row, piece.position.col)}
              />
            );
          })}
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

