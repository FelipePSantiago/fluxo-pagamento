import { functions } from '@/lib/api/functions';

// Substituição das funções do Firebase Functions para Vercel Functions
export const getExtractDataFromSimulationPdfAction = () => {
    return functions.extractPricing;
};

export const getSavePropertyAction = () => {
    return functions.saveProperty;
};