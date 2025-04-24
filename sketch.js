// Global Variables
let player; // Player object
let obstacles = []; // Array to store obstacle objects
let lanes = []; // Array of lane x-positions
let gameState = "home"; // Current game state: home, play, gameover, levelup
let level = 1; // Current game level
let score = 0; // Current score
let highScore = 0; // Highest score reached
let leaderboard = []; // Array of top player scores
let users = []; // List of users with their passwords

// Image Variables
let carImage; // Player car image
let obstacleImages = []; // Array to hold obstacle images

// Preload Function: Load Images
function preload() {
  carImage = loadImage('images/car.png'); // Path to your car image
  // Load all obstacle images into an array
  obstacleImages.push(loadImage('images/oil.jpg'));  // Oil image
  obstacleImages.push(loadImage('images/tire.PNG')); // Tire image
  obstacleImages.push(loadImage('images/cone.webp')); // Cone image
}

// SETUP
function setup() {
  createCanvas(400, 550); // Set canvas size
  textFont('monospace'); // Set default font
  lanes = [60, 120, 200, 280, 340]; // Initialize 5 lanes
  player = new Car(); // Create player car
  generateObstacles(); // Spawn obstacles
}

// DRAW LOOP
function draw() {
  background(getLevelColor(level)); // Set background color by level

  // Display game screen depending on state
  if (gameState === "home") showHomeScreen();
  else if (gameState === "play") updateGame();
  else if (gameState === "gameover") showGameOverScreen();
  else if (gameState === "levelup") showLevelUpScreen();
}

// Car Class
class Car {
  constructor() {
    this.x = lanes[2]; // Start in center lane
    this.y = height - 100; // Near bottom of screen
    this.size = 40; // Width (adjust to fit the image)
    this.speed = 8; // Movement speed
  }
  
  display() {
    // Display player image
    imageMode(CENTER);
    image(carImage, this.x, this.y, this.size * 1.5, this.size); // Draw the car image
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
    this.img = random(obstacleImages); // Randomly pick one obstacle image
  }

  display() {
    // Display the randomly chosen obstacle image
    imageMode(CENTER);
    image(this.img, this.x, this.y, this.w, this.h); // Draw the obstacle image
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

  // HUD display
  fill(255);
  textSize(16);
  textAlign(LEFT);
  text(`Score: ${score}`, 10, 20);
  text(`Level: ${level}`, 10, 40);
  text(`High Score: ${highScore}`, 10, 60);
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

// Keyboard Input Handling
function keyPressed() {
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
