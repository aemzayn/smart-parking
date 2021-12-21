const CARS = ['T', 'X']

export default class ParkingLot {
  constructor() {
    let parking = this // for scoping
    this.isTargetPlaced = false //
    this.board = [
      ['', '', '', 'T'],
      ['', '', '', 'X'],
      ['', '', '', ''],
      ['', '', '', ''],
    ]
    this.checkbox = document.getElementById('checkbox')

    // Root element
    this.root = document.getElementById('parking-lot')

    // Children element
    this.child = Array.from(this.root.children)

    // Place the cars
    this.board.forEach((row, x) => {
      row.forEach((col, y) => {
        if (CARS.includes(col)) {
          let slot = this.child.find(
            ({ dataset }) => +dataset.row === x && +dataset.col === y
          )
          let car = this.createCar(x, y)
          if (car) {
            slot.appendChild(car)
          }
        }
      })
    })

    this.child.forEach(function (lot) {
      lot.addEventListener('click', function () {
        if (parent.checkbox.checked) {
          // this.classList.toggle("clicked");
          const { row, col } = this.dataset

          // add car
          if (this.children && this.children.length > 0) {
            parking.removeCar(this, row, col)
          } else {
            let car = parking.createCar(row, col)
            if (car) {
              this.appendChild(car)
            }
          }
        }
      })
    })
  }

  removeCar(space, row, col) {
    let car = this.board[row][col]
    if (car === 'T') this.isTargetPlaced = false
    this.board[row][col] = ''
    space.children[0].remove()
  }

  findCar(row, col) {
    return this.child.find(
      ({ dataset }) => +dataset.row === row && +dataset.col === col
    )
  }

  createCar(row, col) {
    if (+row === 3 && +col === 0) {
      alert('Cannot place car on exit.')
      return
    }

    let el = document.createElement('img')
    if (!this.isTargetPlaced) {
      el.src = './images/red-car.png'
      this.board[row][col] = 'T'
      this.isTargetPlaced = true
    } else {
      this.board[row][col] = 'X'
      el.src = './images/blue-car.png'
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

  /**
   * Return iterator of next possible moves
   */
  moves() {
    // let board = this.board
  }
}
