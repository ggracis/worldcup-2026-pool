import { db } from '../firebase';
import { ref, get, set, onValue, type Unsubscribe } from 'firebase/database';

export interface Prediction {
  homePrediction: number;
  awayPrediction: number;
  points: number;
  updatedAt: number;
}

export interface UserPredictions {
  [gameId: string]: Prediction;
}

export interface AllPredictions {
  [userId: string]: UserPredictions;
}

/**
 * Get all predictions for a user
 */
export const getUserPredictions = async (
  userId: string
): Promise<UserPredictions> => {
  const predictionsRef = ref(db, `predictions/${userId}`);
  const snapshot = await get(predictionsRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as UserPredictions;
};

/**
 * Get a single prediction for a user and game
 */
export const getPrediction = async (
  userId: string,
  gameId: number
): Promise<Prediction | null> => {
  const predictionRef = ref(db, `predictions/${userId}/${gameId}`);
  const snapshot = await get(predictionRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as Prediction;
};

/**
 * Save or update a prediction
 */
export const savePrediction = async (
  userId: string,
  gameId: number,
  homePrediction: number,
  awayPrediction: number
): Promise<void> => {
  const predictionRef = ref(db, `predictions/${userId}/${gameId}`);

  const prediction: Prediction = {
    homePrediction,
    awayPrediction,
    points: 0, // Points will be calculated by Cloud Function
    updatedAt: Date.now(),
  };

  await set(predictionRef, prediction);
};

/**
 * Subscribe to real-time updates for a user's predictions
 */
export const subscribeToPredictions = (
  userId: string,
  callback: (predictions: UserPredictions) => void
): Unsubscribe => {
  const predictionsRef = ref(db, `predictions/${userId}`);

  return onValue(predictionsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as UserPredictions);
    } else {
      callback({});
    }
  });
};

/**
 * Subscribe to ALL users' predictions (read is public).
 * Used to derive cross-user aggregates: daily leaderboard movement and the
 * list of users who nailed each match's exact score.
 */
export const subscribeToAllPredictions = (
  callback: (predictions: AllPredictions) => void
): Unsubscribe => {
  const predictionsRef = ref(db, 'predictions');

  return onValue(
    predictionsRef,
    (snapshot) => {
      callback(snapshot.exists() ? (snapshot.val() as AllPredictions) : {});
    },
    (error) => {
      console.error('[subscribeToAllPredictions] error:', error.message);
      callback({});
    }
  );
};
