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
   * @param {Array<string | number>} state
   * @param {Array<string | number>} goalState
   * @param {number} dim dimention
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

  getAvailableActionsAndStates() {
    let result = {}

    let zeroIndex = this.state.join('').indexOf('_')
    let row = Math.floor(zeroIndex / 3)
    let column = zeroIndex % 3

    if (column > 0) {
      result[this.Actions.LEFT] = this.getNextState(this.Actions.LEFT)
    }
    if (column < 2) {
      result[this.Actions.RIGHT] = this.getNextState(this.Actions.RIGHT)
    }
    if (row > 0) {
      result[this.Actions.UP] = this.getNextState(this.Actions.UP)
    }
    if (row < 2) {
      result[this.Actions.DOWN] = this.getNextState(this.Actions.DOWN)
    }

    return result
  }

  getNextState(action) {
    let zeroIndex = this.state.indexOf('_')
    let newIndex

    // TODO: Update untuk bisa dipake di 4x4
    switch (action) {
      case this.Actions.LEFT:
        newIndex = zeroIndex - 1
        break
      case this.Actions.RIGHT:
        newIndex = zeroIndex + 1
        break
      case this.Actions.UP:
        newIndex = zeroIndex - 3
        break
      case this.Actions.DOWN:
        newIndex = zeroIndex + 3
        break
      default:
        throw new Error('Unexpected action')
    }

    let stateArr = this.state.slice()
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
    let distance = 0

    let oneIndex = this.state.indexOf('1')
    let onePosition = this.indexToRowColumn(oneIndex)
    distance += Math.abs(0 - onePosition.row) + Math.abs(0 - onePosition.column)

    let twoIndex = this.state.indexOf('2')
    let twoPosition = this.indexToRowColumn(twoIndex)
    distance += Math.abs(0 - twoPosition.row) + Math.abs(1 - twoPosition.column)

    let threeIndex = this.state.indexOf('3')
    let threePosition = this.indexToRowColumn(threeIndex)
    distance +=
      Math.abs(0 - threePosition.row) + Math.abs(2 - threePosition.column)

    let fourIndex = this.state.indexOf('4')
    let fourPosition = this.indexToRowColumn(fourIndex)
    distance +=
      Math.abs(1 - fourPosition.row) + Math.abs(0 - fourPosition.column)

    let fiveIndex = this.state.indexOf('5')
    let fivePosition = this.indexToRowColumn(fiveIndex)
    distance +=
      Math.abs(1 - fivePosition.row) + Math.abs(1 - fivePosition.column)

    let sixIndex = this.state.indexOf('6')
    let sixPosition = this.indexToRowColumn(sixIndex)
    distance += Math.abs(1 - sixPosition.row) + Math.abs(2 - sixPosition.column)

    let sevenIndex = this.state.indexOf('7')
    let sevenPosition = this.indexToRowColumn(sevenIndex)
    distance +=
      Math.abs(2 - sevenPosition.row) + Math.abs(0 - sevenPosition.column)

    let eightIndex = this.state.indexOf('8')
    let eightPosition = this.indexToRowColumn(eightIndex)
    distance +=
      Math.abs(2 - eightPosition.row) + Math.abs(1 - eightPosition.column)

    return distance
  }

  indexToRowColumn(index) {
    return {
      row: Math.floor(index / 3),
      column: index % 3,
    }
  }
}
