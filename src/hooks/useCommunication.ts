import { useCommunication as useCommunicationContext } from '../contexts/CommunicationContext';

export const useCommunication = () => {
  return useCommunicationContext();
};
