const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const {
  generateTicket,
  createDrawBag,
  checkRowComplete,
  checkFullHouse,
} = require('./tambola');

// For legacy compatibility we keep the inline check functions if tambola import fails
function checkRowComplete(ticket, calledSet) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    let complete = true;
    for (let c = 0; c < 9; c++) {
      const val = ticket[r][c];
      if (val !== null && !calledSet.has(val)) {
        complete = false;
        break;
      }
    }
    rows.push(complete);
  }
  return rows;
}

function checkFullHouse(ticket, calledSet) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      const val = ticket[r][c];
      if (val !== null && !calledSet.has(val)) return false;
    }
  }
  return true;
}

exports.draw = functions.https.onCall(async (data, context) => {
  // data: { roomId }
  const { roomId } = data || {};
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated',
    );
  }
  if (!roomId)
    throw new functions.https.HttpsError('invalid-argument', 'roomId required');

  const roomRef = db.collection('rooms').doc(roomId);

  try {
    const result = await db.runTransaction(async tx => {
      const snap = await tx.get(roomRef);
      if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'Room not found');
      }
      const room = snap.data();
      const bag = room.bag || [];
      const called = room.called || [];
      if (!bag || bag.length === 0) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'No more numbers',
        );
      }
      const next = bag[0];
      const newBag = bag.slice(1);
      const newCalled = called.concat(next);
      const updated = {
        bag: newBag,
        called: newCalled,
        last: next,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      tx.update(roomRef, updated);
      return { next, newBagLength: newBag.length, called: newCalled };
    });
    return {
      ok: true,
      next: result.next,
      bagLength: result.newBagLength,
      called: result.called,
    };
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    console.error('draw error', err);
    throw new functions.https.HttpsError(
      'internal',
      err.message || 'internal error',
    );
  }
});

// createRoom: initialize a room with a generated bag and empty called list
exports.createRoom = functions.https.onCall(async (data, context) => {
  // data: { roomId }
  const { roomId } = data || {};
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated',
    );
  }
  if (!roomId)
  00000000000000  throw new functions.https.HttpsError('invalid-argument', 'roomId required');

  const roomRef = db.collection('rooms').doc(roomId);
  try {
    const bag = createDrawBag();
    const roomData = {
      bag,
      called: [],
      last: null,
      players: {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await roomRef.set(roomData);
    return { ok: true };
  } catch (err) {
    console.error('createRoom error', err);
    throw new functions.https.HttpsError(
      'internal',
      err.message || 'internal error',
    );
  }
});

exports.claim = functions.https.onCall(async (data, context) => {
  // data: { roomId, playerId, claimType, rowIndex }
  const { roomId, playerId, claimType, rowIndex } = data || {};
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated',
    );
  }
  if (!roomId || !playerId)
    throw new functions.https.HttpsError(
      'invalid-argument',
      'roomId and playerId required',
    );

  const roomRef = db.collection('rooms').doc(roomId);
  const ticketRef = roomRef.collection('tickets').doc(playerId);

  try {
    const [roomSnap, ticketSnap] = await Promise.all([
      roomRef.get(),
      ticketRef.get(),
    ]);
    if (!roomSnap.exists)
      throw new functions.https.HttpsError('not-found', 'Room not found');
    if (!ticketSnap.exists)
      throw new functions.https.HttpsError(
        'not-found',
        'Ticket not found for player',
      );
    const room = roomSnap.data();
    const ticket = ticketSnap.data().ticket;
    const called = new Set(room.called || []);

    let ok = false;
    if (claimType === 'row') {
      const rows = checkRowComplete(ticket, called);
      ok = !!rows[rowIndex];
    } else if (claimType === 'fullhouse') {
      ok = checkFullHouse(ticket, called);
    }

    // record claim
    const claimRef = roomRef.collection('claims').doc();
    await claimRef.set({
      playerId,
      claimType,
      ok,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok };
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    console.error('claim error', err);
    throw new functions.https.HttpsError(
      'internal',
      err.message || 'internal error',
    );
  }
});
