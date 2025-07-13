const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const BUBBLE_RADIUS = 20;
const BUBBLE_COLORS = ['#ff6b6b', '#4ecdc4', '#f1c40f', '#2ecc71', '#9b59b6', '#3498db'];
const ROWS = 12;
const COLS = 10;
const SHOOTER_Y = canvas.height - 50;

let bubbleGrid = [];
let shooter = {
    x: canvas.width / 2,
    y: SHOOTER_Y,
    angle: 0,
    bubble: null,
    nextBubble: null
};
let projectile = null;
let score = 0;
let level = 1;
let gameOver = false;
let highScore = 0;
let fallingBubbles = [];
let shotsUntilDrop = 15;
let shotsFired = 0;
let ceilingOffset = 0;
let particles = [];
const GAME_OVER_LINE = (ROWS - 1) * BUBBLE_RADIUS * 1.8 + BUBBLE_RADIUS + 10;

// 効果音システム
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.muted = false;
        this.initAudio();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('音声がサポートされていません');
        }
    }

    createSound(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.audioContext || this.muted) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            // エラーを無視
        }
    }

    playShoot() {
        this.createSound(220, 0.1, 'square', 0.05);
    }

    playPop() {
        this.createSound(440, 0.2, 'sine', 0.08);
        setTimeout(() => this.createSound(550, 0.15, 'sine', 0.06), 50);
    }

    playDrop() {
        this.createSound(150, 0.3, 'sawtooth', 0.04);
    }

    playLevelUp() {
        this.createSound(523, 0.2, 'sine', 0.1);
        setTimeout(() => this.createSound(659, 0.2, 'sine', 0.1), 200);
        setTimeout(() => this.createSound(784, 0.3, 'sine', 0.1), 400);
    }

    playGameOver() {
        this.createSound(200, 0.5, 'sawtooth', 0.08);
        setTimeout(() => this.createSound(150, 0.5, 'sawtooth', 0.08), 250);
        setTimeout(() => this.createSound(100, 0.8, 'sawtooth', 0.08), 500);
    }

    toggle() {
        this.muted = !this.muted;
        return !this.muted;
    }
}

const soundManager = new SoundManager();

// パーティクルエフェクトクラス
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 2;
        this.life = 1.0;
        this.decay = 0.02;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // 重力
        this.vx *= 0.98; // 空気抵抗
        this.life -= this.decay;
        this.size *= 0.98;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0 || this.size <= 0.5;
    }
}

class Bubble {
    constructor(x, y, color, row = -1, col = -1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = BUBBLE_RADIUS;
        this.row = row;
        this.col = col;
        this.vx = 0;
        this.vy = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, this.radius / 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
            this.vx = -this.vx;
        }
    }

    updateFalling() {
        this.vy += 0.5;
        this.x += this.vx;
        this.y += this.vy;
    }

    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

function getLevelConfig(level) {
    const configs = {
        1: { colors: 3, rows: 3, shotsUntilDrop: 15 },
        2: { colors: 4, rows: 4, shotsUntilDrop: 12 },
        3: { colors: 5, rows: 4, shotsUntilDrop: 10 },
        4: { colors: 6, rows: 5, shotsUntilDrop: 9 },
        5: { colors: 6, rows: 5, shotsUntilDrop: 8 }
    };
    return configs[Math.min(level, 5)] || configs[5];
}

function getColorsForLevel(level) {
    const config = getLevelConfig(level);
    return BUBBLE_COLORS.slice(0, config.colors);
}

function initGame() {
    bubbleGrid = [];
    fallingBubbles = [];
    score = 0;
    level = 1;
    gameOver = false;
    shotsFired = 0;
    ceilingOffset = 0;
    
    const config = getLevelConfig(level);
    shotsUntilDrop = config.shotsUntilDrop;
    
    loadHighScore();
    updateScore();
    hideModal();
    
    generateBubblesForLevel(level);
    createNewShooterBubble();
}

function generateBubblesForLevel(level) {
    const config = getLevelConfig(level);
    const levelColors = getColorsForLevel(level);
    
    for (let row = 0; row < config.rows; row++) {
        bubbleGrid[row] = [];
        for (let col = 0; col < COLS; col++) {
            if (row % 2 === 0 || col < COLS - 1) {
                const x = col * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + (row % 2 ? BUBBLE_RADIUS : 0);
                const y = row * (BUBBLE_RADIUS * 1.8) + BUBBLE_RADIUS + 10;
                const color = levelColors[Math.floor(Math.random() * levelColors.length)];
                bubbleGrid[row][col] = new Bubble(x, y, color, row, col);
            }
        }
    }
}

function getAvailableColors() {
    const colorsInGrid = new Set();
    
    for (let row = 0; row < bubbleGrid.length; row++) {
        for (let col = 0; col < COLS; col++) {
            if (bubbleGrid[row][col]) {
                colorsInGrid.add(bubbleGrid[row][col].color);
            }
        }
    }
    
    const levelColors = getColorsForLevel(level);
    return colorsInGrid.size > 0 ? Array.from(colorsInGrid) : levelColors;
}

function createNewShooterBubble() {
    if (shooter.nextBubble) {
        shooter.bubble = new Bubble(shooter.x, shooter.y, shooter.nextBubble.color);
    } else {
        const availableColors = getAvailableColors();
        const color = availableColors[Math.floor(Math.random() * availableColors.length)];
        shooter.bubble = new Bubble(shooter.x, shooter.y, color);
    }
    
    const availableColors = getAvailableColors();
    const nextColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    shooter.nextBubble = new Bubble(canvas.width - 40, SHOOTER_Y + 20, nextColor);
}

function drawShooter() {
    ctx.save();
    ctx.translate(shooter.x, shooter.y);
    ctx.rotate(shooter.angle);
    
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -200);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.restore();
    
    if (shooter.bubble) {
        shooter.bubble.x = shooter.x;
        shooter.bubble.y = shooter.y;
        shooter.bubble.draw();
    }
    
    // Nextバブルの表示
    if (shooter.nextBubble) {
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '14px Arial';
        ctx.fillText('NEXT', canvas.width - 55, SHOOTER_Y - 10);
        shooter.nextBubble.draw();
    }
}

function shootBubble() {
    if (projectile || !shooter.bubble || gameOver) return;
    
    soundManager.playShoot();
    
    const speed = 10;
    projectile = shooter.bubble;
    projectile.vx = Math.sin(shooter.angle) * speed;
    projectile.vy = -Math.cos(shooter.angle) * speed;
    
    shooter.bubble = null;
    shotsFired++;
    
    if (shotsFired >= shotsUntilDrop) {
        dropCeiling();
        shotsFired = 0;
    }
}

function checkCollision() {
    if (!projectile) return;
    
    for (let row = 0; row < bubbleGrid.length; row++) {
        for (let col = 0; col < COLS; col++) {
            const bubble = bubbleGrid[row][col];
            if (bubble && projectile.distanceTo(bubble) < BUBBLE_RADIUS * 2) {
                snapToGrid();
                return;
            }
        }
    }
    
    if (projectile.y - projectile.radius <= ceilingOffset) {
        snapToGrid();
    }
}

function snapToGrid() {
    const row = Math.floor((projectile.y - 10 - ceilingOffset) / (BUBBLE_RADIUS * 1.8));
    let col;
    
    if (row % 2 === 0) {
        col = Math.round((projectile.x - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 2));
    } else {
        col = Math.round((projectile.x - BUBBLE_RADIUS * 2) / (BUBBLE_RADIUS * 2));
    }
    
    col = Math.max(0, Math.min(col, COLS - 1));
    
    if (!bubbleGrid[row]) {
        bubbleGrid[row] = [];
    }
    
    const x = col * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + (row % 2 ? BUBBLE_RADIUS : 0);
    const y = row * (BUBBLE_RADIUS * 1.8) + BUBBLE_RADIUS + 10 + ceilingOffset;
    
    projectile.x = x;
    projectile.y = y;
    projectile.row = row;
    projectile.col = col;
    projectile.vx = 0;
    projectile.vy = 0;
    
    bubbleGrid[row][col] = projectile;
    
    checkMatches(projectile);
    projectile = null;
    createNewShooterBubble();
    
    if (checkGameOver()) {
        gameOver = true;
        soundManager.playGameOver();
        showModal('ゲームオーバー！', `スコア: ${score}`);
    }
}

function getNeighbors(bubble) {
    const neighbors = [];
    const row = bubble.row;
    const col = bubble.col;
    const directions = row % 2 === 0 
        ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
        : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
    
    directions.forEach(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        if (bubbleGrid[newRow] && bubbleGrid[newRow][newCol]) {
            neighbors.push(bubbleGrid[newRow][newCol]);
        }
    });
    
    return neighbors;
}

function findMatches(bubble, color, visited = new Set()) {
    const key = `${bubble.row},${bubble.col}`;
    if (visited.has(key) || bubble.color !== color) return [];
    
    visited.add(key);
    const matches = [bubble];
    
    const neighbors = getNeighbors(bubble);
    neighbors.forEach(neighbor => {
        matches.push(...findMatches(neighbor, color, visited));
    });
    
    return matches;
}

function checkMatches(bubble) {
    const matches = findMatches(bubble, bubble.color);
    
    if (matches.length >= 3) {
        soundManager.playPop();
        
        matches.forEach(match => {
            // パーティクルエフェクトを生成
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(match.x, match.y, match.color));
            }
            bubbleGrid[match.row][match.col] = null;
            score += 10;
        });
        updateScore();
        removeFloatingBubbles();
        
        if (checkClear()) {
            score += 100 * level;
            updateScore();
            soundManager.playLevelUp();
            setTimeout(() => {
                nextLevel();
                createNewShooterBubble();
            }, 500);
        }
    }
}

function removeFloatingBubbles() {
    const connected = new Set();
    
    for (let col = 0; col < COLS; col++) {
        if (bubbleGrid[0] && bubbleGrid[0][col]) {
            markConnected(bubbleGrid[0][col], connected);
        }
    }
    
    let removed = 0;
    for (let row = 0; row < bubbleGrid.length; row++) {
        for (let col = 0; col < COLS; col++) {
            const bubble = bubbleGrid[row][col];
            if (bubble && !connected.has(`${bubble.row},${bubble.col}`)) {
                // 落下エフェクト用のパーティクル
                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(bubble.x, bubble.y, bubble.color));
                }
                
                bubble.vx = (Math.random() - 0.5) * 2;
                bubble.vy = -2;
                fallingBubbles.push(bubble);
                bubbleGrid[row][col] = null;
                score += 20;
                removed++;
            }
        }
    }
    
    if (removed > 0) {
        soundManager.playDrop();
        updateScore();
    }
}

function markConnected(bubble, connected) {
    const key = `${bubble.row},${bubble.col}`;
    if (connected.has(key)) return;
    
    connected.add(key);
    const neighbors = getNeighbors(bubble);
    neighbors.forEach(neighbor => markConnected(neighbor, connected));
}

function checkGameOver() {
    for (let row = 0; row < bubbleGrid.length; row++) {
        for (let col = 0; col < COLS; col++) {
            if (bubbleGrid[row][col]) {
                const bubbleBottom = bubbleGrid[row][col].y + BUBBLE_RADIUS;
                if (bubbleBottom >= GAME_OVER_LINE) {
                    return true;
                }
            }
        }
    }
    return false;
}

function checkClear() {
    for (let row = 0; row < bubbleGrid.length; row++) {
        for (let col = 0; col < COLS; col++) {
            if (bubbleGrid[row][col]) {
                return false;
            }
        }
    }
    return true;
}

function nextLevel() {
    level++;
    
    const config = getLevelConfig(level);
    shotsUntilDrop = config.shotsUntilDrop;
    ceilingOffset = 0;
    shotsFired = 0;
    
    bubbleGrid = [];
    generateBubblesForLevel(level);
    updateScore();
}

function dropCeiling() {
    ceilingOffset += BUBBLE_RADIUS * 1.8;
    soundManager.playDrop();
    
    for (let row = 0; row < bubbleGrid.length; row++) {
        for (let col = 0; col < COLS; col++) {
            if (bubbleGrid[row][col]) {
                bubbleGrid[row][col].y += BUBBLE_RADIUS * 1.8;
            }
        }
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('highScore').textContent = highScore;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 天井を描画
    if (ceilingOffset > 0) {
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, canvas.width, ceilingOffset);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, ceilingOffset);
        ctx.lineTo(canvas.width, ceilingOffset);
        ctx.stroke();
    }
    
    // 次の天井落下までのカウント表示（右側に移動）
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Shots until drop: ${shotsUntilDrop - shotsFired}`, canvas.width - 10, GAME_OVER_LINE + 20);
    ctx.textAlign = 'left';
    
    // ゲームオーバーラインを描画
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, GAME_OVER_LINE);
    ctx.lineTo(canvas.width, GAME_OVER_LINE);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 危険ゾーンの警告テキスト
    ctx.fillStyle = '#e74c3c';
    ctx.font = '12px Arial';
    ctx.fillText('DANGER LINE', 10, GAME_OVER_LINE - 5);
    
    for (let row = 0; row < bubbleGrid.length; row++) {
        for (let col = 0; col < COLS; col++) {
            const bubble = bubbleGrid[row][col];
            if (bubble) {
                bubble.draw();
            }
        }
    }
    
    // パーティクルエフェクトを描画
    particles = particles.filter(particle => {
        particle.update();
        particle.draw();
        return !particle.isDead();
    });
    
    // 落下中のバブルを描画
    fallingBubbles = fallingBubbles.filter(bubble => {
        bubble.updateFalling();
        bubble.draw();
        return bubble.y < canvas.height + BUBBLE_RADIUS;
    });
    
    drawShooter();
    
    if (projectile) {
        projectile.update();
        projectile.draw();
        checkCollision();
    }
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const dx = mouseX - shooter.x;
    const dy = mouseY - shooter.y;
    
    shooter.angle = Math.atan2(dx, -dy);
    shooter.angle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, shooter.angle));
});

canvas.addEventListener('click', () => {
    shootBubble();
});

document.getElementById('newGame').addEventListener('click', () => {
    initGame();
});

function loadHighScore() {
    const saved = localStorage.getItem('bubbleShooterHighScore');
    if (saved) {
        highScore = parseInt(saved);
    }
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('bubbleShooterHighScore', highScore);
        updateScore();
    }
}

function showModal(title, message) {
    saveHighScore();
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('modal').style.display = 'block';
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
}

document.getElementById('modalRestart').addEventListener('click', () => {
    hideModal();
    initGame();
});

document.getElementById('soundToggle').addEventListener('click', () => {
    const isEnabled = soundManager.toggle();
    const button = document.getElementById('soundToggle');
    button.textContent = isEnabled ? '🔊 音声ON' : '🔇 音声OFF';
});

// 初期化時にユーザーインタラクションで音声コンテキストを開始
document.addEventListener('click', () => {
    if (soundManager.audioContext && soundManager.audioContext.state === 'suspended') {
        soundManager.audioContext.resume();
    }
}, { once: true });

initGame();
gameLoop();