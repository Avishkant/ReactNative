// Minimal Firestore client adapter scaffold.
// NOTE: Install firebase in the RN app and provide web config credentials before using.
// npm install firebase

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  collection,
  getDoc,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from 'firebase/functions';

let app, auth, db, functions;

export function initFirebase(config) {
  if (!app) {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
  }
  return { app, auth, db, functions };
}

// Connect to local Firebase emulators (call after initFirebase)
export function useEmulator(
  options = {
    host: 'localhost',
    firestorePort: 8080,
    functionsPort: 5001,
    authPort: 9099,
  },
) {
  if (!app || !auth || !db || !functions)
    throw new Error('Firebase not initialized');
  const { host, firestorePort, functionsPort, authPort } = options;
  connectFirestoreEmulator(db, host, firestorePort);
  connectFunctionsEmulator(functions, host, functionsPort);
  try {
    connectAuthEmulator(auth, `http://${host}:${authPort}`);
  } catch (e) {
    // ignore if auth emulator not available
  }
}

export async function signInAnon() {
  if (!auth) throw new Error('Firebase not initialized');
  const userCred = await signInAnonymously(auth);
  return userCred.user;
}

export function listenRoom(roomId, onUpdate) {
  if (!db) throw new Error('Firebase not initialized');
  const ref = doc(db, 'rooms', roomId);
  return onSnapshot(ref, snap => {
    if (!snap.exists()) onUpdate(null);
    else onUpdate(snap.data());
  });
}

export async function uploadTicket(roomId, playerId, ticket) {
  if (!db) throw new Error('Firebase not initialized');
  const ref = doc(db, 'rooms', roomId);
  // ensure room exists (caller should create room separately)
  await setDoc(
    doc(db, 'rooms', roomId),
    { updatedAt: new Date() },
    { merge: true },
  );
  await setDoc(doc(db, 'rooms', roomId, 'tickets', playerId), { ticket });
}

export function useCallDraw() {
  if (!functions) throw new Error('Firebase not initialized');
  const drawFn = httpsCallable(functions, 'draw');
  return async roomId => {
    const res = await drawFn({ roomId });
    return res.data;
  };
}

export function useCallClaim() {
  if (!functions) throw new Error('Firebase not initialized');
  const claimFn = httpsCallable(functions, 'claim');
  return async ({ roomId, playerId, claimType, rowIndex }) => {
    const res = await claimFn({ roomId, playerId, claimType, rowIndex });
    return res.data;
  };
}

export function useCreateRoom() {
  if (!functions) throw new Error('Firebase not initialized');
  const createFn = httpsCallable(functions, 'createRoom');
  return async roomId => {
    const res = await createFn({ roomId });
    return res.data;
  };
}
