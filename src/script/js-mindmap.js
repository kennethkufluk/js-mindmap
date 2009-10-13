// js-mindmap
// (c) Kenneth Kufluk 2008/09 http://kenneth.kufluk.com/
// ported to jQuery plugin by Mike Trpcic http://www.mtrpcic.net/
// GPLv3 http://www.gnu.org/licenses/gpl.html

jQuery.fn.mindmap = function(options) {
    // Define default settings.
    var options = jQuery.extend({
        attract: 6,
        repulse: 2,
        damping: 0.55,
        timeperiod: 10,
        wallrepulse: 0.2,
        mapArea: {
            x:-1,
            y:-1
        },
        canvasError: 'alert',
        canvas: 'cv',
        minSpeed: 0.05,
        maxForce: 0.1,
        showSublines: true,
        updateIterationCount: 20,
        showProgressive: false
    },options);

    var nodes = new Array();
    var lines = new Array();
    var activenode = null;

    // Define all Node related functions.
    function Node(index, el, parent, active){
    	this.el = jQuery(el);
    	this.el.mindMapObj = this;
        if (active) {
            activeNode = this;
            jQuery(this.el).addClass('active');
        }
        this.parent = parent;
        this.el.addClass('node');
        this.index = index;
        this.visible = true;
        this.hasLayout = true;
        this.x = Math.random()+(options.mapArea.x/2);
        this.y = Math.random()+(options.mapArea.y/2);
    	this.el.css('left', this.x + "px");
    	this.el.css('top', this.y + "px");
        this.dx = 0;
        this.dy = 0;
        this.count = 0;
        
        this.el.draggable();
        this.el.css('position','absolute');        

        if (this.el.children()[0]) {
            if (this.el.children()[0].tagName == 'A') this.el.href = this.el.children().href;
        }

        this.el.click(function(){
            if (activeNode) $(activeNode.el).removeClass('active');
            activeNode = this.mindMapObj;
            $(activeNode.el).addClass('active');
            return false;
        });

        this.el.dblclick(function(){
            location.href=this.href;
            return false;
        });
    }

    Node.prototype.normalizePosition = function(){
        //move node to root (outside of parental positioning)
        if (this.parent != null) {
            $("#js-mindmap>ul:eq(1)").append(this.el);
        }
    }
    //TODO: Write this method!
    Node.prototype.layOutChildren = function(){
    //show my child nodes in an equally spaced group around myself, instead of placing them randomly
    }

    Node.prototype.getForceVector = function(){
        var fx = 0;
        var fy = 0;
        for (var i = 0; i < nodes.length; i++) {
            if (i == this.index) continue;
            if ((options.showSublines && !nodes[i].hasLayout) || (!options.showSublines && !nodes[i].visible)) continue;
            // Repulsive force (coulomb's law)
            var x1 = (nodes[i].x - this.x);
            var y1 = (nodes[i].y - this.y);
            //adjust for variable node size
//		var nodewidths = ((jQuery(nodes[i]).width() + jQuery(this.el).width())/2);
            var xsign = x1 / Math.abs(x1);
            var ysign = y1 / Math.abs(y1);
            var dist = Math.sqrt((x1 * x1) + (y1 * y1));
            var theta = Math.atan(y1 / x1);
            if (x1 == 0) {
                theta = Math.PI / 2;
                xsign = 0;
            }
            // force is based on radial distance
            var myrepulse = options.repulse;
            if (this.parent==nodes[i]) myrepulse=myrepulse*10;  //parents stand further away
            var f = (myrepulse * 500) / (dist * dist);
            if (Math.abs(dist) < 500) {
                fx += -f * Math.cos(theta) * xsign;
                fy += -f * Math.sin(theta) * xsign;
            }
        }
        // add repulsive force of the "walls"
        //left wall
        var xdist = this.x + jQuery(this.el).width();
        var f = (options.wallrepulse * 500) / (xdist * xdist);
        fx += Math.min(2, f);
        //right wall
        var rightdist = (options.mapArea.x - xdist);
        var f = -(options.wallrepulse * 500) / (rightdist * rightdist);
        fx += Math.max(-2, f);
        //top wall
        var f = (options.wallrepulse * 500) / (this.y * this.y);
        fy += Math.min(2, f);
        //botttom wall
        var bottomdist = (options.mapArea.y - this.y);
        var f = -(options.wallrepulse * 500) / (bottomdist * bottomdist);
        fy += Math.max(-2, f);

        // for each line, of which I'm a part, add an attractive force.
        for (var i = 0; i < lines.length; i++) {
            var otherend = null;
            if (lines[i].start.index == this.index) {
                otherend = lines[i].end;
            } else if (lines[i].end.index == this.index) {
                otherend = lines[i].start;
            } else continue;
            // Attractive force (hooke's law)
            var x1 = (otherend.x - this.x);
            var y1 = (otherend.y - this.y);
            var dist = Math.sqrt((x1 * x1) + (y1 * y1));
            var xsign = x1 / Math.abs(x1);
            var theta = Math.atan(y1 / x1);
            if (x1==0) {
                theta = Math.PI / 2;
                xsign = 0;
            }
            // force is based on radial distance
            var f = (options.attract * dist) / 10000;
            if (Math.abs(dist) > 0) {
                fx += f * Math.cos(theta) * xsign;
                fy += f * Math.sin(theta) * xsign;
            }
        }

        // if I'm active, attract me to the centre of the area
        if (activeNode === this) {
            // Attractive force (hooke's law)
            var otherend = options.mapArea;
            var x1 = ((otherend.x / 2) - 100 - this.x);
            var y1 = ((otherend.y / 2) - this.y);
            var dist = Math.sqrt((x1 * x1) + (y1 * y1));
            var xsign = x1 / Math.abs(x1);
            var theta = Math.atan(y1 / x1);
            if (x1 == 0) {
                theta = Math.PI / 2;
                xsign = 0;
            }
            // force is based on radial distance
            var f = (0.1 * options.attract*dist) / 10000;
            if (Math.abs(dist) > 0) {
                fx += f * Math.cos(theta) * xsign;
                fy += f * Math.sin(theta) * xsign;
            }
        }

        if (Math.abs(fx) > options.maxForce) fx = options.maxForce * (fx / Math.abs(fx));
        if (Math.abs(fy) > options.maxForce) fy = options.maxForce * (fy / Math.abs(fy));
        return {
            x: fx,
            y: fy
        };
    }

    Node.prototype.getSpeedVector = function(){
        return {
            x:this.dx,
            y:this.dy
        };
    }

    Node.prototype.updatePosition = function(){
        if (jQuery(this.el).hasClass("ui-draggable-dragging")) {
    		this.x = parseInt(this.el.css('left')) + (jQuery(this.el).width() / 2);
    		this.y = parseInt(this.el.css('top')) + (jQuery(this.el).height() / 2);
    		this.dx = 0;
    		this.dy = 0;
    		return;
    	}
        
        
        //apply accelerations
        var forces = this.getForceVector();
        //			$('debug1').innerHTML = forces.x;
        this.dx += forces.x * options.timeperiod;
        this.dy += forces.y * options.timeperiod;

        //TODO: CAP THE FORCES

        //			this.el.childNodes[0].innerHTML = parseInt(this.dx)+' '+parseInt(this.dy);
        this.dx = this.dx * options.damping;
        this.dy = this.dy * options.damping;

        //ADD MINIMUM SPEEDS
        if (Math.abs(this.dx) < options.minSpeed) this.dx = 0;
        if (Math.abs(this.dy) < options.minSpeed) this.dy = 0;
        //apply velocity vector
        this.x += this.dx * options.timeperiod;
        this.y += this.dy * options.timeperiod;
        this.x = Math.min(options.mapArea.x,Math.max(1,this.x));
        this.y = Math.min(options.mapArea.y,Math.max(1,this.y));
        //only update the display after the thousanth iteration, so it's not too wild at the start
        this.count++;
        //			if (this.count<updateDisplayAfterNthIteration) return;
        // display
    	var showx = this.x - (jQuery(this.el).width() / 2);
    	var showy = this.y - (jQuery(this.el).height() / 2);
    	this.el.css('left', showx + "px");
    	this.el.css('top', showy + "px");
    }

    // Define all Line related functions.
    function Line(index, startNode, finNode){
        this.index = index;
        this.start = startNode;
        this.colour = "blue";
        this.size = "thick";
        this.end = finNode;
        this.count = 0;
    }

    Line.prototype.updatePosition = function(){
        if (options.showSublines && (!this.start.hasLayout || !this.end.hasLayout)) return;
        if (!options.showSublines && (!this.start.visible || !this.end.visible)) return;
        if (this.start.visible && this.end.visible) this.size = "thick";
        else this.size = "thin";
        if (activeNode.parent == this.start || activeNode.parent == this.end) this.colour = "red";
        else this.colour = "blue";
        switch (this.colour) {
            case "red":
                ctx.strokeStyle = "rgb(100, 0, 0)";
                break;
            case "blue":
                ctx.strokeStyle = "rgb(0, 0, 100, 0.2)";
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
        ctx.quadraticCurveTo(((this.start.x + this.end.x) / 1.8),((this.start.y + this.end.y) / 2.4), this.end.x, this.end.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
        ctx.closePath();
    }

    // Define all Loop related functions.
    function Loop(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        //update node positions
        for (var i = 0; i < nodes.length; i++) {
            //TODO: replace this temporary idea
            var childActive = false;
            var currentNode = activeNode;
            while (currentNode.parent && (currentNode = currentNode.parent)) {
                if (currentNode == nodes[i]) childActive = true;
            }
            if (childActive || activeNode == nodes[i] || activeNode == nodes[i].parent) {
                nodes[i].visible = true;
                nodes[i].hasLayout = true;
            } else {
                nodes[i].visible = false;
                if (nodes[i].parent && nodes[i].parent.parent && nodes[i].parent.parent == activeNode) {
                    nodes[i].hasLayout = true;
                } else {
                    nodes[i].hasLayout = false;
                }
                if (!options.showProgressive) {
                    nodes[i].visible = true;
                    nodes[i].hasLayout = true;
                }
            }
            if (nodes[i].visible) {
                nodes[i].el.show();
            } else {
                nodes[i].el.hide();
            }
            if ((options.showSublines && !nodes[i].hasLayout) || (!options.showSublines && !nodes[i].visible)) continue;
            nodes[i].updatePosition();
        }
        //display lines
        for (var i = 0; i < lines.length; i++) {
            lines[i].updatePosition();
        }
    }

    // Define all List related functions.
    function addList(ul, parent){
        var mylis = ul.childNodes;
        var thislist = [];
        var linecounter = 0;
        for (var li = 0; li < mylis.length; li++) {
            if (mylis[li].tagName != 'LI') continue;
            var nodeno = nodes.length;
            nodes[nodeno] = new Node(nodeno, mylis[li], parent);

            thislist[thislist.length] = nodes[nodeno];
            var mylicontent = mylis[li].childNodes;
            for (var i = 0; i < mylicontent.length; i++) {
                if (mylicontent[i].tagName != 'UL') continue;
                addList(mylicontent[i], nodes[nodeno]);
            }

            if (parent != null) {
                var lineno = lines.length;
                lines[lineno] = new Line(lineno, nodes[nodeno], parent);
            }
        }
    }

    
    return this.each(function() {
        if (typeof window.CanvasRenderingContext2D == 'undefined' && typeof G_vmlCanvasManager == 'undefined') {
            if (options.canvasError === "alert"){
                alert("ExCanvas was not properly loaded.");
            } else if (options.canvasError === "console"){
                console.log("ExCanvas was not properly loaded.");
            } else {
                options.canvasError();
            }
        } else {
            //CANVAS
            canvas = document.getElementById(options.canvas);
            if (options.mapArea.x==-1) {
                options.mapArea.x = $(canvas).width();
            }
            if (options.mapArea.y==-1) {
                options.mapArea.y = $(canvas).height();
            }
            ctx = canvas.getContext("2d");
            ctx.lineWidth = "2";
            ctx.strokeStyle = "rgb(100, 100, 100)";
            

            var myroot = $("#js-mindmap>a")[0];
            // create a misc UL to store flattened nodes
            var miscUL = document.createElement("UL");
            $('#js-mindmap').append(miscUL);

            var nodeno = nodes.length;
            nodes[nodeno] = new Node(nodeno, myroot, null, true);

            var myul = $("#js-mindmap>ul")[0];
            addList(myul, nodes[nodeno]);
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].normalizePosition();
            }

            setInterval(Loop, 1);

            $('#js-mindmap').addClass('js-mindmap');

        }
    });
};
