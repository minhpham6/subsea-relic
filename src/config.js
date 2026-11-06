// Cấu hình Vật lý & Core Mechanics cho Subsea Relic (Graybox)
const DEFAULT_PHYSICS = {
  gravity: 0.22,           // Trọng lực dưới nước (thấp hơn trên cạn để tạo cảm giác lơ lửng)
  maxFallSpeed: 4.5,       // Vận tốc rơi tối đa trong nước (Terminal Velocity)
  jumpForce: 7.6,          // Lực nhảy cơ bản từ mặt đất / lưng rùa / đỉnh bong bóng
  swimFlutterGravity: 0.1, // Khi giữ phím Nhảy lúc đang rơi, người thợ lặn vẫy chân giảm tốc độ rơi
  moveSpeed: 3.8,          // Tốc độ di chuyển ngang tối đa
  groundAccel: 0.55,       // Gia tốc trên mặt đáy
  airAccel: 0.35,          // Gia tốc trong nước khi đang lơ lửng
  waterDragX: 0.84,        // Lực cản nước theo phương ngang
  bubbleRiseSpeed: 2.2,    // Tốc độ bong bóng lớn bay lên
  anemoneBounceForce: 11.2,// Lực đẩy của đệm Hải Quỳ (Spring)
  oxygenDrainRate: 2.6,    // Tốc độ tiêu hao O2 mỗi giây
  oxygenBubbleRestore: 35, // Lượng O2 hồi lại khi chạm/cưỡi bong bóng lớn
};

const Config = {
  ...DEFAULT_PHYSICS,
  debug: {
    showGrid: true,
    showLabels: true,
    showVectors: true,
    showSensors: true,
    godMode: false,
  }
};

function resetPhysicsToDefault() {
  Object.assign(Config, DEFAULT_PHYSICS);
}

