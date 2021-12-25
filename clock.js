const clockEl = document.querySelector('#clock')
const speedText = document.getElementById('speed')

const startBtn = document.getElementById('start-pause')
const resetBtn = document.getElementById('reset')
const speedBtns = document.querySelectorAll('button.speed')

let running = false
let speed = 1000
let hour = 0
let minute = 0

export function getSpeed() {
  return speed / 1000
}

export function sleep(secs) {
  return new Promise((resolve) => {
    setTimeout(resolve, secs * speed)
  })
}

export function pause() {
  running = false
}

export function reset() {
  running = false
  startBtn.innerText = 'Start'
  speed = 1000
  hour = 0
  minute = 0
  let time = `${hour < 10 ? `0${hour}` : hour}:${
    minute < 10 ? `0${minute}` : minute
  }`
  clockEl.innerText = time
}

export function start() {
  running = !running
  startBtn.innerText = !running ? 'Start' : 'Pause'
}

export default function setClock() {
  function changeTime() {
    if (running) {
      let time = `${hour < 10 ? `0${hour}` : hour}:${
        minute < 10 ? `0${minute}` : minute
      }`
      clockEl.innerText = time

      if (minute + 10 === 60) {
        minute = 0
        hour = +hour + 1 < 24 ? hour + 1 : 0
      } else {
        minute += 10
      }
    }
  }

  let timerInterval = setInterval(changeTime, [speed])

  /* Event listeners */
  startBtn.addEventListener('click', start)

  resetBtn.addEventListener('click', reset)

  speedBtns.forEach((button) =>
    button.addEventListener('click', function () {
      clearInterval(timerInterval)
      speed = Number(this.dataset.speed) * 1000
      timerInterval = setInterval(changeTime, [speed])
      speedText.innerText = (speed === 1000 ? 1 : 2) + 'x'
    })
  )
}
