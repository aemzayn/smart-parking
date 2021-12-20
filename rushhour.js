class RushHour {
  /**
   * A configuration of a single Rush Hour board.
   * @param {string[]} vehicles
   */
  constructor(vehicles) {
    this.vehicles = vehicles;
  }

  isEqual(other) {
    for (let i = 0; i < this.vehicles.length; i++) {
      if (this.vehicles[i] !== other.vehicles[i]) {
        return false;
      }
    }
    return true;
  }

  isNotEqual(other) {
    return !this.isEqual(other);
  }

  repr() {
    let s = "----\n";
    for (const line in this.getBoard()) {
      s += `|${line}|\n`;
    }
    s += "----\n";
    return s;
  }

  getBoard() {
    let board = [
      [" ", " ", " ", " "],
      [" ", " ", " ", " "],
      [" ", " ", " ", " "],
      [" ", " ", " ", " "],
    ];

    for (const vehicle in this.vehicles) {
      let x = vehicle.x,
        y = vehicle.y;
      for (let i = 0; i < self.vehicles.length; i++) {
        board[y][x + i] = vehicle.id;
      }
    }

    return board;
  }
}
