import ParkingLot from './parking-lot.js'
import setClock from './clock.js'
import Astar from './astar.js'

window.onload = () => {
  const pk = new ParkingLot()
  setClock()
  const astar = new Astar()
  astar.solve()
}
