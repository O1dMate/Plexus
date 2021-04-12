const MOVE_SPEED = 0.1;
const POINT_SIZE = 4;
let TOTAL_POINTS = 500;
let DISTANCE_TO_START_DRAWING_LINES = 150;

let SCREEN_WIDTH = 0;
let SCREEN_HEIGHT = 0;

let POINT_LIST = [];

const drawRect = (x, y, w, h) => rect(x, SCREEN_HEIGHT-y, w, h);
const drawLine = (x1, y1, x2, y2) => line(x1, SCREEN_HEIGHT-y1, x2, SCREEN_HEIGHT-y2);
const drawCircle = (x, y, d) => circle(x, SCREEN_HEIGHT-y, d);
const drawArc = (x, y, w, h, startAngle, stopAngle) => arc(x, SCREEN_HEIGHT - y, w, h, 2*Math.PI-stopAngle, 2*Math.PI-startAngle);

// Initial Setup
function setup() {
	SCREEN_WIDTH = window.innerWidth - 20;
	SCREEN_HEIGHT = window.innerHeight - 20

	createCanvas(window.innerWidth - 20, window.innerHeight - 20);

	POINT_LIST = [];

	for (let i = 0; i < TOTAL_POINTS; i++) {
		POINT_LIST.push(new Point(SCREEN_WIDTH, SCREEN_HEIGHT, MOVE_SPEED, i));
	}

	TOTAL_POINTS = Math.round((SCREEN_WIDTH * SCREEN_HEIGHT) / 0.00015);
	DISTANCE_TO_START_DRAWING_LINES = Math.round(Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) / 10);

	frameRate(30);
}

function draw() {
	// Draw background & set Rectangle draw mode
	background(255);
	rectMode(CENTER);

	// Draw scene rectangle
	fill(30,30,30);
	stroke(30,30,30);
	drawRect(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT)

	// Update Position
	POINT_LIST.forEach(currentPoint => {
		drawLineToNearby(currentPoint);
		drawPoint(currentPoint);
		currentPoint.update();
	});
}

const drawPoint = (pointObject) => {
	stroke(180, 180, 180);
	fill(180, 180, 180);
	drawCircle(pointObject.position.x, pointObject.position.y, POINT_SIZE);
}

const drawLineToNearby = (pointObject) => {
	stroke(30,210,230);

	POINT_LIST.forEach(point => {
		if (point.id == pointObject.id) return;
		let distanceBetween = distanceBetweenPoints(pointObject, point);

		if (distanceBetween < DISTANCE_TO_START_DRAWING_LINES) {
			let colour = map(distanceBetween, 0, DISTANCE_TO_START_DRAWING_LINES, 200, 30);
			stroke(colour, colour, colour);
			drawLine(pointObject.position.x, pointObject.position.y, point.position.x, point.position.y);
		}
	})
}

const distanceBetweenPoints = (pointA, pointB) => {
	return Math.sqrt(Math.pow(pointA.position.x - pointB.position.x, 2) + Math.pow(pointA.position.y - pointB.position.y, 2));
}

class Point {
	constructor(backgroundSizeX, backgroundSizeY, moveSpeed, id) {
		// Store basic properties
		this.id = id;
		this.moveSpeed = moveSpeed;
		this.backgroundSize = { x: backgroundSizeX, y: backgroundSizeY };

		// Generate random starting position
		this.position = {
			x: Math.floor(Math.random() * (this.backgroundSize.x - 1)),
			y: Math.floor(Math.random() * (this.backgroundSize.y - 1))
		};

		// Generate random starting direction
		let xDir = -1 + Math.random()*2;
		let yDir = -1 + Math.random()*2;
		
		// Convert to a unit vector
		let length = Math.sqrt(xDir**2 + yDir**2);
		this.direction = {x: xDir/length, y: yDir/length};
	}

	update() {
		// Update the position of the object
		this.position.x += this.direction.x * this.moveSpeed;
		this.position.y += this.direction.y * this.moveSpeed;

		// Handle going off the left & right sides
		if (this.position.x < -0.5) this.position.x += this.backgroundSize.x;
		else if (this.position.x > this.backgroundSize.x) this.position.x -= this.backgroundSize.x;

		// Handle going off the top and bottom sides
		if (this.position.y < -0.5) this.position.y += this.backgroundSize.y;
		else if (this.position.y > this.backgroundSize.y) this.position.y -= this.backgroundSize.y;
	}

	changeDirection(newDirectionX, newDirectionY) {
		this.direction.x += newDirectionX;
		this.direction.y += newDirectionY;

		// Convert new direction to a unit vector
		let length = Math.sqrt(this.direction.x**2 + this.direction.y**2);
		this.direction.x /= length;
		this.direction.y /= length;
	}
}