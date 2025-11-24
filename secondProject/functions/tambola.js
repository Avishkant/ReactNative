// CommonJS copy of tambola helpers for use inside Cloud Functions

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

function generateTicket() {
  const numbers = shuffle(Array.from({ length: 90 }, (_, i) => i + 1))
    .slice(0, 15)
    .sort((a, b) => a - b);
  const grid = Array.from({ length: 3 }, () => Array(9).fill(null));

  let idx = 0;
  for (let r = 0; r < 3; r++) {
    const cols = shuffle(Array.from({ length: 9 }, (_, i) => i))
      .slice(0, 5)
      .sort((a, b) => a - b);
    for (const c of cols) {
      grid[r][c] = numbers[idx++];
    }
  }

  return grid;
}

function createDrawBag() {
  return shuffle(Array.from({ length: 90 }, (_, i) => i + 1));
}

function isNumberOnTicket(ticket, number) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      if (ticket[r][c] === number) return true;
    }
  }
  return false;
}

function checkRowComplete(ticket, calledNumbers) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    let complete = true;
    for (let c = 0; c < 9; c++) {
      const val = ticket[r][c];
      if (val !== null && !calledNumbers.has(val)) {
        complete = false;
        break;
      }
    }
    rows.push(complete);
  }
  return rows;
}

function checkFullHouse(ticket, calledNumbers) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      const val = ticket[r][c];
      if (val !== null && !calledNumbers.has(val)) return false;
    }
  }
  return true;
}

module.exports = {
  generateTicket,
  createDrawBag,
  drawNext: function (bag) {
    if (!bag || bag.length === 0) return { next: null, bag: [] };
    const [next, ...rest] = bag;
    return { next, bag: rest };
  },
  isNumberOnTicket,
  checkRowComplete,
  checkFullHouse,
};
