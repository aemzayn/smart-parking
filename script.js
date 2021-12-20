const CARS = ['T', 'X']

class ParkingLot {
  constructor() {
    let parking = this // for scoping
    this.isTargetPlaced = false //
    this.lot = [
      ['', '', '', 'T'],
      ['', '', '', 'X'],
      ['', '', '', ''],
      ['', '', '', ''],
    ]
    this.checkbox = document.getElementById('checkbox')

    // Root element
    this.el = document.getElementById('parking-lot')

    // Get all the parking spaces
    this.spaces = Array.from(this.el.children)

    // Place the cars
    this.lot.forEach((row, x) => {
      row.forEach((col, y) => {
        if (CARS.includes(col)) {
          let slot = this.spaces.find(
            ({ dataset }) => +dataset.row === x && +dataset.col === y
          )
          let car = this.createCar(x, y)
          if (car) {
            slot.appendChild(car)
          }
        }
      })
    })

    this.spaces.forEach(function (lot) {
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
    let car = this.lot[row][col]
    console.log(car)
    if (car === 'T') this.isTargetPlaced = false
    this.lot[row][col] = ''
    space.children[0].remove()
  }

  findCar(row, col) {
    return this.spaces.find(
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
      this.lot[row][col] = 'T'
      this.isTargetPlaced = true
    } else {
      this.lot[row][col] = 'X'
      el.src = './images/blue-car.png'
    }
    return el
  }

  isSpaceAvailabe(row, col) {
    return !this.lot[row][col]
  }

  /**
   * Return TRUE if the board is in a solved state.
   * @returns {boolean}
   */
  isSolved() {
    return this.lot[3][0] === 'T'
  }

  /**
   * Return iterator of next possible moves
   */
  moves() {
    //
  }
}

const pk = new ParkingLot()

let started = false
let paused = false
let speed = 1000

let hour = 1
let minute = 0

document.getElementById('start-pause').addEventListener('click', function () {
  started = !started
  this.innerText = !started ? 'Start' : 'Pause'
})

function changeTime() {
  if (started) {
    let time = `${hour < 10 ? `0${hour}` : hour}:${
      minute < 10 ? `0${minute}` : minute
    }`
    document.querySelector('#clock').innerText = time

    if (minute + 10 === 60) {
      minute = 0
      hour = hour + 1 > 24 ? 1 : hour + 1
    } else {
      minute += 10
    }
  }
}

let timerInterval = setInterval(changeTime, [speed])

document.querySelectorAll('#time button').forEach((button) =>
  button.addEventListener('click', function () {
    const type = this.id

    switch (type) {
      case 'speeddown':
        if (speed < 2000) {
          clearInterval(timerInterval)
          speed += 100
          timerInterval = setInterval(changeTime, speed)
        }
        break
      case 'speedup':
        if (speed > 500) {
          clearInterval(timerInterval)
          speed -= 100
          timerInterval = setInterval(changeTime, speed)
        }
        break
      default:
        break
    }
    document.getElementById('speed').innerText = speed / 1000 + 's'
  })
)
