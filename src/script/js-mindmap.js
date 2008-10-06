// js-mindmap
// (c) Copyright Kenneth Kufluk 2008
// Digitas London

//requires MooTools
//requires excanvas

var timeperiod = 10;
var damping = 0.55;
var repulse = 2;
var attract = 6;
var wallrepulse = 0.2;
var updateDisplayAfterNthIteration = 20;
var activeNode = null;
var mapArea = {x:900, y:600};
var minSpeed = 0.05;
var maxForce = 0.1;

var showSublines = true;

function SpiderNode(index, el, parent, active) {
	this.el = el;
	this.el.spiderObj = this;
//			this.originalPos = this.el.getPosition();
	if (active) {
		activeNode = this;
		$(this.el).addClass('active');
	}
	this.parent = parent;
	$(this.el).addClass('node');
	this.index = index;
	this.visible = true;
	this.hasLayout = true; 
	this.x = Math.random()+(mapArea.x/2);
	this.y = Math.random()+(mapArea.y/2);
	this.el.style.left = this.x + "px";
	this.el.style.top = this.y + "px";
	this.dx = 0;
	this.dy = 0;
	this.count = 0;
	var myDragInstance = new Drag(this.el,
		{
			snap: 1,
			onSnap: function(el){
				el.addClass('dragging');
			},
			onComplete: function(el){
				el.removeClass('dragging');
			}
		}
	);
	if (this.el.childNodes[0].tagName=='A') {
		this.el.href = this.el.childNodes[0].href;
	}
	this.el.onclick = function() {
		if (activeNode) activeNode.el.removeClass('active');
		activeNode = this.spiderObj;
		activeNode.el.addClass('active');
		return false;
	}
	this.el.ondblclick = function() {
		location.href=this.href;
		return false;
	}
}
SpiderNode.prototype.normalizePosition = function() {
	//move node to root (outside of parental positioning)
	if (this.parent!=null) {
		$$('#js-mindmap>ul')[1].appendChild(this.el);
	}
}
// TODO WRITE METHOD
SpiderNode.prototype.layOutChildren = function() {
	//show my child nodes in an equally spaced group around myself, instead of placing them randomly
}
SpiderNode.prototype.getForceVector = function() {
	// for each item in nodes, calculate the force
	// repulsive force is proportional to 1/distance
	var fx = 0;
	var fy = 0;
	for (var i=0;i<nodes.length;i++) {
		if (i==this.index) continue;
		if ((showSublines && !nodes[i].hasLayout) || (!showSublines && !nodes[i].visible)) continue;
		// Repulsive force (coulomb's law)
		var x1 = (nodes[i].x - this.x);
		var y1 = (nodes[i].y - this.y);
//				$('debug1').innerHTML = x1;
		//adjust for variable node size
		var nodewidths = ((nodes[i].el.getSize().x + this.el.getSize().x)/2)

/*
		if (x1<0) {
			if (Math.abs(x1)<nodewidths) x1=0.01;
				else x1 = x1 + nodewidths;
		} else {
			if (Math.abs(x1)<nodewidths) x1=0.01;
				else x1 = x1 - nodewidths;
		}
*/

		var xsign = x1/Math.abs(x1);
		var ysign = y1/Math.abs(y1);
		var dist = Math.sqrt((x1*x1) + (y1*y1));
//		x1 = x1 + (xsign*((nodes[i].el.getSize().x + this.el.getSize().x)/2));
//		y1 = y1 + (ysign*((nodes[i].el.getSize().y + this.el.getSize().y)/2));
		var theta = Math.atan(y1/x1);
		if (x1==0) {
			theta = Math.PI/2;
			xsign = 0;
		}
		// force is based on radial distance
		var f = (repulse*500)/(dist*dist);
		if (Math.abs(dist)<500) {
			fx += -f * Math.cos(theta)*xsign;
			fy += -f * Math.sin(theta)*xsign;
		}
	}
	// add repulsive force of the "walls"
	//left wall
	var xdist = this.x+this.el.getSize().x;
	var f = (wallrepulse*500)/(xdist*xdist);
	fx += Math.min(2, f);
	//right wall
	var rightdist = (mapArea.x-xdist);
	var f = -(wallrepulse*500)/(rightdist*rightdist);
	fx += Math.max(-2, f);
	//top wall
	var f = (wallrepulse*500)/(this.y*this.y);
	fy += Math.min(2, f);
	//botttom wall
	var bottomdist = (mapArea.y-this.y);
	var f = -(wallrepulse*500)/(bottomdist*bottomdist);
	fy += Math.max(-2, f);
	
	// for each line, of which I'm a part, add an attractive force.
	for (var i=0;i<lines.length;i++) {
		var otherend = null;
		if (lines[i].start.index == this.index) {
			otherend = lines[i].end;
		} else if (lines[i].end.index == this.index) {
			otherend = lines[i].start;
		} else continue;
		// Attractive force (hooke's law)
		var x1 = (otherend.x - this.x);
		var y1 = (otherend.y - this.y);
		var dist = Math.sqrt(x1*x1 + y1*y1);
		var xsign = x1/Math.abs(x1);
		var theta = Math.atan(y1/x1);
		if (x1==0) {
			theta = Math.PI/2;
			xsign = 0;
		}
		// force is based on radial distance
		var f = (attract*dist)/10000;
		if (Math.abs(dist)>0) {
			fx += f * Math.cos(theta)*xsign;
			fy += f * Math.sin(theta)*xsign;
		}
		
//				$('debug1').innerHTML = x1;
	}
	
	// if I'm active, attract me to the centre of the area
	if (activeNode===this) {
		// Attractive force (hooke's law)
		var otherend = mapArea;
		var x1 = ((otherend.x/2) - 100 - this.x);
		var y1 = ((otherend.y/2) - this.y);
		var dist = Math.sqrt(x1*x1 + y1*y1);
		var xsign = x1/Math.abs(x1);
		var theta = Math.atan(y1/x1);
		if (x1==0) {
			theta = Math.PI/2;
			xsign = 0;
		}
		// force is based on radial distance
		var f = (0.1*attract*dist)/10000;
		if (Math.abs(dist)>0) {
			fx += f * Math.cos(theta)*xsign;
			fy += f * Math.sin(theta)*xsign;
		}				
//				$('debug1').innerHTML = x1;
	}
	
	//	$('debug1').innerHTML = dist;
	if (Math.abs(fx) > maxForce) fx = maxForce*(fx/Math.abs(fx));
	if (Math.abs(fy) > maxForce) fy = maxForce*(fy/Math.abs(fy));
	return {x:fx, y:fy};
}
SpiderNode.prototype.getSpeedVector = function() {
	return {x:this.dx, y:this.dy};
}
SpiderNode.prototype.updatePosition = function() {


	if (this.el.hasClass("dragging")) {
		this.x = parseInt(this.el.style.left);
		this.y = parseInt(this.el.style.top);
		this.dx = 0;
		this.dy = 0;
		return;
	}
	//apply accelerations
	var forces = this.getForceVector();
//			$('debug1').innerHTML = forces.x;
	this.dx += forces.x*timeperiod;
	this.dy += forces.y*timeperiod;

	//TODO: CAP THE FORCES
	
	//			this.el.childNodes[0].innerHTML = parseInt(this.dx)+' '+parseInt(this.dy);
	this.dx = this.dx*damping;
	this.dy = this.dy*damping;

	//TODO: ADD MINIMUM SPEEDS
	if (Math.abs(this.dx)<minSpeed) this.dx=0;
	if (Math.abs(this.dy)<minSpeed) this.dy=0;
	//apply velocity vector
	this.x += this.dx*timeperiod;
	this.y += this.dy*timeperiod;
	this.x = Math.min(mapArea.x,Math.max(1,this.x));
	this.y = Math.min(mapArea.y,Math.max(1,this.y));
	//only update the display after the thousanth iteration, so it's not too wild at the start
	this.count++;
//			if (this.count<updateDisplayAfterNthIteration) return;
	// display
	var showx = this.x - (this.el.getSize().x / 2);
	var showy = this.y - (this.el.getSize().y / 2);
	this.el.style.left = showx + "px";
	this.el.style.top = showy + "px";
	
}
//////////////////////////////////////////////////////
function SpiderLine(index, startSpiderNode, finSpiderNode) {
	this.index = index;
	this.start = startSpiderNode;
	this.colour = "blue";
	this.size = "thick";
	this.end = finSpiderNode;
	this.count=0;
}
SpiderLine.prototype.updatePosition = function() {
	if (showSublines && (!this.start.hasLayout || !this.end.hasLayout)) return;
	if (!showSublines && (!this.start.visible || !this.end.visible)) return;
	if (this.start.visible && this.end.visible) this.size = "thick";
		else this.size="thin";
	if (activeNode.parent==this.start || activeNode.parent==this.end) this.colour = "red";
		else this.colour="blue";
	switch (this.colour) {
		case "red":
			ctx.strokeStyle = "rgb(100, 0, 0)";
		break;
		case "blue":
			ctx.strokeStyle = "rgb(0, 0, 100)";
		break;
	}
	switch (this.size) {
		case "thick":
			ctx.lineWidth = "3";
		break;
		case "thin":
			ctx.lineWidth = "1";
		break;
	}
	ctx.beginPath();
	ctx.moveTo(this.start.x, this.start.y);
	ctx.quadraticCurveTo(((this.start.x + this.end.x)/1.8),((this.start.y + this.end.y)/2.4), this.end.x, this.end.y);
	ctx.stroke();
	ctx.closePath();
	
}

//////////////////////////////////////////////////////
function SpiderLoop() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//update node positions
	for (var i=0;i<nodes.length;i++) {
		//TODO: replace this temporary idea
		var childActive = false;
		var currentNode = activeNode;
		while (currentNode.parent && (currentNode=currentNode.parent)) {
			if (currentNode == nodes[i]) childActive = true;
		}
		if (childActive || activeNode==nodes[i] || activeNode==nodes[i].parent) {
			nodes[i].visible=true;
			nodes[i].hasLayout = true;
		} else {
			nodes[i].visible=false;
			if (nodes[i].parent && nodes[i].parent.parent && nodes[i].parent.parent==activeNode) {
				nodes[i].hasLayout = true;
			} else {
				nodes[i].hasLayout = false;
			}
		}
		if (nodes[i].visible) {
			nodes[i].el.style.display="block";
		} else {
			nodes[i].el.style.display="none";
		}
		if ((showSublines && !nodes[i].hasLayout) || (!showSublines && !nodes[i].visible)) continue;
		nodes[i].updatePosition();
	}
	//display lines
	for (var i=0;i<lines.length;i++) {
		lines[i].updatePosition();
	}
}
//////////////////////////////////////////////////////
function addList(ul, parent) {
	var mylis = ul.childNodes;
	var thislist = [];
	var linecounter = 0;
	for (var li=0;li<mylis.length;li++) {
		if (mylis[li].tagName!='LI') continue;
		var nodeno = nodes.length;
		nodes[nodeno] = new SpiderNode(nodeno, mylis[li], parent);

		thislist[thislist.length] = nodes[nodeno];
		var mylicontent = mylis[li].childNodes;
		for (var i=0;i<mylicontent.length;i++) {
			if (mylicontent[i].tagName!='UL') continue;
			addList(mylicontent[i], nodes[nodeno]);
		}

		if (parent!=null) {
			var lineno = lines.length;
			lines[lineno] = new SpiderLine(lineno, nodes[nodeno], parent);
		}

	}
}


var nodes = new Array();
var lines = new Array();
var activenode=null;
onload = function() {
	var myroot = $$('#js-mindmap>a')[0];

	// create a misc UL to store flattened nodes
	var miscUL = document.createElement("UL");
	$('js-mindmap').appendChild(miscUL);

	var nodeno = nodes.length;
	nodes[nodeno] = new SpiderNode(nodeno, myroot, null, true);

	var myul = $$('#js-mindmap>ul')[0];
	addList(myul, nodes[nodeno]);
	for (var i=0;i<nodes.length;i++) {
		nodes[i].normalizePosition();
	}

	setInterval(SpiderLoop, 40);
	
	$('js-mindmap').addClass('js-mindmap');
	
	//CANVAS
	canvas = document.getElementById("cv");
	ctx = canvas.getContext("2d");
	ctx.lineWidth = "2";
	ctx.strokeStyle = "rgb(100, 100, 100)";
}
