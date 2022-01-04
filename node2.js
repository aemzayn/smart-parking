import Game from './game.js'

/**
 * Node2 used in search algorithm
 * @typedef Node2
 * @type {object}
 * @property {Array<string|number>} state
 * @property {Array<string|number>} goalState
 * @property {Node2} parent
 * @property {number} cost
 * @property {number} depth
 * @property {number} dim
 * @property {Game} game
 */

/** @type {Node2} */
export default class Node2 {
  /**
   *
   * @param {{
   *  state: Array<string | number>,
   *  parent: Node2,
   *  cost: number,
   *  depth: number,
   *  dim: number,
   * }} optData options
   * @param {Array<string | number>} goalState
   */
  constructor(optData, goalState = null) {
    let data = optData || {}
    this.state = data.state
    this.parent = data.parent || null
    this.cost = data.cost || 0
    this.depth = data.depth || 0
    this.dim = data.dim
    this.goalState = goalState
    this.game = new Game({ state: this.state, goalState, dim: this.dim })
  }

  expand() {
    let that = this
    let result = []
    let actionsAndStates = this.game.getAvailableActionsAndStates()

    for (let [_action, state] of Object.entries(actionsAndStates)) {
      let childData = {
        cost: that.cost + 1,
        depth: that.depth + 1,
        dim: that.dim,
        parent: that,
        state,
      }

      result.push(new Node2(childData, that.goalState))
    }

    return result
  }

  visualize() {
    let board = ''
    for (let i = 0; i < this.state.length; i += this.dim) {
      let row = this.state.slice(i, i + this.dim).join('\t')
      board += row + '\n'
    }

    console.log(board)
  }

  isEqual(other) {
    let thisState = this.state.join('')
    let otherState = other.state.join('')
    return (
      thisState === otherState &&
      this.cost === other.cost &&
      this.depth === other.depth
    )
  }
}
