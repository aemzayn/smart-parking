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
    this.carLocationInfoEl = document.querySelector('.car-location')
    this.goalState = []
    this.initialState = []

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
    this.carNumberInput = document.getElementById('car-number')
    this.depthInfo = document.querySelector('.depth')
    this.iterationInfo = document.querySelector('.iteration')

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
        park.changeParkingSizeEventListener(this)
      })
    )

    // place randomly generated cars to supposed place based on exit time
    this.placeCarsBtn.addEventListener('click', () => {
      this.placeCarsBtn.disabled = true
      this.placeCarsBtn.innerText = 'Loading...'
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
        this.removeCarEventListener(el, row, col)
      } else {
        // add car
        let car = this.createCarInRowCol(row, col, true)
        if (car) el.appendChild(car)
        this.cost = this.modify2DArray(this.cost, row, col, 2)
      }
    } else {
      const carNode = this.cells[row][col]
      this.carExitTimeInfoEl.innerText = carNode.exitTime
      this.carLocationInfoEl.innerText = `(${row}, ${col})`
    }
  }

  /**
   * Create HTML Img element
   * @param {number} row
   * @param {number} col
   * @returns {Element} image element
   */
  createCarInRowCol(row, col, appendNode = false) {
    if (row === this.width - 1 && col === 0) {
      alert('Cannot place car on exit.')
      return
    }

    let el = document.createElement('img'),
      carType

    if (!this.isTargetPlaced) {
      el.src = './images/red-car.png'
      this.board = this.modify2DArray(this.board, row, col, 'T')
      this.isTargetPlaced = true
      this.startKey = `${row}x${col}`
      this.startPos = { row, col }
      carType = TYPES.TARGET_CAR
    } else {
      this.board = this.modify2DArray(this.board, row, col, 'X')
      el.src = './images/blue-car.png'

      carType = TYPES.OTHER_CARS
    }

    if (appendNode) {
      const oldNode = this.cells[row][col]
      const newNode = new Node(carType, oldNode.row, oldNode.col)
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
  removeCarEventListener(el, row, col) {
    let car = this.board[row][col]
    if (car === 'T') this.isTargetPlaced = false
    this.board = this.modify2DArray(this.board, row, col, '')
    el.children[0]?.remove()

    const oldNode = this.cells[row][col]
    const newNode = new Node(TYPES.OPEN_SPACE, oldNode.row, oldNode.col)
    this.cells = this.modify2DArray(this.cells, row, col, newNode)
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
    const numOfCars = parseInt(this.carNumberInput.value) || this.width - 1
    const carKeys = []

    if (numOfCars > Math.pow(this.width, 2) - 1) {
      alert(`Maximum number of cars is : ${Math.pow(this.width, 2) - 1}`)
      this.carNumberInput.value = this.width - 1
      return
    }

    // empty the boards
    this.resetArrays()
    this.isTargetPlaced = false
    this.childEl.forEach((el) => {
      if (el.children.length > 0) {
        for (const child of el.children) {
          child.remove()
        }
      }
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

    /** @type {Array<Node>} */
    let cars = []
    carKeys.forEach((key, i) => {
      const [row, col] = key.split('x').map(Number)
      const id = i === 0 ? 'T' : 'X'
      this.board = this.modify2DArray(this.board, row, col, id)
      const node = new Node(id, row, col)
      cars.push(node)
    })

    const randomizedCarsPosition = this.getRandomizedInitialState(cars)

    randomizedCarsPosition.forEach((val, index) => {
      const isCar = typeof val === 'number'
      if (isCar) {
        const car = cars.find((node) => node.exitTime === val)
        const row = Math.floor(index / this.width)
        const col = index % this.width
        car.row = row
        car.col = col
        car.key = `${row}x${col}`
        this.cells = this.modify2DArray(this.cells, row, col, car)
      }
    })

    this.cells.forEach((rows, row) => {
      rows.forEach((node, col) => {
        // add car
        if (CARS.includes(node.type)) {
          const el = this.getElementByRowCol(row, col)
          const car = this.createCarInRowCol(row, col)
          if (car) {
            el.appendChild(car)
          }
        }
      })
    })
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
          const alphabet = ((i % 26) + 9).toString(36).repeat(Math.ceil(i / 26))
          alphabets.push(alphabet)
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

    path.reverse().forEach((node) => {
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

  /**
   * Check if puzzle is solvable
   * @param {Array<string | number>} state
   * @param {Array<string | number>} target
   * @returns {boolean}
   */
  isSolvable(state, target) {
    const inversions = {}
    for (let i = 0; i < target.length; i++) {
      inversions[target[i]] = 0
      for (let j = 0; j < target.length; j++) {
        // if
      }
    }
  }

  /**
   * Find solution for traditional parking and returns shuffled array
   * @param {Array<Node>} cars List of cars
   * @returns {Array<string | number>} Shuffled array
   */
  getRandomizedInitialState(cars) {
    // random place cars put in board
    const carsByExitTime = cars.slice().sort((a, b) => {
      if (a.exitTime < b.exitTime) return -1
      else if (a.exitTime > b.exitTime) return 1
      else return 0
    })

    const goal = this.create2dArray(this.width)

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
          const targetKey = `${row}x${col}`
          if (current.key !== targetKey) frontier.push(current)
          goal[row][col] = current
        } else {
          break
        }
      }
    }

    // from board find find best place
    const goalState = this.fill2dArray(goal, true)
    this.goalState = goalState

    // shuffle
    const states = {}
    states[goalState.join('')] = true
    const g = new Game({ state: goalState, dim: this.width })

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
    let randomizeState = randomNextState(goalState)
    let i = 1

    while (i < iteration) {
      randomizeState = randomNextState(randomizeState)
      i++
    }

    this.initialState = randomizeState
    return randomizeState
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
    const carsByExitTime = this.filterCell(this.cells).sort((a, b) => {
      if (a.exitTime < b.exitTime) return -1
      else if (a.exitTime > b.exitTime) return 1
      else return 0
    })

    const carsTarget = {}
    const goal = this.create2dArray(this.width)

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
          goal[row][col] = current
        } else {
          break
        }
      }
    }

    const initialState = this.initialState
    const goalState = this.goalState

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

    search({
      node: initialNode,
      iterationLimit: 10000,
      depthLimit: 0,
      callback: async (err, options) => {
        if (err) {
          console.error(err)
          return
        }

        this.placeCarsBtn.disabled = false
        this.placeCarsBtn.innerText = 'Place'

        const { moves, depth, iteration } = this.searchCallback(options)

        this.depthInfo.innerText = depth
        this.iterationInfo.innerText = iteration

        document.querySelectorAll('#parking-lot img').forEach((img) => {
          img.classList.add('moving')
        })

        const imgEl = {}

        let frontier = moves.slice(0).reverse() // reverse because pop remove from the last element
        while (frontier.length !== 0) {
          const move = frontier.pop()
          const { from, id } = move

          let imgSelector

          if (imgEl.hasOwnProperty(id)) {
            imgSelector = imgEl[id].selector
          } else {
            imgSelector = `[data-row="${from[0]}"][data-col="${from[1]}"] img`
            imgEl[id] = { selector: imgSelector, x: 0, y: 0 }
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
          })

          imgEl[id].x = x
          imgEl[id].y = y

          await sleep(0.5)
        }
      },
    })
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
  }

  async placePuzzle() {
    this.placeCarsBtn.disabled = false
    this.placeCarsBtn.innerText = 'Place'
  }

  async solvePuzzle() {}
}
