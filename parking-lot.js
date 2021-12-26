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
    this.row = row
    this.col = col
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
    this.isPuzzleSystem = false

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
    this.sizeBtns = document.querySelectorAll('.sizes-button')
    this.sizeInfo = document.getElementById('size-info')

    /* ---- Place the cars nodes ---- */
    // TODO: change into randomize function
    // this.placeCars()
    this.randomize()

    /* ---- Event listener ---- */

    // Manually append cars TODO: Move into seperate function
    this.childEl.forEach(function (lot) {
      lot.addEventListener('click', function () {
        park.clickToAddCarEventListener(this)
      })
    })

    // Change the system type
    this.systemBtns.forEach((btn) =>
      btn.addEventListener('click', function () {
        park.changeSystemBtnEventListener(this)
      })
    )

    // Put cars in random place
    this.randomizeBtn.addEventListener('click', () => this.randomize())

    // Solve the maze
    this.startBtn.addEventListener('click', () => {
      if (this.isPuzzleSystem) {
        this.solvePuzzle()
      } else {
        this.solveTraditional()
      }
    })

    // change size of the parking lot
    this.sizeBtns.forEach((btn) =>
      btn.addEventListener('click', function () {
        park.changeSizeEventListener(this, park)
      })
    )
  }

  /**
   * @param {object} buttonEL Button HTML element
   */
  changeSystemBtnEventListener(buttonEL) {
    const systemType = buttonEL.dataset.sys
    const isPuzzleSystem = systemType === 'puzzle' ? true : false
    this.isPuzzleSystem = isPuzzleSystem
    this.systemInfo.innerText = isPuzzleSystem ? 'Puzzle' : 'Traditional'
  }

  clickToAddCarEventListener(el) {
    if (this.checkbox.checked) {
      // this.classList.toggle("clicked");
      const { row, col } = el.dataset

      if (el.children && el.children.length > 0) {
        // if there's already a car remove it
        this.cost = this.modify2DArray(this.cost, row, col, 1)
        this.removeCar(el, row, col)
      } else {
        // add car
        let car = this.createCar(row, col)
        if (car) el.appendChild(car)
        this.cost = this.modify2DArray(this.cost, row, col, 2)
      }
    }
  }

  createCar(row, col) {
    // change string into number
    row = +row
    col = +col

    if (row === this.width - 1 && col === 0) {
      alert('Cannot place car on exit.')
      return
    }

    const oldNode = this.cells[row][col]
    let el = document.createElement('img')
    if (!this.isTargetPlaced) {
      el.src = './images/red-car.png'
      this.board = this.modify2DArray(this.board, row, col, 'T')
      this.isTargetPlaced = true
      this.startKey = `${row}x${col}`
      this.startPos = { row, col }

      const newNode = new Node(
        TYPES.TARGET_CAR,
        oldNode.row,
        oldNode.col,
        oldNode.el
      )
      this.cells = this.modify2DArray(this.cells, row, col, newNode)
    } else {
      this.board = this.modify2DArray(this.board, row, col, 'X')
      el.src = './images/blue-car.png'

      const newNode = new Node(
        TYPES.OTHER_CARS,
        oldNode.row,
        oldNode.col,
        oldNode.el
      )
      this.cells = this.modify2DArray(this.cells, row, col, newNode)
    }
    return el
  }

  removeCar(space, row, col) {
    let car = this.board[row][col]
    if (car === 'T') this.isTargetPlaced = false
    this.board = this.modify2DArray(this.board, row, col, '')
    space.children[0]?.remove()

    const oldNode = this.cells[row][col]
    const newNode = new Node(
      TYPES.OPEN_SPACE,
      oldNode.row,
      oldNode.col,
      oldNode.el
    )
    this.cells = this.modify2DArray(this.cells, row, col, newNode)
  }

  /**
   * Append cars to the UI and create node
   */
  placeCars() {
    this.board.forEach((rows, row) => {
      rows.forEach((val, col) => {
        const el = this.getElement(row, col)
        const node = new Node(val || 'O', row, col, el)
        this.cells = this.modify2DArray(this.cells, row, col, node)

        // set cost to 2 for cars
        if (val === 'X' || val === 'T') {
          this.cost = this.modify2DArray(this.cost, row, col, 2)
        }

        // add car
        if (CARS.includes(val)) {
          const car = this.createCar(row, col)
          if (car) {
            el.appendChild(car)
          }
        }
      })
    })
  }

  changeSizeEventListener(el, park) {
    const width = Number(el.dataset.width)
    if (park.width === width) return // don't do anything if already the same width
    park.width = width
    park.targetKey = `${width - 1}x0`

    // remove element
    park.root.innerHTML = ''

    // update css variable
    park.root.style.setProperty('--cells', width)
    park.root.style.setProperty('--width', 80 / width + 'vh')

    park.isTargetPlaced = false

    // add children
    for (let row = 0; row < width; row++) {
      for (let col = 0; col < width; col++) {
        let newEl = document.createElement('div')
        newEl.dataset.row = row
        newEl.dataset.col = col

        newEl.addEventListener('click', function () {
          park.clickToAddCarEventListener(this)
        })
        if (row === width - 1 && col === 0) {
          newEl.classList.add('exit')
        }
        park.root.appendChild(newEl)
      }
    }

    park.childEl = Array.from(park.root.children)

    // update cost and node size
    park.emptyArrays()

    park.sizeInfo.innerText = `${width}x${width}`
  }

  getElement(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
  }

  randomize() {
    // empty the boards
    this.emptyArrays()
    this.isTargetPlaced = false
    this.childEl.forEach((el) => {
      if (el.children.length > 0) {
        for (const child of el.children) {
          child.remove()
        }
      }
    })

    const numOfCars = this.width - 1
    const carKeys = []
    while (carKeys.length < numOfCars) {
      let row = Math.floor(Math.random() * this.width)
      let col = Math.floor(Math.random() * this.width)
      let key = `${row}x${col}`
      if (key === `${this.width - 1}x0`) continue // continue if car keys is in exit
      if (carKeys.includes(key)) continue // if there's same key continue
      carKeys.push(key)
    }

    carKeys.forEach((key, i) => {
      const [row, col] = key.split('x')
      const id = i === 0 ? 'T' : 'X'
      const newBoard = this.modify2DArray(this.board, row, col, id)
      this.board = newBoard
    })

    this.placeCars()
  }

  emptyArrays() {
    let arr = []
    for (let i = 0; i < this.width; i++) {
      let row = []
      for (let j = 0; j < this.width; j++) {
        row.push('')
      }
      arr.push(row)
    }

    this.board = arr.map((a) => a)
    this.cells = arr.map((rows, row) =>
      rows.map((_, col) => {
        const el = this.getElement(row, col)
        const node = new Node(TYPES.OPEN_SPACE, row, col, el)

        return node
      })
    )

    this.cost = arr.map((a) => a.map(() => 1))
  }

  /**
   * Replace the value in the array
   * @param {any[][]} arr
   * @param {int} row
   * @param {int} col
   * @param {any} newVal The new value
   */
  modify2DArray(arr, row, col, newVal) {
    const newArr = arr.map((rows, x) =>
      rows.map((val, y) => {
        if (x === +row && y === +col) {
          return newVal
        }
        return val
      })
    )
    return newArr
  }

  async solvePuzzle() {
    console.log('solving...')
  }

  async solveTraditional() {
    const queue = new PriorityQueue() // Frontier
    const parentForCell = {} // For keeping track parent-child relationship
    const costFromStart = {}
    const costToTarget = {}
    const [tRow, tCol] = this.targetKey.split('x')
    const [startRow, startCol] = this.startKey.split('x')

    parentForCell[this.startKey] = {
      parentKey: this.startKey,
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
            parentKey: currentKey,
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

    while (current.key !== this.startKey && !!parentForCell[currentKey]) {
      path.push(current)
      const { parentKey, cell } = parentForCell[currentKey]
      currentKey = parentKey
      current = cell
    }

    path.forEach((cell) => {
      cell.el.classList.add('path')
    })

    const exploredNodes = Object.keys(parentForCell).length
    this.nodeInfoEl.innerText = `Nodes explored: ${exploredNodes}`
  }
}
