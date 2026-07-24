import { usePassenger as usePassengerContext } from '../contexts/PassengerContext';

export const usePassenger = () => {
  return usePassengerContext();
};
