import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameHistoryItem, Player } from '../types/game';

const HISTORY_STORAGE_KEY = '@vectorgrid_match_history';

export interface GameStats {
  totalGames: number;
  vsBotGames: number;
  passAndPlayGames: number;
  p1Wins: number; // Human player
  p2Wins: number; // Bot or P2
  botWins: number;
  playerWinsVsBot: number;
  winRateVsBot: number; // Percentage
  avgMoves: number;
  avgDuration: number; // in seconds
}

export function useGameHistory() {
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const calculateStats = (items: GameHistoryItem[]): GameStats => {
    const total = items.length;
    if (total === 0) {
      return {
        totalGames: 0,
        vsBotGames: 0,
        passAndPlayGames: 0,
        p1Wins: 0,
        p2Wins: 0,
        botWins: 0,
        playerWinsVsBot: 0,
        winRateVsBot: 0,
        avgMoves: 0,
        avgDuration: 0,
      };
    }

    const vsBot = items.filter((item) => item.mode === 'VS_BOT');
    const passAndPlay = items.filter((item) => item.mode === 'PASS_AND_PLAY');

    const p1Wins = items.filter((item) => item.winner === 1).length;
    const p2Wins = items.filter((item) => item.winner === 2).length;
    
    // In VS_BOT mode: P1 is human, P2 is Bot.
    const botWins = vsBot.filter((item) => item.winner === 2).length;
    const playerWinsVsBot = vsBot.filter((item) => item.winner === 1).length;
    const winRateVsBot = vsBot.length > 0 ? Math.round((playerWinsVsBot / vsBot.length) * 100) : 0;

    const totalMoves = items.reduce((sum, item) => sum + item.movesCount, 0);
    const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);

    return {
      totalGames: total,
      vsBotGames: vsBot.length,
      passAndPlayGames: passAndPlay.length,
      p1Wins,
      p2Wins,
      botWins,
      playerWinsVsBot,
      winRateVsBot,
      avgMoves: Math.round((totalMoves / total) * 10) / 10,
      avgDuration: Math.round(totalDuration / total),
    };
  };

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed: GameHistoryItem[] = JSON.parse(stored);
        // Sort descending by timestamp (newest first)
        const sorted = parsed.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(sorted);
        setStats(calculateStats(sorted));
      } else {
        setHistory([]);
        setStats(calculateStats([]));
      }
    } catch (error) {
      console.error('Failed to load match history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveMatch = useCallback(async (matchData: Omit<GameHistoryItem, 'id' | 'timestamp'>) => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      const parsed: GameHistoryItem[] = stored ? JSON.parse(stored) : [];
      
      const newMatch: GameHistoryItem = {
        ...matchData,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
      };

      const updatedHistory = [newMatch, ...parsed];
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      
      // Update local state
      setHistory(updatedHistory);
      setStats(calculateStats(updatedHistory));
      return newMatch;
    } catch (error) {
      console.error('Failed to save match:', error);
      return null;
    }
  }, []);

  const clearHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      setHistory([]);
      setStats(calculateStats([]));
    } catch (error) {
      console.error('Failed to clear history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    history,
    stats,
    isLoading,
    loadHistory,
    saveMatch,
    clearHistory,
  };
}
