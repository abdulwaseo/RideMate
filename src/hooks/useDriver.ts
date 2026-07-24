import { useDriver as useDriverContext } from '../contexts/DriverContext';

export const useDriver = () => {
  return useDriverContext();
};
