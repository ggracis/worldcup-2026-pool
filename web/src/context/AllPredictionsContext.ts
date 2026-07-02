import { createContext } from 'react';
import { type AllPredictions } from '../services/predictionService';

export interface AllPredictionsContextType {
  allPredictions: AllPredictions | null;
}

export const AllPredictionsContext = createContext<AllPredictionsContextType>({
  allPredictions: null,
});
