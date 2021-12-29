import PriorityQueue from './priority-queue.js'
import { pause, sleep } from './clock.js'

const TYPES = {
  OTHER_CARS: 'X',
  TARGET_CAR: 'T',
  OPEN_SPACE: 'O',
}

class Node {
  constructor(type, row, col, el) {
    this.exitTime = type !== TYPES.OPEN_SPACE ? this.assignExitTime() : 0
    this.type = type
    this.key = `${row}x${col}`
    this.row = row
    this.col = col
    this.el = el
  }

  assignExitTime() {
    return Math.floor(Math.random() * 24)
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

export default class ParkingLot {
  constructor() {
    const park = this // for scoping
    this.isTargetPlaced = false
    this.startKey = ''
    this.targetKey = '3x0'
    this.startPos = { row: -1, col: -1 }
    this.nodeInfoEl = document.getElementById('node-info')
    this.width = 4
    this.isPuzzleSystem = false
    this.carExitTimeInfoEl = document.querySelector('.car-info')

    // maximum capacity of traditional parking
    this.maxTraditionalCap = 7

    /* ---- Default cells ---- */
    this.board = [
      ['', '', '', 'T'],
      ['', '', '', 'X'],
      ['', '', '', ''],
      ['', '', '', ''],
    ]

    /**
     * Store cost
     * @type {number} cose
     */
    this.cost = [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ]

    /**
     * For storring node
     * @type {Array<Array<Node>>}
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
        this.solvePuzzle()
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
        // TODO: puzzle place cars function
      } else {
        this.placeTraditional()
      }
    })
  }

  /**
   * Change the system type
   * @param {Element} el Button HTML element
   */
  changeSystemBtnEventListener(el) {
    const systemType = el.dataset.sys
    const isPuzzleSystem = systemType === 'puzzle' ? true : false
    this.isPuzzleSystem = isPuzzleSystem
    this.systemInfo.innerText = isPuzzleSystem ? 'Puzzle' : 'Traditional'
  }

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

  /**
   * Change board size
   * @param {Element} el HTML element
   * @returns
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

  /**
   * Put random cars in random position
   */
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

  /**
   * Format board, cells and cost into its default state based on width
   */
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
   * @param {Array<Array<any>>} arr
   * @param {number} row
   * @param {number} col
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

  async placeTraditional() {
    const carsByExitTime = this.flattenedBoard(this.cells).sort((a, b) => {
      if (a.exitTime < b.exitTime) return -1
      else if (a.exitTime > b.exitTime) return 1
      else return 0
    })

    const carsTarget = {}
    const ret = [
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
    ]

    // for loop dari row = 0 dan col = reverse dari row, dan row plus 2
    // kalo mobil udah di baris yang biasa gak usah dipindahin lagi
    const frontier = []
    const width = this.width

    const columnCars = []
    let c = this.width - 1
    while (c >= 0) {
      columnCars.push(c)
      c -= 2
    }

    for (let col = width - 1; col >= 0; col -= 2) {
      for (let row = 0; row < width; row++) {
        // don't place cars in bottom row except bottom right corner
        if (col < width - 1 && row === width - 1) continue

        // while there's car place it
        if (carsByExitTime.length > 0) {
          const current = carsByExitTime.pop()
          const currentKey = current.key

          // if cars already in the used line then continue
          if (columnCars.includes(current.col)) {
            if (
              current.col === this.width - 1 &&
              current.row === this.width - 1
            ) {
              // if cars in bottom right corner don't move it
              continue
            } else if (
              // if cars already in used line don't move
              current.col !== this.width - 1 &&
              current.row < this.width - 1
            ) {
              continue
            }
          }

          const targetKey = `${row}x${col}`
          if (current.key !== targetKey) frontier.push(current)
          carsTarget[currentKey] = targetKey
          ret[row][col] = current
        } else {
          break
        }
      }
    }

    console.log('frontier', frontier)
    console.log('carsTarget', carsTarget)

    console.log(frontier)
    // while (frontier.length !== 0) {
    //   const current = frontier.pop()
    //   const targetKey = carsTarget[current.key]
    //   this.solveTraditional(current.key, targetKey)
    //   await sleep(0.2)
    //   document
    //     .querySelectorAll('#parking-lot div')
    //     .forEach((el) => el.classList.remove('path', 'explored'))
    //   await sleep(0.2)
    // }

    // untuk col paling terakhir bisa sampe index = this.width
    // untuk row < row.length - 1 maka cuman nambah mobil sebanyak row.length - 2

    // kumpulin semua mobil
    // setiap mobil
  }

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
}
