import ParkingLot from './parking-lot.js'
import setClock from './clock.js'
import Node2 from './node2.js'
import Game from './game.js'
import { search } from './search.js'

function searchCallback(err, options) {
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

window.onload = () => {
  const pk = new ParkingLot()
  setClock()
  const initialState = [2, 8, 5, 6, '_', 3, 1, 4, 7]
  const goalState = [1, 2, 3, 4, 5, 6, 7, 8, '_']

  const dim = 3
  const game = new Game({ state: initialState, goalState, dim })
  const initialNode = new Node2({ state: game.state, dim }, goalState)
  const iterationLimit = 10000
  // console.log('Loading...')
  // search({
  //   node: initialNode,
  //   iterationLimit,
  //   callback: searchCallback,
  // })
}
