import PriorityQueue from './priority-queue.js'
import { reset, pause, sleep } from './clock.js'

const TYPES = {
  OTHER_CARS: 'X',
  TARGET_CAR: 'T',
  OPEN_SPACE: 'O',
}

class Node {
  constructor(type, row, col, el) {
    this.type = type
    this.x = row
    this.y = col
    this.key = `${row}x${col}`
    this.el = el
  }

  /**
   * @param {Node} other Other node
   * @returns {boolean}
   */
  isEqual(other) {
    return this.key === other.key
  }
}

const CARS = ['T', 'X']
const SYS = {
  traditional: 'traditional',
  puzzle: 'puzzle',
}

export default class ParkingLot {
  constructor() {
    let park = this // for scoping
    this.isTargetPlaced = false
    this.startKey = ''
    this.targetKey = '3x0'
    this.startPos = { row: -1, col: -1 }
    this.nodeInfoEl = document.getElementById('node-info')
    this.width = 4
    this.system = SYS.traditional

    /* ---- Default cells ---- */
    this.board = [
      ['', '', '', 'T'],
      ['', '', '', 'X'],
      ['', '', '', ''],
      ['', '', '', ''],
    ]

    this.cost = [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ]

    /**
     * @type {Node[][]}
     */
    this.cells = [
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
    ]

    /* ---- DOM Elements ---- */
    this.root = document.getElementById('parking-lot')
    this.childEl = Array.from(this.root.children)
    this.startBtn = document.getElementById('start-pause')
    this.checkbox = document.getElementById('checkbox')
    this.randomizeBtn = document.getElementById('randomize')
    this.placeCarsBtn = document.getElementById('place')
    this.systemBtns = document.querySelectorAll('#system button')
    this.systemInfo = document.querySelector('#system span')

    /* ---- Place the cars nodes ---- */
    // TODO: change into randomize function
    this.placeCars()

    /* ---- Event listener ---- */

    // Manually append cars
    this.childEl.forEach(function (lot) {
      lot.addEventListener('click', function () {
        if (parent.checkbox.checked) {
          // this.classList.toggle("clicked");
          const { row, col } = this.dataset

          if (this.children && this.children.length > 0) {
            // if there's already a car remove it
            park.cost[row][col] = 0
            park.removeCar(this, row, col)
          } else {
            // add car
            let car = park.createCar(row, col)
            if (car) this.appendChild(car)
            park.cost[row][col] = 2
          }
        }
      })
    })

    // Change the system type
    this.systemBtns.forEach((btn) =>
      btn.addEventListener('click', function () {
        const systemType = this.dataset.sys
        park.system = SYS[systemType] ?? SYS.traditional
        park.systemInfo.innerText =
          park.system.charAt(0).toUpperCase() +
          park.system.slice(1, park.system.length)
      })
    )

    // Put cars in random place
    this.randomizeBtn.addEventListener('click', () => this.randomize())

    // Solve the maze
    this.startBtn.addEventListener('click', () => {
      this.generatePath()
    })
  }

  removeCar(space, row, col) {
    let car = this.board[row][col]
    if (car === 'T') this.isTargetPlaced = false
    this.board[row][col] = ''
    space.children[0]?.remove()
    this.cells[row][col].type = TYPES.OPEN_SPACE
  }

  defaultBoard() {
    this.board = [
      ['', '', '', 'T'],
      ['', '', '', 'X'],
      ['', '', '', ''],
      ['', '', '', ''],
    ]

    this.cost = [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ]

    /**
     * @type {Node[][]}
     */
    this.cells = [
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
    ]
  }

  createCar(row, col) {
    ;(row = Number(row)), (col = Number(col))
    if (row === 3 && col === 0) {
      alert('Cannot place car on exit.')
      return
    }

    let el = document.createElement('img')
    if (!this.isTargetPlaced) {
      el.src = './images/red-car.png'
      this.board[row][col] = 'T'
      this.isTargetPlaced = true
      this.startKey = `${row}x${col}`
      this.startPos = { row, col }
      this.cells[row][col].type = TYPES.TARGET_CAR
    } else {
      this.board[row][col] = 'X'
      el.src = './images/blue-car.png'
      this.cells[row][col].type = TYPES.OTHER_CARS
    }
    return el
  }

  isSpaceAvailabe(row, col) {
    return !this.board[row][col]
  }

  /**
   * Return TRUE if the board is in a solved state.
   * @returns {boolean}
   */
  isSolved() {
    return this.board[3][0] === 'T'
  }

  async generatePath() {
    const queue = new PriorityQueue() // Frontier
    const parentForCell = {} // For keeping track parent-child relationship
    const costFromStart = {}
    const costToTarget = {}
    const [tRow, tCol] = this.targetKey.split('x')
    const [startRow, startCol] = this.startKey.split('x')

    parentForCell[this.startKey] = {
      key: this.startKey,
      cell: this.cells[startRow][startCol],
    }
    costFromStart[this.startKey] = 0

    queue.enqueue(this.startPos, 0)

    while (!queue.isEmpty()) {
      const { row, col } = queue.dequeue().element
      const currentKey = `${row}x${col}`
      const current = this.cells[row][col]

      if (currentKey === this.targetKey) break

      const neighbors = [
        { row: row - 1, col }, // top
        { row, col: col + 1 }, // right
        { row: row + 1, col }, // below
        { row, col: col - 1 }, // left
      ]

      for (let i = 0; i < neighbors.length; ++i) {
        const nRow = neighbors[i].row
        const nCol = neighbors[i].col

        if (nRow < 0 || nRow > this.board.length - 1) {
          continue
        }

        if (nCol < 0 || nCol > this.board[nRow].length - 1) {
          continue
        }

        if (this.board[nRow][nCol] === TYPES.OTHER_CARS) {
          continue
        }

        const key = `${nRow}x${nCol}`

        const cost = costFromStart[currentKey] + this.cost[nRow][nCol]

        if (!(key in costFromStart) || cost < costFromStart[key]) {
          parentForCell[key] = {
            key: currentKey,
            cell: current,
          }

          costFromStart[key] = cost

          const dr = Math.pow(tRow - nRow, 2)
          const dc = Math.pow(tCol - nCol, 2)
          const manhattanDistance = dr + dc
          const Fcost = cost + manhattanDistance

          costToTarget[key] = Fcost

          queue.enqueue(neighbors[i], Fcost)
          this.getElement(nRow, nCol).classList.add('explored')
          await sleep(0.5)
        }
      }
      await sleep(0.25)
    }
    pause()

    const path = []
    let currentKey = `${tRow}x${tCol}`
    let current = this.cells[tRow][tCol]

    while (
      current &&
      current.key !== this.startKey &&
      parentForCell[currentKey] !== undefined
    ) {
      console.log(current)
      path.push(current)
      const { key, cell } = parentForCell[currentKey]
      currentKey = key
      current = cell
    }

    path.forEach((cell) => {
      cell.el.classList.add('path')
    })

    const exploredNodes = Object.keys(parentForCell).length
    this.nodeInfoEl.innerText = `Nodes explored: ${exploredNodes}`
  }

  getElement(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
  }

  randomize() {
    const numOfCars = this.width - 1 // 3
    const carKeys = []
    while (carKeys.length < numOfCars) {
      let row = Math.floor(Math.random() * (this.width - 0))
      let col = Math.floor(Math.random() * (this.width - 0))
      let key = `${row}x${col}`
      if (key === `${this.width - 1}x0`) continue // continue if car keys is in exit
      if (carKeys.includes(key)) continue // if there's same key continue
      carKeys.push(key)
    }

    // relocate the cars
    this.clearBoard()

    carKeys.forEach((c, i) => {
      let [row, col] = c.split('x')
      let id = i === 1 ? 'T' : 'X'
      this.board[row][col] = id
    })

    this.placeCars()
  }

  /**
   * Append cars to the UI and create node
   */
  placeCars() {
    this.board.forEach((row, x) => {
      row.forEach((col, y) => {
        let el = this.getElement(x, y)
        let node = new Node(col || 'O', x, y, el)
        this.cells[x][y] = node

        // set cost
        if (col === 'X' || col === 'T') {
          this.cost[x][y] = Number(2)
        } else {
          this.cost[x][y] = 1
        }

        // add car
        if (CARS.includes(col)) {
          let car = this.createCar(x, y)
          if (car) {
            el.appendChild(car)
          }
        }
      })
    })
  }

  clearBoard() {
    this.board = [
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
    ]
    this.cells = [
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
    ]
    this.cost = [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ]
    this.isTargetPlaced = false
    this.childEl.forEach((el) => {
      if (el.children.length > 0) {
        for (const child of el.children) {
          child.remove()
        }
      }
    })
  }
}
