import PriorityQueue from './priority-queue.js'
import Node from './node.js'
import TYPES, { SOURCES } from './types.js'
import { pause, sleep } from './clock.js'
import Game from './game.js'
import { search } from './search.js'
import Node2 from './node2.js'

/**
 * @typedef {import ('./search').Options} Options
 */

const CARS = ['T', 'X']
const SYS = {
  traditional: 'traditional',
  puzzle: 'puzzle',
  'puzzle-retrieval': 'puzzle-retrieval',
}

export default class ParkingLot {
  constructor() {
    const park = this // for scoping
    this.isTargetPlaced = false
    this.startKey = ''
    this.targetKey = '2x0'
    this.startPos = { row: -1, col: -1 }
    this.width = 3
    this.system =
      window.localStorage.getItem('smart-parking-system') || SYS['puzzle']
    this.isPuzzleSystem = true
    this.isPuzzleRetrieval = false
    this.traditionalPlaceState = []
    this.initialState = []
    this.puzzlePlaceState = []
    this.puzzleExitGoalState = []
    this.startTime = null
    this.finishTime = null

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
    this.carExitTimeInfoEl = document.querySelector('.car-info')
    this.carLocationInfoEl = document.querySelector('.car-location')
    this.startBtn = document.getElementById('retrieve')
    this.checkbox = document.getElementById('checkbox')
    this.randomizeBtn = document.getElementById('randomize')
    this.placeCarsBtn = document.getElementById('place')
    this.systemBtns = document.querySelectorAll('#system button')
    this.systemInfo = document.querySelector('#system span')
    this.sizeBtns = document.querySelectorAll('.sizes-button')
    this.sizeInfo = document.getElementById('size-info')
    this.carNumberInput = document.getElementById('car-number')
    this.depthInfo = document.querySelector('.depth')
    this.iterationInfo = document.querySelector('.iteration')
    this.nodeInfoEl = document.getElementById('node-info')
    this.pathInfo = document.getElementById('path-info')

    this.systemInfo.innerText =
      window.localStorage.getItem('smart-parking-system') || 'Puzzle'

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
      if (this.isPuzzle()) {
        this.solvePuzzle()
      } else {
        this.solveTraditional(this.startKey, this.targetKey)
      }
    })

    // change size of the parking lot
    this.sizeBtns.forEach((btn) =>
      btn.addEventListener('click', function () {
        park.changeParkingSizeEventListener(this)
      })
    )

    // place randomly generated cars to supposed place based on exit time
    this.placeCarsBtn.addEventListener('click', () => {
      if (this.isPuzzle()) {
        this.placePuzzle()
      } else {
        this.placeCarsBtn.disabled = true
        this.placeCarsBtn.innerText = 'Loading...'
        this.placeTraditional()
      }
    })
  }

  isPuzzle() {
    return this.system === SYS.puzzle || this.system === SYS['puzzle-retrieval']
  }

  /**
   * Change the system type
   * @param {Element} el HTML button element
   */
  changeSystemBtnEventListener(el) {
    const systemType = el.dataset.sys
    const system = SYS[systemType]
    const txt = system
      .replace('-', ' ')
      .replace(/\w{3,}/g, (match) =>
        match.replace(/\w/, (m) => m.toUpperCase())
      )

    window.localStorage.setItem('smart-parking-system', system)
    this.system = system
    this.systemInfo.innerText = txt
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
      const node = new Node(TYPES.OPEN_SPACE, row, col)
      let cost = 0

      if (el.children && el.children.length > 0) {
        // if there's already a car remove it
        this.removeCarEventListener(el, row, col)
      } else {
        // add car
        node.type = !this.isTargetPlaced ? TYPES.TARGET_CAR : TYPES.OTHER_CARS
        node.exitTime = node.assignExitTime()
        this.createCarInRowCol(node)
      }

      const type = node.type
      this.cost = this.modify2DArray(this.cost, row, col, cost)
      this.cells = this.modify2DArray(this.cells, row, col, node)
      this.board = this.modify2DArray(this.board, row, col, type)
    } else {
      const carNode = this.cells[row][col]
      this.carExitTimeInfoEl.innerText = carNode.exitTime
      this.carLocationInfoEl.innerText = `(${row}, ${col})`
    }
  }

  /**
   * Create HTML Img element
   * @param {Node} node
   */
  createCarInRowCol(node) {
    const { row, col, type } = node
    if (row === this.width - 1 && col === 0) {
      alert('Cannot place car on exit.')
      return
    }

    const img = document.createElement('img')
    img.src = SOURCES[type]
    this.board = this.modify2DArray(this.board, row, col, type)

    if (type === TYPES.TARGET_CAR) {
      this.isTargetPlaced = true
      this.startKey = `${row}x${col}`
      this.startPos = { row, col }
    }

    this.getElementByRowCol(row, col).appendChild(img)
  }

  /**
   * Remove car inside div element
   * @param {Element} el HTML element
   * @param {number} row
   * @param {number} col
   */
  removeCarEventListener(el, row, col) {
    let carType = this.board[row][col]
    if (carType === TYPES.TARGET_CAR) this.isTargetPlaced = false
    el.innerHTML = ''
  }

  /**
   * Change board size
   * @param {Element} el HTML button element
   */
  changeParkingSizeEventListener(el) {
    const width = Number(el.dataset.width)
    if (this.width === width) return // don't do anything if already the same width
    this.width = width
    this.targetKey = `${width - 1}x0`

    switch (width) {
      case 3:
        this.maxTraditionalCap = 5
        break
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
    this.resetArrays()

    this.sizeInfo.innerText = `${width}x${width}`

    this.randomize()
  }

  /**
   * Return correspending HTML element based on data-row and data-col
   * @param {number} row
   * @param {number} col
   * @returns {Element}
   */
  getElementByRowCol(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
  }

  /** Put random cars in random position */
  randomize() {
    const numOfCars =
      parseInt(this.carNumberInput.value) || this.isPuzzle()
        ? Math.pow(this.width, 2) - 1
        : this.width
    const carKeys = []

    // check inputted car number
    if (numOfCars > Math.pow(this.width, 2) - 1) {
      alert(`Maximum number of cars is : ${Math.pow(this.width, 2) - 1}`)
      this.carNumberInput.value = Math.pow(this.width, 2) - 1
      return
    }

    // empty the boards
    this.resetArrays()
    this.isTargetPlaced = false
    this.childEl.forEach((child) => {
      child.innerHTML = ''
    })

    // Generate random car positions
    while (carKeys.length < numOfCars) {
      let row = Math.floor(Math.random() * this.width)
      let col = Math.floor(Math.random() * this.width)
      let key = `${row}x${col}`
      if (key === `${this.width - 1}x0`) continue // continue if car keys is in exit
      if (carKeys.includes(key)) continue // if there's same key continue
      carKeys.push(key)
    }

    // randomize target car position
    const targetCarPos = Math.floor(Math.random() * carKeys.length)

    // target car always top right corner
    const targetCarInitialPos = [0, this.width - 1]

    /** @type {Array<Node>} */
    let carsNode = []
    carKeys.forEach((key, i) => {
      const [row, col] = key.split('x').map(Number)
      // const id = i === targetCarPos ? 'T' : 'X'
      const id =
        targetCarInitialPos[0] === row && targetCarInitialPos[1] === col
          ? TYPES.TARGET_CAR
          : TYPES.OTHER_CARS
      this.board = this.modify2DArray(this.board, row, col, id)
      const node = new Node(id, row, col) //
      while (carsNode.find((n) => n.exitTime === node.exitTime)) {
        node.exitTime = node.assignExitTime()
      }
      carsNode.push(node)
    })

    const randomizedCarsPosition = this.getRandomizedInitialStateTraditional(
      carsNode.slice(0)
    )

    randomizedCarsPosition.forEach((val, index) => {
      if (val === '_') return
      const car = carsNode.find((node) => node.exitTime === val)
      const row = Math.floor(index / this.width)
      const col = index % this.width
      car.row = row
      car.col = col
      car.key = `${row}x${col}`
      this.cells = this.modify2DArray(this.cells, row, col, car)
    })

    this.cells.forEach((rows) => {
      rows.forEach((node) => {
        // add car
        if (CARS.includes(node.type)) {
          this.createCarInRowCol(node)
        }
      })
    })

    // console.log('initial', this.initialState)
    // console.log('cells', this.cells)
    // console.log('T', this.startPos)
  }

  /**
   * Find solution for traditional parking and returns shuffled array
   * @param {Array<Node>} cars List of cars
   * @returns {Array<string | number>} Shuffled array
   */
  getRandomizedInitialStateTraditional(cars) {
    const width = this.width

    // sort cars by exit time
    const carsByExitTime = cars.sort((a, b) => {
      if (a.exitTime < b.exitTime) return -1
      else if (a.exitTime > b.exitTime) return 1
      else return 0
    })

    let traditionalInitialState = this.create2dArray(width)
    let puzzlePlaceGoal = traditionalInitialState.slice(0)
    let puzzleExitGoal = traditionalInitialState.slice(0)
    let otherCars = carsByExitTime.filter((n) => n.type === TYPES.OTHER_CARS)
    const targetCar = carsByExitTime.find((n) => n.type === TYPES.TARGET_CAR)

    /**
     * Place state for puzzle
     * [2, 5, 8]
     * [1, 4, 7]
     * [_, 3, 6]
     *
     * Retrieval state for puzzle
     * [1, 4, 7]
     * [_, 3, 6]
     * [8, 2, 5]
     */
    const carsPuzzle = carsByExitTime.slice(0)
    for (let col = width - 1; col >= 0; col--) {
      for (let row = 0; row < width; row++) {
        if (carsPuzzle.length > 0) {
          const current = carsPuzzle.pop()
          puzzlePlaceGoal = this.modify2DArray(
            puzzlePlaceGoal,
            row,
            col,
            current
          )
        }

        // Retrieval state for puzzle
        // Just place other cars for now
        if (otherCars.length > 0) {
          const current = otherCars.pop()
          puzzleExitGoal = this.modify2DArray(puzzleExitGoal, row, col, current)
        }
      }
    }

    // Place target car in exit cell in puzzle system
    puzzleExitGoal = this.modify2DArray(puzzleExitGoal, width - 1, 0, targetCar)

    /**
     * Traditional Placement State
     * [2, a, 5]
     * [1, b, 4]
     * [_, c, 3]
     */
    for (let col = width - 1; col >= 0; col -= 2) {
      for (let row = 0; row < width; row++) {
        // don't place cars in bottom row except bottom right corner
        if (col < width - 1 && row === width - 1) continue

        // while there's car place it
        if (carsByExitTime.length > 0) {
          const current = carsByExitTime.pop()
          traditionalInitialState[row][col] = current
        } else {
          break
        }
      }
    }

    // from board find find best place
    const goalState = this.fill2dArray(traditionalInitialState, true)

    // goal states
    this.traditionalPlaceState = goalState
    this.puzzlePlaceState = this.fill2dArray(puzzlePlaceGoal, true)
    this.puzzleExitGoalState = this.fill2dArray(puzzleExitGoal, true)

    // shuffle
    const randomizeState = this.shuffleState(goalState)
    const randomizePuzzle = this.shuffleState(this.puzzlePlaceState)
    const randomizedExitPuzzle = this.shuffleState(this.puzzleExitGoalState)

    const ret = {
      [SYS.puzzle]: randomizePuzzle,
      [SYS.traditional]: randomizeState,
      [SYS['puzzle-retrieval']]: randomizedExitPuzzle,
    }

    this.initialState = ret[this.system]
    return ret[this.system]
  }

  /**  Reset board, cells and cost into its default state based on width */
  resetArrays() {
    const empty2dArray = this.create2dArray(this.width)
    this.board = empty2dArray.slice(0)
    this.cost = this.create2dArray(this.width, 1)

    this.cells = empty2dArray.map((rows, row) =>
      rows.map((_, col) => {
        const node = new Node(TYPES.OPEN_SPACE, row, col)
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
   * Returns only node elements inside cells
   * @param {Array<Array<Node>>} cells
   * @returns {Array<Node>}
   */
  filterCell(cells) {
    const array = []
    for (let x = 0; x < cells.length; x++) {
      for (let y = 0; y < cells[x].length; y++) {
        if (cells[x][y].exitTime !== 0) {
          array.push(cells[x][y])
        }
      }
    }
    return array
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
  fill2dArray(array, flat = false, returnSet = false) {
    let result = array.slice()
    let i = 1
    const alphabets = []
    let moverPlaced = false
    for (let row = 0; row < result.length; row++) {
      for (let col = 0; col < result[row].length; col++) {
        if (typeof result[row][col] === 'object') {
          result = this.modify2DArray(
            result,
            row,
            col,
            result[row][col].exitTime
          )
        } else {
          if (!moverPlaced) {
            result = this.modify2DArray(result, row, col, '_')
            moverPlaced = true
          } else {
            const alphabet = ((i % 26) + 9)
              .toString(36)
              .repeat(Math.ceil(i / 26))
            alphabets.push(alphabet)
            result = this.modify2DArray(result, row, col, alphabet)
            i++
          }
        }
      }
    }

    const ret = []
    if (flat) {
      ret.push(result.flat())
    } else {
      ret.push(result)
    }

    if (returnSet) ret.push(alphabets)
    return ret.length === 1 ? ret[0] : ret
  }

  /**
   * Search callback for A* algorithm
   * @param {Options} options
   */
  searchCallback(options) {
    console.log('Solution found!')
    const getRowCol = (state, dim) => {
      if (!state) return []
      const zeroIndex = state.indexOf('_')
      return [Math.floor(zeroIndex / dim), zeroIndex % dim]
    }

    /** @type {Array<Node2>} */
    const path = []
    let current = options.node

    while (current) {
      path.push(current)
      current = current.parent
    }

    /** @type {Array<{id: string | number, from: Array<number>, to: Array<number>, direction: string}}> } */
    const movesCoordinate = path.reverse().reduce((prev, current, id, arr) => {
      if (id + 1 === arr.length) return prev

      const nextState = arr[id + 1]
      const nextStateIndex = nextState.state.indexOf('_')
      const carId = current.state[nextStateIndex]
      const [cRow, cCol] = getRowCol(current.state, current.dim) // current coordinate
      const [nRow, nCol] = getRowCol(nextState.state, current.dim) // next coordinate
      let action, carMoves

      if (cRow > nRow) {
        action = 'up'
        carMoves = 'down'
      }
      if (cRow < nRow) {
        action = 'down'
        carMoves = 'up'
      }
      if (cCol > nCol) {
        action = 'left'
        carMoves = 'right'
      }
      if (cCol < nCol) {
        action = 'right'
        carMoves = 'left'
      }

      return [
        ...prev,
        {
          id: carId,
          to: [cRow, cCol],
          from: [nRow, nCol],
          direction: carMoves,
        },
      ]
    }, [])

    const moves = movesCoordinate.filter((move) => typeof move.id === 'number')

    path.forEach((node) => {
      // node.visualize()
    })

    return {
      moves,
      iteration: options.iteration,
      depth: path.length - 1,
      path,
    }
  }

  fillWithGivenAlphabet(array, alphabets) {
    function shuffle(arr) {
      let currentIndex = arr.length
      let randomIndex
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--
        ;[arr[currentIndex], arr[randomIndex]] = [
          arr[randomIndex],
          arr[currentIndex],
        ]
      }
      return arr
    }

    alphabets = shuffle(alphabets)

    let ret = []

    for (let i = 0; i < array.length; i++) {
      if (typeof array[i] === 'number' || array[i] === '_') {
        ret.push(array[i])
      } else {
        ret.push(alphabets.pop())
      }
    }

    return ret
  }

  visualize(state, label = null) {
    let board = ''
    for (let i = 0; i < state.length; i += this.width) {
      let row = state.slice(i, i + this.width).join('\t')
      board += row + '\n'
    }

    label && console.log(label)
    console.log(board)
  }

  async placeTraditional() {
    const initialState = this.initialState
    const goalState = this.traditionalPlaceState
    this.search(initialState, goalState)
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

          const dr = Math.round(tRow - nRow)
          const dc = Math.round(tCol - nCol)
          const manhattanDistance = dr + dc
          const Fcost = cost + manhattanDistance

          costToTarget[key] = Fcost

          queue.enqueue(neighbors[i], Fcost)
          this.getElementByRowCol(nRow, nCol).classList.add('explored')
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
    this.pathInfo.innerText = `Path Length: ${path.length}`
  }

  async placePuzzle() {
    const initialState = this.initialState
    const goalState = this.puzzlePlaceState
    this.search(initialState, goalState)
  }

  /**
   * Solve the 8-puzzle
   * @param {Array<number | string>} initialState
   * @param {Array<number | string>} goalState
   */
  async search(initialState, goalState) {
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

    console.log('Solving...')
    this.startTime = performance.now()

    search({
      node: initialNode,
      iterationLimit: 0,
      depthLimit: 0,
      callback: async (err, options) => {
        if (err) {
          console.error(err)
          return
        }
        pause()
        this.finishTime = performance.now()

        this.placeCarsBtn.disabled = false
        this.placeCarsBtn.innerText = 'Place'

        const { moves, depth, iteration } = this.searchCallback(options)

        this.depthInfo.innerText = depth
        this.iterationInfo.innerText = iteration

        document.querySelectorAll('#parking-lot img').forEach((img) => {
          img.classList.add('moving')
        })

        const imgEl = {}
        const posInspector = {}
        let isAllAnimationEnded = false

        let frontier = moves.slice(0).reverse() // reverse because pop remove from the last element
        const carNodes = this.cells.flat().filter((n) => n.exitTime)

        while (frontier.length !== 0) {
          const move = frontier.pop()
          const { from, to, id } = move

          let imgSelector

          if (imgEl.hasOwnProperty(id)) {
            imgSelector = imgEl[id].selector
          } else {
            imgSelector = `[data-row="${from[0]}"][data-col="${from[1]}"] img`
            imgEl[id] = { selector: imgSelector, x: 0, y: 0 }
          }

          if (posInspector.hasOwnProperty(id)) {
            posInspector[id] = {
              ...posInspector[id],
              finalPos: to,
            }
          } else {
            posInspector[id] = {
              id: id,
              startPos: from,
              finalPos: to,
              node: carNodes.find((n) => n.exitTime === +id),
            }
          }

          let x = imgEl[id].x
          let y = imgEl[id].y

          switch (move.direction) {
            case 'up':
              y -= 100
              break
            case 'down':
              y += 100
              break
            case 'left':
              x -= 100
              break
            case 'right':
              x += 100
              break
            default:
              throw new Error(`Unrecognized direction: ${move.direction}`)
          }

          gsap.to(imgSelector, {
            duration: 0.5,
            y: `${y}%`,
            x: `${x}%`,
            ease: 'sine.inOut',
            onComplete: async () => {
              if (frontier.length === 0) {
                console.log('All animation finished')
                isAllAnimationEnded = true
                await sleep(1)
                // this.resetCar(posInspector)

                console.log('time consumed: ', this.finishTime - this.startTime)
              }
            },
          })
          await sleep(1)

          imgEl[id].x = x
          imgEl[id].y = y

          // final position visualize
        }
      },
    })
  }

  /**
   * Change img element to their new position
   */
  resetCar() {
    const initialBoard = this.initialState
    const finalBoard = this.isPuzzleSystem
      ? this.puzzlePlaceState
      : this.traditionalPlaceState
    const cars = initialBoard.filter(Number)

    const getRowCol = (index) => {
      return [Math.floor(index / this.width), index % this.width]
    }

    console.log('initial', initialBoard)
    console.log('final', finalBoard)
    console.log('cars', cars)

    // remove all images
    this.childEl.forEach((c) => (c.innerHTML = ''))

    cars.forEach((car) => {
      const initialIndex = initialBoard.indexOf(car)
      const finalIndex = finalBoard.indexOf(car)
      const [cRow, cCol] = getRowCol(initialIndex)
      const [tRow, tCol] = getRowCol(finalIndex)

      // get node element
      const node = this.cells[cRow][cCol]
      console.log(car, node, { cRow, cCol })
      const type = node.type

      // get element
      const el = this.getElementByRowCol(cRow, cCol)
      const targetEl = this.getElementByRowCol(tRow, tCol)

      // create new image element
      const imgEl = document.createElement('img')
      imgEl.src = SOURCES[type]

      // append the imgEl to the target el
      targetEl.appendChild(imgEl)
    })
  }

  sortCarsByExitTime() {
    return this.filterCell(this.cells).sort((a, b) => {
      if (a.exitTime < b.exitTime) return -1
      else if (a.exitTime > b.exitTime) return 1
      else return 0
    })
  }

  async solvePuzzle() {
    console.log(this.initialState)
    console.log(this.puzzleExitGoalState)
    this.search(this.initialState, this.puzzleExitGoalState)
  }

  shuffleState(initialState) {
    const states = {}
    states[initialState.join('')] = true
    const g = new Game({ state: initialState, dim: this.width })

    const randomNextState = (state) => {
      const choices = Object.values(g.getAvailableActionsAndStates(state))
      const randomIndex = Math.floor(Math.random() * choices.length)
      const randomState = choices[randomIndex]
      const carInBottomLeftCorner =
        typeof randomState[randomState.length - this.width] === 'number'
      if (states[randomState.join('')] || carInBottomLeftCorner)
        return randomNextState(randomState)
      return randomState
    }

    const iteration = 100
    let randomizeState = randomNextState(initialState)
    let i = 1

    while (i < iteration) {
      randomizeState = randomNextState(randomizeState)
      i++
    }

    return randomizeState
  }
}
