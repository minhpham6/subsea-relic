const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const input = new InputHandler();

// DOM Elements cho HUD
const hudHp = document.getElementById('hud-hp');
const hudOxygenFill = document.getElementById('hud-oxygen-fill');
const hudRelics = document.getElementById('hud-relics');
const hudScore = document.getElementById('hud-score');
const hudExitStatus = document.getElementById('hud-exit-status');
const levelSelect = document.getElementById('level-select');
const btnReset = document.getElementById('btn-reset');

// Trạng thái Game
let currentLevelIndex = 0;
let level = null;
let player = null;
let popups = [];
let score = 0;
let relicsCollected = 0;
let totalRelics = 0;
let levelCompleted = false;

// Camera 2D bám theo Player mượt mà
const camera = {
  x: 0,
  y: 0,
  w: canvas.width,
  h: canvas.height
};

function loadLevel(index) {
  currentLevelIndex = index;
  levelSelect.value = String(index);
  const raw = LEVEL_BUILDERS[index]();

  level = {
    ...raw,
    bubbles: []
  };

  player = new Player(level.spawn.x, level.spawn.y);
  popups = [];
  score = 0;
  relicsCollected = 0;
  totalRelics = level.relics.length;
  levelCompleted = false;

  // Đặt camera ngay vị trí nhân vật khi mới vào màn
  camera.x = Math.max(0, Math.min(level.width - camera.w, player.x - camera.w / 2));
  camera.y = Math.max(0, Math.min(level.height - camera.h, player.y - camera.h / 2));
  updateHUD();
}

function updateHUD() {
  hudHp.textContent = '♥'.repeat(player.hp) + '♡'.repeat(Math.max(0, 3 - player.hp));
  hudOxygenFill.style.width = `${Math.max(0, Math.min(100, player.oxygen))}%`;
  if (player.oxygen < 30) {
    hudOxygenFill.style.background = '#ef4444';
  } else {
    hudOxygenFill.style.background = 'linear-gradient(90deg, #0284c7, #38bdf8)';
  }

  hudRelics.textContent = `${relicsCollected} / ${totalRelics}`;
  hudScore.textContent = `$${score}`;

  const subUnlocked = relicsCollected >= totalRelics;
  hudExitStatus.textContent = subUnlocked ? 'UNLOCKED!' : 'LOCKED';
  hudExitStatus.className = `stat-value ${subUnlocked ? 'unlocked-val' : 'locked-val'}`;
}

function updateGame(dt) {
  if (input.resetPressed) {
    loadLevel(currentLevelIndex);
    return;
  }

  if (levelCompleted) {
    if (input.jumpPressed) {
      const nextIdx = (currentLevelIndex + 1) % LEVEL_BUILDERS.length;
      loadLevel(nextIdx);
    }
    return;
  }

  // 1. Cập nhật Rùa biển di chuyển trước để Player nhận được dx, dy chính xác
  for (const t of level.turtles) {
    t.update();
  }

  // 2. Cập nhật Mạch nước ngầm & Bong bóng lớn
  for (const v of level.vents) {
    v.update(dt, level.bubbles);
  }
  for (const b of level.bubbles) {
    b.update(dt, level.solids);
  }
  level.bubbles = level.bubbles.filter((b) => !b.popped);

  // 3. Cập nhật Đệm Hải Quỳ, Vỏ Sò, Cua, Sứa
  for (const pad of level.bouncePads) pad.update(dt);
  for (const clam of level.clams) clam.update(dt);
  for (const crab of level.crabs) crab.update();
  for (const jelly of level.jellies) jelly.update(dt);

  // 4. Cập nhật Player
  player.update(dt, input, level, popups);

  // 5. Tương tác với Đệm Hải Quỳ (BouncePad)
  for (const pad of level.bouncePads) {
    if (player.vy >= 0 && aabbOverlap(player, pad)) {
      pad.trigger();
      player.y = pad.y - player.h;
      player.vy = -Config.anemoneBounceForce;
      player.grounded = false;
      player.ridingBubble = null;
      popups.push(new FloatingText(pad.x, pad.y - 10, 'SPRING BOUNCE!', '#f472b6'));
    }
  }

  // 6. Tương tác với Vỏ Sò (Clam: Mở thì lấy Ngọc trai, Đóng thì kẹp mất máu)
  for (const clam of level.clams) {
    if (aabbOverlap(player, clam)) {
      if (clam.state === 'CLOSED') {
        player.takeDamage(1, popups);
      } else if (clam.hasPearl) {
        clam.hasPearl = false;
        score += 100;
        popups.push(new FloatingText(clam.x, clam.y - 12, '+$100 PEARL!', '#facc15'));
      }
    }
  }

  // 7. Va chạm Quái & Bẫy (Crab, Jellyfish, Urchins)
  for (const crab of level.crabs) {
    if (aabbOverlap(player, crab)) {
      player.takeDamage(1, popups);
    }
  }
  for (const jelly of level.jellies) {
    if (aabbOverlap(player, jelly)) {
      player.takeDamage(1, popups);
    }
  }
  for (const u of level.urchins) {
    if (aabbOverlap(player, u)) {
      player.takeDamage(1, popups);
    }
  }

  // 8. Nhặt Vàng / Kho báu (Coins)
  level.coins = level.coins.filter((c) => {
    if (aabbOverlap(player, c)) {
      score += c.val;
      popups.push(new FloatingText(c.x, c.y, `+$${c.val}`, '#fde047'));
      return false;
    }
    return true;
  });

  // 9. Nhặt Mảnh Cổ Vật (Relic Shards)
  level.relics = level.relics.filter((r) => {
    if (aabbOverlap(player, r)) {
      relicsCollected++;
      score += 250;
      player.refillOxygen(50, popups);
      popups.push(
        new FloatingText(
          r.x,
          r.y - 10,
          `RELIC ${relicsCollected}/${totalRelics}!`,
          '#00f5d4'
        )
      );
      return false;
    }
    return true;
  });

  // 10. Kiểm tra chạm Tàu Ngầm Thoát Hiểm (Submarine Exit)
  if (relicsCollected >= totalRelics && aabbOverlap(player, level.submarine)) {
    levelCompleted = true;
    popups.push(new FloatingText(player.x, player.y - 20, 'STAGE CLEAR!', '#4ade80'));
  }

  // 11. Cập nhật Popups & Camera
  for (const p of popups) p.update(dt);
  popups = popups.filter((p) => p.life > 0);

  const targetCamX = player.x + player.w / 2 - camera.w / 2;
  const targetCamY = player.y + player.h / 2 - camera.h / 2;
  camera.x += (targetCamX - camera.x) * 0.12;
  camera.y += (targetCamY - camera.y) * 0.12;
  camera.x = Math.max(0, Math.min(level.width - camera.w, camera.x));
  camera.y = Math.max(0, Math.min(level.height - camera.h, camera.y));

  updateHUD();
}

function drawWorldGrid() {
  const step = 40;
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;

  const startX = Math.floor(camera.x / step) * step;
  const endX = camera.x + camera.w;
  for (let x = startX; x <= endX; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, camera.y);
    ctx.lineTo(x, camera.y + camera.h);
    ctx.stroke();
  }

  const startY = Math.floor(camera.y / step) * step;
  const endY = camera.y + camera.h;
  for (let y = startY; y <= endY; y += step) {
    ctx.beginPath();
    ctx.moveTo(camera.x, y);
    ctx.lineTo(camera.x + camera.w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function renderGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

  // 1. Lưới tọa độ Graybox
  if (Config.debug.showGrid) {
    drawWorldGrid();
  }

  // 2. Chú thích hướng dẫn ngay trong màn chơi (Hints)
  if (level.hints && Config.debug.showLabels) {
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    for (const h of level.hints) {
      ctx.fillText(h.text, h.x, h.y);
    }
  }

  // 3. Vẽ Địa hình Đá & Sàn mỏng (One-way Platforms)
  for (const s of level.solids) {
    if (s.oneWay) {
      ctx.fillStyle = 'rgba(71, 85, 105, 0.65)';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x, s.y, s.w, s.h);
    }

    if (Config.debug.showLabels && s.label) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(s.label, s.x + 6, s.y + 14);
    }
  }

  // 4. Vẽ Bãi Nhím Biển (Urchins Hazard)
  for (const u of level.urchins) {
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(u.x, u.y, u.w, u.h);
    ctx.strokeStyle = '#ef4444';
    ctx.strokeRect(u.x, u.y, u.w, u.h);

    // Răng cưa tượng trưng cho gai nhím
    ctx.beginPath();
    for (let sx = u.x; sx < u.x + u.w; sx += 12) {
      ctx.moveTo(sx, u.y);
      ctx.lineTo(sx + 6, u.y - 6);
      ctx.lineTo(sx + 12, u.y);
    }
    ctx.strokeStyle = '#f87171';
    ctx.stroke();

    if (Config.debug.showLabels && u.label) {
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#fecaca';
      ctx.fillText(u.label, u.x + 8, u.y + 15);
    }
  }

  // 5. Vẽ Tàu Ngầm Thoát Hiểm (Submarine Exit)
  const sub = level.submarine;
  const subUnlocked = relicsCollected >= totalRelics;
  ctx.fillStyle = subUnlocked ? '#15803d' : '#713f12';
  ctx.fillRect(sub.x, sub.y, sub.w, sub.h);
  ctx.strokeStyle = subUnlocked ? '#4ade80' : '#facc15';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(sub.x, sub.y, sub.w, sub.h);

  // Ô cửa kính tròn tàu ngầm
  ctx.beginPath();
  ctx.arc(sub.x + sub.w / 2, sub.y + sub.h / 2, 14, 0, Math.PI * 2);
  ctx.fillStyle = subUnlocked ? '#86efac' : '#334155';
  ctx.fill();
  ctx.stroke();

  if (Config.debug.showLabels) {
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = subUnlocked ? '#4ade80' : '#facc15';
    ctx.textAlign = 'center';
    ctx.fillText(
      subUnlocked ? 'SUB: UNLOCKED (ENTER)' : `SUB: LOCKED (${relicsCollected}/${totalRelics})`,
      sub.x + sub.w / 2,
      sub.y - 8
    );
    ctx.textAlign = 'left';
  }

  // 6. Vẽ Mạch sủi bọt, Đệm Hải Quỳ, Rùa, Vỏ Sò
  for (const v of level.vents) v.draw(ctx);
  for (const pad of level.bouncePads) pad.draw(ctx);
  for (const t of level.turtles) t.draw(ctx);
  for (const clam of level.clams) clam.draw(ctx);

  // 7. Vẽ Coins & Relic Shards
  for (const c of level.coins) {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#fef08a';
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }

  for (const r of level.relics) {
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    if (Config.debug.showLabels) {
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#00f5d4';
      ctx.textAlign = 'center';
      ctx.fillText(`RELIC #${r.id}`, r.x + r.w / 2, r.y - 6);
      ctx.textAlign = 'left';
    }
  }

  // 8. Vẽ Cua, Sứa, Player & Bong bóng lớn
  for (const crab of level.crabs) crab.draw(ctx);
  for (const jelly of level.jellies) jelly.draw(ctx);
  player.draw(ctx);
  for (const b of level.bubbles) b.draw(ctx);
  for (const p of popups) p.draw(ctx);

  ctx.restore();

  // 9. Telemetry góc trái trên Canvas (Graybox Inspector HUD)
  if (Config.debug.showLabels) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(10, 10, 255, 58);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(10, 10, 255, 58);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(
      `POS: (${Math.round(player.x)}, ${Math.round(player.y)}) | VEL: (${player.vx.toFixed(1)}, ${player.vy.toFixed(1)})`,
      18,
      28
    );
    ctx.fillText(`STATE: ${player.state}`, 18, 44);
    ctx.fillText(`ACTIVE BUBBLES: ${level.bubbles.length}`, 18, 60);
    ctx.restore();
  }

  // 10. Màn hình Hoàn thành màn chơi (Stage Clear Overlay)
  if (levelCompleted) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 13, 20, 0.82)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('STAGE COMPLETED!', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px monospace';
    ctx.fillText(
      `Đã thu thập đủ ${relicsCollected}/${totalRelics} Relic Shards | Kho báu: $${score}`,
      canvas.width / 2,
      canvas.height / 2 + 10
    );

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(
      'Nhấn [SPACE / W] để sang Map tiếp theo hoặc [R] để chơi lại',
      canvas.width / 2,
      canvas.height / 2 + 48
    );
    ctx.restore();
  }
}

// =========================================================================
// KẾT NỐI GIAO DIỆN INSPECTOR (LIVE TUNING)
// =========================================================================
function setupInspectorControls() {
  levelSelect.addEventListener('change', (e) => {
    loadLevel(Number(e.target.value));
    canvas.focus();
  });

  btnReset.addEventListener('click', () => {
    loadLevel(currentLevelIndex);
    canvas.focus();
  });

  const bindCheckbox = (id, key) => {
    const el = document.getElementById(id);
    el.checked = Config.debug[key];
    el.addEventListener('change', () => {
      Config.debug[key] = el.checked;
    });
  };

  bindCheckbox('chk-grid', 'showGrid');
  bindCheckbox('chk-labels', 'showLabels');
  bindCheckbox('chk-vectors', 'showVectors');
  bindCheckbox('chk-sensors', 'showSensors');
  bindCheckbox('chk-godmode', 'godMode');

  const sliders = [
    { id: 'inp-gravity', valId: 'val-gravity', key: 'gravity' },
    { id: 'inp-jump', valId: 'val-jump', key: 'jumpForce' },
    { id: 'inp-speed', valId: 'val-speed', key: 'moveSpeed' },
    { id: 'inp-bubble', valId: 'val-bubble', key: 'bubbleRiseSpeed' },
    { id: 'inp-bounce', valId: 'val-bounce', key: 'anemoneBounceForce' }
  ];

  sliders.forEach(({ id, valId, key }) => {
    const inputEl = document.getElementById(id);
    const valEl = document.getElementById(valId);
    inputEl.value = Config[key];
    valEl.textContent = Config[key];

    inputEl.addEventListener('input', () => {
      const v = parseFloat(inputEl.value);
      Config[key] = v;
      valEl.textContent = v;
    });
  });

  document.getElementById('btn-default-physics').addEventListener('click', () => {
    resetPhysicsToDefault();
    sliders.forEach(({ id, valId, key }) => {
      document.getElementById(id).value = Config[key];
      document.getElementById(valId).textContent = Config[key];
    });
  });
}

// =========================================================================
// MAIN LOOP (60 FPS CHUẨN)
// =========================================================================
let lastTime = performance.now();

function gameLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  updateGame(dt);
  renderGame();
  input.endFrame();

  requestAnimationFrame(gameLoop);
}

setupInspectorControls();
loadLevel(0);
requestAnimationFrame(gameLoop);
