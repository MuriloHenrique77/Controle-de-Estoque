import { getApp } from '@react-native-firebase/app';
import { getFirestore, type Firestore } from '@react-native-firebase/firestore';

export function obterFirestore(): Firestore {
  return getFirestore(getApp());
}

// Primitivas modulares para os futuros serviços; não executam operações aqui.
export {
  collection,
  doc,
  query,
  where,
  orderBy,
  runTransaction,
  writeBatch,
  onSnapshot,
} from '@react-native-firebase/firestore';

export type {
  CollectionReference,
  DocumentReference,
  Query,
  Transaction,
  WriteBatch,
  Unsubscribe,
} from '@react-native-firebase/firestore';
