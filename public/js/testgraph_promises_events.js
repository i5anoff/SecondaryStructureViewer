var width = 900,
    height = 900;

var svg = d3.select('body').append('svg').attr('id','graph')
    .attr('width', width)
    .attr('height', height);

var seqString = "",
	dbnString = "";

var nodes = [],
	links = [];

var colorA = "",
	colorT = "",
	colorG = "",
	colorC = "",
	colorN = "";

var connectionMode = false,
	connectionDrawMode = false,
	editMode = false,
	paintMode = false;

var activatedNode = null;
var availableComps = [];

//NOTE: config values refer to indeces in global preset, not actual numeric values

var config = {
	colormode: 2,
	font: 2,
	nodeRadius: 0,
	linkWidth: 0
};
/*------GLOBAL PRESETS---------------*/

//ColorBrewer 5 value diverging color schemes
//middle color is N base, first pair is C & G, second pair is A & T

var colorz = [['#a6611a','#dfc27d','#f5f5f5','#80cdc1','#018571'],
	['#d01c8b','#f1b6da','#f7f7f7','#b8e186','#4dac26'],
	['#7b3294','#c2a5cf','#f7f7f7','#a6dba0','#008837'],
	['#e66101','#fdb863','#f7f7f7','#b2abd2','#5e3c99'],
	['#ca0020','#f4a582','#f7f7f7','#92c5de','#0571b0'],
	['#d7191c','#fdae61','#ffffbf','#abd9e9','#2c7bb6'],
	['#d7191c','#fdae61','#ffffbf','#a6d96a','#1a9641'],
	['#d7191c','#fdae61','#ffffbf','#abdda4','#2b83ba']];

var fontz = ["'Inconsolata', monospace", 
	"'Roboto Mono', monospace", 
	"'Source Code Pro', monospace",
	"'Cousine', monospace"];

var nodeRadii = [4, 6, 8, 10];

var linkWidths = [1, 2, 3, 4];

/*-----------------------------------*/

var node_drag = d3.drag()
	.on("start", dragstart)
	.on("drag", dragmove)
	.on("end", dragend);

//parse URL to determine render mode
var urlBits = window.location.toString().split('/');
var loadingFromDb = urlBits[urlBits.length - 2] == 'load';
console.log(urlBits[urlBits.length - 1]);



var loadingPromises = [];

//determine whether interface is loading default view or from database
if(loadingFromDb){
	loadingPromises = [window.fetch("/share/"+urlBits[urlBits.length - 1]).then(res => res.json())];
}
else{
	loadingPromises = [
	window.fetch("/data/sequence.txt").then(res => res.text()),
	window.fetch("/data/dbn.txt").then(res => res.text())
	]

}

//load, parse, render relevant data
Promise.all(loadingPromises)
.then(function(loadedData) {
	console.log(loadedData);
	var seq_data, dbn_data;

	if(!loadingFromDb) {
	 	seq_data = loadedData[0];
	 	dbn_data = loadedData[1];
	 	renderGraphFromSequence(seq_data,dbn_data);
	}	
	else {
		seq_data = loadedData[0].seq;
		dbn_data = loadedData[0].dbn;
		
		renderGraphFromJSON(loadedData[0]);
		
	}


	// //BIND LISTENERS

	// //bind click event behavior for all states
	// d3.selectAll('.node').on('click',function(d,i){onNodeClick(d,i)});

	//catch clicks that occur outside the graph when in connectionDrawMode -- outside clicks are for exiting link creation
	d3.select('body').on('click', function(){
		if(connectionDrawMode){
			let outside = d3.selectAll('.node').filter(equalToEventTarget).empty();
			if (outside){
				console.log("clicked outside!");
				d3.select("#linkLine").remove();
				resetConnectionMode();
			}
			
		}
		
	});

	//mousemove behavior for drawing new connection lines
	d3.select('svg').on('mousemove', graphMouseMove)

	//TODO: integrate zooming behavior
		//.call(d3.zoom()
		//	.scaleExtent([1 / 2, 4])
		//	.on("zoom", zoomed));

	// INTERACTION MENU

	// PAINT INTERACTION

	d3.select('.fa-paint-brush').on("click",function(){

		//activate paint mode
		if(!paintMode){
			d3.select("#topcontainer").append('div').attr('id','paintOptions');

			//color buttons
			d3.select('#paintOptions').append('div').attr('id','colorWrapper')
			for (let i = 0; i < colorz.length; i++){
				d3.select('#colorWrapper').append('div').attr('class','colorbox')
					.attr('id','color'+i)
					.on("click", function(){				
					    config.colormode = i;
						d3.selectAll('.BaseA').style('fill',colorz[i][3]);
						d3.selectAll('.BaseT').style('fill',colorz[i][4]);
						d3.selectAll('.BaseG').style('fill',colorz[i][0]);
						d3.selectAll('.BaseC').style('fill',colorz[i][1]);
						d3.selectAll('.BaseN').style('fill',colorz[i][2]);

						d3.selectAll('.letterBaseA').style('color',colorz[i][3])
						d3.selectAll('.letterBaseT').style('color',colorz[i][4])
						d3.selectAll('.letterBaseG').style('color',colorz[i][0])
						d3.selectAll('.letterBaseC').style('color',colorz[i][1])
						d3.selectAll('.letterBaseN').style('color',colorz[i][2])
					
					})
				
				d3.select('#color'+i).append('span')
					.style('background-color',colorz[i][0])
				d3.select('#color'+i).append('span')
					.style('background-color',colorz[i][1])
				d3.select('#color'+i).append('span')
					.style('background-color',colorz[i][2])
				d3.select('#color'+i).append('span')
					.style('background-color',colorz[i][3])
				d3.select('#color'+i).append('span')
					.style('background-color',colorz[i][4])


			}

			//font buttons
			d3.select('#paintOptions').append('div').attr('id','fontWrapper')
			for(let i = 0; i < fontz.length; i++){
				d3.select("#fontWrapper").append('div').attr('class','fontbox')
					.on("click",function(){
						config.font = i;
						d3.selectAll("#dbn, #sequence, #connectionMode, .nodeText").style("font-family", fontz[i]);
					})
					.attr('id','font'+i)
					.style("font-family",fontz[i])
					.text("Font "+i)

			}

			//node size buttons
			d3.select('#paintOptions').append('div').attr('id','nodeSizeWrapper')		
			for(let i = 0; i < nodeRadii.length; i++){
				d3.select("#nodeSizeWrapper").append('div').attr('class','nodebox')
					.attr('id','size'+i)
					.on('click',function(){
						config.nodeRadius = i;
						d3.selectAll('.node').attr('r', nodeRadii[i]);
					})
					.append('svg').attr('class',"nodeSizeSvg")				
					.append('circle')
					.attr('cx', 10)
					.attr('cy', 10)
					.attr('r',nodeRadii[i]);
			}

			//link width buttons
			d3.select('#paintOptions').append('div').attr('id','linkWidthWrapper')
			for(let i = 0; i < linkWidths.length; i++){
				d3.select("#linkWidthWrapper").append('div').attr('class','linkbox')
					.attr('id','size'+i)
					.on('click',function(){
						config.linkWidth = i;
						d3.selectAll('.link').style('stroke-width',linkWidths[i]);
					})
					.append('svg').attr('class',"linkWidthSvg")				
					.append('line')
					.attr("x1",0)
					.attr("y1",0)
					.attr("x2",25)
					.attr("y2",25)
					.style("stroke-width",linkWidths[i])
					.style("stroke","white")
			}
			paintMode = !paintMode;
		}

		//deactivate paint mode
		else{
			d3.select("#paintOptions").remove();
			paintMode = !paintMode;
		}

	})

	//TODO: SHARE INTERACTION
	d3.select('.fa-share-square-o').on("click",function(){
		//console.log("share button");
		for(var link of links) {

			link.source_idx = link.source.id;
			link.target_idx = link.target.id;
			console.log(link);
		}

		let visState = {
			config: config,
			force: false,
			nodes: nodes,
			links: links,
			seq: seqString,
			dbn: dbnString
		}
		window.fetch('/share', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(visState)
		}).then((res) => {
			//console.log(res);
			return res;
		}).then(res => res.json()).then(function(res){
			//console.log("recevied response");
			console.log(res);
			d3.select("#utils").append('div')
				.style("font-family",fontz[config.font])
				.text("load/" + res.id)
			//console.log(res);
		})
	})

	//EDIT INTERACTION
	d3.select('.fa-pencil-square-o').on("click",function(){
		let previousState = ""
		if(connectionMode){
			previousState = "connect"
			resetConnectionMode()
			//connectionMode = false;
		}
		else{
			previousState = "draw"
		}

		editMode = !editMode;

		//initiating edit mode
		if(editMode){
			$('#connectionMode').html('edit mode active &mdash; press Enter to render graph with new sequence, or press edit again to return to existing sequence');

			d3.selectAll("#dbn span")
				.style("opacity",0)
				//.style("height",0)
				//.style("width")
			d3.select("#dbn").append("input")
				.attr('id','inputDbn')
				.style("font-family",fontz[config.font])
				.style("position","absolute")
				.style("left", "10px")
				.style("z-index",1)
				.attr("size", 105)
				.attr("value",dbnString);

			d3.selectAll("#sequence span")
				.style("opacity",0)

			d3.select("#sequence").append("input")
				.attr('id','inputSeq')
				.style("position","absolute")
				.style("left", "10px")
				.style("z-index",1)
				.style("font-family",fontz[config.font])
				.attr("size", 105)
				.attr("value",seqString);
			//editMode = !editMode
		}

		//exiting edit mode to return to existing sequence
		else{
			if(previousState == "connect"){
				$('#connectionMode').html('connection mode active &mdash; press X again to return to drag mode');
			}
			else if(previousState = "draw"){
				$('#connectionMode').html('drag mode active &mdash; press X to initiate connection mode');
			}
			d3.selectAll("#inputSeq, #inputDbn").remove();
			d3.selectAll("#dbn span")
				.style("opacity",1)
			d3.selectAll("#sequence span")
				.style("opacity",1)
			// $('#dbn').text(dbnString);
			// $('#dbn').lettering();
			// $('#dbn span').attr('class','datatext');
			//editMode = !editMode;

		}
		

	})

})
//renders the graph with force simulation from sequential data
function renderGraphFromSequence(seq_data, dbn_data){
	//console.log(seq_data);
	//console.log(dbn_data);

	dbnString = dbn_data;
	seqString = seq_data;
	let seqArray = seq_data.split('');

	colorA = colorz[config.colormode][3],
	colorT = colorz[config.colormode][4],
	colorG = colorz[config.colormode][0],
	colorC = colorz[config.colormode][1],
	colorN = colorz[config.colormode][2];
	
	$('#sequence').text(seq_data);
	$('#sequence').lettering();
	$('#sequence span').attr('class','datatext');
	$("span:contains('A')").addClass("letterBaseA").css("color",colorA);
	$("span:contains('T')").addClass("letterBaseT").css("color",colorT);
	$("span:contains('G')").addClass("letterBaseG").css("color",colorG);
	$("span:contains('C')").addClass("letterBaseC").css("color",colorC);
	$("span:contains('N')").addClass("letterBaseN").css("color",colorN);

	d3.selectAll("#dbn, #sequence, #connectionMode").style("font-family", fontz[config.font]);

	seqArray.forEach(function (val, idx, array){
		nodes.push({
			id: idx,
			base: val,
			fivePrime: (idx==0),
			threePrime: (idx==array.length-1)
		});
	});
	$('#dbn').text(dbn_data);
	$('#dbn').lettering();
	$('#dbn span').attr('class','datatext');
	let dbnArray = dbn_data.split('');
	//let links = [];
	dbnArray.forEach(function createLinks (val, idx, array){

		//dot case
		if(val == "."){
			//check to see if this is the end of the sequence
			if(idx==array.length-1){
				//break;
			}
			//if a next node exists, connect this node to the next node
			else{
				links.push({
					source: idx,
					target: idx+1
				});
			}
		}
		//open parenthesis case
		else if(val == "("){
			//connect this node to next node. NOTE: THIS ASSUMES DBN VALIDITY, NO "(" AT END OF SEQUENCE
			links.push({
				source: idx,
				target: idx+1
			});

			//alg for finding matching close parenthesis
			var curIdx = idx;
			var counter = 0;
			for (var i = curIdx+1; i < array.length; i++){
				if(dbnArray[i] == "."){
					counter+=0;
				}
				else if(dbnArray[i] == "("){
					counter+=1;
				}
				else if(dbnArray[i] == ")"){
					counter-=1;

					//matching case
					if(counter == -1){
						links.push({
							source: curIdx,
							target: i
						});
						break;
					}
				}
			}
		}

		//close parenthesis case
		else if(val == ")"){

			if(idx==array.length-1){
				//break;
			}
			//if a next node exists, connect this node to the next node
			else{
				links.push({
					source: idx,
					target: idx+1
				});
			}
		}
	})
	

	let simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.index }).iterations(nodes.length/5))
		.force("charge", d3.forceManyBody()
			.strength(function(){return -120;})
			.distanceMin(function(){return 40;})
		)
		.force("center", d3.forceCenter(width / 2, height / 2))
		.force("y", d3.forceY(0))
        .force("x", d3.forceX(0))

	simulation.nodes(nodes);
	simulation.force('link').links(links);

	var link = svg.append('g').attr('id','linkContainer').selectAll('.link')
		.data(links)
		.enter().append('line')
		.style('stroke-width',linkWidths[config.linkWidth])
		.attr('class', function(d){
			//style phosphate backbone links
			if(d.target.id-d.source.id==1){
				return "link phos";
			}
			//style complementary base links
			else{
				return "link comp";
			}
		});

	
	var node = svg.selectAll('.node')
		.data(nodes)
		.enter().append('g').attr('class','nodeHolder');

	var nodeCirc = node.append('circle')
		.attr('class', function(d, i){
			switch (d.base){
				case "A":
					return "node BaseA";
				case "T":
					return "node BaseT";
				case "G":
					return "node BaseG";
				case "C":
					return "node BaseC";
				case "N":
					return "node BaseN";
			}
			
		})
		.call(node_drag);

	d3.selectAll('.node.BaseA').style("fill",colorA);
	d3.selectAll('.node.BaseT').style("fill",colorT);
	d3.selectAll('.node.BaseG').style("fill",colorG);
	d3.selectAll('.node.BaseC').style("fill",colorC);
	d3.selectAll('.node.BaseN').style("fill",colorN);
	var nodeText = node.append('text')
		.attr('class', 'nodeText');

	d3.selectAll(".nodeText").style("font-family", fontz[config.font]);

	nodeCirc.attr('r', function(d){
			if(d.fivePrime || d.threePrime) { return nodeRadii[config.nodeRadius]+2;}
			else{return nodeRadii[config.nodeRadius];}
		})
	nodeText.attr('dy', function(d){return d.y-10;})
		.attr('dx', function(d){return d.x-10;})
		.text(function(d){
			if(d.fivePrime){
				return "5'";
			}
			else if(d.threePrime){
				return "3'";
			}
		})
	simulation.on('tick', function(){
		nodeText.attr('dy', function(d){return d.y-10;})
			.attr('dx', function(d){return d.x-10;});
		nodeCirc.attr('cx', function(d) { return d.x; })
			.attr('cy', function(d) { return d.y; });

		link.attr('x1', function(d) { return d.source.x; })
			.attr('y1', function(d) { return d.source.y; })
			.attr('x2', function(d) { return d.target.x; })
			.attr('y2', function(d) { return d.target.y; });


	})

	
	//hover behavior for sequence
	
	$('#sequence span').hover(function mouseIn (){
		$(this).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': $(this).css("color"),
			'color': "#333"
		});
		let thisId = $(this).attr('id');
		let thisIdNum = parseInt($(this).attr('id').split("r")[1])-1;

		$('#dbn span#' + thisId).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': '#999',
			'color': '#333'
		});

		d3.selectAll('.node').attr('opacity',function(d,i){return thisIdNum == i ? 1 : 0.1;})
	}, function mouseOut (){
		let thisId = $(this).attr('id');
		$(this).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': $(this).css("background-color")
		});
		$('#dbn span#' + thisId).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': '#999'
		});
		d3.selectAll('.node').attr('opacity',1)
	});

	//hover behavior for DBN

	$('#dbn span').hover(function mouseIn (){
		$(this).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': '#999',
			'color': '#333'
		});

		let thisId = $(this).attr('id');
		let thisIdNum = parseInt($(this).attr('id').split("r")[1])-1;

		$('#sequence span#' + thisId).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': $('#sequence span#' + thisId).css("color"),
			'color': "#333"
		});
		d3.selectAll('.node').attr('opacity',function(d,i){return thisIdNum == i ? 1 : 0.1;})
	}, function mouseOut (){

		let thisId = $(this).attr('id');
		$(this).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': '#999'
		});
		$('#sequence span#' + thisId).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': $('#sequence span#' + thisId).css("background-color")
		});
		d3.selectAll('.node').attr('opacity',1)
	});


	//hover behavior for graph

	d3.selectAll('.node').on('mouseenter',function(d,i){
		d3.selectAll('.node').attr('opacity', function(d,ii){return i == ii ? 1 : 0.1;});
		let spanId = i + 1;
		$('#dbn span#char' + spanId).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': '#999',
			'color': '#333'
		});
		$('#sequence span#char' + spanId).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': $('#sequence span#char' + spanId).css("color"),
			'color': "#333"
		});
	}).on('mouseleave', function(d,i){
		d3.selectAll('.node').attr('opacity',1);
		let spanId = i + 1;
		$('#dbn span#char' + spanId).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': "#999"
		});
		$('#sequence span#char' + spanId).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': $('#sequence span#char' + spanId).css("background-color")
		});
	})

	//BIND LISTENERS

	//bind click event behavior for all states
	d3.selectAll('.node').on('click',function(d,i){onNodeClick(d,i)});

	
}

function renderGraphFromJSON(state_json) {
		d3.selectAll("#inputSeq, #inputDbn").remove();
		d3.selectAll("#dbn span, #sequence span").remove();
		d3.selectAll(".link, .nodeHolder").remove();
		d3.select("#linkContainer").remove();
		nodes = [];
		links = [];
		$('#connectionMode').html('drag mode active &mdash; press X to initiate connection mode');
		connectionMode = false;
		_renderGraphFromJSON(state_json);

}

//renders the graph without force simulation from a previous graph JSON state
function _renderGraphFromJSON(state_json){
	console.log(state_json)
	config = state_json.config;
	dbnString = state_json.dbn;
	seqString = state_json.seq;

	//renderGraphFromSequence(seqString, dbnString);

	let seqArray = seqString.split(''),
		dbnArray = dbnString.split('');

	colorA = colorz[config.colormode][3],
	colorT = colorz[config.colormode][4],
	colorG = colorz[config.colormode][0],
	colorC = colorz[config.colormode][1],
	colorN = colorz[config.colormode][2];

	$('#sequence').text(seqString);
	$('#sequence').lettering();
	$('#sequence span').attr('class','datatext');
	$("span:contains('A')").addClass("letterBaseA").css("color",colorA);
	$("span:contains('T')").addClass("letterBaseT").css("color",colorT);
	$("span:contains('G')").addClass("letterBaseG").css("color",colorG);
	$("span:contains('C')").addClass("letterBaseC").css("color",colorC);
	$("span:contains('N')").addClass("letterBaseN").css("color",colorN);

	d3.selectAll("#dbn, #sequence, #connectionMode").style("font-family", fontz[config.font]);

	

	nodes = state_json.nodes;
	links = state_json.links;
	console.log(nodes);
	
	//recreate object reference which was lost through stringification
	for(var link of links) {
		console.log(link.source_idx);
		link.source = nodes[link.source_idx];
		link.target = nodes[link.target_idx];
		console.log(link.source);
	}

	$('#dbn').text(dbnString);
	$('#dbn').lettering();
	$('#dbn span').attr('class','datatext');
	

	var link = svg.append('g').attr('id','linkContainer').selectAll('.link')
	.data(state_json.links)
	.enter().append('line')
	.style('stroke-width',linkWidths[config.linkWidth])
	.attr('class', function(d){
		//style phosphate backbone links
		if(d.target.id-d.source.id==1){
			return "link phos";
		}
		//style complementary base links
		else{
			return "link comp";
		}
	});

	
	var node = svg.selectAll('.node')
		.data(state_json.nodes)
		.enter().append('g').attr('class','nodeHolder');

	var nodeCirc = node.append('circle')
		.attr('class', function(d, i){
			switch (d.base){
				case "A":
					return "node BaseA";
				case "T":
					return "node BaseT";
				case "G":
					return "node BaseG";
				case "C":
					return "node BaseC";
				case "N":
					return "node BaseN";
			}
			
		})
		.call(node_drag);

	d3.selectAll('.node.BaseA').style("fill",colorA);
	d3.selectAll('.node.BaseT').style("fill",colorT);
	d3.selectAll('.node.BaseG').style("fill",colorG);
	d3.selectAll('.node.BaseC').style("fill",colorC);
	d3.selectAll('.node.BaseN').style("fill",colorN);
	var nodeText = node.append('text')
		.attr('class', 'nodeText');

	d3.selectAll(".nodeText").style("font-family", fontz[config.font]);

	nodeCirc.attr('r', function(d){
		if(d.fivePrime || d.threePrime) { return nodeRadii[config.nodeRadius]+2;}
		else{return nodeRadii[config.nodeRadius];}
	})
	nodeCirc.attr('cx', function(d) { return d.x; })
		.attr('cy', function(d) { return d.y; });

	link.attr('x1', function(d) { return d.source.x; })
		.attr('y1', function(d) { return d.source.y; })
		.attr('x2', function(d) { return d.target.x; })
		.attr('y2', function(d) { return d.target.y; });
	nodeText.attr('dy', function(d){return d.y-10;})
		.attr('dx', function(d){return d.x-10;})
		.text(function(d){
			if(d.fivePrime){
				return "5'";
			}
			else if(d.threePrime){
				return "3'";
			}
	})
	d3.selectAll('.node').call(node_drag);
	//hover behavior for sequence
	
	$('#sequence span').hover(function mouseIn (){
		$(this).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': $(this).css("color"),
			'color': "#333"
		});
		let thisId = $(this).attr('id');
		let thisIdNum = parseInt($(this).attr('id').split("r")[1])-1;

		$('#dbn span#' + thisId).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': '#999',
			'color': '#333'
		});

		d3.selectAll('.node').attr('opacity',function(d,i){return thisIdNum == i ? 1 : 0.1;})
	}, function mouseOut (){
		let thisId = $(this).attr('id');
		$(this).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': $(this).css("background-color")
		});
		$('#dbn span#' + thisId).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': '#999'
		});
		d3.selectAll('.node').attr('opacity',1)
	});

	//hover behavior for DBN

	$('#dbn span').hover(function mouseIn (){
		$(this).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': '#999',
			'color': '#333'
		});

		let thisId = $(this).attr('id');
		let thisIdNum = parseInt($(this).attr('id').split("r")[1])-1;

		$('#sequence span#' + thisId).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': $('#sequence span#' + thisId).css("color"),
			'color': "#333"
		});
		d3.selectAll('.node').attr('opacity',function(d,i){return thisIdNum == i ? 1 : 0.1;})
	}, function mouseOut (){

		let thisId = $(this).attr('id');
		$(this).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': '#999'
		});
		$('#sequence span#' + thisId).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': $('#sequence span#' + thisId).css("background-color")
		});
		d3.selectAll('.node').attr('opacity',1)
	});


	//hover behavior for graph

	d3.selectAll('.node').on('mouseenter',function(d,i){
		d3.selectAll('.node').attr('opacity', function(d,ii){return i == ii ? 1 : 0.1;});
		let spanId = i + 1;
		$('#dbn span#char' + spanId).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': '#999',
			'color': '#333'
		});
		$('#sequence span#char' + spanId).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': $('#sequence span#char' + spanId).css("color"),
			'color': "#333"
		});
	}).on('mouseleave', function(d,i){
		d3.selectAll('.node').attr('opacity',1);
		let spanId = i + 1;
		$('#dbn span#char' + spanId).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': "#999"
		});
		$('#sequence span#char' + spanId).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': $('#sequence span#char' + spanId).css("background-color")
		});
	})

	//BIND LISTENERS

	//bind click event behavior for all states
	d3.selectAll('.node').on('click',function(d,i){onNodeClick(d,i)});
	//nodeText.attr('dy', function(d){return d.y-10;})
	//	.attr('dx', function(d){return d.x-10;});
	




}

function graphMouseMove(){
	let m = d3.mouse(this);
	if(connectionDrawMode){
		svg.select("#linkLine")
			.style("stroke-width",linkWidths[config.linkWidth])
			.attr("x2", m[0])
			.attr("y2", m[1])
	}
}

function onDocumentKeyUp(event){

	//detecting 'x' keypress
	if(event.keyCode == 88){
		
		//case to turn on connection mode
		if(!connectionMode && !editMode){
			$('#connectionMode').html('connection mode active &mdash; press X again to return to drag mode');
			connectionMode = !connectionMode;

			//turn off normal mode drag behavior for connection mode
			d3.selectAll('.node').on('mousedown.drag', null);

			//hover behavior for connection mode -- highlights currently moused over node + complementary nodes
			d3.selectAll('.node').on('mouseenter',function(d,i){
			d3.selectAll('.node').attr('opacity', function(dd,ii){
				
				let ddPlus = dd.id+1;
				let dPlus = d.id+1;

				let dbnCompText = $('#dbn span#char' + ddPlus).text();
				let dbnActiveText = $('#dbn span#char' + dPlus).text();
				

				if(dbnActiveText == "."){
					switch (d.base){
						case "A":
							return (((dd.base == "T") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0.1;
						case "T":
							return (((dd.base == "A") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0.1;
						case "G":
							return (((dd.base == "C") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0.1;
						case "C":
							return (((dd.base == "G") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0.1;
						case "N":
							return i == ii ? 1 : 0.1;
					}
				}
				else if (dbnActiveText == "(" || dbnActiveText == ")"){
					return i == ii ? 1 : 0.1;
				}
				else {
					//this condition should never happen
					console.log("idk");
				}

				
			});
			let spanId = i + 1;
			$('#dbn span#char' + spanId).css({
				'font-size': 30,
				'font-weight': 'bold',
				'background-color': '#999',
				'color': '#333'
			});
			$('#sequence span#char' + spanId).css({
				'font-size': 30,
				'font-weight': 'bold',
				'background-color': $('#sequence span#char' + spanId).css("color"),
				'color': "#333"
			});
			}).on('mouseleave', function(d,i){
			d3.selectAll('.node').attr('opacity',1);
			let spanId = i + 1;
			$('#dbn span#char' + spanId).css({
				'font-size': 10,
				'font-weight': 'normal',
				'background-color': '#333',
				'color': "#999"
			});
			$('#sequence span#char' + spanId).css({
				'font-size': 10,
				'font-weight': 'normal',
				'background-color': '#333',
				'color': $('#sequence span#char' + spanId).css("background-color")
			});
			})

			

		}

		//case to turn off connection mode
		else if(!editMode){
			$('#connectionMode').html('drag mode active &mdash; press X to initiate connection mode');
			connectionMode = !connectionMode;

			//restore normal mode drag behavior
			
			d3.selectAll('.node').call(node_drag);

			d3.selectAll('.node').on('mouseenter',function(d,i){
				d3.selectAll('.node').attr('opacity', function(d,ii){return i == ii ? 1 : 0.1;});
				let spanId = i + 1;
				$('#dbn span#char' + spanId).css({
					'font-size': 30,
					'font-weight': 'bold',
					'background-color': '#999',
					'color': '#333'
				});
				$('#sequence span#char' + spanId).css({
					'font-size': 30,
					'font-weight': 'bold',
					'background-color': $('#sequence span#char' + spanId).css("color"),
					'color': "#333"
				});
				}).on('mouseleave', function(d,i){
				d3.selectAll('.node').attr('opacity',1);
				let spanId = i + 1;
				$('#dbn span#char' + spanId).css({
					'font-size': 10,
					'font-weight': 'normal',
					'background-color': '#333',
					'color': "#999"
				});
				$('#sequence span#char' + spanId).css({
					'font-size': 10,
					'font-weight': 'normal',
					'background-color': '#333',
					'color': $('#sequence span#char' + spanId).css("background-color")
				});
			})
		}
	}

	//detecting 'y' keypress--reload graph from JSON dump
	else if(event.keyCode == 89){
		let visState = {
			config: config,
			force: false,
			nodes: nodes,
			links: links,
			seq: seqString,
			dbn: dbnString
		}
		d3.selectAll("#inputSeq, #inputDbn").remove();
		d3.selectAll("#dbn span, #sequence span").remove();
		d3.selectAll(".link, .nodeHolder").remove();
		d3.select("#linkContainer").remove();
		nodes = [];
		links = [];
		$('#connectionMode').html('drag mode active &mdash; press X to initiate connection mode');
		connectionMode = false;

		//used to test how dump data upon stringification 
		renderGraphFromJSON(JSON.parse(JSON.stringify(visState)));
		
	}

	//detecting 'Enter' keypress
	else if(event.keyCode == 13){
		if(editMode){
			let openPCount = 0,
				closedPCount = 0;
			let seqValue = $("#inputSeq").val(),
				dbnValue = $("#inputDbn").val();
			let pattSeq = new RegExp('[^ATCG]'),
				pattDbn = new RegExp('[^().]');
			let dbnValueArray = dbnValue.split('');
			//can use for..in because we dont care about visiting order
			for (let x in dbnValueArray){
				if(dbnValueArray[x] == "(") openPCount++;
				else if(dbnValueArray[x] == ")") closedPCount++;
			}
			//validate sequence + dbn alignment
			if(seqValue.length != dbnValue.length){
				console.log("invalid input: sequence and dbn must be same length")
			}
			//validate sequence characters
			else if(pattSeq.test(seqValue)){
				console.log("invalid input: wrong characters in sequence");
			}
			//validate dbn characters
			else if(pattDbn.test(dbnValue)){
				console.log("invalid input: wrong characters in dbn");
			}
			//validate dbn symmetry
			else if(openPCount!=closedPCount){
				console.log("invalid input: number of '(' in dbn must match number of ')'");
			}
			//validate dbn phrasing
			else if(dbnValue.lastIndexOf("(") > dbnValue.lastIndexOf(")")){
				console.log("invalid input: unclosed link in dbn");
			}
			//input is valid!
			else{
				d3.selectAll("#inputSeq, #inputDbn").remove();
				d3.selectAll("#dbn span, #sequence span").remove();
				d3.selectAll(".link, .nodeHolder").remove();
				d3.select("#linkContainer").remove();
				nodes = [];
				links = [];
				$('#connectionMode').html('drag mode active &mdash; press X to initiate connection mode');
				editMode = false;
				
				renderGraphFromSequence(seqValue, dbnValue);
				

			}
			
		}
	}
}

function resetConnectionMode() {
	console.log(config.colormode);

	//reset connection mode html
	$('#connectionMode').html('connection mode active &mdash; press X again to return to drag mode');		

	//reset DBN highlighting
	$("#dbn span").css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': "#999"
		});
	//reset opacity
	d3.selectAll('.node').attr('opacity', 1);

	//reset sequence highlighting
	$(".letterBaseA").css({
		"color": colorz[config.colormode][3],
		"background-color": "#333",
		'font-size': 10,
		'font-weight': 'normal'
	});
	$(".letterBaseT").css({
		"color": colorz[config.colormode][4],
		"background-color": "#333",
		'font-size': 10,
		'font-weight': 'normal'
	});
	$(".letterBaseG").css({
		"color": colorz[config.colormode][0],
		"background-color": "#333",
		'font-size': 10,
		'font-weight': 'normal'
	});
	$(".letterBaseC").css({
		"color": colorz[config.colormode][1],
		"background-color": "#333",
		'font-size': 10,
		'font-weight': 'normal'
	});
	$(".letterBaseN").css({
		"color": colorz[config.colormode][2],
		"background-color": "#333",
		'font-size': 10,
		'font-weight': 'normal'
	});

	//rebind connection mode hover behavior to graph
	d3.selectAll('.node').on('mouseenter',function(d,i){
		d3.selectAll('.node').attr('opacity', function(dd,ii){

			let ddPlus = dd.id+1;
			let dPlus = d.id+1;

			let dbnCompText = $('#dbn span#char' + ddPlus).text();
			let dbnActiveText = $('#dbn span#char' + dPlus).text();

			if(dbnActiveText == "."){
				switch (d.base){
					case "A":
						return (((dd.base == "T") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0.1;
					case "T":
						return (((dd.base == "A") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0.1;
					case "G":
						return (((dd.base == "C") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0.1;
					case "C":
						return (((dd.base == "G") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0.1;
					case "N":
						return i == ii ? 1 : 0.1;
				}
			}
			else if (dbnActiveText == "(" || dbnActiveText == ")"){
				return i == ii ? 1 : 0.1;
			}
			else {
				//this condition should never happen
				console.log("idk");
			}
			//return i == ii ? 1 : 0.1;
		});
		let spanId = i + 1;
		//console.log(baseColor(d.base,colorbrewer2));
		$('#dbn span#char' + spanId).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': '#999',
			'color': '#333'
		});
		$('#sequence span#char' + spanId).css({
			'font-size': 30,
			'font-weight': 'bold',
			'background-color': baseColor(d.base,colorz[config.colormode]),
			'color': "#333"
		});
	}).on('mouseleave', function(d,i){
		d3.selectAll('.node').attr('opacity',1);
		let spanId = i + 1;
		$('#dbn span#char' + spanId).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': "#999"
		});
		$('#sequence span#char' + spanId).css({
			'font-size': 10,
			'font-weight': 'normal',
			'background-color': '#333',
			'color': baseColor(d.base,colorz[config.colormode])
		});
	});
	connectionDrawMode = false;

}



function onNodeClick(d,i) {

	if(connectionMode && !connectionDrawMode) {
		$('#connectionMode').html('connection link mode active &mdash; click on complementary node to create link, or click elsewhere to return to connection mode');
		d3.selectAll('.node').on('mouseenter', null).on('mouseleave',null);
		availableComps = [];
		//highlight unpaired complementary bases
		d3.selectAll('.node').attr('opacity', function(dd,ii){
			let ddPlus = dd.id+1;
			let dPlus = d.id+1;

			let dbnCompText = $('#dbn span#char' + ddPlus).text();
			let dbnActiveText = $('#dbn span#char' + dPlus).text();

			if(dbnActiveText == "."){
				switch (d.base){
					case "A":
						if (dd.base == "T" && dbnCompText == "." && ii != (i+1) && ii != (i-1)) {availableComps.push(ii)};
						return (((dd.base == "T") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0;
					case "T":
						if (dd.base == "A" && dbnCompText == "." && ii != (i+1) && ii != (i-1)) {availableComps.push(ii)};
						return (((dd.base == "A") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0;
					case "G":
						if (dd.base == "C" && dbnCompText == "." && ii != (i+1) && ii != (i-1)) {availableComps.push(ii)};
						return (((dd.base == "C") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0;
					case "C":
						if (dd.base == "G" && dbnCompText == "." && ii != (i+1) && ii != (i-1)) {availableComps.push(ii)};
						return (((dd.base == "G") && dbnCompText == "." && ii != (i+1) && ii != (i-1)) || i == ii) ? 1 : 0;
					case "N":
						return i == ii ? 1 : 0;
				}
			}
			else if (dbnActiveText == "(" || dbnActiveText == ")"){
				return i == ii ? 1 : 0;
			}
			else {
			 	//this condition should never happen
			 	console.log("idk");
			}			
			
		});
		//console.log(d);

		d3.select("#linkContainer").append("line")
			.attr('id',"linkLine")
			.attr('x1',d.x)
			.attr('y1',d.y)
			.attr('x2',d.x)
			.attr('y2',d.y);
		connectionDrawMode = true;
		activatedNode = d;
		

	}

	else if(connectionMode && connectionDrawMode){

		
		//If 'i' matches activated, you clicked on the same node dingus! 
		//If 'i' doesn't match any of the availableComps, you clicked a non complementary node.
		

		if (i == activatedNode.id){
			console.log("you clicked on the same node dingus!");
			d3.select("#linkLine").remove();
			resetConnectionMode();
		}
		else if (!availableComps.includes(i)){
			console.log("you clicked an unavailable node dingus!");
			console.log(availableComps);
			console.log(i);
			d3.select("#linkLine").remove();
			resetConnectionMode();
		}
		//click on correct available complementary node case
		else if (availableComps.includes(i)){
			//bind new link to data structure and draw new link 

			//let yeee = d;			
			d3.select("#linkLine").remove();
			links.push({source: activatedNode, target : d});
			console.log(links);
			link = d3.select('#linkContainer').selectAll("line")
				.data(links);
			link.exit().remove();
			linkEnter = link.enter().append("line")
				.classed("link",true)
				.classed("merged",true)
				.style("stroke-width",linkWidths[config.linkWidth])
				.attr('x1', function(d) { return activatedNode.x; })
				.attr('y1', function(d) { return activatedNode.y; })
				.attr('x2', function() { return d.x; })
				.attr('y2', function() { return d.y; })
			link = linkEnter.merge(link);

			//edit dbn

			let sourceID = activatedNode.id+1,
				targID = d.id+1;
			if(targID > sourceID){
				d3.select("#dbn span#char" + sourceID).text("(");
				dbnString = replaceString(dbnString, activatedNode.id, "(");
				d3.select("#dbn span#char" + targID).text(")");
				dbnString = replaceString(dbnString, d.id, ")");
			}
			else{
				d3.select("#dbn span#char" + sourceID).text(")");
				dbnString = replaceString(dbnString, activatedNode.id, ")");
				d3.select("#dbn span#char" + targID).text("(");
				dbnString = replaceString(dbnString, d.id, "(");
			}
			
			
			//reset 
			connectionDrawMode = false;
			resetConnectionMode();
		}
		else {
		 	//this condition should never occur
		 	console.log("idk");
		}	

				

	}

 
}

document.addEventListener('keyup', onDocumentKeyUp);
//document.addEventListener('mousemove', onDocumentMouseMove);
//document.addEventListener('mouseup', onDocumentMouseUp);
