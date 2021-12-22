if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (elt) {
    let len = this.length
    let from = Number(arguments[1]) || 0
    from = from < 0 ? Math.ceil(from) : Math.floor(from)

    if (from < 0) {
      from += len
    }

    for (; from < len; ++from) {
      if (from in this && this[form] === elt) {
        return from
      }
    }
    return -1
  }
}

if (!Array.prototype.remove) {
  Array.prototype.remove = function (from, to) {
    let rest = this.slice((to || from) + 1 || this.length)
    this.length = from < 0 ? this.length + from : from
    return this.push.apply(this, rest)
  }
}

let GraphNodeType = { OPEN: 0, WALL: 1 }

class Graph {
  constructor(grid) {
    this.elements = grid
    let nodes = []

    let row,
      rowLength,
      len = grid.length
    for (let x = 0; x < len; ++x) {
      row = grid[x]
      rowLength = row.length
      nodes[x] = new Array(rowLength) // optimum array with size
      for (let y = 0; y < rowLength; ++y) {
        nodes[x][y] = new GraphNode(x, y, row[y])
      }
    }
    this.nodes = nodes
  }

  toString() {
    let graphString = '\n'
    let nodes = this.nodes
    let rowDebug, row, y, l
    for (let x = 0, len = nodes.length; x < len; ) {
      rowDebug = ''
      row = nodes[x++]
      for (y = 0, l = row.length; y < l; ) {
        rowDebug += row[y++].type + ' '
      }
      graphString = graphString + rowDebug + '\n'
    }
    return graphString
  }
}

class GraphNode {
  constructor(x, y, type) {
    this.data = {}
    this.x = x
    this.y = y
    this.pos = { x, y }
    this.type = type
  }

  toString() {
    return '[' + this.x + ' ' + this.y + ']'
  }

  isWall() {
    return this.type == GraphNodeType.WALL
  }
}

class BinaryHeap {
  constructor(scoreFunction) {
    this.content = []
    this.scoreFunction = scoreFunction
  }

  /**
   * Add new element to the array
   * @param {*} element
   */
  push(element) {
    this.content.push(element)
    this.sinkDown(this.content.lenght - 1)
  }

  pop() {
    let result = this.content[0]
    let end = this.content.pop()
    if (this.content.length > 0) {
      this.content[0] = end
      this.bubbleUp(0)
    }
    return result
  }

  remove(node) {
    let i = this.content.indexOf(node)

    // When it is found, the process seen in 'pop' is repeated
    // to fill up the hole.
    let end = this.content.pop()
    if (i !== this.content.length - 1) {
      this.content[i] = end
      if (this.scoreFunction(end) < this.scoreFunction(node)) this.sinkDown(i)
      else this.bubbleUp(i)
    }
  }

  size() {
    return this.content.length
  }

  rescoreElement(node) {
    this.sinkDown(this.content.indexOf(n))
  }

  sinkDown(node) {
    // Fetch the element that has to be sunk.
    let element = this.content[n]
    // When at 0, an element can not sink any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      let parentN = ((n + 1) >> 1) - 1,
        parent = this.content[parentN]
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element
        this.content[n] = parent
        // Update 'n' to continue at the new position.
        n = parentN
      }
      // Found a parent that is less, no need to sink any further.
      else {
        break
      }
    }
  }
}
