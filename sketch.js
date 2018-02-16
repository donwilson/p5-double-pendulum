// screen size
let screenW = 512;
let screenH = 512;

// colors
let bgcolor = "#1B1B1E";
let textcolor = "#A9BCD0";
let linecolor = "#58A4B0";

// pendulum sizes/physics
let r1 = (screenW / 6);
let r2 = (screenW / 6);
let m1 = 10.0;
let m2 = 10.0;
let a1 = 0;
let a2 = 0;
let a1_v = 0.0;
let a2_v = 0.0;
let a1_a = 0.0;
let a2_a = 0.0;
let g = 1.0;
let ballDiameter = 6;
let dampening = 0.998;

// ball points
let x1;
let y1;
let x2;
let y2;

// sliders
let r1_slider;
let r2_slider;
let m1_slider;
let m2_slider;
let dampening_slider;

// state
let dragging = false;

function setup() {
	// set bg color
	document.body.style.background = bgcolor;
	
	// create canvas
	createCanvas(screenW, screenH);
	
	// set default state
	a1 = PI / 4;
	a2 = -PI / 8;
	
	// create sliders
	r1_slider = createSlider(10, (width / 3), r1);
	r1_slider.position(15, 15);
	
	r2_slider = createSlider(10, (width / 3), r2);
	r2_slider.position(r1_slider.x, (r1_slider.y + r1_slider.height + 10));
	
	m1_slider = createSlider(0.2, 20, m1, 0.1);
	m1_slider.position(r2_slider.x, (r2_slider.y + r2_slider.height + 10));
	
	m2_slider = createSlider(0.2, 20, m2, 0.1);
	m2_slider.position(m1_slider.x, (m1_slider.y + m1_slider.height + 10));
	
	gravity_slider = createSlider(0, 20, g, 0.1);
	gravity_slider.position(m2_slider.x, (m2_slider.y + m2_slider.height + 10));
	
	dampening_slider = createSlider(975, 999, (dampening * 1000));
	dampening_slider.position(gravity_slider.x, (gravity_slider.y + gravity_slider.height + 10));
}

function draw() {
	// pull realtime values from sliders
	r1 = r1_slider.value();
	r2 = r2_slider.value();
	m1 = m1_slider.value();
	m2 = m2_slider.value();
	g = gravity_slider.value();
	dampening = (dampening_slider.value() / 1000);
	
	// draw bg
	background(bgcolor);
	
	// draw text for sliders
	let text_size = 12;
	strokeWeight(0);
	fill(textcolor);
	textSize(text_size);
	text("rod-1 length: "+ r1, (r1_slider.x + r1_slider.width + 15), (r1_slider.y + (r1_slider.height / 2) + (text_size / 2)));
	text("rod-2 length: "+ r2, (r2_slider.x + r2_slider.width + 15), (r2_slider.y + (r2_slider.height / 2) + (text_size / 2)));
	text("mass 1: "+ m1, (m1_slider.x + m1_slider.width + 15), (m1_slider.y + (m1_slider.height / 2) + (text_size / 2)));
	text("mass 2: "+ m2, (m2_slider.x + m2_slider.width + 15), (m2_slider.y + (m2_slider.height / 2) + (text_size / 2)));
	text("gravity: "+ g, (gravity_slider.x + gravity_slider.width + 15), (gravity_slider.y + (gravity_slider.height / 2) + (text_size / 2)));
	text("dampening: "+ dampening, (dampening_slider.x + dampening_slider.width + 15), (dampening_slider.y + (dampening_slider.height / 2) + (text_size / 2)));
	
	// line styling
	stroke(linecolor);
	strokeWeight(3);
	fill(linecolor);
	
	// translate to center
	translate(width/2, height/2);
	
	calcPolarPoints();
	
	// draw pendulum
	line(0, 0, x1, y1);
	ellipse(x1, y1, ballDiameter, ballDiameter);
	
	line(x1, y1, x2, y2);
	ellipse(x2, y2, ballDiameter, ballDiameter);
	
	// calculate angles
	calcAngles();
	
	// apply forces
	applyForces();
	
	// soften velocities over time
	dampenVelocities();
}

function calcPolarPoints() {
	// ball 1
	x1 = r1 * sin(a1);
	y1 = r1 * cos(a1);
	
	// ball 2
	x2 = (x1 + (r2 * sin(a2)));
	y2 = (y1 + (r2 * cos(a2)));
}

function calcAngles() {
	if(dragging !== false) {
		a1_v = 0;
		a1_a = 0;
		a2_v = 0;
		a2_a = 0;
		
		return;
	}
	
	let num1, num2, num3, num4, den;
	
	//      −g   (2   m1 + m2)   sin θ1
	num1 = (-g * (2 * m1 + m2) * sin(a1));
	
	//      −m2   g   sin(θ1 − 2   θ2)
	num2 = (-m2 * g * sin(a1 - 2 * a2));
	
	//      −2   sin(θ1 − θ2)   m2
	num3 = (-2 * sin(a1 - a2) * m2);
	
	//      θ2'2          L2 + θ1'2          L1   cos(θ1 − θ2)
	num4 = (sq(a2_v) * r2 + sq(a1_v) * r1 * cos(a1 - a2));
	
	//     L1   (2   m1 + m2 − m2   cos(2   θ1 − 2   θ2))
	den = (r1 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2)));
	
	a1_a = ((num1 + num2 + (num3 * num4)) / den);
	
	
	//      2   sin(θ1 − θ2)
	num1 = (2 * sin(a1 - a2));
	
	//      θ1'2          L1   (m1 + m2)
	num2 = (sq(a1_v) * r1 * (m1 + m2));
	
	//      g   (m1 + m2)   cos θ1
	num3 = (g * (m1 + m2) * cos(a1));
	
	//      θ2'2          L2   m2   cos(θ1 − θ2))
	num4 = (sq(a2_v) * r2 * m2 * cos(a1 - a2));
	
	//     L2   (2   m1 + m2 − m2   cos(2   θ1 − 2   θ2))
	den = (r2 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2)));
	
	a2_a = ((num1 * (num2 + num3 + num4)) / den);
	
	
	// wrap acceleration to prevent drawing from breaking due to high speed
	a1_a %= (PI * 2);
	a2_a %= (PI * 2);
}

function applyForces() {
	// add acceleration to velocity
	a1_v += a1_a;
	a2_v += a2_a;
	
	// add velocity to pendulum angles
	a1 += a1_v;
	a2 += a2_v;
}

function dampenVelocities() {
	// soften velocity
	a1_v *= dampening;
	a2_v *= dampening;
}

function calcDraggedAngle() {
	if(false === dragging) {
		return;
	}
	
	if(dragging === 1) {
		// set angle1 to be from ball 1 starting point (center) to mouse position
		let delta_x = (mouseX - (width / 2));
		let delta_y = ((height / 2) - mouseY);
		
		a1 = atan2(delta_y, delta_x) + PI/2;
	} else if(dragging === 2) {
		// set angle1 to be from ball 2 starting point (center + (x1, x2)) to mouse position
		let delta_x = (mouseX - ((width / 2) + x1));
		let delta_y = (((height / 2) + y1) - mouseY);
		
		a2 = atan2(delta_y, delta_x) + PI/2;
	}
}

function touchStarted() {
	// distance is from center since we translate to center of screen in draw()
	let mouseDeltaX = (mouseX - (width / 2));
	let mouseDeltaY = (mouseY - (height / 2));
	
	// check if we clicked on ball 1
	let dist1 = dist(x1, y1, mouseDeltaX, mouseDeltaY);
	
	// max distance is half of ball's line distance from ball
	let maxDist1 = (r1 / 2);
	
	if(dist1 <= maxDist1) {
		// dragging ball 1
		dragging = 1;
		
		calcDraggedAngle();
		
		return;
	}
	
	// check if we clicked on ball 2
	let dist2 = dist(x2, y2, mouseDeltaX, mouseDeltaY);
	let maxDist2 = (r2 / 2);
	
	if(dist2 <= maxDist2) {
		// dragging ball 2
		dragging = 2;
		
		// stop acceleration on a1 to prevent movement when dragging child ball
		a1_a = 0;
		
		calcDraggedAngle();
		
		return;
	}
	
	dragging = false;
	
	return;
}

function touchMoved() {
	if(false === dragging) {
		// not dragging either ball
		return;
	}
	
	calcDraggedAngle();
}

function touchEnded() {
	calcDraggedAngle();
	
	// reset dragging
	dragging = false;
}
