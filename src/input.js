class InputHandler {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();

    window.addEventListener('keydown', (e) => {
      // Tránh cuộn trang khi bấm Space hoặc phím mũi tên
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        if (document.activeElement?.tagName !== 'SELECT' && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
        }
      }
      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.justPressed.clear();
    });
  }

  get left() {
    return this.keys.has('ArrowLeft') || this.keys.has('KeyA');
  }

  get right() {
    return this.keys.has('ArrowRight') || this.keys.has('KeyD');
  }

  get up() {
    return this.keys.has('ArrowUp') || this.keys.has('KeyW') || this.keys.has('Space');
  }

  get down() {
    return this.keys.has('ArrowDown') || this.keys.has('KeyS');
  }

  get jumpPressed() {
    return (
      this.justPressed.has('ArrowUp') ||
      this.justPressed.has('KeyW') ||
      this.justPressed.has('Space')
    );
  }

  get downPressed() {
    return this.justPressed.has('ArrowDown') || this.justPressed.has('KeyS');
  }

  get resetPressed() {
    return this.justPressed.has('KeyR');
  }

  endFrame() {
    this.justPressed.clear();
  }
}
