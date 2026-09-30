import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app } from './firebaseConfig';

const db = getFirestore(app);

export const getDestinations = async () => {
  const snapshot = await getDocs(
    collection(db, 'destinations')
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};