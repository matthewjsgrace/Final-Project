// GAME: The Survival Circuit
// Group Members: Arthur Carvalho, Ben Trader, Matthew Grace
// ATLS 1350 Final Project

// Global Variables
let player;
let obstacles = [];
let powerUps = [];
let lanes = [];
let gameState = "home"; // Current game state: home, play, gameover, levelup
let level = 1;
let score = 0;
let highScore = 0;
let leaderboard = [];
let users = [];

// Image files
let playerCarImage;
let oilImage;
let tireImage;
let coneImage;

// Login State Variables
let tempName = '';
let playerName = '';
let playerPassword = '';
let enteringPassword = false;
let nameInputActive = true;

// Power-Up State
let intangibilityTimer = 0;
let slowMotionTimer = 0;
let slowMotionActive = false;
let intangibilityActive = false;
let activePowerUp = null;

// Transition Between Levels
let transitionTimer = 0;
let transitioning = false;

// Movement Controls
let moveLeft = false, moveRight = false, moveUp = false, moveDown = false;

function preload() {
  // Load images
  playerCarImage = loadImage('images/car.PNG');
  oilImage = loadImage('images/oil.PNG');
  tireImage = loadImage('images/tire.PNG');
  coneImage = loadImage('images/cone.webp');
}

function setup() {
  createCanvas(400, 550);
  textFont('monospace');
  lanes = [60, 120, 200, 280, 340];
  player = new Car();
  generateObstacles();
  generatePowerUps();
}

function draw() {
  background(getLevelColor(level)); // Set background color by level

  if (gameState === "home") showHomeScreen();
  else if (gameState === "play") updateGame();
  else if (gameState === "gameover") showGameOverScreen();
  else if (gameState === "levelup") showLevelUpScreen();
}

class Car {
  constructor() {
    this.x = lanes[2];
    this.y = height - 100;
    this.size = 40;
    this.speed = 8;
  }
  display() {
    imageMode(CENTER);
    image(playerCarImage, this.x, this.y, this.size, this.size * 1.5);
  }
  move() {
    if (moveLeft && this.x > 30) this.x -= this.speed;
    if (moveRight && this.x < width - 30) this.x += this.speed;
    if (moveUp && this.y > 50) this.y -= this.speed;
    if (moveDown && this.y < height - 50) this.y += this.speed;
  }
  update() {
    this.move();
    if (intangibilityActive) {
      intangibilityTimer--;
      if (intangibilityTimer <= 0) intangibilityActive = false;
    }
  }
}

class Obstacle {
  constructor(laneIndex, speed) {
    this.lane = laneIndex;
    this.x = lanes[this.lane];
    this.y = -random(100, 1000);
    this.w = random(30, 50);
    this.h = random(30, 60);
    this.speed = speed;
    this.image = this.getRandomImage(); // Randomly assign image
  }

  getRandomImage() {
    const randomNumber = random();
    if (randomNumber < 0.33) return oilImage;
    if (randomNumber < 0.66) return tireImage;
    return coneImage;
  }

  display() {
    imageMode(CENTER);
    image(this.image, this.x, this.y, this.w, this.h);
  }

  update() {
    this.y += slowMotionActive ? this.speed * 0.4 : this.speed;
  }

  hits(car) {
    return (
      abs(this.x - car.x) < (this.w + car.size) / 2 &&
      abs(this.y - car.y) < (this.h + car.size * 1.5) / 2
    );
  }
}

class PowerUp {
  constructor(type) {
    this.type = type;
    this.x = random(lanes);
    this.y = -random(300, 1000);
    this.size = 25;
    this.collected = false;
  }
  display() {
    if (!this.collected) {
      fill(this.type === "intangibility" ? "cyan" : "orange");
      ellipse(this.x, this.y, this.size);
      fill(0);
      textSize(10);
      textAlign(CENTER, CENTER);
      text(this.type === "intangibility" ? "I" : "⏳", this.x, this.y);
    }
  }
  update() {
    if (!this.collected) {
      this.y += slowMotionActive ? 1 : 2;
      if (dist(this.x, this.y, player.x, player.y) < (this.size + player.size) / 2) {
        this.collected = true;
        activePowerUp = this.type;
      }
    }
  }
}

function updateGame() {
  player.update();
  player.display();

  for (let obs of obstacles) {
    obs.update();
    obs.display();
    if (!intangibilityActive && obs.hits(player)) {
      gameState = "gameover";
      if (score > highScore) highScore = score;
      let existing = leaderboard.find(p => p.name === playerName);
      if (existing) {
        if (score > existing.score) existing.score = score;
      } else {
        leaderboard.push({ name: playerName || 'Player', score: score });
      }
      leaderboard.sort((a, b) => b.score - a.score);
      leaderboard = leaderboard.slice(0, 3);
    }
    if (obs.y > height + obs.h) respawnObstacle(obs);
  }

  for (let p of powerUps) {
    p.update();
    p.display();
  }

  if (slowMotionActive) {
    slowMotionTimer--;
    if (slowMotionTimer <= 0) slowMotionActive = false;
  }

  fill(255);
  textSize(16);
  textAlign(LEFT);
  text(`Score: ${score}`, 10, 20);
  text(`Level: ${level}`, 10, 40);
  text(`High Score: ${highScore}`, 10, 60);
  text(`Power-Up: ${activePowerUp ? activePowerUp.toUpperCase() : ""}`, 10, 80);
  score++;

  if (score > 0 && score % 1000 === 0 && !transitioning) {
    transitioning = true;
    transitionTimer = 120;
    gameState = "levelup";
  }
}

function showHomeScreen() {
  textAlign(CENTER);
  fill(255);
  textSize(24);
  text("The Survival Circuit", width / 2, 80);
  textSize(16);

  const userExists = users.find(u => u.name === tempName);

  if (!enteringPassword) {
    text("Enter your username:", width / 2, 130);
    fill(200);
    textSize(20);
    text(tempName + (frameCount % 60 < 30 ? "|" : ""), width / 2, 160);
    fill(255);
    textSize(14);
    text("Press ENTER to continue", width / 2, 200);
  } else {
    const prompt = userExists ? "Enter your password:" : "Create your password:";
    text(prompt, width / 2, 130);
    fill(200);
    textSize(20);
    text("*".repeat(playerPassword.length) + (frameCount % 60 < 30 ? "|" : ""), width / 2, 160);
    fill(255);
    textSize(14);
    text("Press ENTER to start", width / 2, 200);
  }

  textSize(16);
  text("Leaderboard:", width / 2, 260);
  leaderboard.forEach((p, i) => {
    text(`${i + 1}. ${p.name} - ${p.score}`, width / 2, 290 + i * 20);
  });
}

function showGameOverScreen() {
  textAlign(CENTER);
  fill(255);
  textSize(32);
  text("GAME OVER", width / 2, 160);
  textSize(16);
  text(`Score: ${score}`, width / 2, 210);
  text(`High Score: ${highScore}`, width / 2, 240);
  text(`Press "R" to return to the home page`, width / 2, 280);
}

function showLevelUpScreen() {
  fill(255);
  textAlign(CENTER);
  textSize(30);
  text(`LEVEL ${level + 1}`, width / 2, height / 2);
  transitionTimer--;
  if (transitionTimer <= 0) {
    level++;
    generateObstacles();
    generatePowerUps();
    gameState = "play";
    transitioning = false;
  }
}

function generateObstacles() {
  obstacles = [];
  while (obstacles.length < 6 + level * 2) {
    let lane = floor(random(lanes.length));
    let newObs = new Obstacle(lane, random(2 + level * 0.2, 4 + level * 0.3));
    let overlaps = obstacles.some(o => dist(o.x, o.y, newObs.x, newObs.y) < 60);
    if (!overlaps) obstacles.push(newObs);
  }
}

function generatePowerUps() {
  powerUps = [];
  while (powerUps.length < 2) {
    let newPU = new PowerUp(random(["intangibility", "slow"]));
    let overlaps = powerUps.some(p => dist(p.x, p.y, newPU.x, newPU.y) < 80);
    if (!overlaps) powerUps.push(newPU);
  }
}

function respawnObstacle(obs) {
  let tries = 0;
  do {
    obs.y = -random(100, 600);
    obs.lane = floor(random(lanes.length));
    obs.x = lanes[obs.lane];
    obs.w = random(30, 50);
    obs.h = random(30, 60);
    obs.speed = random(2 + level * 0.2, 4 + level * 0.3);
    tries++;
  } while (obstacles.some(o => o !== obs && dist(o.x, o.y, obs.x, obs.y) < 60) && tries < 10);
}

function keyPressed() {
  if (gameState === "home") {
    if (!enteringPassword) {
      if (keyCode === ENTER && tempName.length > 0) {
        const user = users.find(u => u.name === tempName);
        if (user) enteringPassword = true;
        else {
          users.push({ name: tempName, password: "" });
          enteringPassword = true;
        }
      } else if (keyCode === BACKSPACE) {
        tempName = tempName.slice(0, -1);
      } else if (key.length === 1 && tempName.length < 10 && key.match(/[a-z0-9]/i)) {
        tempName += key.toUpperCase();
      }
    } else {
      if (keyCode === ENTER && playerPassword.length > 0) {
        const user = users.find(u => u.name === tempName);
        if (user.password === "") {
          user.password = playerPassword;
          loginSuccess();
        } else if (user.password === playerPassword) {
          loginSuccess();
        } else {
          playerPassword = ""; // Wrong password
        }
      } else if (keyCode === BACKSPACE) {
        playerPassword = playerPassword.slice(0, -1);
      } else if (key.length === 1 && playerPassword.length < 10) {
        playerPassword += key;
      }
    }
  }

  if (gameState === "gameover" && (key === 'r' || key === 'R')) {
    gameState = "home";
    resetLogin();
  }

  if (gameState === "play") {
    if (key === 'a' || keyCode === LEFT_ARROW) moveLeft = true;
    if (key === 'd' || keyCode === RIGHT_ARROW) moveRight = true;
    if (key === 'w' || keyCode === UP_ARROW) moveUp = true;
    if (key === 's' || keyCode === DOWN_ARROW) moveDown = true;

    if (key === ' ' && activePowerUp) {
      if (activePowerUp === "intangibility") {
        intangibilityActive = true;
        intangibilityTimer = 180;
      } else if (activePowerUp === "slow") {
        slowMotionActive = true;
        slowMotionTimer = 180;
      }
      activePowerUp = null;
    }
  }
}

function keyReleased() {
  if (key === 'a' || keyCode === LEFT_ARROW) moveLeft = false;
  if (key === 'd' || keyCode === RIGHT_ARROW) moveRight = false;
  if (key === 'w' || keyCode === UP_ARROW) moveUp = false;
  if (key === 's' || keyCode === DOWN_ARROW) moveDown = false;
}

function loginSuccess() {
  playerName = tempName;
  tempName = '';
  gameState = "play";
  score = 0;
  level = 1;
  activePowerUp = null;
  playerPassword = '';
  nameInputActive = false;
  generateObstacles();
  generatePowerUps();
}

function resetLogin() {
  tempName = '';
  playerName = '';
  playerPassword = '';
  enteringPassword = false;
  nameInputActive = true;
}

function getLevelColor(lvl) {
  let colors = [
    color(80, 180, 255),
    color(30, 30, 60),
    color(200, 150, 0),
    color(0, 100, 60),
    color(150, 0, 90)
  ];
  return colors[(lvl - 1) % colors.length];
}
