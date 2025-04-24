// GAME: The Survival Circuit
// Group Members: Arthur Carvalho, Ben Trader, Matthew Grace
// ATLS 1350 Final Project

// Declare variables for your images
let carImg, coneImg, oilImg, tireImg;

// Declare other game variables
let player; // Player object
let obstacles = []; // Array to store obstacle objects
let powerUps = []; // Array to store power-up objects
let lanes = []; // Array of lane x-positions
let gameState = "home"; // Current game state: home, play, gameover, levelup
let level = 1; // Current game level
let score = 0; // Current score
let highScore = 0; // Highest score reached
let leaderboard = []; // Array of top player scores
let users = []; // List of users with their passwords

// Power-Up State
let intangibilityTimer = 0; // Duration for intangibility
let slowMotionTimer = 0; // Duration for slow motion
let slowMotionActive = false; // Flag for slow motion active
let intangibilityActive = false; // Flag for intangibility active
let activePowerUp = null; // Currently held power-up

// Transition Between Levels
let transitionTimer = 0; // Timer for level transition
let transitioning = false; // Flag for ongoing level transition

// Movement Controls
let moveLeft = false, moveRight = false, moveUp = false, moveDown = false; // Input flags

// Preload images
function preload() {
  carImg = loadImage("images/car.PNG"); // Player car image
  coneImg = loadImage("images/cone.webp"); // Obstacle image (cone)
  oilImg = loadImage("images/oil.jpg"); // Obstacle image (oil)
  tireImg = loadImage("images/tire.PNG"); // Obstacle image (tire)
}

// Setup function
function setup() {
  createCanvas(400, 550); // Set canvas size
  textFont('monospace'); // Set default font
  lanes = [60, 120, 200, 280, 340]; // Initialize 5 lanes
  player = new Car(); // Create player car
  generateObstacles(); // Spawn obstacles
  generatePowerUps(); // Spawn power-ups
}

// Car Class
class Car {
  constructor() {
    this.x = lanes[2]; // Start in center lane
    this.y = height - 100; // Near bottom of screen
    this.size = 40; // Width
    this.speed = 8; // Movement speed
  }

  display() {
    // Display car with image
    imageMode(CENTER);
    image(carImg, this.x, this.y, this.size, this.size * 1.5); // Draw car image
  }

  move() {
    // Movement controls
    if (moveLeft && this.x > 30) this.x -= this.speed;
    if (moveRight && this.x < width - 30) this.x += this.speed;
    if (moveUp && this.y > 50) this.y -= this.speed;
    if (moveDown && this.y < height - 50) this.y += this.speed;
  }

  update() {
    this.move();
    if (intangibilityActive) {
      intangibilityTimer--;
      if (intangibilityTimer <= 0) intangibilityActive = false; // End power-up
    }
  }
}

// Obstacle Class
class Obstacle {
  constructor(laneIndex, speed) {
    this.lane = laneIndex;
    this.x = lanes[this.lane];
    this.y = -random(100, 1000); // Start offscreen
    this.w = random(30, 50);
    this.h = random(30, 60);
    this.speed = speed;
    // Randomize obstacle images
    this.image = this.randomObstacleImage();
  }

  // Randomize which image to use for the obstacle
  randomObstacleImage() {
    const randomNum = floor(random(3)); // Random number between 0 and 2
    if (randomNum === 0) return oilImg;
    if (randomNum === 1) return tireImg;
    return coneImg;
  }

  display() {
    imageMode(CENTER);
    image(this.image, this.x, this.y, this.w, this.h); // Draw the random obstacle image
  }

  update() {
    this.y += slowMotionActive ? this.speed * 0.4 : this.speed; // Adjust for slow-mo
  }

  hits(car) {
    return (
      abs(this.x - car.x) < (this.w + car.size) / 2 &&
      abs(this.y - car.y) < (this.h + car.size * 1.5) / 2
    );
  }
}

// Power-Up Class (same as original)
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

// Main Game Update Function
function updateGame() {
  player.update();
  player.display();

  // Update obstacles
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

  // Update power-ups
  for (let p of powerUps) {
    p.update();
    p.display();
  }

  // Handle slow-motion timer
  if (slowMotionActive) {
    slowMotionTimer--;
    if (slowMotionTimer <= 0) slowMotionActive = false;
  }

  // HUD display
  fill(255);
  textSize(16);
  textAlign(LEFT);
  text(`Score: ${score}`, 10, 20);
  text(`Level: ${level}`, 10, 40);
  text(`High Score: ${highScore}`, 10, 60);
  text(`Power-Up: ${activePowerUp ? activePowerUp.toUpperCase() : ""}`, 10, 80);
  score++;

  // Check for level up
  if (score > 0 && score % 1000 === 0 && !transitioning) {
    transitioning = true;
    transitionTimer = 120;
    gameState = "levelup";
  }
}

// Generate New Obstacles
function generateObstacles() {
  obstacles = [];
  while (obstacles.length < 6 + level * 2) {
    let lane = floor(random(lanes.length));
    let newObs = new Obstacle(lane, random(2 + level * 0.2, 4 + level * 0.3));
    let overlaps = obstacles.some(o => dist(o.x, o.y, newObs.x, newObs.y) < 60);
    if (!overlaps) obstacles.push(newObs);
  }
}

// Generate New PowerUps
function generatePowerUps() {
  powerUps = [];
  while (powerUps.length < 2) {
    let newPU = new PowerUp(random(["intangibility", "slow"]));
    let overlaps = powerUps.some(p => dist(p.x, p.y, newPU.x, newPU.y) < 80);
    if (!overlaps) powerUps.push(newPU);
  }
}

// Recycle Obstacle to Top
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

// Keyboard Input Handling (same as original)
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

  // Handle restart after game over
  if (gameState === "gameover" && (key === 'r' || key === 'R')) {
    gameState = "home";
    resetLogin();
  }

  // In-game movement and power-up use
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

// Reset movement when keys released
function keyReleased() {
  if (key === 'a' || keyCode === LEFT_ARROW) moveLeft = false;
  if (key === 'd' || keyCode === RIGHT_ARROW) moveRight = false;
  if (key === 'w' || keyCode === UP_ARROW) moveUp = false;
  if (key === 's' || keyCode === DOWN_ARROW) moveDown = false;
}

// Called when login is successful
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

// Reset all login-related variables
function resetLogin() {
  tempName = '';
  playerName = '';
  playerPassword = '';
  enteringPassword = false;
  nameInputActive = true;
}

// Returns background color based on level
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
