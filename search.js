import board from './board.js'

/**
 * @typedef options
 * @type {object}
 * @property {Node2} node
 * @property {Array<Node2>} frontier
 * @property {Object.<string, Node2>} expandedNodes
 * @property {number} iteration
 * @property {number} iterationLimit
 * @property {number} depthLimit
 * @property {boolean} expandedCheckOptimization
 * @property {function | null} callback
 * @property {function | null} stepCallback
 * @property {'aStar'} type
 * @property {number} maxFrontierListLength
 * @property {number} maxExpandedNodesLength
 * @property {number} iterativeDeepeningIndex
 */

/**
 *
 * @param {options} opt
 * @returns
 */
export const search = (opt) => {
  let options = {
    node: null,
    frontier: [],
    expandedNodes: {},
    iteration: 0,
    iterationLimit: 1000,
    depthLimit: 0,
    expandedCheckOptimization: false,
    callback: function () {},
    stepCallback: null,
    type: 'aStar',
    maxFrontierListLength: 0,
    maxExpandedNodesLength: 0,
    iterativeDeepeningIndex: 0,
    ...opt,
  }

  // options.node.visualize()

  if (options.node.game.isFinished()) {
    return options.callback(null, options)
  }

  const expandedList = options.node.expand()

  const expandedUnexploredList = expandedList.filter((node) => {
    // Check depth
    if (options.depthLimit && node.depth > options.depthLimit) {
      return false
    }

    // Check whether node is already expanded (with lower cost)
    let alreadyExpandedNode = options.expandedNodes[node.state.join('')]
    if (alreadyExpandedNode && alreadyExpandedNode.cost <= node.cost) {
      return false
    }

    let alternativeNode = options.frontier.find((n) => n.isEqual(node))
    if (alternativeNode && alternativeNode.cost <= node.cost) {
      return false
    } else if (alternativeNode && alternativeNode.cost > node.cost) {
      options.frontier = options.frontier.filter((n) =>
        n.isEqual(alternativeNode)
      )
    }

    return true
  })

  // Add filtered just-expanded nodes into frontier list
  options.frontier = options.frontier.concat(expandedUnexploredList)
  options.maxFrontierListLength = Math.max(
    options.maxFrontierListLength,
    options.frontier.length
  )

  if (options.expandedCheckOptimization) {
    let desiredNode = expandedUnexploredList.find((n) => n.game.isFinished())

    if (desiredNode) {
      return options.callback(null, { ...options, ...{ node: desiredNode } })
    }
  }

  // Next call
  const [nextNode, newFrontier] = getNextNode(options)
  if (!nextNode) {
    console.error('Frontier list is empty')
    return options.callback(new Error('Frontier list is emtpy'), options)
  }

  options.frontier = newFrontier.slice()

  // Iteration check
  options.iteration++
  if (options.iterationLimit && options.iteration > options.iterationLimit) {
    return options.callback(
      new Error('Iteration limit reached: ' + options.iteration),
      options
    )
  }

  if (options.stepCallback) {
    options.stepCallback({ ...options, node: nextNode })
  } else {
    setTimeout(function () {
      search({ ...options, node: nextNode })
    }, 0)
  }
}

/**
 * @typedef {Node2} BestNode node with the lowest f score
 * @param {object} options
 * @returns {[BestNode, Array<Node2>]}
 */
function getNextNode(options) {
  const sortedFrontier = options.frontier.sort((a, b) => {
    let aScore = a.game.getManhattanDistance() + a.cost
    let bScore = b.game.getManhattanDistance() + b.cost
    if (aScore < bScore) return -1
    else if (aScore > bScore) return 1
    return 0
  })

  const newFrontier = sortedFrontier.slice(1)
  return [sortedFrontier[0], newFrontier]
}
