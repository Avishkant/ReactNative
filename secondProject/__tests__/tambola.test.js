import { generateTicket, createDrawBag, checkRowComplete, checkFullHouse } from '../utils/tambola'

test('generateTicket returns 3x9 grid with 15 numbers', () => {
  const ticket = generateTicket()
  expect(ticket.length).toBe(3)
  let count = 0
  for (let r = 0; r < 3; r++) {
    expect(ticket[r].length).toBe(9)
    for (let c = 0; c < 9; c++) {
      if (ticket[r][c] !== null) count++
    }
  }
  expect(count).toBe(15)
})

test('createDrawBag has 90 unique numbers', () => {
  const bag = createDrawBag()
  expect(bag.length).toBe(90)
  const set = new Set(bag)
  expect(set.size).toBe(90)
})

test('checkRowComplete and checkFullHouse basic scenario', () => {
  // create a small ticket where all numbers are 1..15 placed sequentially
  const nums = Array.from({ length: 15 }, (_, i) => i + 1)
  const ticket = [
    [1, 2, 3, 4, 5, null, null, null, null],
    [6, 7, 8, 9, 10, null, null, null, null],
    [11, 12, 13, 14, 15, null, null, null, null],
  ]
  const called = new Set([1,2,3,4,5,6,7,8,9,10])
  const rows = checkRowComplete(ticket, called)
  expect(rows).toEqual([true, true, false])
  expect(checkFullHouse(ticket, called)).toBe(false)
  // mark remaining
  for (let i = 11; i <= 15; i++) called.add(i)
  expect(checkFullHouse(ticket, called)).toBe(true)
})
