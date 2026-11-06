const LEVEL_BUILDERS = [
  // =========================================================================
  // MAP 1: CORE TRAVERSAL, BUBBLES & ANEMONE SPRINGS
  // =========================================================================
  function buildMap1() {
    return {
      name: 'Map 1: Traversal & Bubbles (Core Movement)',
      width: 1280,
      height: 760,
      spawn: { x: 80, y: 640 },
      solids: [
        // Viền bao quanh màn chơi
        { x: 0, y: 700, w: 1280, h: 60, label: 'SEABED' },
        { x: 0, y: 0, w: 24, h: 760 },
        { x: 1256, y: 0, w: 24, h: 760 },
        { x: 0, y: 0, w: 1280, h: 24 },

        // Bậc thềm bên trái
        { x: 180, y: 600, w: 150, h: 24, label: 'ROCK LEDGE' },
        { x: 370, y: 510, w: 150, h: 24, label: 'ROCK LEDGE' },

        // Sàn mỏng nhảy xuyên từ dưới lên (One-Way Platform)
        { x: 140, y: 400, w: 200, h: 14, oneWay: true, label: 'ONE-WAY REEF' },
        { x: 80, y: 260, w: 210, h: 24, label: 'HIGH RUIN (RELIC #1)' },

        // Khu vực trung tâm (Nơi cưỡi Bong bóng lớn)
        { x: 560, y: 540, w: 180, h: 160, label: 'SUNKEN PILLAR' },
        { x: 640, y: 310, w: 210, h: 16, oneWay: true, label: 'BUBBLE LANDING' },
        { x: 680, y: 170, w: 200, h: 24, label: 'UPPER ALTAR (RELIC #2)' },

        // Khu vực bên phải (Tàu ngầm & Relic #3)
        { x: 940, y: 480, w: 280, h: 24, label: 'SUBMARINE DOCK' },
        { x: 980, y: 290, w: 220, h: 16, oneWay: true, label: 'EAST PLATFORM' }
      ],
      vents: [
        // Mạch sủi bong bóng đưa người chơi bay lên tầng cao
        new BubbleVent(590, 524, 390, 2.2),
        new BubbleVent(850, 684, 430, 2.5)
      ],
      bouncePads: [
        // Hải quỳ đàn hồi bên trái
        new BouncePad(230, 582, 54),
        new BouncePad(1120, 682, 56)
      ],
      turtles: [
        new MovingTurtle(390, 260, 610, 260, 1.5)
      ],
      clams: [
        new Clam(430, 478)
      ],
      crabs: [
        new EnemyCrab(200, 576, 185, 325, 1.1)
      ],
      jellies: [
        new EnemyJellyfish(500, 350, 55, 1.8)
      ],
      urchins: [
        { x: 430, y: 680, w: 60, h: 20, label: 'URCHINS' }
      ],
      coins: [
        { x: 245, y: 520, w: 16, h: 16, val: 25 },
        { x: 245, y: 470, w: 16, h: 16, val: 25 },
        { x: 602, y: 440, w: 16, h: 16, val: 25 },
        { x: 602, y: 370, w: 16, h: 16, val: 25 },
        { x: 750, y: 270, w: 16, h: 16, val: 25 },
        { x: 1050, y: 250, w: 16, h: 16, val: 50 }
      ],
      relics: [
        { x: 130, y: 215, w: 24, h: 28, id: 1 },
        { x: 770, y: 125, w: 24, h: 28, id: 2 },
        { x: 1120, y: 245, w: 24, h: 28, id: 3 }
      ],
      submarine: {
        x: 1040,
        y: 416,
        w: 96,
        h: 64
      },
      hints: [
        { x: 70, y: 615, text: '1. Nhảy lên Đệm Hải Quỳ (SPRING) hoặc Bậc đá' },
        { x: 540, y: 505, text: '2. Nhảy vào BUBBLE để cưỡi lên cao & hồi O₂!' },
        { x: 960, y: 400, text: '3. Gom đủ 3 RELIC SHARD để mở khóa Tàu Ngầm' }
      ]
    };
  },

  // =========================================================================
  // MAP 2: HAZARDS, SNAPPING CLAMS & MOVING TURTLES
  // =========================================================================
  function buildMap2() {
    return {
      name: 'Map 2: Hazards, Clams & Moving Turtles',
      width: 1360,
      height: 760,
      spawn: { x: 70, y: 640 },
      solids: [
        { x: 0, y: 700, w: 1360, h: 60, label: 'SEABED' },
        { x: 0, y: 0, w: 24, h: 760 },
        { x: 1336, y: 0, w: 24, h: 760 },
        { x: 0, y: 0, w: 1360, h: 24 },

        // Các đảo đá cách nhau bởi bãi Nhím biển (Urchins)
        { x: 240, y: 580, w: 220, h: 28, label: 'CRAB ISLAND' },
        { x: 820, y: 540, w: 260, h: 28, label: 'CLAM REEF' },
        { x: 1140, y: 440, w: 170, h: 28, label: 'EAST LEDGE' },

        // Tầng trên
        { x: 460, y: 320, w: 280, h: 20, oneWay: true, label: 'MID CANOPY' },
        { x: 80, y: 230, w: 240, h: 28, label: 'SUBMARINE BAY' }
      ],
      vents: [
        new BubbleVent(170, 684, 360, 2.3),
        new BubbleVent(1200, 424, 300, 2.2)
      ],
      bouncePads: [
        new BouncePad(920, 522, 54)
      ],
      turtles: [
        // Rùa chở người chơi vượt bãi nhím biển
        new MovingTurtle(490, 560, 770, 560, 1.7),
        // Rùa tầng cao chở về Tàu ngầm
        new MovingTurtle(800, 250, 350, 250, 1.8)
      ],
      clams: [
        new Clam(320, 548),
        new Clam(860, 508),
        new Clam(1010, 508)
      ],
      crabs: [
        new EnemyCrab(260, 556, 245, 455, 1.5),
        new EnemyCrab(840, 516, 825, 1070, 1.6)
      ],
      jellies: [
        new EnemyJellyfish(620, 440, 75, 2.2),
        new EnemyJellyfish(1090, 320, 70, 2.0),
        new EnemyJellyfish(390, 220, 65, 2.3)
      ],
      urchins: [
        { x: 460, y: 678, w: 360, h: 22, label: 'SEA URCHIN BED (DANGER)' }
      ],
      coins: [
        { x: 560, y: 500, w: 16, h: 16, val: 25 },
        { x: 640, y: 500, w: 16, h: 16, val: 25 },
        { x: 720, y: 500, w: 16, h: 16, val: 25 },
        { x: 550, y: 270, w: 16, h: 16, val: 50 },
        { x: 630, y: 270, w: 16, h: 16, val: 50 }
      ],
      relics: [
        { x: 350, y: 640, w: 24, h: 28, id: 1 },
        { x: 1210, y: 150, w: 24, h: 28, id: 2 },
        { x: 590, y: 265, w: 24, h: 28, id: 3 }
      ],
      submarine: {
        x: 120,
        y: 166,
        w: 96,
        h: 64
      },
      hints: [
        { x: 250, y: 530, text: 'Canh lúc CLAM:OPEN để lấy Ngọc trai (+100$), tránh lúc CLOSED!' },
        { x: 510, y: 635, text: 'Đứng lên lưng TURTLE để vượt qua bãi Nhím biển' }
      ]
    };
  },

  // =========================================================================
  // MAP 3: DEEP TRENCH — VERTICAL EXPLORATION (FULL MECHANICS)
  // =========================================================================
  function buildMap3() {
    return {
      name: 'Map 3: Deep Trench (Vertical Exploration)',
      width: 1400,
      height: 1100,
      spawn: { x: 100, y: 980 },
      solids: [
        { x: 0, y: 1040, w: 1400, h: 60, label: 'ABYSS FLOOR' },
        { x: 0, y: 0, w: 24, h: 1100 },
        { x: 1376, y: 0, w: 24, h: 1100 },
        { x: 0, y: 0, w: 1400, h: 24 },

        // Tầng Đáy (Abyss)
        { x: 280, y: 920, w: 220, h: 24, label: 'LOWER REEF' },
        { x: 640, y: 860, w: 240, h: 24, label: 'SUNKEN DECK' },
        { x: 1020, y: 920, w: 260, h: 24, label: 'EAST ABYSS (RELIC #1)' },

        // Tầng Trung (Mid Trench)
        { x: 880, y: 660, w: 280, h: 20, oneWay: true, label: 'MID LEDGE' },
        { x: 420, y: 620, w: 260, h: 24, label: 'CENTRAL RUIN' },
        { x: 80, y: 540, w: 240, h: 24, label: 'WEST CAVERN (RELIC #2)' },

        // Tầng Thượng (Upper Sanctum)
        { x: 380, y: 360, w: 240, h: 18, oneWay: true, label: 'UPPER REEF' },
        { x: 740, y: 280, w: 260, h: 24, label: 'SANCTUM BRIDGE' },
        { x: 1080, y: 200, w: 240, h: 28, label: 'CROWN ALTAR (RELIC #3)' },
        { x: 600, y: 130, w: 220, h: 24, label: 'SUBMARINE EXTRACTION' }
      ],
      vents: [
        new BubbleVent(560, 1024, 440, 2.3),
        new BubbleVent(940, 904, 340, 2.4),
        new BubbleVent(260, 524, 340, 2.1),
        new BubbleVent(980, 644, 420, 2.3)
      ],
      bouncePads: [
        new BouncePad(360, 902, 54),
        new BouncePad(520, 602, 54),
        new BouncePad(840, 262, 54)
      ],
      turtles: [
        new MovingTurtle(660, 480, 920, 480, 1.6),
        new MovingTurtle(320, 220, 560, 220, 1.5)
      ],
      clams: [
        new Clam(720, 828),
        new Clam(470, 588),
        new Clam(1140, 888)
      ],
      crabs: [
        new EnemyCrab(1040, 896, 1025, 1270, 1.6),
        new EnemyCrab(90, 516, 85, 310, 1.5),
        new EnemyCrab(760, 256, 745, 990, 1.7)
      ],
      jellies: [
        new EnemyJellyfish(820, 740, 65, 2.1),
        new EnemyJellyfish(350, 480, 70, 2.2),
        new EnemyJellyfish(680, 260, 65, 2.4)
      ],
      urchins: [
        { x: 640, y: 1018, w: 340, h: 22, label: 'ABYSS URCHINS' }
      ],
      coins: [
        { x: 380, y: 830, w: 16, h: 16, val: 25 },
        { x: 572, y: 920, w: 16, h: 16, val: 25 },
        { x: 572, y: 840, w: 16, h: 16, val: 25 },
        { x: 572, y: 760, w: 16, h: 16, val: 25 },
        { x: 780, y: 440, w: 16, h: 16, val: 50 },
        { x: 480, y: 310, w: 16, h: 16, val: 50 }
      ],
      relics: [
        { x: 1220, y: 875, w: 24, h: 28, id: 1 },
        { x: 130, y: 495, w: 24, h: 28, id: 2 },
        { x: 1220, y: 155, w: 24, h: 28, id: 3 }
      ],
      submarine: {
        x: 660,
        y: 66,
        w: 96,
        h: 64
      },
      hints: [
        { x: 80, y: 950, text: 'Hẻm vực sâu 1100px: Sử dụng chuỗi BUBBLE & SPRING để leo lên đỉnh!' }
      ]
    };
  }
];
