export default function setClock() {
  let running = false
  let speed = 1000
  let hour = 0
  let minute = 0

  const clockEl = document.querySelector('#clock')
  const speedText = document.getElementById('speed')

  const startBtn = document.getElementById('start-pause')
  const resetBtn = document.getElementById('reset')
  const speedBtns = document.querySelectorAll('#time button')

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

  startBtn.addEventListener('click', function () {
    running = !running
    this.innerText = !running ? 'Start' : 'Pause'
  })

  resetBtn.addEventListener('click', function () {
    running = false
    startBtn.innerText = 'Start'
    speed = 1000
    hour = 0
    minute = 0
    let time = `${hour < 10 ? `0${hour}` : hour}:${
      minute < 10 ? `0${minute}` : minute
    }`
    clockEl.innerText = time
  })

  speedBtns.forEach((button) =>
    button.addEventListener('click', function () {
      const type = this.id

      switch (type) {
        case 'speeddown':
          if (speed < 2000) {
            clearInterval(timerInterval)
            speed += 100
            timerInterval = setInterval(changeTime, [speed])
          }
          break
        case 'speedup':
          if (speed > 500) {
            clearInterval(timerInterval)
            speed -= 100
            timerInterval = setInterval(changeTime, [speed])
          }
          break
        default:
          break
      }
      speedText.innerText = speed / 1000 + 's'
    })
  )
}
