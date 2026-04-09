import { useContext } from 'react';
import { StoreContext } from './store-context';

export const useStore = () => useContext(StoreContext);
