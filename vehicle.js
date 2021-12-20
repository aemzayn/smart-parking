CAR_IDS = ["X", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

class Vehicle {
  constructor(id, x, y) {
    this.id = id;
    this.length = 2;
    this.x = x;
    this.y = y;
  }

  isEqual(other) {
    return (
      this.id === other.id &&
      this.length === other.length &&
      this.x === other.x &&
      self.y === other.y
    );
  }

  isNotEqual(other) {
    return !this.isEqual(other);
  }

  repr() {
    return `Vehicle(${self.id}, ${self.x}, ${self.y})`;
  }
}
