function zoomed() {
  d3.selectAll(".node, .link, .nodeText").attr("transform", d3.event.transform);
}

function replaceString(str ,index, replacement) {
    return str.substr(0, index) + replacement+ str.substr(index + replacement.length);
}


function baseColor (base, colors) {
	switch (base){
		case "A":
			return colors[3];
		case "T":
			return colors[4];
		case "G":
			return colors[0];
		case "C":
			return colors[1];
		case "N":
			return colors[2];
	}

}

function isComplementary(base) {

}

function equalToEventTarget() {
    return this == d3.event.target;
}


function dragstart(d, i) {
}

function dragmove(d, i) {
	d.px += d3.event.dx;
	d.py += d3.event.dy;
	d.x += d3.event.dx;
	d.y += d3.event.dy; 
	dragTick(); // this is the key to make it work together with updating both px,py,x,y on d !
}

function dragend(d, i) {
	d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
	dragTick();
}

function dragTick() {
	d3.selectAll(".link, .link.merged, .link.phos, .comp").attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	d3.selectAll('.node').attr('cx', function(d) { return d.x; });
	d3.selectAll('.nodeText').attr('dx', function(d) { return d.x -10; });
	d3.selectAll('.node').attr('cy', function(d) { return d.y; });
	d3.selectAll('.nodeText').attr('dy', function(d) { return d.y -10; });
};