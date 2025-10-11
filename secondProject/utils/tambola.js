// Simple Tambola utilities: ticket generation and draw management
// Ticket format: 3 rows x 9 columns, 15 numbers placed with typical constraints simplified.
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Generate a single ticket with 15 numbers. This is a simplified generator:
// - pick 15 unique numbers from 1..90, then place them into a 3x9 grid
// - ensure each row has exactly 5 numbers
export function generateTicket() {
  const numbers = shuffle(Array.from({ length: 90 }, (_, i) => i + 1)).slice(0, 15).sort((a, b) => a - b);
  // Create empty 3x9
  const grid = Array.from({ length: 3 }, () => Array(9).fill(null));

  // Fill rows with 5 numbers each, distributing sequentially across columns
  let idx = 0;
  for (let r = 0; r < 3; r++) {
    // pick 5 columns out of 9 for this row
    const cols = shuffle(Array.from({ length: 9 }, (_, i) => i)).slice(0, 5).sort((a, b) => a - b);
    for (const c of cols) {
      grid[r][c] = numbers[idx++];
    }
  }

  return grid; // 3x9 matrix with numbers or null
}

export function createDrawBag() {
  return shuffle(Array.from({ length: 90 }, (_, i) => i + 1));
}

export function drawNext(bag) {
  if (!bag || bag.length === 0) return { next: null, bag: [] };
  const [next, ...rest] = bag;
  return { next, bag: rest };
}

export function isNumberOnTicket(ticket, number) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      if (ticket[r][c] === number) return true;
    }
  }
  return false;
}

export function checkRowComplete(ticket, calledNumbers) {
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
  return rows; // array of booleans for 3 rows
}

export function checkFullHouse(ticket, calledNumbers) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      const val = ticket[r][c];
      if (val !== null && !calledNumbers.has(val)) return false;
    }
  }
  return true;
}

export default { generateTicket, createDrawBag, drawNext, isNumberOnTicket, checkRowComplete, checkFullHouse };
