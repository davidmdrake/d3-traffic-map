width = $('#worldmap').width();
height = $('#worldmap').height();

var radius = 100;
var projection = d3.geoEquirectangular()
    .scale(110)
    .translate([330, 180]);

var path = d3.geoPath()
    .projection(projection)
    .pointRadius(function (d,i){
        return radius;
    });    

var barContainer = [];
var tabContainer = [];

var barCount = 0;
var tabCount = 0;

var graticule = d3.geoGraticule();

var svg = d3.select('#worldmap').append("svg")

var g = svg.append("g");

g.append("path")
    .datum(graticule)
    .attr("class","graticule")
    .attr("d", path)

///////////////////
//Test
//////////////////
var test_type = "streaming";
function loadData(test_type, json_input, func){
    if (test_type == "test"){
        var q = d3.queue();
        q.defer(d3.json, json_input);
        q.awaitAll(func);
    } else {
        //var q = d3.queue
        //var urlArray = [];
        
        //json.forEach(function(t){
            //urlArray.push("http://localhost:3002/api/locations/")
        //})
        //console.log(urlArray);
        //urlArray.foreach(function(t){ q.defer(d3.json, t); });
        //q.awaitAll(func);

        var q = d3.queue();
        q.defer(d3.json, json_input);
        q.awaitAll(func);

    }
}

d3.queue()
    .defer(d3.json, "./images/world-110m.json")
    .await(startScript);


function startScript(error, world){
    if (error) throw error;

    formTable(['src loc', 'src ip', 'src dev','dst loc','dst ip','dst dev', 'time (CST)' ])

    g.insert('path','.graticule')
        .datum(topojson.feature(world,world.objects.land))
        .attr("class", "land")
        .attr('d',path);

    g.insert("path",'.graticule')
        .datum(topojson.mesh(world, world.objects.countries, function(a,b){
            return a !== b;
        }))
        .attr("class", "boundary")
        .attr("d", path);

    var gemfire_url;

    //DEV
    //var time1 = +moment().subtract({ 'minutes': 10 });
    //console.log(time1)
    //var time2 = time1 + 100;
    //console.log(time2)

    //TEST
    var time1 = 150980664800;
    var time2 = 150980664900;

    function animation() {

        requestAnimationFrame(function() {

            // var gemfire_url = "some server"
            // var query_arguments  = `[
            //     {
            //         "@type": "long",
            //         "@value": ` + time1 + `
            //     },
            //     {
            //         "@type": "long",
            //         "@value": ` + time2 + `
            //     }
                
            // ]`;
            // d3.request(gemfire_url)
            // .header("Content-Type", "application/json")
            // .post(query_arguments,
            //     function (err, rawData){
            //         if(typeof rawData == 'undefined') {
            //             alert("Gemfire:" + err)
            //         } else {
            //             var data = JSON.parse(rawData.response);
            //             setTimeout( function () {
            //                 readySend(data);
            //             }, 1000)
            //         }
            //     });
            gemfire_url = "http://localhost:3002/api/locations/" + time1 + "/" + time2;
            loadData(test_type, gemfire_url, readySend);
            time1 = time1 + 1000;
            //console.log(time1)
            time2 = time2 + 1000;
            //console.log(time2)
            barCount = barCount + 1;
            if (barCount >= 60*5) {
                barContainer.shift();;
            }

        });
    }
    //Run continuously
    d3.interval(function() {
        animation();
    }, 1000);
    
    //Run Once
    //animation();

}

function readySend(error, geojson_sample){
    if (error ) throw error;

    var send_type;
    if (geojson_sample.length > 0){
        if (geojson_sample[0].length > 1){
            send_type = 'all';
            send(geojson_sample[0], send_type)
        } else if (geojson_sample[0].length == 1 ){
            send_type = 'one';
            send(geojson_sample[0], send_type)
        } else {
            removeOldMapAnimations();
            continueAnimationNull();
        }

    }

    function send(origin, send_type){
        var identityColor;
        var animation;

        removeOldMapAnimations();

        if (send_type == "one"){

            if ( origin[0].src_lat == null && origin[0].dst_lat == null){
                continueAnimationNull();
            } else if ( origin[0].src_lat == null && origin[0].dst_lat != null){
                singleNullSRCPrep(origin);
            } else if ( origin[0].src_lat != null && origin[0].dst_lat == null){
                singeNullDSTPrep(origin);
            } else {
                singleTransitionPrep(origin);
            }
        } else {

            var nullvaluesBoth = _.filter(origin, function(d){
                return d.src_lat == null && d.dst_lat == null;
            });
            var nullvalueSRC = _.filter(origin, function(d){
                return d.src_lat == null && d.dst_lat != null;
            });
            var nullvalueDST = _.filter(origin, function(d){
                return d.src_lat != null && d.dst_lat == null;
            });
            origin = _.filter(origin, function(d){
                return d.src_lat != null && d.dst_lat != null;
            });

            if (nullvalueSRC.length > 1){
                multipleNullSRCPrep(nullvalueSRC);
            } else if ( nullvalueSRC.length == 1 ){
                singleNullSRCPrep(nullvalueSRC);
            }
            if ( nullvalueDST.length > 1){
                multipleNullDSTPrep(nullvalueDST);
            } else if ( nullvalueDST.length == 1){
                singeNullDSTPrep(nullvalueDST);

            }
            if( origin.length > 1){
                multipleTransitionPrep(origin);
            } else if ( origin.length == 1){
                singleTransitionPrep(origin);
            }
            if(origin.length == 0 && nullvalueSRC.length == 0 && nullvalueDST.length == 0){
                continueAnimationNull();
            }
        }
    

    function lineTransitionBackwards(path){
        path.attr("stroke-dashoffset", function() { 
            var len = this.getTotalLength();
            return len / 8 + "," + len / 8 
        });
        path.transition()
            .delay(5)
            .duration(150)
            .attrTween("stroke-dasharray", tweenDashBackwards)
            .styleTween("stroke", function(){
                return d3.interpolateRgb(identityColor, identityColor);
            });

    };

    function tweenDash(){
        var len = this.getTotalLength();

        interpolate = d3.interpolateString("0," + len, len + "," + len);

        return function (t) {
            return interpolate(t);
        };
    }

    function tweenDashBackwards(){
        var len = this.getTotalLength(),
        interpolate = d3.interpolateString(len + "," + len, "0," + len);

        return function(t){ return interpolate(t)}
    }
    }
    function singleTransitionPrep(data) {
        var point1Coords = projection([data[0].src_lon, data[0].src_lat]);
        var point2Coords = projection([data[0].dst_lon, data[0].dst_lat]);

        identityColor = createColors(data);
        animation = true;

        var point1 = g.append("text")
            .attr("class","point1")
            .attr("x", point1Coords[0])
            .attr("y", point1Coords[1])
            .attr("dy",".35em")
            .attr("text-anchor", "middle")
            .style("font-family", 'FontAwesome')
            .style('font-size','20px')
            .text(function(d){ return '\uf096'; })
            .style('fill', identityColor[0])

        var point1ISO = g.append("text")
            .attr("class","point1-iso")
            .attr("x", point1Coords[0])
            .attr("y", point1Coords[1] - 20)
            .attr("dy",".35em")
            .attr("text-anchor", "middle")
            .style("font-family", 'FontAwesome')
            .style('font-size','20px')
            .text(data[0].src_country_iso)
            .style('fill', identityColor[0])   

            var point2 = g.append("text")
            .attr("class","point1")
            .attr("x", point2Coords[0])
            .attr("y", point2Coords[1])
            .attr("dy",".35em")
            .attr("text-anchor", "middle")
            .style("font-family", 'FontAwesome')
            .style('font-size','20px')
            .text(function(d){ return '\uf192'; })
            .style('fill', identityColor[0])   

            var point2ISO = g.append("text")
            .attr("class","point2-iso")
            .attr("x", point1Coords[0])
            .attr("y", point1Coords[1] - 20)
            .attr("dy",".35em")
            .attr("text-anchor", "middle")
            .style("font-family", 'FontAwesome')
            .style('font-size','20px')
            .text(data[0].dst_country_iso)
            .style('fill', '#849EDC')
            
        singleTransition(data, point1Coords, point2Coords, identityColor);

    }

    function singleTransition(data, point1Coords, point2Coords, identityColor){
        
        singleCharts(data, identityColor);

        g.append("line")
            .attr("class","route")
            .attr("stroke-width", (Math.log(data[0].cnt + 1)))
            .style("stroke", identityColor[0])
            .attr("x1", point1Coords[0])
            .attr("y1", point1Coords[1])
            .attr("x2", point1Coords[0])
            .attr("y2", point1Coords[1])
            .transition()
            .duration(50)
            .attr("x2", point2Coords[0])
            .attr("y2", point2Coords[1])
            .transition()
            .delay(15)
            .duration(350)
            .attr("x1", point2Coords[0])
            .attr("y1", point2Coords[1])
            .attr("x2", point2Coords[0])
            .attr("y2", point2Coords[1])
    };

    function multipleTransitionPrep(data){
        var identityColor = createColors(data);
        
        g.selectAll(".point1")
            .data(data)
            .enter().append("text",".point1")
            .attr("transform", function(d){ return "translate(" + projection([d.src_lon,d.src_lat]) + ")";})
            .attr("dy",".35em")
            .attr("text-anchor","middle")
            .style("font-family",'FontAwesome')
            .style('font-size','20px')
            .text(function(d) { return '\uf096' })
            .style('fill', function(d,k){ return identityColor[k] })
            .attr("class","point1");

        g.selectAll(".point1-iso")
            .data(data)
            .enter().append("text",".point1-iso")
            .attr("transform", function(d){ var isoPoint = projection([d.src_lon,d.src_lat]); return "translate(" + isoPoint[0] + ',' + (isoPoint[1] - 20) + ")";})
            .attr("dy",".35em")
            .attr("text-anchor","middle")
            .style("font-family",'FontAwesome')
            .style('font-size','20px')
            .text(function(d) { return d.src_country_iso; })
            .style('fill', '#849EDC')
            .attr("class","point1-iso");

        g.selectAll(".point2")
            .data(data)
            .enter().append("text",".point2")
            .attr("transform", function(d){ return "translate(" + projection([d.dst_lon,d.dst_lat]) + ")";})
            .attr("dy",".35em")
            .attr("text-anchor","middle")
            .style("font-family",'FontAwesome')
            .style('font-size','20px')
            .text(function(d) { return '\uf192' })
            .style('fill', function(d,k){ return identityColor[k] })
            .attr("class","point2");


        g.selectAll(".point2-iso")
            .data(data)
            .enter().append("text",".point2-iso")
            .attr("transform", function(d){ var isoPoint = projection([d.dst_lon,d.dst_lat]); return "translate(" + isoPoint[0] + ',' + (isoPoint[1] - 20) + ")";})
            .attr("dy",".35em")
            .attr("text-anchor","middle")
            .style("font-family",'FontAwesome')
            .style('font-size','20px')
            .text(function(d) { return d.dst_country_iso; })
            .style('fill', '#849EDC')
            .attr("class","point1-iso");

        multipleTransition(data, identityColor);
    }

    function multipleTransition(data, identityColor){

        multipleCharts(data, identityColor);

        var routeData = data.map(function (d) {
            var point1 = projection([d.src_lon, d.src_lat]);
            var point2 = projection([d.dst_lon, d.dst_lat]);
            return({ "x1": point1[0], "y1": point1[1],"x2": point2[0],"y2": point2[1],})

        });
        console.log(routeData)

        g.selectAll(".route")
            .data(routeData)
            .enter().append("line", ".route")
            .attr("class", "route")
            .attr("stroke-width", function(d,i){ return( Math.log(data[i].cnt) + 1)})
            .style("stroke", function(d,k) { console.log(k); return identityColor[k]})
            .attr("x1", function(d){ return d.x1})
            .attr("y1", function(d){ return d.y1})
            .attr("x2", function(d){ return d.x1})
            .attr("y2", function(d){ return d.y1})
            .transition()
            .duration(150)
            .attr("x2", function(d){ return d.x2})
            .attr("y2", function(d){ return d.y2})
            .transition()
            .delay(100)
            .duration(350)
            .attr("x1", function(d){ return d.x2})
            .attr("y1", function(d){ return d.y2})
            .attr("x2", function(d){ return d.x2})
            .attr("y2", function(d){ return d.y2})

        };


function singleNullSRCPrep(nullvalueSRC){
    var point2Coords = projection([nullvalueSRC[0].dst_lon, nullvalueSRC[0].dst_lat]);
    var identityColorNullSRC = createNullColors(nullvalueSRC, 'dst');

    var nullPoint = g.append("text")
    .attr("class","point2-null")
    .attr("x", point2Coords[0])
    .attr("y", point2Coords[1])
    .attr("dy",".35em")
    .attr("text-anchor", "middle")
    .style("font-family", 'FontAwesome')
    .style('font-size','20px')
    .text(function(d){ return '\uf192'; })
    .style('fill', identityColorNullSRC[0]);

    g.append("text")
    .attr("class","point2-null-iso")
    .attr("x", point2Coords[0])
    .attr("y", point2Coords[1] - 20)
    .attr("dy",".35em")
    .attr("text-anchor", "middle")
    .style("font-family", 'FontAwesome')
    .style('font-size','20px')
    .text(nullvalueSRC[0].dst_country_iso)
    .style('fill', '#849EDC');
    
    singleNullSRCAnimation(nullvalueSRC, point2Coords, identityColorNullSRC);
}

function singleNullSRCAnimation(data, point2Coords, identityColor){

    var nullSRCCirc = g.append("circle")
        .attr("class","null-src.circle")
        .attr("cx", point2Coords[0])
        .attr("cy", point2Coords[1])
        .attr("r", (Math.log(data[0].cnt) + 1))
        .style("opacity", 0.35)
        .style("fill", identityColor[0]);

    nullSRCCirc.transition().delay(5).duration(150).attr("r", (Math.log(data[0].cnt) + 1) * 2).style("opacity",0);
    singleCharts(data, identityColor)

}

function multipleNullSRCPrep(nullvalueSRC){
    var identityColorNullSRC = createNullColors(nullvalueSRC, 'dst');

    var nullPoint = g.selectAll(".point2-null")
    .data(nullvalueSRC)
    .enter().append("text",".point2-null")
    .attr("dy",".35em")
    .attr("text-anchor", "middle")
    .attr("transform", function(d){ return "translate(" + projection([d.dst_lon, d.dst_lat]) + ")"})
    .style("font-family", 'FontAwesome')
    .style('font-size','20px')
    .text(function(d){ return '\uf192'; })
    .style('fill', function(d,k){ return identityColorNullSRC[k] })
    .attr("class", "point2-null")

    g.selectAll(".point2-null-iso")
    .data(nullvalueSRC)
    .enter().append("text", ".point2-null-iso")
    .attr("dy",".35em")
    .attr("text-anchor", "middle")
    .attr("transform", function(d){ var isoPoint = projection([d.dst_lon,d.dst_lat]); return "translate(" + isoPoint[0] + ',' + (isoPoint[1] - 20) + ")";})
    .style("font-family", 'FontAwesome')
    .style('font-size','20px')
    .text(function(d) { return d.dst_country_iso; })
    .style('fill', '#849EDC')
    .attr("class", "point2-null-iso");
    
    multipleNullSRCAnimation(nullvalueSRC, identityColorNullSRC);
}

function multipleNullSRCAnimation(data, identityColor){

    var nullSRCCirc = g.selectAll(".null-src.circle")
    .data(data)
    .enter().append("circle", ".null-src.circle")
    .attr("cx", function(d) { var cx = projection([d.dst_lon, d.dst_lat]); return cx[0]; })
    .attr("cy", function(d) { var cy = projection([d.dst_lon, d.dst_lat]); return cy[1]; })
    .attr("r", function(d,k) { return (Math.log(d.cnt) + 1) })
    .style("opacity", 0.35)
    .style("fill", function(d,k){ return identityColor[k] })
    .attr("class", "null-src.circle")

    nullSRCCirc.transition().delay(5).duration(150).attr("r", function(d,k){ return 2*(Math.log(d.cnt) + 1)}).style("opacity",0);
    
    multipleCharts(data, identityColor);

}

function singeNullDSTPrep(nullvalueDST){
    var point1Coords = projection([nullvalueDST[0].src_lon, nullvalueDST[0].src_lat]);
    var identityColorNullDST = createNullColors(nullvalueDST, 'src');

    var nullPoint = g.append("text")
    .attr("class","point1-null")
    .attr("x", point1Coords[0])
    .attr("y", point1Coords[1])
    .attr("dy",".35em")
    .attr("text-anchor", "middle")
    .style("font-family", 'FontAwesome')
    .style('font-size','20px')
    .text(function(d){ return '\uf096'; })
    .style('fill', identityColorNullDST[0]);

    g.append("text")
    .attr("class","point1-null-iso")
    .attr("x", point1Coords[0])
    .attr("y", point1Coords[1] - 20)
    .attr("dy",".35em")
    .attr("text-anchor", "middle")
    .style("font-family", 'FontAwesome')
    .style('font-size','20px')
    .text(nullvalueDST[0].src_country_iso)
    .style('fill', '#849EDC');
    
    singleNullDSTAnimation(nullvalueDST, point1Coords, identityColorNullDST);

}

function singleNullDSTAnimation(data, point1Coords, identityColorNullDST){

    var nullDSTCirc = g.append("square")
        .attr("class","null-dst.square")
        .attr("cx", point1Coords[0])
        .attr("cy", point1Coords[1])
        .attr("width", (Math.log(data[0].cnt) + 1))
        .attr("height", (Math.log(data[0].cnt) + 1))
        .style("opacity", 0.35)
        .style("fill", identityColor[0]);

    nullDSTCirc.transition().delay(5).duration(150).attr("width", data[0].cnt * 2).attr("height", data[0].cnt * 2).style("opacity",0);
    singleCharts(data, identityColor)
}

function multipleNullDSTPrep(nullvalueDST){

    var identityColorNullDST = createNullColors(nullvalueSRC, 'src');

    var nullPoint = g.selectAll(".point1-null")
    .data(nullvalueDST)
    .enter().append("text",".point1-null")
    .attr("dy",".35em")
    .attr("text-anchor", "middle")
    .attr("transform", function(d){ return "translate(" + projection([d.src_lon, d.src_lat]) + ")"})
    .style("font-family", 'FontAwesome')
    .style('font-size','20px')
    .text(function(d){ return '\uf096'; })
    .style('fill', function(d,k){ return identityColorNullDST[k] })
    .attr("class", "point1-null")

    g.selectAll(".point1-null-iso")
    .data(nullvalueDST)
    .enter().append("text", ".point1-null-iso")
    .attr("dy",".35em")
    .attr("text-anchor", "middle")
    .attr("transform", function(d){ var isoPoint = projection([d.src_lon,d.src_lat]); return "translate(" + isoPoint[0] + ',' + (isoPoint[1] - 20) + ")";})
    .style("font-family", 'FontAwesome')
    .style('font-size','20px')
    .text(function(d) { return d.dst_country_iso; })
    .style('fill', '#849EDC')
    .attr("class", "point2-null-iso");
    
    multipleNullDSTAnimation(nullvalueSRC, identityColorNullSRC);
}

function multipleNullDSTAnimation(data, identityColor){
    var nullDSTCirc = g.selectAll(".null-dst.square")
    .data(data)
    .enter().append("square", ".null-dst.square")
    .attr("cx", function (d) { var cx = projection([d.src_lon, d.src_lat]); return cx[0];})
    .attr("cy", function (d) { var cy = projection([d.src_lon, d.src_lat]); return cy[1];})
    .attr("width", function (d,k){ return (Math.log(data[0].cnt) + 1) })
    .attr("height", function (d,k){ return (Math.log(data[0].cnt) + 1) })
    .style("opacity", 0.35)
    .style("fill", function(d,k) { return identityColor[k] })
    .attr("class","null-dst.square")

    nullDSTCirc.transition().delay(5).duration(150)
    .attr("width", function(d,k){ return 2 *(Math.log(d.cnt) + 1)})
    .attr("height", function(d,k){ return 2 *(Math.log(d.cnt) + 1)})
    .style("opacity",0);
    singleCharts(data, identityColor);

    multipleCharts(data, identityColor);

}

function createColors(data){
    identityColor = [];
    for ( i=0;i < data.length; i++){
        if ( data[i].svrty.toLowerCase() == "low" && Number(data[i].src_lat) > 20 && Number(data[i].dst_lat) > 20 && Number(data[i].src_lon) < -50 && Number(data[i].dst_lon) < -50){
            identityColor[i] = '#49fb35';

        } else if ((data[i].svrty.toLowerCase() == "medium" || data[i].svrty.toLowerCase() == "informational") && Number(data[i].src_lat) > 20 && Number(data[i].dst_lat) > 20 && Number(data[i].src_lon) < -50 && Number(data[i].dst_lon) < -50){ 
            identityColor[i] = 'yellow';
        } else if ((data[i].svrty.toLowerCase() == 'high') && Number(data[i].src_lat) > 20 && Number(data[i].dst_lat) > 20 && Number(data[i].src_lon) < -50 && Number(data[i].dst_lon) < -50) {
            identityColor[i] = 'orange';
            
        } else {
            identityColor[i] = 'red';

        }

    
    }
    return identityColor;
}

function createNullColors(data, type){
    identityColor = [];
    for ( i=0;i < data.length; i++){

        if(type == 'dst'){
            if ( data[i].svrty.toLowerCase() == "low" && Number(data[i].dst_lat) > 20 && Number(data[i].dst_lon) < -50){
                identityColor[i] = '#49fb35';

            } else if ((data[i].svrty.toLowerCase() == "medium" || data[i].svrty.toLowerCase() == "informational") && Number(data[i].dst_lat) > 20 && Number(data[i].dst_lon) < -50){ 
                identityColor[i] = 'yellow';
            } else if ((data[i].svrty.toLowerCase() == 'high') && Number(data[i].dst_lat) > 20 && Number(data[i].dst_lon) < -50) {
                identityColor[i] = 'orange';
                
            } else {
                identityColor[i] = 'red';

            }
        } else {
            if ( data[i].svrty.toLowerCase() == "low" && Number(data[i].src_lat) > 20 && Number(data[i].src_lon) < -50){
                identityColor[i] = '#49fb35';

            } else if ((data[i].svrty.toLowerCase() == "medium" || data[i].svrty.toLowerCase() == "informational") && Number(data[i].src_lat) > 20 && Number(data[i].src_lon) < -50){ 
                identityColor[i] = 'yellow';
            } else if ((data[i].svrty.toLowerCase() == 'high') && Number(data[i].src_lat) > 20 && Number(data[i].src_lon) < -50) {
                identityColor[i] = 'orange';
                
            } else {
                identityColor[i] = 'red';

            }
         }
    
    }
    return identityColor;
}

function singleCharts(origin, identityColor){

    tabCount = tabCount + 1
    tabContainer.push(origin[0]);
    tabulate(tabContainer, ['src loc', 'src ip', 'src dev','dst loc','dst ip','dst dev', 'time'], tabCount, identityColor)
    tabContainer.shift();

    barContainer.push(origin[0]);
    var barDataSRC = fillDataContainer(barContainer, 'src_country_iso');

    fillBarChart(barDataSRC.slice(0,5), 'barChartSRC');

}

function multipleCharts(origin, identityColor){

    tabCount = tabCount + origin.length;
    for (i = 0; i < origin.length; i++){
        tabContainer.push(origin[i]);

    }
    tabulate(tabContainer, ['src loc', 'src ip', 'src dev','dst loc','dst ip','dst dev', 'time'], tabCount, identityColor)
    tabContainer.splice(0,origin,length);

    for (i = 0; i < origin.length; i++){
        barContainer.push(origin[i]);

    }

    var barDataSRC = fillDataContainer(barContainer, 'src_country_iso');

    fillBarChart(barDataSRC.slice(0,5), 'barChartSRC');

}

function removeOldMapAnimations(){

    svg.selectAll('circle').remove();
    svg.selectAll('square').remove();
    svg.selectAll('.point1-null').remove();
    svg.selectAll('.point2-null').remove();
    svg.selectAll('.point1').remove();
    svg.selectAll('.point2').remove();
    svg.selectAll('.route').remove();
    svg.selectAll('.focus').remove();
    svg.selectAll('.point1-null-iso').remove();
    svg.selectAll('.point2-null-iso').remove();
    svg.selectAll('.point1-iso').remove();
    svg.selectAll('.point2-iso').remove();
    svg.selectAll('.null-src.circle').remove();
    svg.selectAll('.null-dst.square').remove();

}

function continueAnimationNull(origin){

    var barDataSRC = fillDataContainer(barContainer, 'src_country_iso');

    fillBarChart(barDataSRC.slice(0,5), 'barChartSRC');
}

}