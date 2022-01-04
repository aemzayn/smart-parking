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
  const initialState = ['a', 'b', 'c', 91, 66, 'd', '_', 'e', 'f']
  const goalState = ['a', 'b', 'c', 91, 66, 'd', 'e', '_', 'f']

  const dim = 3
  const game = new Game({ state: initialState, goalState, dim })
  const initialNode = new Node2({ state: game.state, dim }, goalState)
  const iterationLimit = 100
  const depthLimit = 0

  search({
    node: initialNode,
    iterationLimit,
    depthLimit,
    callback: searchCallback,
  })
}
