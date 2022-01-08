/**
 * @typedef Game
 * @type {object}
 * @property {Array<string | number>} state
 * @property {Array<string | number>} goalState
 * @property {number} dim dimension example: 4 for 4x4 board
 * @property {Object.<string, string>} Actions
 */

/** @type {Game} game */
export default class Game {
  /**
   *
   * @param {{
   *  state: Array<string | number>,
   *  goalState: Array<string | number>,
   *  dim: number
   * }} options
   */
  constructor({ state, goalState, dim }) {
    this.state = state
    this.goalState = goalState
    this.dim = dim
    this.Actions = {
      UP: 'up',
      DOWN: 'down',
      LEFT: 'left',
      RIGHT: 'right',
    }
  }

  getAvailableActionsAndStates(state = this.state) {
    let result = {}

    let zeroIndex = state.indexOf('_')
    let row = Math.floor(zeroIndex / this.dim)
    let column = zeroIndex % this.dim

    if (column > 0) {
      result[this.Actions.LEFT] = this.getNextState(this.Actions.LEFT, state)
    }
    if (column < this.dim - 1) {
      result[this.Actions.RIGHT] = this.getNextState(this.Actions.RIGHT, state)
    }
    if (row > 0) {
      result[this.Actions.UP] = this.getNextState(this.Actions.UP, state)
    }
    if (row < this.dim - 1) {
      result[this.Actions.DOWN] = this.getNextState(this.Actions.DOWN, state)
    }

    return result
  }

  getNextState(action, state) {
    let zeroIndex = state.indexOf('_')
    let newIndex

    switch (action) {
      case this.Actions.LEFT:
        newIndex = zeroIndex - 1
        break
      case this.Actions.RIGHT:
        newIndex = zeroIndex + 1
        break
      case this.Actions.UP:
        newIndex = zeroIndex - this.dim
        break
      case this.Actions.DOWN:
        newIndex = zeroIndex + this.dim
        break
      default:
        throw new Error('Unexpected action')
    }

    let stateArr = state.slice()
    stateArr[zeroIndex] = stateArr[newIndex]
    stateArr[newIndex] = '_'
    return stateArr
  }

  isFinished() {
    return this.goalState.every((val, idx) => val === this.state[idx])
  }

  /**
   * Heuristic function
   * @returns {number} The manhattan distance
   */
  getManhattanDistance() {
    let totalDistance = 0

    for (let i = 0; i < 9; i++) {
      const val = this.state[i]
      const stateIndex = this.state.indexOf(val)
      const goalIndex = this.goalState.indexOf(val)
      const statePos = this.indexToRowColumn(stateIndex)
      const goalPos = this.indexToRowColumn(goalIndex)
      // console.log(val, 'state:', statePos, 'goal:', goalPos)
      const manhattan =
        Math.abs(goalPos.row - statePos.row) +
        Math.abs(goalPos.column - statePos.column)
      totalDistance += manhattan
    }

    return totalDistance
  }

  indexToRowColumn(index) {
    return {
      row: Math.floor(index / this.dim),
      column: index % this.dim,
    }
  }
}
