import PriorityQueue from './priority-queue.js'

class Node {
  constructor(row, col) {
    this.key = `${row}x${col}`
  }

  manhattan() {
    return Math.abs(row - 3) + Math.abs(col - 0)
  }
}

export default class Astar {
  constructor() {
    this.board = [
      ['', '', 'X', 'T'],
      ['', '', '', 'X'],
      ['', '', '', ''],
      ['', '', '', ''],
    ]
    this.cost = [
      ['1', '1', '2', '1'],
      ['1', '1', '1', '2'],
      ['1', '1', '1', '1'],
      ['1', '1', '1', '1'],
    ]

    this.startKey = '0x3'

    this.cells = []

    // for (let x = 0; x < this.board.length; x++) {
    //   for (let y = 0; y < x.length; y++) {
    //     const node = new Node(x, y)
    //     // row.push(node)
    //   }
    // }

    this.targetKey = '3x0'
  }

  solve() {
    const frontier = new PriorityQueue()
    const explored = {}
    const parentChild = {}
    const costFromStart = {}
    const [sRow, sCol] = this.startKey.split('x')
    const [tRow, tCol] = this.targetKey.split('x')
    const startPos = { row: sRow, col: sCol }

    costFromStart[this.startKey] = 0

    frontier.enqueue(startPos)

    while (!frontier.isEmpty()) {
      const current = frontier.dequeue()
      const currentKey = `${current.element.row}x${current.element.col}`

      if (currentKey === this.targetKey) {
        // found
        break
      }

      const neigbors = current.getNeighbors()

      for (const { row: nRow, col: nCol } of neigbors) {
        // eliminate invalid neighbors
        if (nRow < 0 || nRow > this.board.length - 1) {
          continue
        }

        if (nCol < 0 || nCol > this.board[nRow].length - 1) {
          continue
        }

        const key = `${nRow}x${nCol}`

        // console.log(key, this.cost[nRow][nCol])

        // n = neighbor
        /**
         * compute f function
         * f(x) = g(x) + h(x)
         * g = cost from start
         * h = cost to target (heuristic in this case manhattan)
         */
        const horizontalDistance = Math.pow(nRow - tRow, 2)
        const verticalDistance = Math.pow(nCol - tCol, 2)
        const h = horizontalDistance + verticalDistance
        //
        // const g = costFromStart[currentKey] + this.cost[]

        // add every neighbor to the frontier
        // console.log(row, col)
      }
    }
  }
}
