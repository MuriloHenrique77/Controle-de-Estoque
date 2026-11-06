import { Timestamp } from '@react-native-firebase/firestore';

export function timestampParaDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

export function dateParaTimestamp(data: Date): Timestamp {
  if (!Number.isFinite(data.getTime())) {
    throw new Error('Não é possível persistir uma data inválida.');
  }
  return Timestamp.fromDate(data);
}
