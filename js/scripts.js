const MOVE_SPEED = 0.2;
const POINT_SIZE = 5;
let DISTANCE_TO_START_DRAWING_LINES;
let TOTAL_POINTS;

let SCREEN_WIDTH = 0;
let SCREEN_HEIGHT = 0;

let POINT_LIST = [];
let colourMap = {};
let brightnessMap = {};

let Y_PARTITIONS = 10;
let X_PARTITIONS;
let totalPartitions;
let partitionSize;
let partitionMap = {};

let displayMode = 0;

if (window.location.hash === '#1') {
	displayMode = 1;
} else if (window.location.hash === '#2') {
	displayMode = 2;
} else if (window.location.hash === '#3') {
	displayMode = 3;
}

// Drawing functions to handled inverted Y-Axis of the browser
const drawRect = (x, y, w, h) => rect(x, SCREEN_HEIGHT-y, w, h);
const drawLine = (x1, y1, x2, y2) => line(x1, SCREEN_HEIGHT-y1, x2, SCREEN_HEIGHT-y2);
const drawCircle = (x, y, d) => circle(x, SCREEN_HEIGHT-y, d);
const drawArc = (x, y, w, h, startAngle, stopAngle) => arc(x, SCREEN_HEIGHT-y, w, h, 2*Math.PI-stopAngle, 2*Math.PI-startAngle);
const drawTri = (x1, y1, x2, y2, x3, y3) => triangle(x1, SCREEN_HEIGHT-y1, x2, SCREEN_HEIGHT-y2, x3, SCREEN_HEIGHT-y3);

// Initial Setup
function setup() {
	SCREEN_WIDTH = window.innerWidth - 20;
	SCREEN_HEIGHT = window.innerHeight - 80;

	createCanvas(window.innerWidth - 20, window.innerHeight - 80);

	partitionSize = Math.ceil(SCREEN_HEIGHT/Y_PARTITIONS);
	X_PARTITIONS = Math.ceil(SCREEN_WIDTH/partitionSize);
	totalPartitions = X_PARTITIONS*Y_PARTITIONS;

	// Initialize the partition map
	for (let i = 0; i < totalPartitions; ++i) {
		partitionMap[i] = {};
	}

	// Determine total points and line distance based off the screen size
	if (displayMode === 0) {
		TOTAL_POINTS = Math.round((SCREEN_WIDTH * SCREEN_HEIGHT) * 0.0002);
	} else {
		TOTAL_POINTS = Math.round((SCREEN_WIDTH * SCREEN_HEIGHT) * 0.00035);
	}
	DISTANCE_TO_START_DRAWING_LINES = Math.round(Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) / 8);

	// Create random Points all over the screen
	for (let i = 0; i < TOTAL_POINTS; i++) {
		POINT_LIST.push(new Point(SCREEN_WIDTH, SCREEN_HEIGHT, MOVE_SPEED, POINT_SIZE, i));
	}

	// Build Brightness and Colour lookup maps
	for (let i = -1; i <= SCREEN_WIDTH; ++i) {
		colourMap[i] = Math.round(map(i, -1, SCREEN_WIDTH, 0, 300));
	}
	for (let i = -1; i <= DISTANCE_TO_START_DRAWING_LINES; ++i) {
		brightnessMap[i] = Math.round(map(i, -1, DISTANCE_TO_START_DRAWING_LINES, 100, 0));
	}

	frameRate(60);
}

function draw() {
	// Draw background & set Rectangle draw mode
	background(255);
	rectMode(CENTER);

	// Draw scene rectangle
	fill(30,30,30);
	stroke(30,30,30);
	drawRect(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT)

	// Draw Points & Lines
	POINT_LIST.forEach(currentPoint => {
		drawLineToNearby(currentPoint);
		drawPoint(currentPoint);
	});

	// Update Points positions
	POINT_LIST.forEach(currentPoint => {
		currentPoint.update();
	});
}

const drawPoint = (pointObject) => {
	stroke(200,200,200);
	fill(200,200,200);
	drawCircle(pointObject.position.x, pointObject.position.y, pointObject.pointSize);
}

const drawLineToNearby = (targetPoint) => {
	colorMode(HSB, 360, 100, 100, 100);

	getPointsInNearbyPartitions(targetPoint).forEach(pointsInPartition => pointsInPartition.forEach(point => {
		let distanceBetween = distanceBetweenPoints(targetPoint, point);

		// Only draw the line if it's close enough
		if (distanceBetween < DISTANCE_TO_START_DRAWING_LINES) {
			stroke(colourMap[Math.round(targetPoint.position.x)], 100, 100, brightnessMap[Math.round(distanceBetween)]);
			drawLine(targetPoint.position.x, targetPoint.position.y, point.position.x, point.position.y);
		}
	}))

	colorMode(RGB, 255);
}

// Calculate Euclidean distance between 2 points
const distanceBetweenPoints = (pointA, pointB) => {
	return Math.sqrt(Math.pow(pointA.position.x - pointB.position.x, 2) + Math.pow(pointA.position.y - pointB.position.y, 2));
}

const getPointsInNearbyPartitions = (pointObject) => {
	let partitionIndices;

	if (displayMode === 1) {
		// Vertical ONLY
		partitionIndices = [
			pointObject.currentPartition-X_PARTITIONS, pointObject.currentPartition, pointObject.currentPartition+X_PARTITIONS,
		];
	} else if (displayMode === 2) {
		// Horizontal ONLY
		partitionIndices = [
			pointObject.currentPartition-1, pointObject.currentPartition, pointObject.currentPartition+1,
		];
	} else if (displayMode === 3) {
		// Horizontal-Vertical Split Mode
		if (pointObject.position.x < SCREEN_WIDTH/2) {
			partitionIndices = [ pointObject.currentPartition-1, pointObject.currentPartition, pointObject.currentPartition+1 ];
		} else {
			partitionIndices = [ pointObject.currentPartition-X_PARTITIONS, pointObject.currentPartition, pointObject.currentPartition+X_PARTITIONS ];
		}
	} else {
		// Normal
		partitionIndices = [
			pointObject.currentPartition-X_PARTITIONS-1, pointObject.currentPartition-X_PARTITIONS, pointObject.currentPartition-X_PARTITIONS+1,
			pointObject.currentPartition-1, pointObject.currentPartition, pointObject.currentPartition+1,
			pointObject.currentPartition+X_PARTITIONS-1, pointObject.currentPartition+X_PARTITIONS, pointObject.currentPartition+X_PARTITIONS+1,
		];
	}

	return partitionIndices.filter(index => index >= 0 && index < totalPartitions).map(index => Object.values(partitionMap[index]));
}

class Point {
	constructor(backgroundSizeX, backgroundSizeY, moveSpeed, pointSize, pointId) {
		// Store properties
		this.moveSpeed = moveSpeed;
		this.pointSize = pointSize;
		this.pointId = pointId;
		this.backgroundSize = { x: backgroundSizeX, y: backgroundSizeY };
		this.currentPartition = 0;

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

		this._calculatePartition();
	}

	update() {
		// Update the position of the object
		this.position.x += this.direction.x * this.moveSpeed;
		this.position.y += this.direction.y * this.moveSpeed;

		// Handle going off the left & right sides of the screen
		if (this.position.x < -0.5) this.position.x += this.backgroundSize.x;
		else if (this.position.x > this.backgroundSize.x) this.position.x -= this.backgroundSize.x;

		// Handle going off the top and bottom sides of the screen
		if (this.position.y < -0.5) this.position.y += this.backgroundSize.y;
		else if (this.position.y > this.backgroundSize.y) this.position.y -= this.backgroundSize.y;

		this._calculatePartition();
	}

	_calculatePartition() {
		let row = Math.floor(Math.max(this.position.y, 0) / partitionSize);
		let col = Math.floor(Math.max(this.position.x, 0) / partitionSize);

		// Delete the old position from the map
		delete partitionMap[this.currentPartition][this.pointId];

		this.currentPartition = X_PARTITIONS*(row) + (col);

		// Store the new position in the map
		partitionMap[this.currentPartition][this.pointId] = this;
	}
}