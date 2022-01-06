import PriorityQueue from './priority-queue.js'
import Node from './node.js'
import TYPES from './types.js'
import { pause, sleep } from './clock.js'
import Game from './game.js'
import { search } from './search.js'
import Node2 from './node2.js'

/**
 * @typedef {import ('./search').Options} Options
 */

const CARS = ['T', 'X']

export default class ParkingLot {
  constructor() {
    const park = this // for scoping
    this.isTargetPlaced = false
    this.startKey = ''
    this.targetKey = '2x0'
    this.startPos = { row: -1, col: -1 }
    this.nodeInfoEl = document.getElementById('node-info')
    this.width = 3
    this.isPuzzleSystem = false
    this.carExitTimeInfoEl = document.querySelector('.car-info')

    // maximum capacity of traditional parking
    this.maxTraditionalCap = 7

    /* ---- Default cells ---- */
    this.board = this.create2dArray(this.width)

    /** @type {number} cose */
    this.cost = this.create2dArray(this.width, 1)

    /** @type {Array<Array<Node>>} */
    this.cells = this.create2dArray(this.width)

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
    this.randomize()

    /* ---- Event listener ---- */

    // Manually append cars
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

    // Solve the exit car
    this.startBtn.addEventListener('click', () => {
      if (this.isPuzzleSystem) {
        this.solvePuzzle(this.startKey)
      } else {
        this.solveTraditional(this.startKey, this.targetKey)
      }
    })

    // change size of the parking lot
    this.sizeBtns.forEach((btn) =>
      btn.addEventListener('click', function () {
        park.changeSizeEventListener(this)
      })
    )

    // place randomly generated cars to supposed place based on exit time
    this.placeCarsBtn.addEventListener('click', () => {
      if (this.isPuzzleSystem) {
        this.placePuzzle()
      } else {
        this.placeTraditional()
      }
    })
  }

  /**
   * Change the system type
   * @param {Element} el HTML button element
   */
  changeSystemBtnEventListener(el) {
    const systemType = el.dataset.sys
    const isPuzzleSystem = systemType === 'puzzle' ? true : false
    this.isPuzzleSystem = isPuzzleSystem
    this.systemInfo.innerText = isPuzzleSystem ? 'Puzzle' : 'Traditional'
  }

  /**
   * Add car to UI
   * @param {Element} el HTML button element
   */
  clickToAddCarEventListener(el) {
    const row = Number(el.dataset.row)
    const col = Number(el.dataset.col)
    if (this.checkbox.checked) {
      // this.classList.toggle("clicked");

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
    } else {
      const carNode = this.cells[row][col]
      this.carExitTimeInfoEl.innerText = carNode.exitTime
    }
  }

  /**
   * Create HTML Img element
   * @param {number} row
   * @param {number} col
   * @returns {Element} image element
   */
  createCar(row, col) {
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

  /**
   * Remove car inside div element
   * @param {Element} el HTML element
   * @param {number} row
   * @param {number} col
   */
  removeCar(el, row, col) {
    let car = this.board[row][col]
    if (car === 'T') this.isTargetPlaced = false
    this.board = this.modify2DArray(this.board, row, col, '')
    el.children[0]?.remove()

    const oldNode = this.cells[row][col]
    const newNode = new Node(
      TYPES.OPEN_SPACE,
      oldNode.row,
      oldNode.col,
      oldNode.el
    )
    this.cells = this.modify2DArray(this.cells, row, col, newNode)
  }

  /** Append cars to the UI and create node */
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

  /**
   * Change board size
   * @param {Element} el HTML button element
   */
  changeSizeEventListener(el) {
    const width = Number(el.dataset.width)
    if (this.width === width) return // don't do anything if already the same width
    this.width = width
    this.targetKey = `${width - 1}x0`

    switch (width) {
      case 4:
        this.maxTraditionalCap = 7
        break
      case 5:
        this.maxTraditionalCap = 13
        break
      case 6:
        this.maxTraditionalCap = 21
        break
      case 7:
        this.maxTraditionalCap = 25
        break
      case 8:
        this.maxTraditionalCap = 36
        break
      default:
        break
    }

    // remove element
    this.root.innerHTML = ''

    // update css variable
    this.root.style.setProperty('--cells', width)
    this.root.style.setProperty('--width', 80 / width + 'vh')

    this.isTargetPlaced = false

    // add children
    const root = this
    for (let row = 0; row < width; row++) {
      for (let col = 0; col < width; col++) {
        let newEl = document.createElement('div')
        newEl.dataset.row = row
        newEl.dataset.col = col

        newEl.addEventListener('click', function () {
          root.clickToAddCarEventListener(this)
        })
        if (row === width - 1 && col === 0) {
          newEl.classList.add('exit')
        }
        this.root.appendChild(newEl)
      }
    }

    this.childEl = Array.from(this.root.children)

    // update cost and node size
    this.emptyArrays()

    this.sizeInfo.innerText = `${width}x${width}`
  }

  /**
   * Return correspending HTML element based on data-row and data-col
   * @param {number} row
   * @param {number} col
   * @returns {Element}
   */
  getElement(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
  }

  /** Put random cars in random position */
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

  /**  Format board, cells and cost into its default state based on width */
  emptyArrays() {
    const empty2dArray = this.create2dArray(this.width)
    this.board = empty2dArray.slice(0)
    this.cost = this.create2dArray(this.width, 1)

    this.cells = empty2dArray.map((rows, row) =>
      rows.map((_, col) => {
        const el = this.getElement(row, col)
        const node = new Node(TYPES.OPEN_SPACE, row, col, el)
        return node
      })
    )
  }

  /**
   * Replace the value in the array
   * @param {Array<Array<any>>} arr The array that will be modified
   * @param {number} row
   * @param {number} col
   * @param {any} newVal The new value
   * @returns {Array<Array<any>>} New array
   */
  modify2DArray(arr, row, col, newVal) {
    if (!Array.isArray(arr) || !Array.isArray(arr[0])) return arr
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

  /**
   * Flat board into one dimensional array
   * @param {Array<Array<Node>>} board
   * @returns {Array<Node>}
   */
  flattenedBoard(board) {
    const ret = []
    for (let x = 0; x < board.length; x++) {
      for (let y = 0; y < board[x].length; y++) {
        if (board[x][y].exitTime !== 0) {
          ret.push(board[x][y])
        }
      }
    }
    return ret
  }

  /**
   * Create 2d array based on given dimension
   * @param {number} dimension Width and height of the array
   * @param {any} fill Store value in the array
   * @returns {Array<Array<any>>} New array
   */
  create2dArray(dimension, fill = null) {
    const ret = []
    for (let i = 0; i < dimension; i++) {
      const row = []
      for (let j = 0; j < dimension; j++) {
        if (fill) {
          row.push(fill)
        } else {
          row.push('')
        }
      }
      ret.push(row)
    }
    return ret
  }

  /**
   * Fill empty 2d array with alphabet
   * @param {Array<Array<Node>>} array 2d array
   * @param {boolean} flat Flat the array
   * @returns {Array<Array<Node>> | Array<Node>}
   */
  fill2dArray(array, flat = false) {
    let result = array.slice()
    let i = 1
    for (let row = 0; row < result.length; row++) {
      for (let col = 0; col < result[row].length; col++) {
        if (row === result.length - 1 && col === 0) {
          result = this.modify2DArray(result, row, col, '_')
          continue
        }

        if (
          !result[row][col] ||
          (typeof result[row][col] === 'object' &&
            result[row][col].exitTime === 0)
        ) {
          const alphabet = (i + 9).toString(36)
          result = this.modify2DArray(result, row, col, alphabet)
          i++
          continue
        }

        if (typeof result[row][col] === 'object') {
          result = this.modify2DArray(
            result,
            row,
            col,
            result[row][col].exitTime
          )
        }
      }
    }
    if (flat) return result.flat()
    return result
  }

  async placeTraditional() {
    const carsByExitTime = this.flattenedBoard(this.cells).sort((a, b) => {
      if (a.exitTime < b.exitTime) return -1
      else if (a.exitTime > b.exitTime) return 1
      else return 0
    })

    const carsTarget = {}
    const ret = this.create2dArray(this.width)

    const frontier = []
    const width = this.width

    const columnCars = []
    let c = this.width - 1
    while (c >= 0) {
      columnCars.push(c)
      c -= 2
    }

    // Place cars
    for (let col = width - 1; col >= 0; col -= 2) {
      for (let row = 0; row < width; row++) {
        // don't place cars in bottom row except bottom right corner
        if (col < width - 1 && row === width - 1) continue

        // while there's car place it
        if (carsByExitTime.length > 0) {
          const current = carsByExitTime.pop()
          const currentKey = current.key
          const targetKey = `${row}x${col}`
          if (current.key !== targetKey) frontier.push(current)
          carsTarget[currentKey] = targetKey
          ret[row][col] = current
        } else {
          break
        }
      }
    }

    const initialState = this.fill2dArray(this.cells, true)
    const goalState = this.fill2dArray(ret, true)

    console.log(initialState)
    console.log(goalState)

    const dim = this.width

    const game = new Game({
      state: initialState,
      goalState,
      dim,
    })

    const initialNode = new Node2(
      {
        state: game.state,
        dim,
      },
      goalState
    )

    // console.log('Solving...')

    search({
      node: initialNode,
      iterationLimit: 10000,
      depthLimit: 0,
      callback: this.searchCallback,
    })
  }

  /**
   * Search callback for A* algorithm
   * @param {Error} err
   * @param {Options} options
   */
  searchCallback(err, options) {
    if (err) console.error(err)
    else {
      const path = []
      let current = options.node
      while (current) {
        path.push(current)
        current = current.parent
      }

      path.reverse().forEach((n) => n.visualize())
      console.log('Solution found!')
      console.log('Iteration: ', options.iteration)
      console.log('Depth: ', path.length - 1)
    }
  }

  /**
   * A* path finding algorithm
   * @param {string} startKey
   * @param {string} targetKey
   */
  async solveTraditional(startKey, targetKey) {
    const queue = new PriorityQueue() // Frontier
    const parentForCell = {} // For keeping track parent-child relationship
    const costFromStart = {}
    const costToTarget = {}
    const [tRow, tCol] = targetKey.split('x')
    const [startRow, startCol] = startKey.split('x')
    let isSolutionFound = false

    parentForCell[startKey] = {
      parentKey: startKey,
      cell: this.cells[startRow][startCol],
    }
    costFromStart[startKey] = 0

    queue.enqueue(this.startPos, 0)

    while (!queue.isEmpty()) {
      const { row, col } = queue.dequeue().element
      const currentKey = `${row}x${col}`
      const current = this.cells[row][col]

      if (currentKey === targetKey) {
        isSolutionFound = true
        break
      }

      const neighbors = [
        { row: row + 1, col }, // below
        { row, col: col - 1 }, // left
        { row, col: col + 1 }, // right
        { row: row - 1, col }, // top
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

    if (!isSolutionFound) {
      alert('No solution found')
      return
    }

    const path = []
    let currentKey = `${tRow}x${tCol}`
    let current = this.cells[tRow][tCol]

    while (current.key !== startKey && !!parentForCell[currentKey]) {
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

  async placePuzzle() {}

  async solvePuzzle() {}
}
