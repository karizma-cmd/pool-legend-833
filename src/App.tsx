/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PoolScene, CameraViewMode } from './game/scene';
import { 
  BallState, 
  GameMode, 
  MatchType, 
  AIDifficulty, 
  PlayerProfile, 
  TournamentMatch, 
  P2PMessage,
  TableSkin,
  TrajectoryPrediction
} from './game/types';
import { 
  createInitialRack, 
  areBallsAtRest, 
  strikeCueBall, 
  stepPhysics, 
  calculateTrajectory,
  stopAllBalls,
  BALL_RADIUS,
  TABLE_WIDTH,
  TABLE_LENGTH
} from './game/physics';
import { createInitialRulesState, evaluateShot, GameRulesState } from './game/rules';
import { computeAIShot, AI_PERSONAS, AIShotDecision } from './game/ai';
import { multiplayer } from './game/multiplayer';
import { storage } from './game/storage';
import { sounds } from './game/audio';
import { i18n } from './game/i18n';
import { X, Banknote, Users } from 'lucide-react';

// Components
import { SplashScreen } from './components/SplashScreen';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { SpinModal } from './components/SpinModal';
import { HotspotModal } from './components/HotspotModal';
import { TournamentModal } from './components/TournamentModal';
import { TournamentGiftModal } from './components/TournamentGiftModal';
import { ShopModal } from './components/ShopModal';
import { ProfileModal } from './components/ProfileModal';
import { GameOverModal } from './components/GameOverModal';
import { MatchmakingModal } from './components/MatchmakingModal';
import { AvatarPickerModal } from './components/AvatarPickerModal';
import { PauseModal } from './components/PauseModal';
import { 
  HotspotTournamentModal, 
  HotspotTournamentState, 
  HotspotTournamentPlayer 
} from './components/HotspotTournamentModal';
import { 
  TournamentState, 
  createNewTournament, 
  getSavedTournamentState, 
  advanceToNextRound, 
  generateRandomTournamentPrize 
} from './game/tournament';

type GameScreen = 'title' | 'playing' | 'game_over';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PoolScene | null>(null);

  // Persistence State
  const [profile, setProfile] = useState<PlayerProfile>(() => storage.getProfile());
  const profileRef = useRef<PlayerProfile>(profile);
  profileRef.current = profile;

  // Game flow state
  const [screen, setScreen] = useState<GameScreen>('title');
  const [gameMode, setGameMode] = useState<GameMode>('8ball');
  const gameModeRef = useRef<GameMode>(gameMode);
  gameModeRef.current = gameMode;

  const [matchType, setMatchType] = useState<MatchType>('ai');
  const matchTypeRef = useRef<MatchType>(matchType);
  matchTypeRef.current = matchType;

  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('normal');
  const aiDifficultyRef = useRef<AIDifficulty>(aiDifficulty);
  aiDifficultyRef.current = aiDifficulty;

  const [opponentName, setOpponentName] = useState<string>('Sofia Reyes');
  const [opponentAvatar, setOpponentAvatar] = useState<string>('⚡');

  // Pass and play player names
  const passPlayNamesRef = useRef<{ p1: string; p2: string }>({ p1: 'Player 1', p2: 'Player 2' });

  // Active game physics & rules state
  const ballsRef = useRef<BallState[]>([]);
  const rulesRef = useRef<GameRulesState>(createInitialRulesState('8ball'));
  const [hudState, setHudState] = useState({
    currentPlayerIndex: 0,
    isMyTurn: true,
    playerGroups: rulesRef.current.playerGroups,
    statusMessage: 'Break Shot: Take your opening break!',
    isBallInHand: false,
    balls: [] as BallState[],
  });

  // Aiming & Shooting state
  const aimAngleRef = useRef<number>(0);
  const [aimAngle, setAimAngle] = useState<number>(0);

  const powerRef = useRef<number>(0.5);
  const [power, setPower] = useState<number>(0.5);

  const spinOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [spinOffset, setSpinOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastCuePosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0.5 });

  // DEFAULT VIEW MODE: 2D classic top-down view ('top') as explicitly requested by user!
  const [viewMode, setViewMode] = useState<CameraViewMode>('top');
  const viewModeRef = useRef<CameraViewMode>('top');
  viewModeRef.current = viewMode;

  // Match Stake state
  const [matchStake, setMatchStake] = useState<string>('0');
  const [matchStakeAmount, setMatchStakeAmount] = useState<number>(0);
  const matchStakeAmountRef = useRef<number>(0);
  const matchStakeLabelRef = useRef<string>('0');
  const currentMatchIdRef = useRef<string>('match_' + Date.now());
  const isMatchSettledRef = useRef<boolean>(false);

  // Shot execution states
  const isAimingRef = useRef<boolean>(true);
  const isShootingAnimRef = useRef<boolean>(false);
  const strikeProgressRef = useRef<number>(0);
  const shotStartTimeRef = useRef<number>(0);
  const pottedBallIdsThisShotRef = useRef<number[]>([]);
  const firstContactBallIdRef = useRef<number | null>(null);
  const cushionHitsAfterContactRef = useRef<number>(0);
  const isAiThinkingRef = useRef<boolean>(false);
  const [showBallMarkers, setShowBallMarkers] = useState<boolean>(true);
  const [targetBallId, setTargetBallId] = useState<number | null>(null);
  const lastTargetBallIdRef = useRef<number | null>(null);
  const isDraggingCueBallRef = useRef<boolean>(false);

  // 60-Second Shot Clock state (1 minute per player turn)
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(60);
  const turnTimeLeftRef = useRef<number>(60);
  turnTimeLeftRef.current = turnTimeLeft;

  // Incoming peer emoji reaction
  const [incomingReactionEmoji, setIncomingReactionEmoji] = useState<string | null>(null);

  // Modals state
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  const [isHotspotModalOpen, setIsHotspotModalOpen] = useState(false);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [isTournamentGiftOpen, setIsTournamentGiftOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);

  // Dynamic 8-player knockout tournament state
  const isTournamentMatchRef = useRef<boolean>(false);
  const [tournamentState, setTournamentState] = useState<TournamentState>(() => {
    const saved = getSavedTournamentState();
    if (saved && saved.matches && saved.matches.length > 0) return saved;
    return createNewTournament({ name: profile.name, avatar: profile.avatar, level: profile.level });
  });

  const [tournamentGameOverStatus, setTournamentGameOverStatus] = useState<{
    isTournament: boolean;
    isChampion: boolean;
    nextRound?: number;
  } | null>(null);

  // Hotspot Friends Tournament (2 to 4 Players)
  const [isHotspotTournamentOpen, setIsHotspotTournamentOpen] = useState(false);
  const activeHotspotMatchRef = useRef<{ id: string; p1: HotspotTournamentPlayer; p2: HotspotTournamentPlayer; title: string } | null>(null);
  const [hotspotTournamentState, setHotspotTournamentState] = useState<HotspotTournamentState>(() => {
    const p1: HotspotTournamentPlayer = { id: 'p1', name: profile.name || 'Player 1', avatar: profile.avatar || '👑' };
    const p2: HotspotTournamentPlayer = { id: 'p2', name: 'صديق 2', avatar: '⚡' };
    const p3: HotspotTournamentPlayer = { id: 'p3', name: 'صديق 3', avatar: '🎯' };
    const p4: HotspotTournamentPlayer = { id: 'p4', name: 'صديق 4', avatar: '🦁' };
    return {
      playerCount: 4,
      players: [p1, p2, p3, p4],
      matches: [
        { id: 'semi_1', titleAr: 'نصف النهائي 1', titleEn: 'Semi-Final 1', round: 'semi', player1: p1, player2: p2, winner: null, completed: false },
        { id: 'semi_2', titleAr: 'نصف النهائي 2', titleEn: 'Semi-Final 2', round: 'semi', player1: p3, player2: p4, winner: null, completed: false },
        { id: 'final', titleAr: 'المباراة النهائية الكبرى', titleEn: 'Grand Championship Final', round: 'final', player1: { id: 'w1', name: 'فائز نصف النهائي 1', avatar: '🎱' }, player2: { id: 'w2', name: 'فائز نصف النهائي 2', avatar: '🎱' }, winner: null, completed: false },
      ],
      currentMatchIndex: 0,
      isCompleted: false,
      champion: null,
    };
  });

  // Floating Coin Deduction Notice (Shown prominently at the top as requested: "العدد الدي خسره يجب ان يظهر فوق بإنه تم خصم المال منه")
  const [coinDeductionNotice, setCoinDeductionNotice] = useState<{
    amount: number;
    message: string;
    timestamp: number;
  } | null>(null);

  const triggerCoinDeductionNotice = useCallback((amount: number, customMessage?: string) => {
    if (amount <= 0) return;
    const isAr = i18n.getLanguage() === 'ar';
    const msg = customMessage || (isAr ? 'تم خصم مبلغ الرهان من رصيدك' : 'Stake deducted from balance');
    setCoinDeductionNotice({
      amount,
      message: msg,
      timestamp: Date.now(),
    });
  }, []);

  useEffect(() => {
    if (!coinDeductionNotice) return;
    const timer = setTimeout(() => {
      setCoinDeductionNotice(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [coinDeductionNotice]);

  // Game over state
  const [gameOverDetails, setGameOverDetails] = useState({
    isVictory: false,
    winnerName: '',
    reason: '',
    coinsEarned: 0,
    coinsLost: 0,
    xpEarned: 0,
  });

  // Pointer drag aiming
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const initialAngleOnPointerDownRef = useRef<number>(0);

  // Check URL params on mount & check for any abandoned pending bet from an abruptly closed session
  useEffect(() => {
    try {
      const abandoned = storage.checkAndSettleAbandonedBet();
      if (abandoned) {
        const p = storage.getProfile();
        setProfile(p);
        profileRef.current = p;
      }
    } catch {}

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const room = urlParams.get('room');
      if (room) {
        setIsHotspotModalOpen(true);
      }
    } catch {}

    const handleBeforeUnload = () => {
      if (screen === 'playing' && currentMatchIdRef.current && !isMatchSettledRef.current) {
        storage.forfeitActiveBet(currentMatchIdRef.current);
        isMatchSettledRef.current = true;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [screen]);

  // Update power helper
  const handlePowerUpdate = useCallback((newPower: number) => {
    powerRef.current = newPower;
    setPower(newPower);
  }, []);

  // Update spin helper
  const handleSpinUpdate = useCallback((newSpin: { x: number; y: number }) => {
    spinOffsetRef.current = newSpin;
    setSpinOffset(newSpin);
  }, []);

  // Update aim angle helper (STRICT: only updates and broadcasts when it is my turn)
  const handleAimAngleUpdate = useCallback((newAngle: number) => {
    if (!hudState.isMyTurn && matchTypeRef.current !== 'solo') {
      return; // Prevent modifying cue angle when not your turn!
    }

    aimAngleRef.current = newAngle;
    setAimAngle(newAngle);

    if (matchTypeRef.current === 'hotspot_p2p') {
      multiplayer.sendMessage({
        type: 'SHOT_PREVIEW',
        senderId: profileRef.current.id,
        payload: { angle: newAngle, power: powerRef.current },
        timestamp: Date.now(),
      });
    }
  }, [hudState.isMyTurn]);

  // 1. Initialize 3D Three.js Scene ONCE on mount with empty dependency array []
  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new PoolScene(mountRef.current);
    sceneRef.current = scene;

    // Apply default 2D top-down view mode
    scene.viewMode = 'top';

    // Apply initial table and cue skins
    const tableSkins = storage.getTables();
    const activeTable = tableSkins.find(t => t.id === profileRef.current.selectedTableFelt) || tableSkins[0];
    scene.applyTableSkin(activeTable);

    const cuesCatalog = storage.getCues();
    const activeCue = cuesCatalog.find(c => c.id === profileRef.current.selectedCueId) || cuesCatalog[0];
    scene.applyCueItem(activeCue);

    // Initial rack
    const initialBalls = createInitialRack('8ball');
    ballsRef.current = initialBalls;
    scene.syncBalls(
      initialBalls, 
      profileRef.current.selectedBallSkin,
      rulesRef.current.playerGroups,
      rulesRef.current.currentPlayerIndex,
      gameModeRef.current,
      null,
      0.016
    );

    // Setup P2P Multiplayer listeners
    multiplayer.init({
      onStatusChange: (status, msg) => {
        if (msg) {
          setHudState(prev => ({ ...prev, statusMessage: msg }));
        }
      },
      onMessage: (msg: P2PMessage) => {
        handleP2PMessage(msg);
      },
      onPeerConnected: (role) => {
        setScreen('playing');
        setMatchType('hotspot_p2p');
        matchTypeRef.current = 'hotspot_p2p';
        setOpponentName(role === 'host' ? 'Friend (Guest)' : 'Friend (Host)');
        setOpponentAvatar('📱');
        resetMatch('8ball', 'hotspot_p2p', 'normal', false);
      },
      onPeerDisconnected: () => {
        setHudState(prev => ({ ...prev, statusMessage: 'Peer connection disconnected.' }));
      },
    });

    // 2. Continuous 60 FPS Physics & Render Loop
    let lastTime = performance.now();
    let animId = 0;

    const gameLoop = (currentTime: number) => {
      animId = requestAnimationFrame(gameLoop);
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05);

      const balls = ballsRef.current;
      const currentScene = sceneRef.current;
      if (!currentScene || balls.length === 0) return;

      const cueBall = balls.find(b => b.id === 0);
      if (cueBall && !cueBall.inPocket) {
        lastCuePosRef.current = { x: cueBall.x, z: cueBall.z };
      }
      const cuePos = lastCuePosRef.current;

      // A. Strike Animation Progress
      if (isShootingAnimRef.current) {
        strikeProgressRef.current += dt * 6.0;
        if (strikeProgressRef.current >= 1.0) {
          isShootingAnimRef.current = false;
          strikeProgressRef.current = 0;
          isAimingRef.current = false;
        }
      }

      // B. Step Physics Simulation
      const events = stepPhysics(balls, dt);

      // Record first ball contact
      if (events.ballCollisions.length > 0 && firstContactBallIdRef.current === null) {
        const cueCollision = events.ballCollisions.find(c => c.ballA === 0 || c.ballB === 0);
        if (cueCollision) {
          firstContactBallIdRef.current = cueCollision.ballA === 0 ? cueCollision.ballB : cueCollision.ballA;
        }
      }

      // Record cushion hits
      if (events.cushionHits.length > 0 && firstContactBallIdRef.current !== null) {
        cushionHitsAfterContactRef.current += events.cushionHits.length;
      }

      // Record pocketed balls during gameplay
      if (events.pocketDrops.length > 0) {
        events.pocketDrops.forEach(pd => {
          if (!pottedBallIdsThisShotRef.current.includes(pd.ballId)) {
            pottedBallIdsThisShotRef.current.push(pd.ballId);

            if (pd.ballId !== 0) {
              const updatedProfile = storage.getProfile();
              updatedProfile.ballsPottedTotal++;
              storage.saveProfile(updatedProfile);
              setProfile(updatedProfile);
              profileRef.current = updatedProfile;
            }
          }
        });
      }

      // C. Check if balls have come to complete rest
      // Watchdog safety timer: if shot started and balls are still moving after 11 seconds, force stop!
      const timeSinceShot = shotStartTimeRef.current > 0 ? (currentTime - shotStartTimeRef.current) : 0;
      const forceStopTimeout = !isAimingRef.current && !isShootingAnimRef.current && timeSinceShot > 11000;

      const atRest = areBallsAtRest(balls) || forceStopTimeout;

      if (atRest && !isAimingRef.current && !isShootingAnimRef.current) {
        stopAllBalls(balls);
        shotStartTimeRef.current = 0;

        const shotEval = evaluateShot(
          rulesRef.current,
          balls,
          pottedBallIdsThisShotRef.current,
          firstContactBallIdRef.current,
          cushionHitsAfterContactRef.current
        );

        rulesRef.current = shotEval.newState;
        pottedBallIdsThisShotRef.current = [];
        firstContactBallIdRef.current = null;
        cushionHitsAfterContactRef.current = 0;
        isAimingRef.current = true;
        setTurnTimeLeft(60);
        turnTimeLeftRef.current = 60;

        if (shotEval.result.gameOver) {
          handleGameOver(shotEval.result.winnerPlayerIndex === 0);
        } else {
          const currentIdx = rulesRef.current.currentPlayerIndex;
          const currentMatchType = matchTypeRef.current;
          const role = multiplayer.getRole();
          
          let isMyTurn = true;
          if (currentMatchType === 'ai' || currentMatchType === 'solo') {
            isMyTurn = (currentIdx === 0);
          } else if (currentMatchType === 'hotspot_p2p') {
            isMyTurn = (role === 'host' ? currentIdx === 0 : currentIdx === 1);
          } else if (currentMatchType === 'pass_and_play') {
            isMyTurn = true; // Both shoot on shared phone
          }

          let displayMsg = rulesRef.current.statusMessage;
          if (currentMatchType === 'pass_and_play') {
            const activePlayerName = currentIdx === 0 ? passPlayNamesRef.current.p1 : passPlayNamesRef.current.p2;
            const isAr = i18n.getLanguage() === 'ar';
            displayMsg = isAr ? `دور اللاعب: ${activePlayerName}` : `${activePlayerName}'s Turn - Take your shot!`;
          }

          setHudState({
            currentPlayerIndex: currentIdx,
            isMyTurn,
            playerGroups: rulesRef.current.playerGroups,
            statusMessage: displayMsg,
            isBallInHand: rulesRef.current.isBallInHand,
            balls: [...balls],
          });

          // In P2P: Host broadcasts synced balls and turn state so guest is 100% in lockstep!
          if (currentMatchType === 'hotspot_p2p') {
            multiplayer.sendMessage({
              type: 'SYNC_BALLS',
              senderId: profileRef.current.id,
              payload: {
                balls: balls.map(b => ({
                  id: b.id,
                  type: b.type,
                  x: b.x,
                  y: b.y,
                  z: b.z,
                  inPocket: b.inPocket,
                })),
                rulesState: rulesRef.current,
              },
              timestamp: Date.now(),
            });
          }

          if (currentMatchType === 'ai' && currentIdx === 1 && !isAiThinkingRef.current) {
            triggerAITurn();
          }
        }
      }

      // D. Trajectory Raycast Prediction
      const cuesCatalog = storage.getCues();
      const currentCue = cuesCatalog.find(c => c.id === profileRef.current.selectedCueId) || cuesCatalog[0];
      const trajectory = calculateTrajectory(balls, aimAngleRef.current, 0.7 + currentCue.aimLength * 0.15);

      if (trajectory.targetBallId !== lastTargetBallIdRef.current) {
        lastTargetBallIdRef.current = trajectory.targetBallId;
        setTargetBallId(trajectory.targetBallId);
      }

      // E. Update 3D Scene Ball Meshes & Cue
      currentScene.syncBalls(
        balls, 
        profileRef.current.selectedBallSkin,
        rulesRef.current.playerGroups,
        rulesRef.current.currentPlayerIndex,
        gameModeRef.current,
        trajectory.targetBallId,
        dt
      );
      currentScene.updateAim(
        cuePos,
        aimAngleRef.current,
        powerRef.current,
        trajectory,
        isAimingRef.current,
        isShootingAnimRef.current,
        strikeProgressRef.current,
        rulesRef.current.isBallInHand
      );

      // F. Smooth Camera Damping
      currentScene.updateCamera(cuePos, dt, isAimingRef.current);

      // G. Render frame smoothly in lockstep!
      currentScene.render();
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      scene.dispose();
      multiplayer.close();
    };
  }, []);

  // Handle incoming P2P multiplayer messages
  const handleP2PMessage = useCallback((msg: P2PMessage) => {
    if (msg.type === 'SHOT_PREVIEW') {
      // Only accept opponent's preview when it's their turn!
      if (!hudState.isMyTurn) {
        aimAngleRef.current = msg.payload.angle;
        powerRef.current = msg.payload.power;
        setAimAngle(msg.payload.angle);
        setPower(msg.payload.power);
      }
    } else if (msg.type === 'SHOT_EXECUTE') {
      aimAngleRef.current = msg.payload.angle;
      powerRef.current = msg.payload.power;
      setAimAngle(msg.payload.angle);
      setPower(msg.payload.power);
      executeShot(msg.payload.angle, msg.payload.power, msg.payload.spinOffset, true);
    } else if (msg.type === 'SYNC_BALLS') {
      if (msg.payload.balls && Array.isArray(msg.payload.balls)) {
        msg.payload.balls.forEach((rb: any) => {
          const localBall = ballsRef.current.find(b => b.id === rb.id);
          if (localBall) {
            localBall.x = rb.x;
            localBall.y = rb.y;
            localBall.z = rb.z;
            localBall.inPocket = rb.inPocket;
            localBall.vx = 0;
            localBall.vz = 0;
          }
        });
      }
      if (msg.payload.rulesState) {
        rulesRef.current = msg.payload.rulesState;
        const currentIdx = msg.payload.rulesState.currentPlayerIndex;
        const isMyTurn = multiplayer.getRole() === 'host' ? currentIdx === 0 : currentIdx === 1;

        setHudState({
          currentPlayerIndex: currentIdx,
          isMyTurn,
          playerGroups: msg.payload.rulesState.playerGroups,
          statusMessage: msg.payload.rulesState.statusMessage,
          isBallInHand: msg.payload.rulesState.isBallInHand,
          balls: [...ballsRef.current],
        });
        isAimingRef.current = true;
        isShootingAnimRef.current = false;
      }
    } else if (msg.type === 'BALL_IN_HAND') {
      const cue = ballsRef.current.find(b => b.id === 0);
      if (cue && msg.payload) {
        cue.x = msg.payload.x;
        cue.z = msg.payload.z;
        cue.y = BALL_RADIUS;
        cue.inPocket = false;
      }
    } else if (msg.type === 'EMOTE') {
      if (msg.payload && msg.payload.emoji) {
        setIncomingReactionEmoji(msg.payload.emoji);
        sounds.playClick();
      }
    } else if (msg.type === 'REMATCH_VOTE' || msg.type === 'REMATCH') {
      sounds.playRack();
      resetMatch(gameModeRef.current, 'hotspot_p2p', aiDifficultyRef.current, false);
    } else if (msg.type === 'TIMEOUT_FOUL') {
      sounds.playFoul();
      if (msg.payload) {
        const nextIdx = msg.payload.newPlayerIndex;
        rulesRef.current.currentPlayerIndex = nextIdx;
        rulesRef.current.isBallInHand = true;
        rulesRef.current.statusMessage = msg.payload.statusMessage;
        const currentIdx = msg.payload.newPlayerIndex;
        const isMyTurn = multiplayer.getRole() === 'host' ? currentIdx === 0 : currentIdx === 1;
        setHudState(prev => ({
          ...prev,
          currentPlayerIndex: currentIdx,
          isMyTurn,
          isBallInHand: true,
          statusMessage: msg.payload.statusMessage,
          balls: [...ballsRef.current],
        }));
        setTurnTimeLeft(60);
        turnTimeLeftRef.current = 60;
      }
    }
  }, [hudState.isMyTurn]);

  // Lifelike human AI animation references
  const aiAnimRef = useRef<number | null>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAiAnimation = () => {
    if (aiAnimRef.current) {
      cancelAnimationFrame(aiAnimRef.current);
      aiAnimRef.current = null;
    }
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    isAiThinkingRef.current = false;
  };

  // Trigger offline AI shot
  const triggerAITurn = () => {
    if (isAiThinkingRef.current) return;
    clearAiAnimation();
    isAiThinkingRef.current = true;

    const isAr = i18n.getLanguage() === 'ar';
    setHudState(prev => ({ 
      ...prev, 
      statusMessage: isAr ? `${opponentName} يدرس وضعية الطاولة...` : `${opponentName} is studying the table...` 
    }));

    aiTimeoutRef.current = setTimeout(() => {
      const aiDecision = computeAIShot(
        ballsRef.current,
        gameModeRef.current,
        rulesRef.current.playerGroups[1],
        aiDifficultyRef.current,
        rulesRef.current.isBreakShot,
        rulesRef.current.isBallInHand
      );

      if (aiDecision.isBallInHandPlacement) {
        const cue = ballsRef.current.find(b => b.id === 0);
        if (cue) {
          cue.x = aiDecision.isBallInHandPlacement.x;
          cue.z = aiDecision.isBallInHandPlacement.z;
          cue.inPocket = false;
          rulesRef.current.isBallInHand = false;
        }
      }

      const startAngle = aimAngleRef.current;
      const targetAngle = aiDecision.angle;
      let angleDiff = targetAngle - startAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const aimDuration = Math.min(1300, Math.max(700, Math.abs(angleDiff) * 600));
      const startTime = performance.now();

      setHudState(prev => ({ 
        ...prev, 
        statusMessage: isAr ? `${opponentName} يوجّه العصا نحو الهدف...` : `${opponentName} is lining up the shot...` 
      }));

      const animateAim = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / aimDuration);
        const ease = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentAngle = startAngle + angleDiff * ease;
        aimAngleRef.current = currentAngle;
        setAimAngle(currentAngle);

        if (progress < 1) {
          aiAnimRef.current = requestAnimationFrame(animateAim);
        } else {
          aimAngleRef.current = targetAngle;
          setAimAngle(targetAngle);
          spinOffsetRef.current = aiDecision.spinOffset;
          setSpinOffset(aiDecision.spinOffset);
          animateCueFeathering(aiDecision);
        }
      };

      aiAnimRef.current = requestAnimationFrame(animateAim);
    }, 700);
  };

  const animateCueFeathering = (aiDecision: AIShotDecision) => {
    const isAr = i18n.getLanguage() === 'ar';
    setHudState(prev => ({ 
      ...prev, 
      statusMessage: isAr ? `${opponentName} يسحب العصا للتسديد...` : `${opponentName} is drawing back the cue...` 
    }));

    const targetPower = aiDecision.power;
    const featherTime = performance.now();
    const pumpDuration = 380;
    const finalDrawDuration = 420;

    const animateStrokes = (now: number) => {
      const elapsed = now - featherTime;

      if (elapsed < pumpDuration) {
        const pProgress = elapsed / pumpDuration;
        const pumpVal = Math.sin(pProgress * Math.PI) * Math.min(0.28, targetPower * 0.5);
        powerRef.current = pumpVal;
        setPower(pumpVal);
        aiAnimRef.current = requestAnimationFrame(animateStrokes);
      } else if (elapsed < pumpDuration + finalDrawDuration) {
        const drawProgress = (elapsed - pumpDuration) / finalDrawDuration;
        const easeDraw = 1 - (1 - drawProgress) * (1 - drawProgress);
        const currentP = targetPower * easeDraw;
        powerRef.current = currentP;
        setPower(currentP);
        aiAnimRef.current = requestAnimationFrame(animateStrokes);
      } else {
        powerRef.current = targetPower;
        setPower(targetPower);

        aiTimeoutRef.current = setTimeout(() => {
          executeShot(aiDecision.angle, aiDecision.power, aiDecision.spinOffset, true);
          isAiThinkingRef.current = false;
        }, 120);
      }
    };

    aiAnimRef.current = requestAnimationFrame(animateStrokes);
  };

  // Handle 60-Second Shot Clock Timeout: pass turn to opponent with Ball in Hand
  const handleTurnTimeout = () => {
    if (rulesRef.current.gameOver) return;

    sounds.playFoul();
    const currentIdx = rulesRef.current.currentPlayerIndex;
    const opponentIdx = currentIdx === 0 ? 1 : 0;
    const currentMatchType = matchTypeRef.current;
    const role = multiplayer.getRole();
    const isAr = i18n.getLanguage() === 'ar';

    const p1Name = currentMatchType === 'pass_and_play' ? passPlayNamesRef.current.p1 : profileRef.current.name;
    const p2Name = currentMatchType === 'pass_and_play' ? passPlayNamesRef.current.p2 : opponentName;
    const timedOutPlayerName = currentIdx === 0 ? p1Name : p2Name;
    const nextPlayerName = opponentIdx === 0 ? p1Name : p2Name;

    // Switch turn & grant Ball-in-Hand to opponent anywhere on the table
    rulesRef.current.currentPlayerIndex = opponentIdx;
    rulesRef.current.isBallInHand = true;

    const statusMsg = isAr
      ? `⏰ انتهى الوقت (60 ثانية)! خطأ على ${timedOutPlayerName}، انتقل الدور إلى ${nextPlayerName} مع الكرة في اليد!`
      : `⏰ Shot clock expired (60s)! Foul on ${timedOutPlayerName}. Ball-in-Hand awarded to ${nextPlayerName}!`;
    rulesRef.current.statusMessage = statusMsg;

    let isMyTurn = true;
    if (currentMatchType === 'ai' || currentMatchType === 'solo') {
      isMyTurn = (opponentIdx === 0);
    } else if (currentMatchType === 'hotspot_p2p') {
      isMyTurn = (role === 'host' ? opponentIdx === 0 : opponentIdx === 1);
    } else if (currentMatchType === 'pass_and_play') {
      isMyTurn = true;
    }

    setHudState(prev => ({
      ...prev,
      currentPlayerIndex: opponentIdx,
      isMyTurn,
      isBallInHand: true,
      statusMessage: statusMsg,
      balls: [...ballsRef.current],
    }));

    setTurnTimeLeft(60);
    turnTimeLeftRef.current = 60;

    // In P2P Hotspot: broadcast timeout foul to peer
    if (currentMatchType === 'hotspot_p2p') {
      multiplayer.sendMessage({
        type: 'TIMEOUT_FOUL',
        senderId: profileRef.current.id,
        payload: {
          newPlayerIndex: opponentIdx,
          statusMessage: statusMsg,
        },
        timestamp: Date.now(),
      });
    }

    // If turn switched to AI, trigger AI shot
    if (currentMatchType === 'ai' && opponentIdx === 1 && !isAiThinkingRef.current) {
      triggerAITurn();
    }
  };

  // 60-Second Shot Clock Countdown Effect (1 minute per player turn)
  useEffect(() => {
    if (screen !== 'playing') return;

    const timer = setInterval(() => {
      // Only tick down when aiming, balls at rest, and not currently shooting animation or AI thinking
      if (!isAimingRef.current || isShootingAnimRef.current || rulesRef.current.gameOver || isAiThinkingRef.current) {
        return;
      }

      setTurnTimeLeft(prev => {
        if (prev <= 1) {
          handleTurnTimeout();
          return 60;
        }

        // Warning tick sounds in the last 6 seconds for the active human player
        if (prev <= 6 && hudState.isMyTurn) {
          sounds.playClick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, hudState.isMyTurn, opponentName]);

  // Execute shot on cue ball with physics impulse
  const executeShot = (
    shotAngle = aimAngleRef.current,
    shotPower = powerRef.current,
    shotSpin = spinOffsetRef.current,
    isRemoteOrAi: boolean = false
  ) => {
    // STRICT check: local player cannot shoot when not their turn!
    if (!isRemoteOrAi && !hudState.isMyTurn && matchTypeRef.current !== 'solo') {
      return;
    }

    const cueBall = ballsRef.current.find(b => b.id === 0);
    if (!cueBall || !isAimingRef.current || isShootingAnimRef.current) return;

    isShootingAnimRef.current = true;
    strikeProgressRef.current = 0;
    shotStartTimeRef.current = performance.now();
    pottedBallIdsThisShotRef.current = [];
    firstContactBallIdRef.current = null;
    cushionHitsAfterContactRef.current = 0;

    const cuesCatalog = storage.getCues();
    const currentCue = cuesCatalog.find(c => c.id === profileRef.current.selectedCueId) || cuesCatalog[0];
    const powerMultiplier = 0.85 + (currentCue.power || 2) * 0.07;
    const spinMultiplier = 0.85 + (currentCue.spinControl || 2) * 0.07;

    strikeCueBall(cueBall, shotAngle, shotPower * powerMultiplier, {
      x: shotSpin.x * spinMultiplier,
      y: shotSpin.y * spinMultiplier,
    });

    if (!isRemoteOrAi && matchTypeRef.current === 'hotspot_p2p') {
      multiplayer.sendMessage({
        type: 'SHOT_EXECUTE',
        senderId: profileRef.current.id,
        payload: { angle: shotAngle, power: shotPower, spinOffset: shotSpin },
        timestamp: Date.now(),
      });
    }

    powerRef.current = 0.5;
    setPower(0.5);
  };

  // Start or configure a new match with guaranteed atomic bet session & unique match ID
  const startNewMatch = (
    mode: GameMode,
    type: MatchType,
    diff: AIDifficulty = 'normal',
    stakeAmount: number = 0,
    stakeLabel: string = '0',
    oppName?: string,
    oppAvatar?: string,
    broadcastRematch: boolean = true
  ): boolean => {
    const isAr = i18n.getLanguage() === 'ar';
    const isCupTournament = isTournamentMatchRef.current;

    // 1. If staked match and not cup tournament, strictly validate funds and start bet session
    if (stakeAmount > 0 && !isCupTournament) {
      const curCoins = storage.getProfile().coins;
      if (curCoins < stakeAmount) {
        triggerCoinDeductionNotice(
          0,
          isAr ? 'رصيدك غير كافٍ للمراهنة بهذا المبلغ!' : 'Insufficient balance for this stake!'
        );
        sounds.playFoul();
        return false;
      }

      // Generate unique match ID
      const newMatchId = 'match_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      currentMatchIdRef.current = newMatchId;
      isMatchSettledRef.current = false;

      const betRes = storage.startMatchBet(newMatchId, stakeAmount, {
        opponentName: oppName || opponentName,
        mode,
      });

      if (!betRes.success) {
        triggerCoinDeductionNotice(
          0,
          isAr ? 'تعذر تأكيد الرهان: رصيد غير كافٍ!' : 'Failed to confirm bet: Insufficient funds!'
        );
        sounds.playFoul();
        return false;
      }

      // Synchronize player profile wallet in state
      const updatedProf = storage.getProfile();
      setProfile(updatedProf);
      profileRef.current = updatedProf;

      // Immediately alert player of deducted stake
      triggerCoinDeductionNotice(
        stakeAmount,
        isAr ? `تم خصم مبلغ الرهان فوراً (-${stakeAmount.toLocaleString()} كوينز)` : `Bet deducted: -${stakeAmount.toLocaleString()} Coins`
      );

      matchStakeAmountRef.current = stakeAmount;
      matchStakeLabelRef.current = stakeLabel || stakeAmount.toLocaleString();
      setMatchStakeAmount(stakeAmount);
      setMatchStake(stakeLabel || stakeAmount.toLocaleString());
    } else {
      // Free / Tournament match
      const newMatchId = 'match_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      currentMatchIdRef.current = newMatchId;
      isMatchSettledRef.current = false;

      storage.startMatchBet(newMatchId, 0, {
        opponentName: oppName || opponentName,
        mode,
      });

      matchStakeAmountRef.current = 0;
      matchStakeLabelRef.current = stakeLabel || '0';
      setMatchStakeAmount(0);
      setMatchStake(stakeLabel || '0');
    }

    if (oppName) setOpponentName(oppName);
    if (oppAvatar) setOpponentAvatar(oppAvatar);

    resetMatch(mode, type, diff, broadcastRematch);
    return true;
  };

  // Reset match for new game (Fixes replay button!)
  const resetMatch = (
    mode: GameMode, 
    type: MatchType, 
    diff: AIDifficulty = 'normal',
    broadcastRematch: boolean = true
  ) => {
    sounds.playRack();
    setGameMode(mode);
    gameModeRef.current = mode;
    setMatchType(type);
    matchTypeRef.current = type;
    setAiDifficulty(diff);
    aiDifficultyRef.current = diff;

    const initialBalls = createInitialRack(mode);
    ballsRef.current = initialBalls;
    rulesRef.current = createInitialRulesState(mode);

    if (type === 'ai') {
      const persona = AI_PERSONAS[diff];
      setOpponentName(persona.name);
      setOpponentAvatar(persona.avatar);
    }

    // Role-dependent turn state
    const isHost = multiplayer.getRole() === 'host';
    const isMyTurn = (type === 'hotspot_p2p') ? isHost : true;

    let initialStatus = 'Break Shot: Take your opening break!';
    if (type === 'pass_and_play') {
      const isAr = i18n.getLanguage() === 'ar';
      initialStatus = isAr ? `ضربة البداية: دور ${passPlayNamesRef.current.p1}` : `Break Shot: ${passPlayNamesRef.current.p1}'s Turn`;
    } else if (type === 'hotspot_p2p') {
      const isAr = i18n.getLanguage() === 'ar';
      initialStatus = isHost 
        ? (isAr ? 'ضربة البداية: دورك للتسديد!' : 'Break Shot: Your turn!')
        : (isAr ? 'ضربة البداية: دور المضيف' : 'Break Shot: Host\'s turn');
    }

    setHudState({
      currentPlayerIndex: 0,
      isMyTurn,
      playerGroups: ['unassigned', 'unassigned'],
      statusMessage: initialStatus,
      isBallInHand: false,
      balls: [...initialBalls],
    });

    // Reset all internal physics & shot refs
    isAimingRef.current = true;
    isShootingAnimRef.current = false;
    strikeProgressRef.current = 0;
    shotStartTimeRef.current = 0;
    pottedBallIdsThisShotRef.current = [];
    firstContactBallIdRef.current = null;
    cushionHitsAfterContactRef.current = 0;
    isAiThinkingRef.current = false;
    clearAiAnimation();

    aimAngleRef.current = 0;
    powerRef.current = 0.5;
    setAimAngle(0);
    setPower(0.5);

    // Default 2D top-down view (never forced 3D)
    setViewMode('top');
    viewModeRef.current = 'top';
    setTurnTimeLeft(60);
    turnTimeLeftRef.current = 60;

    // Close any open modals and return to playing screen!
    setIsPauseModalOpen(false);
    setScreen('playing');

    if (sceneRef.current) {
      sceneRef.current.onResize();
      sceneRef.current.viewMode = 'top';
      sceneRef.current.syncBalls(
        initialBalls, 
        profileRef.current.selectedBallSkin,
        rulesRef.current.playerGroups,
        0,
        mode,
        null,
        0.016
      );
      sceneRef.current.snapCamera();
    }

    // Notify remote peer to reset too so both players rematch in sync!
    if (broadcastRematch && type === 'hotspot_p2p') {
      multiplayer.sendMessage({
        type: 'REMATCH_VOTE',
        senderId: profileRef.current.id,
        payload: {},
        timestamp: Date.now(),
      });
    }
  };

  // Game over handler - player wins DOUBLE their bet money once on victory, or loses ONLY wager on defeat!
  // Exactly-Once Settlement Engine
  const handleGameOver = (isUserWinner: boolean) => {
    // 1. Guard against duplicate settlement
    if (isMatchSettledRef.current) {
      return;
    }
    isMatchSettledRef.current = true;

    clearAiAnimation();
    const isTournament = isTournamentMatchRef.current;
    const isAr = i18n.getLanguage() === 'ar';
    const xpWon = isUserWinner ? 100 : 25;

    let coinsWon = 0;
    let coinsLost = 0;
    let gameReason = rulesRef.current.statusMessage;

    if (isTournament) {
      // Cup Tournament: settle as free match
      storage.settleMatchBet(currentMatchIdRef.current, isUserWinner);
      coinsLost = 0;

      if (isUserWinner) {
        const advance = advanceToNextRound(tournamentState.currentRound, tournamentState.matches);
        if (advance.isChampion) {
          // User is the Grand Champion: Wins 5000 coins ONLY!
          coinsWon = 5000;
          storage.addCoins(5000);

          const prize = generateRandomTournamentPrize();
          const curProf = storage.getProfile();
          curProf.tournamentsWon++;
          storage.saveProfile(curProf);

          setTournamentState(prev => ({
            ...prev,
            isCompleted: true,
            wonByPlayer: true,
            prizeAwarded: prize,
          }));

          setTournamentGameOverStatus({
            isTournament: true,
            isChampion: true,
            nextRound: 5,
          });

          gameReason = isAr 
            ? 'بطل كؤوس البلياردو الأسطوري! فزت بجميع الأدوار ضد 32 متنافساً ونلت كأس البطولة وجائزة 5000 كوينز فقط!'
            : 'Grand Tournament Champion! You conquered all 32 contenders across 5 rounds and earned 5,000 Coins!';
        } else if (advance.nextRound === 4) {
          // Qualified for Semi-Finals (Round 4): Wins 2500 coins!
          coinsWon = 2500;
          storage.addCoins(2500);

          setTournamentState(prev => ({
            ...prev,
            currentRound: advance.nextRound,
            matches: advance.updatedMatches,
          }));

          setTournamentGameOverStatus({
            isTournament: true,
            isChampion: false,
            nextRound: 4,
          });

          gameReason = isAr
            ? 'مبروك الفوز! تأهلت إلى نصف النهائي ونلت مكافأة الـ 2500 كوينز!'
            : 'Victory! You qualified for the Semi-Finals and earned the 2,500 Coins Prize!';
        } else {
          coinsWon = 0;

          setTournamentState(prev => ({
            ...prev,
            currentRound: advance.nextRound,
            matches: advance.updatedMatches,
          }));

          setTournamentGameOverStatus({
            isTournament: true,
            isChampion: false,
            nextRound: advance.nextRound,
          });

          const roundNameAr = 
            advance.nextRound === 2 ? 'ثمن النهائي (دور 16)' :
            advance.nextRound === 3 ? 'ربع النهائي (دور 8)' : 'النهائي الكبير';
          const roundNameEn = 
            advance.nextRound === 2 ? 'Round of 16' :
            advance.nextRound === 3 ? 'Quarter-Finals' : 'Grand Final';

          gameReason = isAr
            ? `مبروك الفوز! تأهلت إلى ${roundNameAr} في بطولة الـ 32 لاعباً (المكافآت المالية عند نصف النهائي 2500 والنهائي 5000 فقط)!`
            : `Victory! You qualified for the ${roundNameEn} in the 32-player Championship!`;
        }
      } else {
        // Eliminated from tournament (no coins lost)
        coinsWon = 0;
        coinsLost = 0;

        setTournamentState(prev => ({
          ...prev,
          isCompleted: true,
          wonByPlayer: false,
        }));

        setTournamentGameOverStatus({
          isTournament: true,
          isChampion: false,
        });

        gameReason = isAr
          ? 'تم الإقصاء من بطولة الكؤوس! يمكنك بدء دورة بطولة جديدة في أي وقت دون خسارة كوينز.'
          : 'Eliminated from the Tournament Cup. You can start a fresh tournament anytime!';
      }

      isTournamentMatchRef.current = false;
    } else {
      // Regular Staked Match (Atomic Exact-Once Settlement)
      setTournamentGameOverStatus(null);
      const settlement = storage.settleMatchBet(currentMatchIdRef.current, isUserWinner);

      if (isUserWinner) {
        // Winner receives 2x stake added to wallet (net profit = 1x stake)
        coinsWon = settlement.payout; // stake * 2
        coinsLost = 0;
      } else {
        // Defeat: Player's staked money was deducted at match start and is NOT returned
        coinsWon = 0;
        const actualStakeLost = (settlement.stakeAmount !== undefined && settlement.stakeAmount > 0)
          ? settlement.stakeAmount
          : (settlement.bet?.stakeAmount ?? matchStakeAmountRef.current);
        coinsLost = actualStakeLost;
      }
    }

    // Handle Hotspot Tournament progression if this was a tournament match between friends
    if (activeHotspotMatchRef.current) {
      const activeHM = activeHotspotMatchRef.current;
      const winnerPlayer = isUserWinner ? activeHM.p1 : activeHM.p2;

      setHotspotTournamentState(prev => {
        const updatedMatches = prev.matches.map(m => {
          if (m.id === activeHM.id) {
            return { ...m, winner: winnerPlayer, completed: true };
          }
          return m;
        });

        if (prev.playerCount === 4) {
          const s1 = updatedMatches.find(m => m.id === 'semi_1');
          const s2 = updatedMatches.find(m => m.id === 'semi_2');
          const finalM = updatedMatches.find(m => m.id === 'final');
          if (finalM) {
            if (s1?.winner) finalM.player1 = s1.winner;
            if (s2?.winner) finalM.player2 = s2.winner;
          }
        }

        const finalMatch = updatedMatches.find(m => m.id === 'final');
        const isCompleted = Boolean(finalMatch && finalMatch.completed && finalMatch.winner);
        const champion = isCompleted ? finalMatch!.winner : null;

        return {
          ...prev,
          matches: updatedMatches,
          isCompleted,
          champion,
        };
      });

      activeHotspotMatchRef.current = null;
    }

    storage.addXP(xpWon);

    const updatedProfile = storage.getProfile();
    if (isUserWinner) {
      updatedProfile.matchesWon++;
      updatedProfile.currentStreak++;
      if (updatedProfile.currentStreak > updatedProfile.highestStreak) {
        updatedProfile.highestStreak = updatedProfile.currentStreak;
      }
    } else {
      updatedProfile.matchesLost++;
      updatedProfile.currentStreak = 0;
    }
    storage.saveProfile(updatedProfile);
    setProfile(updatedProfile);
    profileRef.current = updatedProfile;

    setGameOverDetails({
      isVictory: isUserWinner,
      winnerName: isUserWinner ? profileRef.current.name : opponentName,
      reason: gameReason,
      coinsEarned: coinsWon,
      coinsLost: coinsLost,
      xpEarned: xpWon,
    });
    setScreen('game_over');
  };

  // Pointer drag to aim on the 3D canvas (STRICT: disabled if not your turn!)
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // STRICT CHECK: if not your turn, do not allow moving cue stick!
    if (!hudState.isMyTurn && viewModeRef.current !== 'free') {
      return;
    }

    const hit = sceneRef.current?.getTableIntersection(e.clientX, e.clientY);
    const cue = ballsRef.current.find(b => b.id === 0);

    // Ball-in-hand repositioning
    if (hudState.isMyTurn && isAimingRef.current && hit && cue && !cue.inPocket && rulesRef.current.isBallInHand) {
      const minX = -TABLE_WIDTH / 2 + BALL_RADIUS * 1.8;
      const maxX = TABLE_WIDTH / 2 - BALL_RADIUS * 1.8;
      const minZ = -TABLE_LENGTH / 2 + BALL_RADIUS * 1.8;
      const maxZ = TABLE_LENGTH / 2 - BALL_RADIUS * 1.8;

      const targetX = Math.max(minX, Math.min(maxX, hit.x));
      const targetZ = Math.max(minZ, Math.min(maxZ, hit.z));

      const isOverlapping = ballsRef.current.some(b => {
        if (b.id === 0 || b.inPocket) return false;
        const dx = b.x - targetX;
        const dz = b.z - targetZ;
        return dx * dx + dz * dz < (BALL_RADIUS * 2.1) * (BALL_RADIUS * 2.1);
      });

      if (!isOverlapping) {
        cue.x = targetX;
        cue.z = targetZ;
        cue.y = BALL_RADIUS;
        cue.vx = 0;
        cue.vz = 0;
        cue.inPocket = false;
        cue.pocketDropProgress = 0;
        isDraggingCueBallRef.current = true;
        sounds.playClick();

        if (matchTypeRef.current === 'hotspot_p2p') {
          multiplayer.sendMessage({
            type: 'BALL_IN_HAND',
            senderId: profileRef.current.id,
            payload: { x: targetX, z: targetZ },
            timestamp: Date.now(),
          });
        }
      }

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    initialAngleOnPointerDownRef.current = aimAngleRef.current;
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // STRICT CHECK: if not your turn, ignore pointer movement
    if (!hudState.isMyTurn && viewModeRef.current !== 'free') {
      return;
    }

    // 1. Dragging cue ball by hand automatically
    if (isDraggingCueBallRef.current && hudState.isMyTurn) {
      const hit = sceneRef.current?.getTableIntersection(e.clientX, e.clientY);
      if (hit) {
        const minX = -TABLE_WIDTH / 2 + BALL_RADIUS * 1.8;
        const maxX = TABLE_WIDTH / 2 - BALL_RADIUS * 1.8;
        const minZ = -TABLE_LENGTH / 2 + BALL_RADIUS * 1.8;
        const maxZ = TABLE_LENGTH / 2 - BALL_RADIUS * 1.8;

        const targetX = Math.max(minX, Math.min(maxX, hit.x));
        const targetZ = Math.max(minZ, Math.min(maxZ, hit.z));

        const isOverlapping = ballsRef.current.some(b => {
          if (b.id === 0 || b.inPocket) return false;
          const dx = b.x - targetX;
          const dz = b.z - targetZ;
          return dx * dx + dz * dz < (BALL_RADIUS * 2.1) * (BALL_RADIUS * 2.1);
        });

        if (!isOverlapping) {
          const cue = ballsRef.current.find(b => b.id === 0);
          if (cue) {
            cue.x = targetX;
            cue.z = targetZ;
            cue.y = BALL_RADIUS;
            cue.inPocket = false;

            if (matchTypeRef.current === 'hotspot_p2p') {
              multiplayer.sendMessage({
                type: 'BALL_IN_HAND',
                senderId: profileRef.current.id,
                payload: { x: targetX, z: targetZ },
                timestamp: Date.now(),
              });
            }
          }
        }
      }
      return;
    }

    // 2. Aiming angle rotation or 3D camera orbit
    if (!pointerDownPosRef.current || !isAimingRef.current) return;

    if (viewModeRef.current === 'free' && sceneRef.current) {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      sceneRef.current.orbitAngleX += dx * 0.008;
      sceneRef.current.orbitAngleY = Math.max(0.2, Math.min(1.4, sceneRef.current.orbitAngleY + dy * 0.008));
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const newAngle = initialAngleOnPointerDownRef.current + dx * 0.005;
      handleAimAngleUpdate(newAngle);
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingCueBallRef.current) {
      isDraggingCueBallRef.current = false;
      rulesRef.current.isBallInHand = false;
      sounds.playBallHit(0.4);
      setHudState(prev => ({
        ...prev,
        isBallInHand: false,
        statusMessage: 'Ready! Adjust angle and strike.',
        balls: [...ballsRef.current],
      }));
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    pointerDownPosRef.current = null;
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          sounds.playClick();
          resetMatch('8ball', 'ai', aiDifficultyRef.current);
        }
        return;
      }

      if (screen === 'playing' && isAimingRef.current && hudState.isMyTurn) {
        if (e.code === 'ArrowLeft') {
          handleAimAngleUpdate(aimAngleRef.current - 0.02);
        } else if (e.code === 'ArrowRight') {
          handleAimAngleUpdate(aimAngleRef.current + 0.02);
        } else if (e.code === 'Space' || e.code === 'Enter') {
          executeShot();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, handleAimAngleUpdate, hudState.isMyTurn]);

  // Ensure 3D viewport matches exact screen size without black flicker
  useEffect(() => {
    if (screen === 'playing') {
      const t1 = setTimeout(() => {
        sceneRef.current?.onResize();
      }, 30);
      const t2 = setTimeout(() => {
        sceneRef.current?.onResize();
      }, 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [screen]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 font-['Outfit',sans-serif]">
      {/* 0. Floating Top Coin Deduction Notice - Visibly displays amount deducted at top */}
      {coinDeductionNotice && (
        <div
          dir={i18n.getLanguage() === 'ar' ? 'rtl' : 'ltr'}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] max-w-[92vw] sm:max-w-md w-full px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-2 border-red-500 shadow-[0_10px_35px_rgba(239,68,68,0.75)] flex items-center justify-between gap-3 text-white animate-bounce-short pointer-events-auto"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-600/40 border border-red-400 flex items-center justify-center text-red-200 shrink-0 font-black text-xs">
              🔻
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-red-100">
                <span className="text-red-300 font-mono tracking-wider font-extrabold text-sm sm:text-base">
                  -{coinDeductionNotice.amount.toLocaleString()} {i18n.getLanguage() === 'ar' ? 'كوينز' : 'Coins'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-800/90 text-white font-bold uppercase tracking-wider">
                  {i18n.getLanguage() === 'ar' ? 'تم الخصم' : 'Deducted'}
                </span>
              </div>
              <p className="text-[11px] text-red-200/90 truncate font-semibold">
                {coinDeductionNotice.message}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCoinDeductionNotice(null)}
            className="p-1 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 hover:text-white transition cursor-pointer shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 1. Dedicated 3D Three.js WebGL Mount */}
      <div
        ref={mountRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        onWheel={(e) => {
          if (e.deltaY > 0) {
            sceneRef.current?.zoomOut();
          } else {
            sceneRef.current?.zoomIn();
          }
        }}
        className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none select-none transition-opacity duration-300 ${
          screen === 'playing' ? 'z-10 opacity-100 pointer-events-auto' : 'z-0 opacity-100 pointer-events-none'
        }`}
      />

      {/* 2. Title Screen */}
      {screen === 'title' && (
        <TitleScreen
          profile={profile}
          onStartMatch={(mode, type, diff) => {
            if (type === 'ai') {
              setIsMatchmakingOpen(true);
            } else {
              startNewMatch(mode, type, diff || 'normal', 0, '0');
            }
          }}
          onOpenHotspot={() => setIsHotspotModalOpen(true)}
          onOpenTournament={() => setIsTournamentModalOpen(true)}
          onOpenHotspotTournament={() => setIsHotspotTournamentOpen(true)}
          onOpenTournamentGift={() => setIsTournamentGiftOpen(true)}
          onOpenShop={() => setIsShopModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenAvatarPicker={() => setIsAvatarPickerOpen(true)}
          onShowSplash={() => setShowSplash(true)}
        />
      )}

      {/* 3. In-Game Low-Occlusion HUD */}
      {screen === 'playing' && (
        <HUD
          mode={gameMode}
          matchType={matchType}
          profile={profile}
          opponentName={opponentName}
          opponentAvatar={opponentAvatar}
          currentPlayerIndex={hudState.currentPlayerIndex}
          isMyTurn={hudState.isMyTurn}
          playerGroups={hudState.playerGroups}
          balls={hudState.balls}
          statusMessage={hudState.statusMessage}
          isBallInHand={hudState.isBallInHand}
          power={power}
          onPowerChange={handlePowerUpdate}
          onShoot={() => executeShot()}
          onFineAngleAdjust={(delta) => handleAimAngleUpdate(aimAngleRef.current + delta)}
          viewMode={viewMode}
          onViewModeChange={(vm) => {
            setViewMode(vm);
            viewModeRef.current = vm;
            if (sceneRef.current) sceneRef.current.viewMode = vm;
          }}
          onOpenSpinModal={() => setIsSpinModalOpen(true)}
          onOpenShop={() => setIsShopModalOpen(true)}
          onPauseMatch={() => setIsPauseModalOpen(true)}
          targetBallId={targetBallId}
          showBallMarkers={showBallMarkers}
          stakeDisplay={matchStake}
          onSendReaction={(emoji) => {
            if (matchTypeRef.current === 'hotspot_p2p') {
              multiplayer.sendMessage({
                type: 'EMOTE',
                senderId: profileRef.current.id,
                payload: { emoji },
                timestamp: Date.now(),
              });
            }
          }}
          incomingReactionEmoji={incomingReactionEmoji}
          coinDeductionNotice={coinDeductionNotice}
          turnTimeLeft={turnTimeLeft}
        />
      )}

      {/* 4. Match Over Modal */}
      <GameOverModal
        isOpen={screen === 'game_over'}
        isVictory={gameOverDetails.isVictory}
        winnerName={gameOverDetails.winnerName}
        reason={gameOverDetails.reason}
        coinsEarned={gameOverDetails.coinsEarned}
        coinsLost={gameOverDetails.coinsLost}
        xpEarned={gameOverDetails.xpEarned}
        onRematch={() => {
          if (isTournamentMatchRef.current) {
            startNewMatch('8ball', 'ai', aiDifficulty, 0, i18n.getLanguage() === 'ar' ? 'كأس البطولة' : 'Cup Match');
          } else {
            const curCoins = storage.getProfile().coins;
            if (matchStakeAmount > 0 && curCoins < matchStakeAmount) {
              triggerCoinDeductionNotice(
                0,
                i18n.getLanguage() === 'ar' ? 'رصيدك لا يكفي لإعادة نفس الرهان!' : 'Insufficient balance for rematch!'
              );
              setScreen('title');
              return;
            }
            startNewMatch(gameMode, matchType, aiDifficulty, matchStakeAmount, matchStake, opponentName, opponentAvatar, true);
          }
        }}
        onMainMenu={() => {
          clearAiAnimation();
          setScreen('title');
        }}
        tournamentStatus={tournamentGameOverStatus || undefined}
        onOpenTournamentGift={() => setIsTournamentGiftOpen(true)}
        onNextTournamentMatch={() => {
          setScreen('playing');
          setIsTournamentModalOpen(true);
        }}
      />

      {/* 4b. In-Game Pause Menu Modal */}
      <PauseModal
        isOpen={isPauseModalOpen}
        stakeAmount={matchStakeAmount}
        onResume={() => setIsPauseModalOpen(false)}
        onReplay={() => {
          setIsPauseModalOpen(false);
          // Forfeit previous unfinished match first if one was active
          if (!isMatchSettledRef.current && currentMatchIdRef.current) {
            storage.forfeitActiveBet(currentMatchIdRef.current);
            isMatchSettledRef.current = true;
          }

          if (isTournamentMatchRef.current) {
            startNewMatch('8ball', 'ai', aiDifficulty, 0, i18n.getLanguage() === 'ar' ? 'كأس البطولة' : 'Cup Match');
          } else {
            const curCoins = storage.getProfile().coins;
            if (matchStakeAmount > 0 && curCoins < matchStakeAmount) {
              triggerCoinDeductionNotice(
                0,
                i18n.getLanguage() === 'ar' ? 'رصيدك لا يكفي لإعادة نفس الرهان!' : 'Insufficient balance for replay!'
              );
              setScreen('title');
              return;
            }
            startNewMatch(gameMode, matchType, aiDifficulty, matchStakeAmount, matchStake, opponentName, opponentAvatar, true);
          }
        }}
        onExit={() => {
          clearAiAnimation();
          setIsPauseModalOpen(false);
          // Forfeit penalty: Player surrenders mid-match.
          // The stake was already deducted at start. No refund, no double deduction.
          if (!isMatchSettledRef.current && currentMatchIdRef.current) {
            const forfeitRes = storage.forfeitActiveBet(currentMatchIdRef.current);
            isMatchSettledRef.current = true;
            if (forfeitRes.stakeLost > 0) {
              triggerCoinDeductionNotice(
                forfeitRes.stakeLost,
                i18n.getLanguage() === 'ar' 
                  ? `تم سلب مبلغ الرهان بسبب الانسحاب (${forfeitRes.stakeLost.toLocaleString()} كوينز)` 
                  : `Stake forfeited upon match exit: ${forfeitRes.stakeLost.toLocaleString()} Coins`
              );
            }
          }
          const updated = storage.getProfile();
          setProfile(updated);
          profileRef.current = updated;
          if (isTournamentMatchRef.current) {
            isTournamentMatchRef.current = false;
          }
          setScreen('title');
        }}
      />

      {/* 5. Cue Ball Spin Modal */}
      <SpinModal
        isOpen={isSpinModalOpen}
        onClose={() => setIsSpinModalOpen(false)}
        spinOffset={spinOffset}
        onSpinChange={handleSpinUpdate}
      />

      {/* 6. Offline Local Hotspot Multiplayer Modal */}
      <HotspotModal
        isOpen={isHotspotModalOpen}
        onClose={() => setIsHotspotModalOpen(false)}
        onOpenHotspotTournament={() => {
          setIsHotspotModalOpen(false);
          setIsHotspotTournamentOpen(true);
        }}
        onStartHotspotGame={(role, stakeAmount = 0, stakeLabel = '0') => {
          isTournamentMatchRef.current = false;
          startNewMatch('8ball', 'hotspot_p2p', 'normal', stakeAmount, stakeLabel, role === 'host' ? 'Friend (Guest)' : 'Friend (Host)', '📱', true);
        }}
        onStartPassAndPlay={(p1, p2, stakeAmount = 0, stakeLabel = '0') => {
          passPlayNamesRef.current = { p1: p1 || 'Player 1', p2: p2 || 'Player 2' };
          isTournamentMatchRef.current = false;
          startNewMatch('8ball', 'pass_and_play', 'normal', stakeAmount, stakeLabel, p2 || 'Player 2', '🎱', false);
        }}
      />

      {/* 6b. Friends Hotspot Tournament Modal (2 to 4 Players) */}
      <HotspotTournamentModal
        isOpen={isHotspotTournamentOpen}
        onClose={() => setIsHotspotTournamentOpen(false)}
        userProfile={profile}
        tournamentState={hotspotTournamentState}
        onUpdateTournamentState={(st) => setHotspotTournamentState(st)}
        onStartMatch={(p1, p2, matchTitle) => {
          passPlayNamesRef.current = { p1: p1.name, p2: p2.name };
          activeHotspotMatchRef.current = { id: '', p1, p2, title: matchTitle };
          // Find matching bracket match ID
          const matchingM = hotspotTournamentState.matches.find(m => 
            (m.player1.name === p1.name && m.player2.name === p2.name) ||
            (m.player1.id === p1.id && m.player2.id === p2.id)
          );
          if (matchingM) {
            activeHotspotMatchRef.current.id = matchingM.id;
          }
          isTournamentMatchRef.current = false;
          setIsHotspotTournamentOpen(false);
          startNewMatch('8ball', 'pass_and_play', 'normal', 0, matchTitle, p2.name, p2.avatar, false);
        }}
      />

      {/* 7. Tournament Bracket Cup Modal */}
      <TournamentModal
        isOpen={isTournamentModalOpen}
        onClose={() => setIsTournamentModalOpen(false)}
        profile={profile}
        currentRound={tournamentState.currentRound}
        matches={tournamentState.matches}
        onStartTournamentMatch={(oppName, round) => {
          isTournamentMatchRef.current = true;
          setTournamentGameOverStatus(null);
          const diffMap: Record<number, 'easy' | 'normal' | 'pro' | 'legend'> = { 1: 'easy', 2: 'normal', 3: 'normal', 4: 'pro', 5: 'legend' };
          startNewMatch('8ball', 'ai', diffMap[round] || 'normal', 0, i18n.getLanguage() === 'ar' ? 'كأس البطولة' : 'Cup Match', oppName, '🏆', true);
        }}
        onResetTournament={() => {
          const fresh = createNewTournament({ name: profile.name, avatar: profile.avatar, level: profile.level });
          setTournamentState(fresh);
        }}
        onOpenGift={() => setIsTournamentGiftOpen(true)}
      />

      {/* 7b. Tournament Gift Modal ("هدية البطولة") */}
      <TournamentGiftModal
        isOpen={isTournamentGiftOpen}
        onClose={() => setIsTournamentGiftOpen(false)}
        profile={profile}
        onProfileUpdate={(updated) => {
          setProfile(updated);
          profileRef.current = updated;
        }}
        onOpenTournament={() => {
          setIsTournamentGiftOpen(false);
          setIsTournamentModalOpen(true);
        }}
      />

      {/* 8. Pro Shop Modal */}
      <ShopModal
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
        profile={profile}
        onProfileUpdate={(updated) => {
          setProfile(updated);
          profileRef.current = updated;
          const cuesCatalog = storage.getCues();
          const equippedCue = cuesCatalog.find(c => c.id === updated.selectedCueId);
          if (equippedCue && sceneRef.current) sceneRef.current.applyCueItem(equippedCue);
        }}
        onTableChange={(table) => {
          if (sceneRef.current) sceneRef.current.applyTableSkin(table);
        }}
      />

      {/* 9. Player Career Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onProfileUpdate={(updated) => {
          setProfile(updated);
          profileRef.current = updated;
        }}
      />

      {/* 10. Random Opponent Slots Matchmaking Modal */}
      <MatchmakingModal
        isOpen={isMatchmakingOpen}
        onClose={() => setIsMatchmakingOpen(false)}
        userProfile={profile}
        onConfirmOpponent={(opp, stakeLabel, stakeAmount) => {
          setIsMatchmakingOpen(false);
          isTournamentMatchRef.current = false;
          startNewMatch('8ball', 'ai', opp.difficulty, stakeAmount, stakeLabel, opp.nameAr, opp.avatar, true);
        }}
      />

      {/* 11. Cartoon Character Avatar Thumbnail Picker */}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        profile={profile}
        onProfileUpdate={(updated) => {
          setProfile(updated);
          profileRef.current = updated;
        }}
      />

      {/* 12. 7-Second Opening Poster / Splash Screen */}
      {showSplash && (
        <SplashScreen
          durationSeconds={7}
          onComplete={() => setShowSplash(false)}
        />
      )}
    </div>
  );
}
