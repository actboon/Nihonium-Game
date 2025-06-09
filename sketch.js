/*
Infinite arcade-style shooter game with science-themed cartoon elements.
All assets are drawn with p5.js primitives (no external images or fonts).
Audio is generated using p5.js oscillators, noise, and envelopes.
Make sure to include the p5.sound library along with p5.js for sound to work.
*/
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;

// Touch button area
const BUTTON_AREA_HEIGHT = 80;
let leftBtn, rightBtn, shootBtn;
let leftPressed = false, rightPressed = false, shootPressed = false; // タッチ用

const BULLET_R = 5;
const ENEMY_R = 20;
const PLAYER_R = 20;
const INITIAL_SPAWN_INTERVAL = 120;
const NIHONIUM_DURATION = 60; // frames that Nihonium effect lasts (~1 sec at 60fps)
const notes = [261.6, 329.6, 392.0, 523.3, 392.0, 329.6]; // background music melody (Hz)

let player;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let score = 0;
let gameState = 0; // 0 = start screen, 1 = playing, 2 = game over
window.gameState = gameState;
// Control and timing variables
let shootCooldown = 0;
let spawnInterval;
let spawnTimer;
let musicTimer = 0;
let noteIndex = 0;
let flashAlpha = 0;
let audioStarted = false;
// Sound objects
let oscMusic, envMusic;
let oscShoot, envShoot;
let noiseExpl, envExpl;
// Starfield background
let stars = [];
let particles = []; // ★ パーティクル管理
let electricItems = [];
let powerupTimer = 0;

function setup() {
  window.canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  // タッチボタン初期化（1回だけ）
  const margin = 20;
  const btnW = 80, btnH = 60;
  const baseY = height - BUTTON_AREA_HEIGHT/2;
  leftBtn = {x: margin + btnW/2, y: baseY, w: btnW, h: btnH, label:'←'};
  rightBtn = {x: width/2, y: baseY, w: btnW, h: btnH, label:'→'};
  shootBtn = {x: width - margin - btnW/2, y: baseY, w: btnW, h: btnH, label:'SHOOT'};


  // Initialize starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      brightness: random(150, 255)
    });
  }
  // Initialize sound generators and envelopes
  oscMusic = new p5.Oscillator('square');
  envMusic = new p5.Envelope();
  envMusic.setADSR(0.01, 0.1, 0.2, 0.1);
  envMusic.setRange(0.3, 0);
  oscShoot = new p5.Oscillator('triangle');
  envShoot = new p5.Envelope();
  envShoot.setADSR(0.001, 0.1, 0, 0.1);
  envShoot.setRange(0.2, 0);
  noiseExpl = new p5.Noise('white');
  envExpl = new p5.Envelope();
  envExpl.setADSR(0.01, 0.2, 0, 0.2);
  envExpl.setRange(0.5, 0);
  // Create player
  player = new Player();
  // Set initial game state
  spawnInterval = INITIAL_SPAWN_INTERVAL;
  spawnTimer = spawnInterval;
  gameState = 0;
}

function mousePressed() {
  if (gameState === 2) return; // ゲームオーバー画面ではp5.jsのマウス処理を無効化
  if (gameState === 0) {
    startGame();
    return;
  }
  // PC用: クリックでボタン反応
  leftPressed = rightPressed = shootPressed = false;
  if (inBtn({x: mouseX, y: mouseY}, leftBtn)) leftPressed = true;
  if (inBtn({x: mouseX, y: mouseY}, rightBtn)) rightPressed = true;
  if (inBtn({x: mouseX, y: mouseY}, shootBtn)) shootPressed = true;
}
function mouseReleased() {
  leftPressed = rightPressed = shootPressed = false;
}

function touchStarted() {
  if (gameState === 2) return; // ゲームオーバー画面ではp5.jsのタッチ処理を無効化
  if (gameState === 0) {
    startGame();
    return false;
  }
  leftPressed = rightPressed = shootPressed = false;
  for (let t of touches) {
    if (inBtn(t, leftBtn)) leftPressed = true;
    if (inBtn(t, rightBtn)) rightPressed = true;
    if (inBtn(t, shootBtn)) shootPressed = true;
  }
  return false; // デフォルト動作防止
}
function touchMoved() {
  leftPressed = rightPressed = shootPressed = false;
  for (let t of touches) {
    if (inBtn(t, leftBtn)) leftPressed = true;
    if (inBtn(t, rightBtn)) rightPressed = true;
    if (inBtn(t, shootBtn)) shootPressed = true;
  }
  return false;
}
function touchEnded() {
  leftPressed = rightPressed = shootPressed = false;
  return false;
}
function inBtn(t, btn) {
  return t.x > btn.x - btn.w/2 && t.x < btn.x + btn.w/2 &&
         t.y > btn.y - btn.h/2 && t.y < btn.y + btn.h/2;
}



// 周期表風の背景を描く
function drawPeriodicTableBackground() {
  // 2D配列で正確な周期表を表現
  const table = [
    // 1行目
    ["H", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "He"],
    // 2行目
    ["Li", "Be", "", "", "", "", "", "", "", "", "", "B", "C", "N", "O", "F", "Ne", ""],
    // 3行目
    ["Na", "Mg", "", "", "", "", "", "", "", "", "", "Al", "Si", "P", "S", "Cl", "Ar", ""],
    // 4行目
    ["K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr"],
    // 5行目
    ["Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe"],
    // 6行目
    ["Cs", "Ba", "La", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn"],
    // 7行目
    ["Fr", "Ra", "Ac", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Fl", "Lv", "Ts", "Og", "", ""]
  ];
  // ランタノイド系列
  const lanth = ["", "", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "", ""];
  // アクチノイド系列
  const actin = ["", "", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "", ""];

  const cols = 18;
  const spacingX = width / cols;
  const spacingY = 35;
  const opacity = 50
  const pastelColors = [
    color(100, 150, 255, opacity), // 半透明（50%）
    color(150, 255, 150, opacity),
    color(255, 150, 200, opacity),
    color(255, 255, 180, opacity),
    color(200, 150, 255, opacity),
    color(255, 220, 150, opacity)
  ];

  textAlign(CENTER, CENTER);
  textSize(16);
  rectMode(CENTER);

  // 通常行
  for (let row = 0; row < table.length; row++) {
    for (let col = 0; col < cols; col++) {
      const symbol = table[row][col] || "";
      const x = col * spacingX + spacingX / 2;
      const y = row * spacingY + 50;
      if (symbol !== "") {
        const c = pastelColors[row % pastelColors.length];
        noStroke();
        fill(c);
        rect(x, y, spacingX - 4, spacingY - 4, 4);
        if (["Zn", "Bi", "Nh"].includes(symbol)) {
          stroke(255);
          strokeWeight(1.2);
          noFill();
          rect(x, y, spacingX - 4, spacingY - 4, 4);
        }
        noStroke();
        fill(220, 127);
        text(symbol, x, y);
      }
    }
  }
  // ランタノイド行
  for (let col = 0; col < cols; col++) {
    const symbol = lanth[col] || "";
    const x = col * spacingX + spacingX / 2;
    const y = 8 * spacingY + 50;
    if (symbol !== "") {
      fill(200, 200, 255, opacity);
      rect(x, y, spacingX - 4, spacingY - 4, 4);
      fill(120, 120, 255, 180);
      text(symbol, x, y);
    }
  }
  // アクチノイド行
  for (let col = 0; col < cols; col++) {
    const symbol = actin[col] || "";
    const x = col * spacingX + spacingX / 2;
    const y = 9 * spacingY + 50;
    if (symbol !== "") {
      fill(255, 200, 200, opacity);
      rect(x, y, spacingX - 4, spacingY - 4, 4);
      fill(255, 120, 120, 180);
      text(symbol, x, y);
    }
  }
}

// --- タッチボタン描画 ---
function drawTouchButtons() {
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(24);
  fill(20, 30, 40, 120); // 半透明背景
  noStroke();
  rect(width/2, height - BUTTON_AREA_HEIGHT/2, width, BUTTON_AREA_HEIGHT, 20);
  drawButton(leftBtn, leftPressed);
  drawButton(rightBtn, rightPressed);
  drawButton(shootBtn, shootPressed);
  pop();
}
function drawButton(btn, pressed) {
  push();
  rectMode(CENTER);
  stroke(255, 200);
  strokeWeight(pressed ? 4 : 2);
  fill(pressed ? 'rgba(255,80,80,0.7)' : 'rgba(80,160,255,0.4)');
  rect(btn.x, btn.y, btn.w, btn.h, 12);
  fill(255);
  textAlign(CENTER, CENTER);
  if (btn.label === "SHOOT") {
    // 上側に小さめで"SHOOT"
    textSize(16);
    text("SHOOT", btn.x, btn.y - 10);
    // 下側にさらに小さく(SPACE)
    textSize(12);
    text("(SPACE)", btn.x, btn.y + 14);
  } else {
    // 通常ラベル
    textSize(24);
    text(btn.label, btn.x, btn.y);
  }
  pop();
}

function draw() {
  // 電気アイテム出現タイミング
  if (gameState === 1 && random() < 0.00055) {
    let ex = random(ENEMY_R, width - ENEMY_R);
    electricItems.push(new ElectricItem(ex, -20));
  }
  // 電気アイテム出現タイミング
  if (gameState === 1 && random() < 0.00055) { // 約5秒に1回
    let ex = random(ENEMY_R, width - ENEMY_R);
    electricItems.push(new ElectricItem(ex, -20));
  }
  // Background with moving starfield
  background(0); // 🌑 黒背景に
  drawPeriodicTableBackground(); // 💡 周期表を描画

  noStroke();
  for (let s of stars) {
    fill(s.brightness);
    ellipse(s.x, s.y, s.size, s.size);
    s.y += 0.5;
    if (s.y > height) {
      s.y = 0;
      s.x = random(width);
    }
  }
  // 電気アイテム描画・更新
  for (let i = electricItems.length - 1; i >= 0; i--) {
    electricItems[i].update();
    electricItems[i].show();
    // 画面外 or 取得済み
    if (electricItems[i].toRemove) electricItems.splice(i, 1);
  }
  // 電気アイテム描画・更新
  for (let i = electricItems.length - 1; i >= 0; i--) {
    electricItems[i].update();
    electricItems[i].show();
    if (electricItems[i].toRemove) electricItems.splice(i, 1);
  }
  // パーティクル描画・更新
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isDead()) particles.splice(i, 1);
  }

  // --- SCOREと強化モード残り時間表示 ---
  push();
  fill(255);
  textSize(18);
  textAlign(LEFT, TOP);
  text("SCORE: " + score, 10, 10);
  if (powerupTimer > 0) {
    let sec = Math.ceil(powerupTimer / 60);
    textSize(14);
    text("Power-up Time Left: " + sec + "s", 10, 36);
  }
  pop();

  if (gameState === 0) {
    // Start Screen
    textAlign(CENTER, CENTER);
    fill(200);
    textSize(24);
    text("Nh113: The Bismuth Strike", width/2, height/2 - 50);
    textSize(16);
    text("Controls: / to move, Space to shoot", width/2, height/2 - 20);
    text("Shoot Bismuth (Bi) with Zinc (Zn) bullets to create Nihonium (Nh)!", width/2, height/2 + 5);
    text("Press ENTER to Start", width/2, height/2 + 50);
    textSize(12);
    fill(180);
    text("beta3.0", width/2, height/2 + 70);
  } else if (gameState === 1) {
    // Playing State
    // Player movement
    // タッチ or キーボード両対応
    if (keyIsDown(LEFT_ARROW) || leftPressed) {
      player.x = max(player.x - player.speed, PLAYER_R);
    }
    if (keyIsDown(RIGHT_ARROW) || rightPressed) {
      player.x = min(player.x + player.speed, width - PLAYER_R);
    }
    // シュート（タッチ or キーボード）
    if ((shootPressed || keyIsDown(32)) && shootCooldown <= 0 && gameState === 1) { // 32:スペースキー
      if (powerupTimer > 0) {
        bullets.push(new Bullet(player.x, player.y - PLAYER_R));
        let b1 = new Bullet(player.x, player.y - PLAYER_R); b1.angle = -0.25; bullets.push(b1);
        let b2 = new Bullet(player.x, player.y - PLAYER_R); b2.angle = 0.25; bullets.push(b2);
      } else {
        bullets.push(new Bullet(player.x, player.y - PLAYER_R));
      }
      shootCooldown = 10;
      if (oscShoot && envShoot) { oscShoot.start(); envShoot.play(oscShoot); }
      shootPressed = false; // タッチは1回でリセット
    }
    // Draw player
    player.show();
    // パワーアップタイマー減少
    if (powerupTimer > 0) powerupTimer--;
    // Update bullets and handle collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
      let b = bullets[i];
      // Remove bullet if it goes off screen
      if (b.y < 0) {
        b.toRemove = true;
        continue;
      }
      b.update();
      b.show();
      // Check bullet vs enemy collisions
      for (let j = enemies.length - 1; j >= 0; j--) {
        let e = enemies[j];
        if (e.type === 'bismuth' && dist(b.x, b.y, e.x, e.y) < BULLET_R + ENEMY_R) {
          // Bullet hits Bismuth -> transform to Nihonium
          e.transform();
          b.toRemove = true;
          score++;
          // Play hit/explosion sound
          envExpl.play(noiseExpl, 0, 0);
          // スパークパーティクルを発生
          for (let k = 0; k < 14; k++) {
            let angle = random(TWO_PI);
            let speed = random(2, 5);
            particles.push(new Particle(b.x, b.y, angle, speed, [100, 200, 255]));
          }
          break; // bullet is used up, stop checking this bullet
        }
      }
    }
    // Remove bullets marked for removal
    bullets = bullets.filter(b => !b.toRemove);

    // --- 敵弾の更新・描画・当たり判定 ---
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      let eb = enemyBullets[i];
      eb.update();
      eb.show();
      // プレイヤーに当たったらゲームオーバー
      if (dist(eb.x, eb.y, player.x, player.y) < eb.r + PLAYER_R) {
        // 爆発パーティクル
        for (let k = 0; k < 36; k++) {
          let a = random(TWO_PI);
          let s = random(3, 7);
          particles.push(new Particle(player.x, player.y, a, s, [255, random(180,220), 40]));
        }
        envExpl.play(noiseExpl, 0, 0);
        gameState = 2;
        flashAlpha = 255;
        oscMusic.stop();
      }
      // 画面外
      if (eb.x < -30 || eb.x > width + 30 || eb.y < -30 || eb.y > height + 30) {
        enemyBullets.splice(i, 1);
      }
    }
    // Spawn new enemies over time with increasing frequency
    spawnTimer--;
    if (spawnTimer <= 0) {
      let ex = random(ENEMY_R, width - ENEMY_R);
      let ey = -ENEMY_R; // just above top
      let e = new Enemy(ex, ey);
      // Set enemy velocity (basic downward movement plus slight horizontal)
      let baseSpeed = 2 + (INITIAL_SPAWN_INTERVAL - spawnInterval) * 0.01;
      e.vy = baseSpeed;
      e.vx = random(-1, 1) * baseSpeed;
      enemies.push(e);
      // --- 5点ごとに出現間隔を緩やかに加速 ---
      let accel = floor(score / 5) * 3; // 5点ごとに3ずつ速く（以前は5）
      spawnInterval = max(28, INITIAL_SPAWN_INTERVAL - accel - (INITIAL_SPAWN_INTERVAL - spawnInterval)); // 最小28フレーム
      spawnTimer = spawnInterval;
    }
    // Update enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      let e = enemies[j];
      e.update();
      e.show();
      // --- 敵の攻撃（赤弾） ---
      // 発射頻度を減らし、必ず真下に撃つ
      if (e.type === 'bismuth' && gameState === 1 && random() < 0.004) { // 以前より頻度を1/3に減少
        let angle = PI / 2; // 真下
        enemyBullets.push(new EnemyBullet(e.x, e.y, angle));
      }
      if (e.type === 'bismuth') {
        // Remove enemy if it exits bottom of screen
        if (e.y - ENEMY_R > height) {
          enemies.splice(j, 1);
          continue;
        }
        // Check enemy vs player collision
        if (dist(e.x, e.y, player.x, player.y) < ENEMY_R + PLAYER_R) {
          // Player hit -> Game Over
          // 爆発パーティクル
          for (let i = 0; i < 36; i++) {
            let a = random(TWO_PI);
            let s = random(3, 7);
            particles.push(new Particle(player.x, player.y, a, s, [255, random(180,220), 40]));
          }
          envExpl.play(noiseExpl, 0, 0); // 爆発音
          gameState = 2;
          window.gameState = gameState;
          window.lastScore = score; // 
          flashAlpha = 255; // start screen flash
          oscMusic.stop();  // stop background music
        }
      } else if (e.type === 'nihonium') {
        // Remove Nihonium after it fades out
        if (e.lifeTime <= 0) {
          enemies.splice(j, 1);
        }
      }
    }
    // Handle shooting cooldown
    if (shootCooldown > 0) shootCooldown--;
    // Background music: play next note on interval
    musicTimer++;
    if (musicTimer >= 30) {
      musicTimer = 0;
      let freq = notes[noteIndex];
      noteIndex = (noteIndex + 1) % notes.length;
      oscMusic.freq(freq);
      envMusic.play(oscMusic, 0, 0.2);
    }

    // Screen flash effect (on player death)
    if (flashAlpha > 0) {
      fill(255, 255, 255, flashAlpha);
      rect(0, 0, width, height);
      flashAlpha -= 15;
    }
  } else if (gameState === 2) {
    const rankingFullscreen = document.getElementById('ranking-fullscreen');
    const canvas = document.getElementById('defaultCanvas0');

    if (rankingFullscreen && rankingFullscreen.style.display !== 'flex') {
      const finalScoreElement = document.getElementById('final-score');
      if (finalScoreElement) {
        finalScoreElement.textContent = 'Score: ' + score;
      }
      rankingFullscreen.style.display = 'flex';
      // p5.jsのインスタンスを完全に破棄し、イベントハンドラを無効化
      if (canvas) {
        canvas.style.display = 'none';
        canvas.style.pointerEvents = 'none';
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
      
      // p5.jsのインスタンスを破棄
      window.canvas = null;
      
      // タッチイベントを完全に無効化
      window.touchStarted = null;
      window.touchMoved = null;
      window.touchEnded = null;
      window.mousePressed = null;
      window.mouseReleased = null;
      
      // ランキング画面のタッチイベントを強化
      document.getElementById('ranking-fullscreen').style.pointerEvents = 'auto';
      document.getElementById('username-input-fullscreen').style.pointerEvents = 'auto';
      document.getElementById('submit-btn-fullscreen').style.pointerEvents = 'auto';
      document.getElementById('restart-btn').style.pointerEvents = 'auto';
      setTimeout(() => {
        const usernameInput = document.getElementById('username-input-fullscreen');
        if (usernameInput) {
          usernameInput.focus();
          usernameInput.select();
        }
      }, 100);
      if (typeof fetchAndShowRankingFullscreen === 'function') {
        fetchAndShowRankingFullscreen();
      } else if (typeof fetchAndShowRanking === 'function') {
        fetchAndShowRanking('ranking-list-fullscreen');
      }
      window.lastScore = score;
    }
    noLoop();
  }
  drawTouchButtons();
}

function keyPressed() {
  // Check if an input field is focused
  const activeElement = document.activeElement;
  const inputFieldIds = ['username-input', 'username-input-fullscreen'];
  if (activeElement && inputFieldIds.includes(activeElement.id)) {
    // If an input field is focused, stop p5.js from processing the event further
    // and let the browser handle it natively.
    if (event) {
      event.stopPropagation();
    }
    return; // Prevent further execution of p5.js key handling logic
  }

  // Start audio context on first key press
  if (!audioStarted) {
    userStartAudio();
    oscMusic.start();
    audioStarted = true;
  }
  
  // Restart game if in game over or start screen state
  if ((gameState === 0 || gameState === 2)) {
    if (keyCode === ENTER) {
      // 
      const rankingFullscreen = document.getElementById('ranking-fullscreen');
      if (rankingFullscreen && rankingFullscreen.style.display === 'flex') {
        // 
      } else {
        startGame();
      }
    }
  } else if (gameState === 1) {
    // Shoot bullet if 'z' or SPACE is pressed
    if (key === 'z' || key === ' ' || keyCode === 32) {
      if (shootCooldown <= 0) {
        // 
        if (powerupTimer > 0) {
          bullets.push(new Bullet(player.x, player.y - PLAYER_R));
          let b1 = new Bullet(player.x, player.y - PLAYER_R);
          b1.angle = -0.25; // 
          bullets.push(b1);
          let b2 = new Bullet(player.x, player.y - PLAYER_R);
          b2.angle = 0.25; // 
          bullets.push(b2);
        } else {
          bullets.push(new Bullet(player.x, player.y - PLAYER_R));
        }
        shootCooldown = 10; // 10
        // Play shoot sound
        oscShoot.start();
        envShoot.play(oscShoot);
      }
    }
    // 
    if (key === 'x' || key === 'X') {
      enemies = [];
      enemyBullets = [];
      // 
      for (let i = 0; i < 50; i++) {
        let angle = random(TWO_PI);
        let speed = random(2, 8);
        particles.push(new Particle(random(width), random(height), angle, speed, [255, 100, 50]));
      }
    }
  }
}

function startGame() {
  // Initialize audio on first user interaction
  if (!audioStarted) {
    userStartAudio();
    oscMusic.start(); oscMusic.amp(0);
    oscShoot.start(); oscShoot.amp(0);
    noiseExpl.start(); noiseExpl.amp(0);
    audioStarted = true;
  } else {
    // Resume background oscillator if it was stopped
    oscMusic.start();
    oscMusic.amp(0);
  }
  // Reset game variables
  score = 0;
  bullets = [];
  enemies = [];
  enemyBullets = [];
  powerupTimer = 0;
  electricItems = [];
  spawnInterval = INITIAL_SPAWN_INTERVAL;
  spawnTimer = spawnInterval;
  noteIndex = 0;
  musicTimer = 0;
  shootCooldown = 0;
  flashAlpha = 0;
  // Reset player position
  player.x = width / 2;
  player.y = height - BUTTON_AREA_HEIGHT - 40;

  // Hide fullscreen ranking and show canvas
  const rankingFullscreen = document.getElementById('ranking-fullscreen');
  if (rankingFullscreen) {
    rankingFullscreen.style.display = 'none';
  }
  const canvas = document.getElementById('defaultCanvas0');
  // 新しいp5.jsインスタンスを作成
  if (!window.canvas) {
    window.canvas = createCanvas(600, 600);
    window.canvas.elt.id = "defaultCanvas0";
    window.canvas.style('display', 'block');
    window.canvas.style('pointer-events', 'auto');
    
    // タッチイベントを再設定
    initTouchButtons();
  } else {
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'auto';
  }

  // 
  const rankingEmbedded = document.getElementById('ranking-embedded');
  if (rankingEmbedded) rankingEmbedded.style.display = 'none';
  window.leaderboardShown = false;
  
  gameState = 1;
  window.gameState = gameState;
  loop(); // Resume p5.js draw loop
}

// Player class (Zinc shooter)
class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - BUTTON_AREA_HEIGHT - 40;
    this.speed = 5;
  }
  show() {
    push();
    // パワーアップ時は光るエフェクト
    if (powerupTimer > 0) {
      for (let i = 0; i < 8; i++) {
        let a = TWO_PI * i / 8 + frameCount * 0.1;
        let px = this.x + 22 * cos(a);
        let py = this.y + 22 * sin(a);
        fill(100, 255, 255, 120 + 80 * sin(frameCount * 0.4 + i));
        noStroke();
        ellipse(px, py, 10, 10);
      }
    }
    // Draw player as an upward-pointing triangle (cartoon rocket/turret)
    fill(100, 200, 255);
    stroke(0);
    strokeWeight(2);
    let size = 15;
    triangle(this.x, this.y - size, 
             this.x - size, this.y + size, 
             this.x + size, this.y + size);
    // Small detail (window/eye)
    noStroke();
    fill(0);
    ellipse(this.x, this.y, 5, 5);
    pop();
  }
}

// Bullet class (Zinc bullet)
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = BULLET_R;
    this.speed = 7;
    this.toRemove = false;
    this.trail = [];
    this.angle = 0; // 3WAY用
  }
  update() {
    this.trail.push({x: this.x, y: this.y});
    if (this.trail.length > 8) this.trail.shift();
    // 3WAY時は斜めに進む
    this.x += sin(this.angle) * this.speed;
    this.y -= cos(this.angle) * this.speed;
  }
  show() {
    // 軌道エフェクト（青白い残像）
    noFill();
    stroke(100, 200, 255, 80);
    beginShape();
    for (let p of this.trail) {
      vertex(p.x, p.y);
    }
    endShape();
    // 弾本体
    noStroke();
    fill(180, 180, 255);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
  }
}

// 電気アイテムクラス
class ElectricItem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 16;
    this.vy = 2.2;
    this.toRemove = false;
  }
  update() {
    this.y += this.vy;
    // プレイヤー取得判定
    if (!this.toRemove && dist(this.x, this.y, player.x, player.y) < this.r + PLAYER_R) {
      this.toRemove = true;
      powerupTimer = 600; // 10秒間
      // パワーアップ取得エフェクト
      for (let i = 0; i < 18; i++) {
        let a = random(TWO_PI);
        let s = random(3, 6);
        particles.push(new Particle(this.x, this.y, a, s, [255, 255, 100]));
      }
    }
    // 下に消えたら削除
    if (this.y - this.r > height) this.toRemove = true;
  }
  show() {
    push();
    translate(this.x, this.y);
    // 光る球体
    for (let i = 0; i < 6; i++) {
      fill(180, 255, 100, 70);
      ellipse(0, 0, 32 - i * 4, 32 - i * 4);
    }
    // 稲妻マーク
    stroke(255, 255, 100);
    strokeWeight(3);
    noFill();
    beginShape();
    vertex(-4, -6);
    vertex(0, 0);
    vertex(-2, 0);
    vertex(4, 8);
    endShape();
    pop();
  }
}

// --- 敵弾クラス ---
class EnemyBullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = cos(angle) * 4.2;
    this.vy = sin(angle) * 4.2;
    this.r = 5; // 半径を10から5に変更（サイズを1/2に）
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
  }
  show() {
    push();
    noStroke();
    fill(255, 80, 80, 220);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
    pop();
  }
}

// パーティクルクラス
class Particle {
  constructor(x, y, angle, speed, color) {
    this.x = x;
    this.y = y;
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.life = 20 + random(10);
    this.color = color;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }
  show() {
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], map(this.life, 0, 30, 0, 255));
    ellipse(this.x, this.y, 4, 4);
  }
  isDead() {
    return this.life <= 0;
  }
}

// Enemy class (Bismuth enemy -> Nihonium)
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.type = 'bismuth';
    this.lifeTime = 0;
  }
  update() {
    if (this.type === 'bismuth') {
      // Move and bounce off walls
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < ENEMY_R || this.x > width - ENEMY_R) {
        this.vx *= -1;
      }
      // Basic homing: adjust horizontal velocity toward player occasionally
      if (player && frameCount % 60 === 0) {
        let direction = (player.x > this.x) ? 1 : -1;
        this.vx += 0.2 * direction;
        this.vx = constrain(this.vx, -3, 3);
      }
    } else if (this.type === 'nihonium') {
      // Count down lifespan
      this.lifeTime--;
    }
  }
  show() {
    if (this.type === 'bismuth') {
      // Draw Bismuth as layered colorful squares
      push();
      rectMode(CENTER);
      stroke(0);
      strokeWeight(2);
      fill(255, 0, 255);
      rect(this.x, this.y, ENEMY_R * 2, ENEMY_R * 2);
      fill(0, 255, 255);
      rect(this.x, this.y, ENEMY_R * 1.5, ENEMY_R * 1.5);
      fill(255, 255, 0);
      rect(this.x, this.y, ENEMY_R, ENEMY_R);
      pop();
      // Label with "Bi"
      push();
      textAlign(CENTER, CENTER);
      textSize(12);
      fill(0);
      text("Bi", this.x, this.y);
      pop();
    } else if (this.type === 'nihonium') {
      // Draw Nihonium as a glowing circle
      push();
      let alpha = map(this.lifeTime, 0, NIHONIUM_DURATION, 0, 255);
      fill(100, 255, 100, alpha);
      stroke(0, alpha);
      strokeWeight(2);
      ellipse(this.x, this.y, ENEMY_R * 2, ENEMY_R * 2);
      // Label with "Nh"
      textAlign(CENTER, CENTER);
      fill(0, alpha);
      textSize(14);
      text("Nh", this.x, this.y);
      pop();
    }
  }
  transform() {
    if (this.type === 'bismuth') {
      // Transform into Nihonium (stop movement and start fade-out timer)
      this.type = 'nihonium';
      this.lifeTime = NIHONIUM_DURATION;
      this.vx = 0;
      this.vy = 0;
    }
  }
}
