const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const BUBBLE_RADIUS = 20;
const BUBBLE_COLORS = ['#ff6b6b', '#4ecdc4', '#f1c40f', '#e74c3c', '#9b59b6', '#3498db'];
const ROWS = 12;
const COLS = 10;
const SHOOTER_Y = canvas.height - 50;

let bubbleGrid = [];
let shooter = {
    x: canvas.width / 2,
    y: SHOOTER_Y,
    angle: 0,
    bubble: null
};
let projectile = null;
let score = 0;
let level = 1;
let gameOver = false;
let fallingBubbles = [];
const GAME_OVER_LINE = (ROWS - 1) * BUBBLE_RADIUS * 1.8 + BUBBLE_RADIUS + 10;

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

function initGame() {
    bubbleGrid = [];
    fallingBubbles = [];
    score = 0;
    level = 1;
    gameOver = false;
    updateScore();
    
    for (let row = 0; row < 5; row++) {
        bubbleGrid[row] = [];
        for (let col = 0; col < COLS; col++) {
            if (row % 2 === 0 || col < COLS - 1) {
                const x = col * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + (row % 2 ? BUBBLE_RADIUS : 0);
                const y = row * (BUBBLE_RADIUS * 1.8) + BUBBLE_RADIUS + 10;
                const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
                bubbleGrid[row][col] = new Bubble(x, y, color, row, col);
            }
        }
    }
    
    createNewShooterBubble();
}

function createNewShooterBubble() {
    const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    shooter.bubble = new Bubble(shooter.x, shooter.y, color);
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
}

function shootBubble() {
    if (projectile || !shooter.bubble || gameOver) return;
    
    const speed = 10;
    projectile = shooter.bubble;
    projectile.vx = Math.sin(shooter.angle) * speed;
    projectile.vy = -Math.cos(shooter.angle) * speed;
    
    shooter.bubble = null;
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
    
    if (projectile.y - projectile.radius <= 0) {
        snapToGrid();
    }
}

function snapToGrid() {
    const row = Math.floor((projectile.y - 10) / (BUBBLE_RADIUS * 1.8));
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
    const y = row * (BUBBLE_RADIUS * 1.8) + BUBBLE_RADIUS + 10;
    
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
        alert(`ゲームオーバー！ スコア: ${score}`);
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
        matches.forEach(match => {
            bubbleGrid[match.row][match.col] = null;
            score += 10;
        });
        updateScore();
        removeFloatingBubbles();
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
    for (let col = 0; col < COLS; col++) {
        if (bubbleGrid[ROWS - 1] && bubbleGrid[ROWS - 1][col]) {
            return true;
        }
    }
    return false;
}

function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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

initGame();
gameLoop();