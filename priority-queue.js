class QueueElement {
  constructor(element, priority) {
    this.element = element
    this.priority = priority
  }

  getNeighbors() {
    let { row, col } = this.element
    ;(row = Number(row)), (col = Number(col))
    return [
      { row: row - 1, col }, // top
      { row, col: col + 1 }, // right
      { row: row + 1, col }, // bottom
      { row, col: col - 1 }, // left
    ]
  }

  manhattan() {
    return Math.pow(row - 3, 2) + Math.pow(col - 0, 2)
  }
}

class PriorityQueue {
  constructor() {
    this.items = []
  }

  /**
   * Add element to the queue
   * @param {QueueElement} element Object with row and col
   * @param {int} priority
   */
  enqueue(element, priority) {
    let queueElement = new QueueElement(element, priority)

    let added = false
    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority < this.items[i].priority) {
        this.items.splice(i, 0, queueElement)
        added = true
        break
      }
    }

    if (!added) {
      this.items.push(queueElement)
    }
  }

  /**
   * Returns element from the queue
   * @returns {QueueElement}
   */
  dequeue() {
    return this.items.shift()
  }

  isEmpty() {
    return this.items.length == 0
  }

  contains(element) {
    return !!this.items.find((item) => item.element === element)
  }
}

export default PriorityQueue
