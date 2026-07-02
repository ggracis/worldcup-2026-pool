import { use } from 'react';
import { AllPredictionsContext } from '../context/AllPredictionsContext';

export const useAllPredictions = () => use(AllPredictionsContext);
