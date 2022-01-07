import TYPES from './types.js'

export default class Node {
  constructor(type, row, col) {
    this.exitTime = type !== TYPES.OPEN_SPACE ? this.assignExitTime() : 0
    this.type = type
    this.key = `${row}x${col}`
    this.row = row
    this.col = col
    this.el = this.getElementFromRowCol()
  }

  assignExitTime() {
    return Math.floor(Math.random() * 100 + 1)
  }

  /**
   * @param {Node} other Other node
   * @returns {boolean}
   */
  isEqual(other) {
    return this.key === other.key
  }

  getElementFromRowCol() {
    return document.querySelector(
      `[data-row="${this.row}"][data-col="${this.col}"]`
    )
  }
}
