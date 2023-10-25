
const app = new PIXI.Application({
    width: 640,
    height: 640,
    backgroundColor: 0x1099bb,
});

document.getElementById('game-board').appendChild(app.view);


class Game {
    constructor() {
        this.snake = new Snake();
        this.board = new Board(20, 20);
        this.ui = new UI();
        this.mode = "Classic";
        this.score = 0;
        this.bestScore = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.animationFrameId = null;
    }

    init() {
        this.ui.initUI(this);
        this.board.initBoard(app);
        this.snake.initSnake(app);
    }

    start() {
        this.isPlaying = true;
        this.ui.showMenuButton();
        this.gameLoop();
    }

    gameLoop() {
        if (this.isPlaying && !this.isPaused) {
            this.update();
            this.render();
            setTimeout(() => {
                if (this.animationFrameId) {
                    cancelAnimationFrame(this.animationFrameId);
                }
                this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
            }, 50);
        } else if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.ui.toggleMenuButtonText(this.isPaused);
        if (!this.isPaused) {
            this.gameLoop();
        }
    }

    update() {
        this.snake.move();
        const collisionResult = this.board.checkCollision(this.snake, this.mode);

        if (collisionResult === "food") {
            this.score++;
            this.snake.grow(1);
        }

        if (collisionResult === "wall" || collisionResult === "self") {
            this.end();
        }

        this.ui.updateScore(this.score);
    }

    render() {
        this.board.renderBoard(app);
        this.snake.renderSnake();
    }

    end() {
        this.isPlaying = false;
        this.ui.showPlayAndExitButtons();
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.ui.updateBestScore(this.bestScore);
        }
        this.reset();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    reset() {
        this.score = 0;
        this.snake.reset();
        this.board.reset();
    }

    setMode(newMode) {
        this.mode = newMode;
        if (newMode !== "walls") {
            this.board.wall = null;
            if (this.board.wallSprite) {
                app.stage.removeChild(this.board.wallSprite);
                this.board.wallSprite = null;
            }
        }
    }
}

class Snake {
    constructor() {
        this.body = [{ x: 10, y: 10 }];
        this.length = 1;
        this.speed = 1;
        this.direction = "UP";
        this.growth = 0;
        this.sprites = [];
    }

    initSnake(app) {
        this.body.forEach(segment => {
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0x00FF00);
            graphics.drawRect(0, 0, 32, 32);
            graphics.endFill();
            graphics.x = segment.x * 32;
            graphics.y = segment.y * 32;
            this.sprites.push(graphics);
            app.stage.addChild(graphics);
        });
    }

    move() {
        let newHead = { ...this.body[0] };
        switch (this.direction) {
            case "UP":
                newHead.y -= 1;
                break;
            case "DOWN":
                newHead.y += 1;
                break;
            case "LEFT":
                newHead.x -= 1;
                break;
            case "RIGHT":
                newHead.x += 1;
                break;
            default:
                break;
        }

        this.body.unshift(newHead);

        if (this.growth > 0) {
            this.growth--;
            this.length++;
        } else {
            this.body.pop();
        }
    }

    setDirection(newDirection) {
        if (
            (newDirection === "UP" && this.direction !== "DOWN") ||
            (newDirection === "DOWN" && this.direction !== "UP") ||
            (newDirection === "LEFT" && this.direction !== "RIGHT") ||
            (newDirection === "RIGHT" && this.direction !== "LEFT")
        ) {
            this.direction = newDirection;
        }
    }

    grow(n) {
        this.growth += n;
        const newSegment = { x: this.body[this.body.length - 1].x, y: this.body[this.body.length - 1].y };
        const newSprite = this.createSprite(newSegment);
        this.sprites.push(newSprite);
        app.stage.addChild(newSprite);
    }

    createSprite(segment) {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0x00FF00);
        graphics.drawRect(0, 0, 32, 32);
        graphics.endFill();
        graphics.x = segment.x * 32;
        graphics.y = segment.y * 32;
        return graphics;
    }

    renderSnake() {
        this.body.forEach((segment, index) => {
            const sprite = this.sprites[index];
            sprite.x = segment.x * 32;
            sprite.y = segment.y * 32;
        });
    }


    reset() {
        this.sprites.forEach(sprite => {
            app.stage.removeChild(sprite);
        });
        this.body = [{ x: 10, y: 10 }];
        this.length = 1;
        this.direction = "UP";
        this.growth = 0;
        this.sprites = [];
        this.initSnake(app);
    }
}
class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [...Array(height)].map(e => Array(width).fill(0));
        this.food = null;
        this.wall = null;
    }

    initBoard(app) {
        this.spawnFood();
        this.renderBoard(app);
    }

    renderBoard(app) {
        if (this.foodSprite) {
            app.stage.removeChild(this.foodSprite);
        }

        const foodGraphics = new PIXI.Graphics();
        foodGraphics.beginFill(0xFF0000);
        foodGraphics.drawRect(0, 0, 32, 32);
        foodGraphics.endFill();
        foodGraphics.x = this.food.x * 32;
        foodGraphics.y = this.food.y * 32;
        this.foodSprite = foodGraphics;
        app.stage.addChild(this.foodSprite);

        if (this.wall) {
            if (this.wallSprite) {
                app.stage.removeChild(this.wallSprite);
            }

            const wallGraphics = new PIXI.Graphics();
            wallGraphics.beginFill(0x000000);
            wallGraphics.drawRect(0, 0, 32, 32);
            wallGraphics.endFill();
            wallGraphics.x = this.wall.x * 32;
            wallGraphics.y = this.wall.y * 32;
            this.wallSprite = wallGraphics;
            app.stage.addChild(this.wallSprite);
        }
    }

    checkCollision(snake, gameMode) {
        const head = snake.body[0];

        if (head.x < 0 || head.y < 0 || head.x >= this.width || head.y >= this.height) {
            if (gameMode !== "no-death") {
                return "wall";
            } else {
                if (head.x < 0) head.x = this.width - 1;
                if (head.y < 0) head.y = this.height - 1;
                if (head.x >= this.width) head.x = 0;
                if (head.y >= this.height) head.y = 0;
            }
        }

        for (let i = 1; i < snake.body.length; i++) {
            if (head.x === snake.body[i].x && head.y === snake.body[i].y) {
                if (gameMode !== "no-death") {
                    return "self";
                }
            }
        }

        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            if (gameMode === "walls") {
                this.wall = { x: Math.floor(Math.random() * this.width), y: Math.floor(Math.random() * this.height) };
            }
            if (gameMode === "speed") {
                snake.speed *= 1.1;
            }
            if (gameMode === "portal" && this.secondFood) {
                head.x = this.secondFood.x;
                head.y = this.secondFood.y;
            }
            this.spawnFood();
            return "food";
        }

        if (gameMode === "portal" && this.secondFood && head.x === this.secondFood.x && head.y === this.secondFood.y) {
            head.x = this.food.x;
            head.y = this.food.y;
            this.spawnFood();
            return "food";
        }

        if (gameMode === "walls" && this.wall && head.x === this.wall.x && head.y === this.wall.y) {
            return "wall";
        }

        return null;
    }

    spawnFood() {
        let x, y;
        do {
            x = Math.floor(Math.random() * this.width);
            y = Math.floor(Math.random() * this.height);
        } while (this.grid[y][x] !== 0);
        this.food = { x, y };

        do {
            x = Math.floor(Math.random() * this.width);
            y = Math.floor(Math.random() * this.height);
        } while (this.grid[y][x] !== 0);
        this.secondFood = { x, y };
    }

    reset() {
        this.grid = [...Array(this.height)].map(e => Array(this.width).fill(0));
        this.spawnFood();
    }
}

class UI {
    constructor() {
        this.bestScoreElement = document.getElementById("best-score");
        this.currentScoreElement = document.getElementById("current-score");
        this.menuButton = document.getElementById("menu-button");
        this.playButton = document.getElementById("play-button");
        this.exitButton = document.getElementById("exit-button");
        this.gameModes = document.getElementById("game-modes");
    }

    updateScore(score) {
        this.currentScoreElement.textContent = `Текущий счет: ${score}`;
    }

    updateBestScore(bestScore) {
        this.bestScoreElement.textContent = `Лучший счет: ${bestScore}`;
    }

    showMenuButton() {
        this.menuButton.style.display = "block";
        this.playButton.style.display = "none";
        this.exitButton.style.display = "block";
    }

    showPlayAndExitButtons() {
        this.menuButton.style.display = "none";
        this.playButton.style.display = "block";
        this.exitButton.style.display = "block";
    }

    toggleMenuButtonText(isPaused) {
        this.menuButton.textContent = isPaused ? "Продолжить" : "Меню";
    }


    initUI(game) {
        this.playButton.addEventListener("click", () => {
            game.start();
            this.showMenuButton();
        });

        this.exitButton.addEventListener("click", () => {
            game.end();
            this.showPlayAndExitButtons();
        });

        this.menuButton.addEventListener("click", () => {
            game.togglePause();
        });;

        this.gameModes.addEventListener("change", (event) => {
            const newMode = event.target.value;
            game.setMode(newMode);
        });
    }
}

const game = new Game();
game.init(app);
game.start();


document.addEventListener("keydown", function (event) {
    switch (event.key) {
        case "ArrowUp":
            game.snake.setDirection("UP");
            break;
        case "ArrowDown":
            game.snake.setDirection("DOWN");
            break;
        case "ArrowLeft":
            game.snake.setDirection("LEFT");
            break;
        case "ArrowRight":
            game.snake.setDirection("RIGHT");
            break;
    }
});