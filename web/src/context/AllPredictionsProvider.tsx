import React from 'react';
import {
  subscribeToAllPredictions,
  type AllPredictions,
} from '../services/predictionService';
import { AllPredictionsContext } from './AllPredictionsContext';

export const AllPredictionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [allPredictions, setAllPredictions] =
    React.useState<AllPredictions | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToAllPredictions(setAllPredictions);
    return () => unsubscribe();
  }, []);

  return (
    <AllPredictionsContext value={{ allPredictions }}>
      {children}
    </AllPredictionsContext>
  );
};
