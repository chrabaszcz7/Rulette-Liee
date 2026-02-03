import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()

// Types
interface Room {
  id: string
  code: string
  hostId: string
  players: RoomPlayer[]
  maxPlayers: number
  status: 'waiting' | 'active' | 'finished'
  createdAt: admin.firestore.Timestamp
  updatedAt: admin.firestore.Timestamp
}

interface RoomPlayer {
  id: string
  nickname: string
  suffix: string
  avatarUrl: string | null
  isHost: boolean
  isAlive: boolean
  isReady: boolean
}

interface Game {
  id: string
  roomId: string
  state: GameState
  chamber: number
  currentRound: number
  rounds: GameRound[]
  alivePlayers: string[]
  winnerId: string | null
  createdAt: admin.firestore.Timestamp
  updatedAt: admin.firestore.Timestamp
}

type GameState = 
  | 'waiting_for_players'
  | 'assigning_roles'
  | 'mission_phase'
  | 'decision_phase'
  | 'roulette_phase'
  | 'eliminated'
  | 'finished'

type Mission = 'TRUTH' | 'LIE'
type RoleBadge = '🐴' | '🎭' | '🐺'

interface GameRound {
  roundNumber: number
  missionPlayerId: string
  decisionPlayerId: string
  mission: Mission
  roleBadge: RoleBadge
  decision: 'TRUTH' | 'LIE' | null
  eliminatedPlayerId: string | null
  rouletteResult: number | null
}

// Helper functions
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomMission(): Mission {
  return Math.random() < 0.5 ? 'TRUTH' : 'LIE'
}

function getRandomRoleBadge(): RoleBadge {
  const badges: RoleBadge[] = ['🐴', '🎭', '🐺']
  return badges[getRandomInt(0, 2)]
}

function selectTwoPlayers(playerIds: string[]): [string, string] {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1]]
}

// Start Game Function
export const startGame = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
    }

    const { roomId } = data
    if (!roomId) {
      throw new functions.https.HttpsError('invalid-argument', 'Room ID is required')
    }

    // Get room
    const roomRef = db.collection('rooms').doc(roomId)
    const roomDoc = await roomRef.get()

    if (!roomDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Room not found')
    }

    const room = { id: roomDoc.id, ...roomDoc.data() } as Room

    // Verify caller is host
    if (room.hostId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Only the host can start the game')
    }

    // Verify room status
    if (room.status !== 'waiting') {
      throw new functions.https.HttpsError('failed-precondition', 'Game already started')
    }

    // Verify minimum players
    if (room.players.length < 2) {
      throw new functions.https.HttpsError('failed-precondition', 'Need at least 2 players')
    }

    // Verify all players ready
    if (!room.players.every(p => p.isReady)) {
      throw new functions.https.HttpsError('failed-precondition', 'Not all players are ready')
    }

    // Create game
    const playerIds = room.players.map(p => p.id)
    const [missionPlayerId, decisionPlayerId] = selectTwoPlayers(playerIds)
    const chamber = getRandomInt(1, 6)

    const gameData: Omit<Game, 'id'> = {
      roomId,
      state: 'mission_phase',
      chamber,
      currentRound: 1,
      rounds: [{
        roundNumber: 1,
        missionPlayerId,
        decisionPlayerId,
        mission: getRandomMission(),
        roleBadge: getRandomRoleBadge(),
        decision: null,
        eliminatedPlayerId: null,
        rouletteResult: null,
      }],
      alivePlayers: playerIds,
      winnerId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    }

    // Use transaction for atomicity
    await db.runTransaction(async (transaction) => {
      // Create game document
      const gameRef = db.collection('games').doc()
      transaction.set(gameRef, gameData)

      // Update room status
      transaction.update(roomRef, {
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    return { success: true }
  })

// Make Decision Function
export const makeDecision = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
    }

    const { gameId, decision } = data
    if (!gameId || !decision) {
      throw new functions.https.HttpsError('invalid-argument', 'Game ID and decision are required')
    }

    if (decision !== 'TRUTH' && decision !== 'LIE') {
      throw new functions.https.HttpsError('invalid-argument', 'Decision must be TRUTH or LIE')
    }

    const gameRef = db.collection('games').doc(gameId)
    const gameDoc = await gameRef.get()

    if (!gameDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Game not found')
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as Game

    // Verify game state
    if (game.state !== 'decision_phase' && game.state !== 'mission_phase') {
      throw new functions.https.HttpsError('failed-precondition', 'Not in decision phase')
    }

    const currentRound = game.rounds[game.rounds.length - 1]

    // Verify caller is decision player
    if (currentRound.decisionPlayerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Only the decision player can make a decision')
    }

    // Process decision
    const isCorrect = decision === currentRound.mission
    let eliminatedPlayerId: string | null = null
    let rouletteResult: number | null = null

    if (!isCorrect) {
      // Wrong decision - decision player faces roulette
      rouletteResult = getRandomInt(1, 6)
      if (rouletteResult === game.chamber) {
        eliminatedPlayerId = currentRound.decisionPlayerId
      }
    } else {
      // Correct decision - mission player faces roulette
      rouletteResult = getRandomInt(1, 6)
      if (rouletteResult === game.chamber) {
        eliminatedPlayerId = currentRound.missionPlayerId
      }
    }

    // Update round
    currentRound.decision = decision
    currentRound.rouletteResult = rouletteResult
    currentRound.eliminatedPlayerId = eliminatedPlayerId

    // Update alive players
    let alivePlayers = [...game.alivePlayers]
    if (eliminatedPlayerId) {
      alivePlayers = alivePlayers.filter(id => id !== eliminatedPlayerId)
    }

    // Determine next state
    let newState: GameState = 'roulette_phase'
    let winnerId: string | null = null

    // Check win condition
    if (alivePlayers.length === 1) {
      newState = 'finished'
      winnerId = alivePlayers[0]
    }

    // Update game
    await gameRef.update({
      state: newState,
      rounds: game.rounds,
      alivePlayers,
      winnerId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // If game finished, update player stats
    if (winnerId) {
      const roomDoc = await db.collection('rooms').doc(game.roomId).get()
      const room = roomDoc.data() as Room

      const batch = db.batch()

      for (const player of room.players) {
        const userRef = db.collection('users').doc(player.id)
        if (player.id === winnerId) {
          batch.update(userRef, {
            wins: admin.firestore.FieldValue.increment(1),
            totalGames: admin.firestore.FieldValue.increment(1),
          })
        } else {
          batch.update(userRef, {
            losses: admin.firestore.FieldValue.increment(1),
            totalGames: admin.firestore.FieldValue.increment(1),
          })
        }
      }

      // Update room status
      batch.update(db.collection('rooms').doc(game.roomId), {
        status: 'finished',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      await batch.commit()
    }

    return { success: true, eliminated: eliminatedPlayerId !== null }
  })

// Spin Roulette / Continue to next round
export const spinRoulette = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
    }

    const { gameId } = data
    if (!gameId) {
      throw new functions.https.HttpsError('invalid-argument', 'Game ID is required')
    }

    const gameRef = db.collection('games').doc(gameId)
    const gameDoc = await gameRef.get()

    if (!gameDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Game not found')
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as Game

    if (game.state !== 'roulette_phase') {
      throw new functions.https.HttpsError('failed-precondition', 'Not in roulette phase')
    }

    // Check if game should end
    if (game.alivePlayers.length <= 1) {
      await gameRef.update({
        state: 'finished',
        winnerId: game.alivePlayers[0] || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      return { success: true, finished: true }
    }

    // Start new round
    const [missionPlayerId, decisionPlayerId] = selectTwoPlayers(game.alivePlayers)
    
    const newRound: GameRound = {
      roundNumber: game.currentRound + 1,
      missionPlayerId,
      decisionPlayerId,
      mission: getRandomMission(),
      roleBadge: getRandomRoleBadge(),
      decision: null,
      eliminatedPlayerId: null,
      rouletteResult: null,
    }

    await gameRef.update({
      state: 'mission_phase',
      currentRound: game.currentRound + 1,
      rounds: admin.firestore.FieldValue.arrayUnion(newRound),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true, finished: false }
  })

// Room Cleanup - Trigger when room document is updated
export const onRoomUpdate = functions
  .region('europe-west1')
  .firestore.document('rooms/{roomId}')
  .onUpdate(async (change, context) => {
    const roomBefore = change.before.data() as Room
    const roomAfter = change.after.data() as Room
    const roomId = context.params.roomId

    // Check if all players left
    if (roomAfter.players.length === 0) {
      // Delete room and associated data
      await cleanupRoom(roomId)
    }

    // Check if room finished and should be cleaned up after some time
    if (roomAfter.status === 'finished' && roomBefore.status !== 'finished') {
      // Schedule cleanup after 5 minutes
      // In production, you might want to use Cloud Tasks or Pub/Sub for delayed execution
      console.log(`Room ${roomId} finished, will be cleaned up`)
    }
  })

// Cleanup helper function
async function cleanupRoom(roomId: string) {
  const batch = db.batch()

  // Delete room
  batch.delete(db.collection('rooms').doc(roomId))

  // Delete messages
  const messagesSnapshot = await db.collection('rooms').doc(roomId).collection('messages').get()
  messagesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref)
  })

  // Delete associated game
  const gamesSnapshot = await db.collection('games').where('roomId', '==', roomId).get()
  gamesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref)
  })

  await batch.commit()
  console.log(`Cleaned up room ${roomId}`)
}

// Scheduled cleanup for old finished rooms (runs daily)
export const scheduledCleanup = functions
  .region('europe-west1')
  .pubsub.schedule('every 24 hours')
  .onRun(async () => {
    const cutoff = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    )

    // Find old finished rooms
    const oldRoomsSnapshot = await db.collection('rooms')
      .where('status', '==', 'finished')
      .where('updatedAt', '<', cutoff)
      .get()

    for (const doc of oldRoomsSnapshot.docs) {
      await cleanupRoom(doc.id)
    }

    // Find empty waiting rooms older than 1 hour
    const emptyRoomsCutoff = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    )

    const emptyRoomsSnapshot = await db.collection('rooms')
      .where('status', '==', 'waiting')
      .where('updatedAt', '<', emptyRoomsCutoff)
      .get()

    for (const doc of emptyRoomsSnapshot.docs) {
      const room = doc.data() as Room
      if (room.players.length === 0) {
        await cleanupRoom(doc.id)
      }
    }

    console.log('Scheduled cleanup completed')
    return null
  })
