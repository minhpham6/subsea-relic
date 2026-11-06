function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

class FloatingText {
  constructor(x, y, text, color = '#38bdf8') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.0;
    this.vy = -1.1;
  }

  update(dt) {
    this.y += this.vy;
    this.life -= dt * 1.1;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText(this.text, this.x + 1, this.y + 1);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

class RideableBubble {
  constructor(x, y, minY) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.r = 22; // Bán kính bong bóng lớn
    this.minY = minY; // Độ cao tối đa trước khi vỡ
    this.age = 0;
    this.popped = false;
    this.hasRider = false;
  }

  get bbox() {
    return {
      x: this.x - this.r,
      y: this.y - this.r,
      w: this.r * 2,
      h: this.r * 2
    };
  }

  update(dt, solids) {
    this.age += dt;
    const rise = Config.bubbleRiseSpeed;
    this.y -= rise;
    this.x = this.baseX + Math.sin(this.age * 3.5) * 6;

    if (this.y - this.r <= this.minY) {
      this.popped = true;
      return;
    }

    // Kiểm tra đụng trần đá cứng thì vỡ
    const box = this.bbox;
    for (const s of solids) {
      if (!s.oneWay && aabbOverlap(box, s)) {
        this.popped = true;
        break;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    // Vòng tròn bong bóng Graybox
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.hasRider
      ? 'rgba(56, 189, 248, 0.38)'
      : 'rgba(125, 211, 252, 0.22)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.hasRider ? '#38bdf8' : '#bae6fd';
    ctx.stroke();

    // Điểm phản quang
    ctx.beginPath();
    ctx.arc(this.x - 7, this.y - 7, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();

    if (Config.debug.showLabels) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#e0f2fe';
      ctx.textAlign = 'center';
      ctx.fillText('BUBBLE', this.x, this.y + 3);
    }
    ctx.restore();
  }
}

class BubbleVent {
  constructor(x, y, maxRiseHeight = 340, interval = 2.4) {
    this.x = x;
    this.y = y;
    this.w = 40;
    this.h = 16;
    this.maxRiseHeight = maxRiseHeight;
    this.interval = interval;
    this.timer = interval * 0.6;
  }

  update(dt, bubbles) {
    this.timer += dt;
    if (this.timer >= this.interval) {
      this.timer = 0;
      bubbles.push(
        new RideableBubble(
          this.x + this.w / 2,
          this.y - 16,
          this.y - this.maxRiseHeight
        )
      );
    }
  }

  draw(ctx) {
    ctx.save();
    // Vùng cột khí dẫn hướng (Sensor)
    if (Config.debug.showSensors) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        this.x + 4,
        this.y - this.maxRiseHeight,
        this.w - 8,
        this.maxRiseHeight
      );
      ctx.setLineDash([]);
    }

    // Đế mạch nước ngầm
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeStyle = '#7dd3fc';
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    if (Config.debug.showLabels) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#bae6fd';
      ctx.textAlign = 'center';
      ctx.fillText('VENT', this.x + this.w / 2, this.y + 12);
    }
    ctx.restore();
  }
}

class BouncePad {
  constructor(x, y, w = 48) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = 18;
    this.compressTimer = 0;
  }

  trigger() {
    this.compressTimer = 0.25;
  }

  update(dt) {
    if (this.compressTimer > 0) {
      this.compressTimer = Math.max(0, this.compressTimer - dt);
    }
  }

  draw(ctx) {
    ctx.save();
    const squeeze = this.compressTimer > 0 ? 6 : 0;
    ctx.fillStyle = '#db2777';
    ctx.fillRect(this.x, this.y + squeeze, this.w, this.h - squeeze);
    ctx.strokeStyle = '#f9a8d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y + squeeze, this.w, this.h - squeeze);

    // Mũi tên hướng bật lên
    ctx.fillStyle = '#fce7f3';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    if (Config.debug.showLabels) {
      ctx.fillText('▲ SPRING', this.x + this.w / 2, this.y - 4);
    }
    ctx.restore();
  }
}

class MovingTurtle {
  constructor(x1, y1, x2, y2, speed = 1.4, w = 76, h = 22) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.x = x1;
    this.y = y1;
    this.w = w;
    this.h = h;
    this.speed = speed;
    this.forward = true;
    this.dx = 0;
    this.dy = 0;
  }

  update() {
    const targetX = this.forward ? this.x2 : this.x1;
    const targetY = this.forward ? this.y2 : this.y1;
    const distX = targetX - this.x;
    const distY = targetY - this.y;
    const dist = Math.hypot(distX, distY);

    if (dist <= this.speed) {
      this.dx = targetX - this.x;
      this.dy = targetY - this.y;
      this.x = targetX;
      this.y = targetY;
      this.forward = !this.forward;
    } else {
      this.dx = (distX / dist) * this.speed;
      this.dy = (distY / dist) * this.speed;
      this.x += this.dx;
      this.y += this.dy;
    }
  }

  draw(ctx) {
    ctx.save();
    if (Config.debug.showSensors) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(this.x1 + this.w / 2, this.y1 + this.h / 2);
      ctx.lineTo(this.x2 + this.w / 2, this.y2 + this.h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = '#15803d';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    // Đầu rùa chỉ hướng di chuyển
    const headX = this.dx >= 0 ? this.x + this.w : this.x - 10;
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(headX, this.y + 4, 10, 10);

    if (Config.debug.showLabels) {
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#dcfce7';
      ctx.textAlign = 'center';
      ctx.fillText('TURTLE', this.x + this.w / 2, this.y + 15);
    }
    ctx.restore();
  }
}

class Clam {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 44;
    this.h = 32;
    this.timer = 0;
    this.state = 'OPEN'; // OPEN -> WARNING -> CLOSED
    this.hasPearl = true;
  }

  update(dt) {
    this.timer += dt;
    const cycle = this.timer % 5.2;
    if (cycle < 2.6) {
      this.state = 'OPEN';
    } else if (cycle < 3.5) {
      this.state = 'WARNING';
    } else {
      this.state = 'CLOSED';
    }
  }

  draw(ctx) {
    ctx.save();
    let color = '#d97706';
    let border = '#fcd34d';
    if (this.state === 'WARNING') {
      color = '#ea580c';
      border = '#fde047';
    } else if (this.state === 'CLOSED') {
      color = '#991b1b';
      border = '#f87171';
    }

    const topHeight = this.state === 'CLOSED' ? this.h : 12;
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y + (this.h - topHeight), this.w, topHeight);
    ctx.strokeStyle = border;
    ctx.strokeRect(this.x, this.y + (this.h - topHeight), this.w, topHeight);

    // Vẽ viên ngọc trai nếu đang mở và chưa nhặt
    if (this.state !== 'CLOSED' && this.hasPearl) {
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + 12, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
    }

    if (Config.debug.showLabels) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(`CLAM:${this.state}`, this.x + this.w / 2, this.y - 5);
    }
    ctx.restore();
  }
}

class EnemyCrab {
  constructor(x, y, minX, maxX, speed = 1.35) {
    this.x = x;
    this.y = y;
    this.w = 34;
    this.h = 24;
    this.minX = minX;
    this.maxX = maxX;
    this.vx = speed;
  }

  update() {
    this.x += this.vx;
    if (this.x <= this.minX) {
      this.x = this.minX;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.w >= this.maxX) {
      this.x = this.maxX - this.w;
      this.vx = -Math.abs(this.vx);
    }
  }

  draw(ctx) {
    ctx.save();
    if (Config.debug.showSensors) {
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.25)';
      ctx.beginPath();
      ctx.moveTo(this.minX, this.y + this.h - 2);
      ctx.lineTo(this.maxX, this.y + this.h - 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeStyle = '#fca5a5';
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    if (Config.debug.showLabels) {
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#fee2e2';
      ctx.textAlign = 'center';
      ctx.fillText('CRAB', this.x + this.w / 2, this.y + 15);
    }
    ctx.restore();
  }
}

class EnemyJellyfish {
  constructor(x, y, rangeY = 70, speed = 2.0) {
    this.baseX = x;
    this.baseY = y;
    this.x = x;
    this.y = y;
    this.w = 30;
    this.h = 34;
    this.rangeY = rangeY;
    this.speed = speed;
    this.t = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.t += dt * this.speed;
    this.y = this.baseY + Math.sin(this.t) * this.rangeY;
  }

  draw(ctx) {
    ctx.save();
    if (Config.debug.showSensors) {
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.25)';
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.baseY - this.rangeY);
      ctx.lineTo(this.x + this.w / 2, this.baseY + this.rangeY + this.h);
      ctx.stroke();
    }

    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeStyle = '#d8b4fe';
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    if (Config.debug.showLabels) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#f3e8ff';
      ctx.textAlign = 'center';
      ctx.fillText('JELLY', this.x + this.w / 2, this.y + 19);
    }
    ctx.restore();
  }
}

class Player {
  constructor(x, y) {
    this.spawnX = x;
    this.spawnY = y;
    this.w = 28;
    this.h = 40;
    this.reset();
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.grounded = false;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.dropThroughTimer = 0;
    this.ridingBubble = null;
    this.ridingTurtle = null;
    this.state = 'SWIM_ARC';
    this.hp = 3;
    this.oxygen = 100;
    this.invulnTimer = 0;
  }

  takeDamage(amount, popups) {
    if (Config.debug.godMode || this.invulnTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnTimer = 1.4;
    this.ridingBubble = null;
    this.vy = -5.0;
    this.vx = -this.facing * 4.0;
    popups.push(new FloatingText(this.x, this.y - 10, `-${amount} HP!`, '#f87171'));

    if (this.hp <= 0) {
      this.hp = 3;
      this.oxygen = 100;
      this.x = this.spawnX;
      this.y = this.spawnY;
      this.vx = 0;
      this.vy = 0;
      popups.push(new FloatingText(this.x, this.y - 20, 'RESPAWNED', '#facc15'));
    }
  }

  refillOxygen(amount, popups) {
    const prev = this.oxygen;
    this.oxygen = Math.min(100, this.oxygen + amount);
    if (prev < 85 && this.oxygen >= 95) {
      popups.push(new FloatingText(this.x, this.y - 12, '+O₂ REFILL', '#38bdf8'));
    }
  }

  update(dt, input, level, popups) {
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.dropThroughTimer > 0) this.dropThroughTimer -= dt;

    // 1. Tiêu hao Oxy dưới nước
    if (!Config.debug.godMode) {
      this.oxygen -= Config.oxygenDrainRate * dt;
      if (this.oxygen <= 0) {
        this.oxygen = 65;
        this.takeDamage(1, popups);
        popups.push(new FloatingText(this.x, this.y - 26, 'OUT OF O₂!', '#ef4444'));
      }
    } else {
      this.oxygen = 100;
    }

    // 2. Xử lý khi đang cưỡi trong Bong bóng lớn (Core Mechanic đặc trưng của Subsea Relic)
    if (this.ridingBubble) {
      if (this.ridingBubble.popped) {
        this.ridingBubble.hasRider = false;
        this.ridingBubble = null;
      } else {
        this.state = 'ON_BUBBLE';
        this.ridingBubble.hasRider = true;
        this.x = this.ridingBubble.x - this.w / 2;
        this.y = this.ridingBubble.y - this.h / 2;
        this.vx = 0;
        this.vy = -Config.bubbleRiseSpeed;
        this.refillOxygen(40 * dt, popups);

        if (input.left) this.facing = -1;
        if (input.right) this.facing = 1;

        // Nhảy vọt ra khỏi Bong bóng
        if (input.jumpPressed) {
          this.ridingBubble.hasRider = false;
          this.ridingBubble.popped = true;
          this.ridingBubble = null;
          this.vy = -Config.jumpForce * 1.05;
          if (input.left) this.vx = -Config.moveSpeed;
          if (input.right) this.vx = Config.moveSpeed;
          popups.push(new FloatingText(this.x, this.y, 'BUBBLE JUMP!', '#7dd3fc'));
        } else if (input.downPressed) {
          // Chui xuống đáy thoát khỏi bong bóng
          this.ridingBubble.hasRider = false;
          this.ridingBubble = null;
          this.dropThroughTimer = 0.35;
          this.vy = 2.0;
        }
        return;
      }
    }

    // 3. Nếu đang đứng trên lưng Rùa di chuyển, cộng độ dời của Rùa
    if (this.ridingTurtle) {
      this.x += this.ridingTurtle.dx;
      this.y += this.ridingTurtle.dy;
    }

    // 4. Điều khiển di chuyển ngang (có quán tính nước)
    const accel = this.grounded ? Config.groundAccel : Config.airAccel;
    if (input.left) {
      this.vx -= accel;
      this.facing = -1;
    } else if (input.right) {
      this.vx += accel;
      this.facing = 1;
    } else {
      this.vx *= Config.waterDragX;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    }
    this.vx = Math.max(-Config.moveSpeed, Math.min(Config.moveSpeed, this.vx));

    // 5. Coyote Time & Jump Buffer
    if (this.grounded) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (input.jumpPressed) {
      this.jumpBuffer = 0.12;
    } else {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    }

    // 6. Bấm S / Mũi tên xuống để tụt qua sàn mỏng (One-Way Platform)
    if (input.downPressed && this.grounded) {
      this.dropThroughTimer = 0.28;
      this.grounded = false;
      this.ridingTurtle = null;
      this.y += 2;
    }

    // 7. Thực hiện cú nhảy dưới nước
    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      this.vy = -Config.jumpForce;
      this.grounded = false;
      this.ridingTurtle = null;
      this.coyoteTimer = 0;
      this.jumpBuffer = 0;
    }

    // 8. Trọng lực nước + Vẫy chân bơi nhẹ (Swim Flutter khi giữ nút nhảy lúc đang rơi)
    const isFluttering = !this.grounded && this.vy > 0 && input.up;
    const g = isFluttering ? Config.swimFlutterGravity : Config.gravity;
    this.vy += g;
    const maxFall = isFluttering ? Config.maxFallSpeed * 0.55 : Config.maxFallSpeed;
    if (this.vy > maxFall) {
      this.vy = maxFall;
    }

    // 9. Di chuyển & Giải quyết va chạm trục X
    this.x += this.vx;
    for (const s of level.solids) {
      if (s.oneWay) continue;
      if (aabbOverlap(this, s)) {
        if (this.vx > 0) {
          this.x = s.x - this.w;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = s.x + s.w;
          this.vx = 0;
        }
      }
    }

    // 10. Di chuyển & Giải quyết va chạm trục Y
    const prevBottom = this.y + this.h;
    this.y += this.vy;
    this.grounded = false;
    this.ridingTurtle = null;

    for (const s of level.solids) {
      if (s.oneWay) {
        if (
          this.dropThroughTimer <= 0 &&
          this.vy >= 0 &&
          prevBottom <= s.y + 6 &&
          aabbOverlap(this, s)
        ) {
          this.y = s.y - this.h;
          this.vy = 0;
          this.grounded = true;
        }
        continue;
      }

      if (aabbOverlap(this, s)) {
        if (this.vy > 0) {
          this.y = s.y - this.h;
          this.vy = 0;
          this.grounded = true;
        } else if (this.vy < 0) {
          this.y = s.y + s.h;
          this.vy = 0;
        }
      }
    }

    // 11. Va chạm đứng trên lưng Rùa biển (MovingTurtle)
    for (const turtle of level.turtles) {
      if (
        this.dropThroughTimer <= 0 &&
        this.vy >= 0 &&
        prevBottom <= turtle.y + 8 &&
        aabbOverlap(this, turtle)
      ) {
        this.y = turtle.y - this.h;
        this.vy = 0;
        this.grounded = true;
        this.ridingTurtle = turtle;
      }
    }

    // 12. Kiểm tra bắt vào Bong bóng lớn (RideableBubble)
    if (this.dropThroughTimer <= 0) {
      for (const b of level.bubbles) {
        if (!b.popped && aabbOverlap(this, b.bbox)) {
          this.ridingBubble = b;
          b.hasRider = true;
          this.refillOxygen(Config.oxygenBubbleRestore, popups);
          break;
        }
      }
    }

    // 13. Cập nhật nhãn trạng thái (State Label) cho Graybox Debug
    if (this.ridingTurtle) {
      this.state = 'ON_TURTLE';
    } else if (this.grounded) {
      this.state = Math.abs(this.vx) > 0.2 ? 'WALK_SEABED' : 'IDLE_SEABED';
    } else if (isFluttering) {
      this.state = 'SWIM_FLUTTER';
    } else {
      this.state = this.vy < 0 ? 'JUMP_ASCEND' : 'WATER_FALL';
    }
  }

  draw(ctx) {
    ctx.save();
    if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Thân thợ lặn (Graybox placeholder)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    // Kính lặn chỉ hướng nhìn (Visor)
    const visorX = this.facing === 1 ? this.x + 12 : this.x + 2;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(visorX, this.y + 6, 14, 10);

    // Bình dưỡng khí sau lưng
    const tankX = this.facing === 1 ? this.x - 5 : this.x + this.w - 1;
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(tankX, this.y + 10, 6, 20);

    // Vector vận tốc (Debug)
    if (Config.debug.showVectors) {
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + this.vx * 8, cy + this.vy * 6);
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Nhãn State trên đầu Player
    if (Config.debug.showLabels) {
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(this.state, this.x + this.w / 2, this.y - 8);
    }

    ctx.restore();
  }
}
