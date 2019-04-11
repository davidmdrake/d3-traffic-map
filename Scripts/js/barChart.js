var barChartSRC = d3.select("#barChartSRC").append("svg")
    .attr("width", '100%')
margin = {top: 20, right: 20, bottom: 30, left: 40};
var srcChart = barChartSRC.append("g")
    .attr("class", "barchart-g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var barChartDST = d3.select("#barChartDST").append("svg")
    .attr("width", '110%')

var dstChart = barChartDST.append("g")
    .attr("class", "barchart-g")
    .attr("transform","translate(" + margin.left + ',' + margin.top + ")");

function sumData(p,c){
    return _.extend(p, { cnt: Number(p.cnt) + Number(c.cnt) });
};

function fillDataContainer(container, category){
    var results = _(container)
        .groupBy(category)
        .map(function(b) { return b.reduce(sumData,  {'category' : b[0][category],cnt:0 })})
        .valueOf();

    return (results);
}

function fillBarChart(input, id){

    data = input.sort(function(a,b){
        return a.cnt - b.cnt
    });
    d3.selectAll("#" + id + " .axis").remove();
    d3.selectAll("#" + id + " .bar").remove();
    d3.selectAll("#" + id + " .count-value").remove();

    var Chart = d3.select('#' + id + ' .barchart-g');
    var barwidth = +$('#' + id + ' svg').width() - margin.left - margin.right;
    var barheight = +data.length*100 - margin.top - margin.bottom;
    $('#barChartSRC svg').height(barheight);
    var y = d3.scaleBand().range([barheight,0]),
    x = d3.scaleBand().range([0, barwidth]);
    y.domain(data.map(function(d){ return d.category; })).paddingInner(0.1).paddingOuter(0.5);
    x.domain([0, d3.max(data, function(d) { return d.cnt })]);
    var xAxis = d3.axisBottom(x).ticks(10);
    var yAxis = d3.axisLeft(y);


    Chart.append("g")
        .attr("class","axis axis--y")
        .style("stroke","#849EDC")
        .attr("transform","translate(55,0)")
        .call(yAxis)
        .selectAll("text")
        .attr("y",0)
        .attr("x",-45)
        .attr("dy",'.35em')
        .attr("transform","rotate(0)")
        .style("text-anchor", "start")

    Chart.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0,0)")
        .style("display","none")
        .call(xAxis)


    if ( data.length == 1){
        gridLength = 25;

    } else {
        gridLength = ((barheight/data.length) -  45);
    }

    Chart.selectAll('.count-value')
        .data(data)
        .enter().append("text")
        .attr("class", "count-value")
        .attr("x",0)
        .attr("y", function(d){ return y(d.category); })
        .attr("width", 0)
        .style("fill", "#849EDC")
        .text(function(d){
            return (d.cnt);
        })
        .attr("transform", "translate(60,"+ gridLength + ")");

}