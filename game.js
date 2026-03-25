const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const sndEat = document.getElementById("snd-eat");
const sndDie = document.getElementById("snd-die");
const sndClick = document.getElementById("snd-click");

let snake, food, obstacles, dx, dy, score, gameInterval;
let currentDifficulty = 'Vừa';
let speed = 130;
let highScore = localStorage.getItem("snakeHS") || 0;

const EMOJI = { snake: '🐍', green: '🍏', red: '🍎', wall: '🧱' };
document.getElementById("high-score").innerText = `Kỷ lục: ${highScore}`;

function playSound(s) { s.currentTime = 0; s.play().catch(() => {}); }

// --- THÔNG BÁO HỆ THỐNG ---
function initNotifications() {
    if ("Notification" in window) {
        Notification.requestPermission().then(perm => {
            if (perm === "granted") {
                const times = [{h:11, m:0}, {h:17, m:0}, {h:21, m:0}];
                times.forEach(t => {
                    let d = new Date();
                    d.setHours(t.h, t.m, 0);
                    if (new Date() > d) d.setDate(d.getDate() + 1);
                    setTimeout(() => {
                        sendNotif();
                        setInterval(sendNotif, 24*60*60*1000);
                    }, d.getTime() - new Date().getTime());
                });
            }
        });
    }
}
function sendNotif() {
    navigator.serviceWorker.ready.then(reg => {
        reg.showNotification("😎 Đến giờ thể hiện của mình rồi!", {
            body: "Hãy vào trò chơi và bắt đầu phá kỷ lục ngay nào.",
            icon: "192x192.png", badge: "192x192.png", tag: "snake-daily", vibrate: [500, 100, 500]
        });
    });
}
initNotifications();

// --- MENU ---
function showDifficulty() {
    playSound(sndClick);
    Swal.fire({
        title: 'Chọn mức độ',
        input: 'radio',
        inputOptions: { 'Dễ': 'Dễ 🍏', 'Vừa': 'Vừa 🧱', 'Khó': 'Khó 🔥', 'Siêu Khó': 'Siêu Khó 💀' },
        inputValue: currentDifficulty
    }).then(res => { 
        if(res.value) {
            currentDifficulty = res.value;
            Swal.fire({ title: "Thành công!", text: `Bạn đã chọn mức độ ${currentDifficulty}!`, icon: "success", timer: 1500, showConfirmButton: false });
        }
    });
}

function exitGame() {
    playSound(sndClick);
    Swal.fire({
        title: "Bạn chắc muốn thoát?",
        text: "Mọi nỗ lực săn mồi sẽ bị hủy bỏ đó nha!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Tôi chắc chắn"
    }).then((result) => {
        if (result.isConfirmed) window.location.href = "about:blank";
    });
}

// --- GAME CORE ---
function setupLevel() {
    obstacles = [];
    if (currentDifficulty === 'Dễ') speed = 180;
    else if (currentDifficulty === 'Vừa') {
        speed = 130;
        for(let i=0; i<400; i+=20) if(Math.random()>0.85) obstacles.push({x:i, y:0},{x:i, y:380});
    } else if (currentDifficulty === 'Khó') {
        speed = 100;
        for(let i=80; i<320; i+=20) obstacles.push({x:120, y:i}, {x:280, y:i});
    } else {
        speed = 70;
        for(let i=0; i<20; i++) obstacles.push({x:Math.floor(Math.random()*19)*20, y:Math.floor(Math.random()*19)*20});
    }
}

function startGame() {
    playSound(sndClick);
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    resetGame();
}

function resetGame() {
    snake = [{x: 200, y: 200}, {x: 180, y: 200}]; dx = 20; dy = 0; score = 0;
    document.getElementById("score").innerText = "Điểm: 0";
    setupLevel(); createFood();
    if(gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(draw, speed);
}

function createFood() {
    food = { x: Math.floor(Math.random()*19)*20, y: Math.floor(Math.random()*19)*20, type: Math.random() < 0.2 ? 'red' : 'green' };
    if(obstacles.some(o => o.x === food.x && o.y === food.y) || snake.some(s => s.x === food.x && s.y === food.y)) createFood();
}

function draw() {
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(0,0,400,400);
    ctx.font = "18px Arial"; ctx.textBaseline = "top";
    obstacles.forEach(o => ctx.fillText(EMOJI.wall, o.x, o.y));
    ctx.fillText(food.type === 'red' ? EMOJI.red : EMOJI.green, food.x, food.y);
    snake.forEach(s => ctx.fillText(EMOJI.snake, s.x, s.y));

    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    if (head.x<0 || head.x>=400 || head.y<0 || head.y>=400 || 
        snake.some(p => p.x===head.x && p.y===head.y) || obstacles.some(o => o.x===head.x && o.y===head.y)) {
        gameOver(); return;
    }
    snake.unshift(head);
    if(head.x===food.x && head.y===food.y) {
        if (food.type === 'red') {
            score += 5;
            if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
        } else {
            score += 1;
            if ("vibrate" in navigator) navigator.vibrate(40);
        }
        document.getElementById("score").innerText = `Điểm: ${score}`;
        playSound(sndEat); createFood();
    } else snake.pop();
}

function gameOver() {
    playSound(sndDie); clearInterval(gameInterval);
    if(score > highScore) { highScore = score; localStorage.setItem("snakeHS", highScore); }
    Swal.fire({ title: 'BẠN ĐÃ DIE! 💀', html: `Điểm: ${score} <br> Kỷ lục: ${highScore}`, confirmButtonText: 'Thử lại', showCancelButton: true, cancelButtonText: 'Menu' })
    .then(res => { if(res.isConfirmed) resetGame(); else location.reload(); });
}

const move = (nx, ny) => { if(nx!==-dx || ny!==-dy) { dx=nx; dy=ny; playSound(sndClick); } };
document.getElementById("btn-up").onclick = () => move(0,-20);
document.getElementById("btn-down").onclick = () => move(0,20);
document.getElementById("btn-left").onclick = () => move(-20,0);
document.getElementById("btn-right").onclick = () => move(20,0);
window.onkeydown = e => {
    if(e.key.includes("Up")) move(0,-20); if(e.key.includes("Down")) move(0,20);
    if(e.key.includes("Left")) move(-20,0); if(e.key.includes("Right")) move(20,0);
};

