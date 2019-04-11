function sizeChange() {


    d3.select("#worldmap g").attr("transform", "scale(" + $("#worldmap").width() / 800 + ")");

    if ($("#worldmap").width() >= 1920){
        $("#worldmap svg").height($("#worldmap").width() * 0.420)
    } else if ( $("#worldmap").width() < 1680 ) {
        $("#worldmap svg").height($("#worldmap").width() * 0.370);
    } else {
       $("#worldmap svg").height($("#worldmap").width() * 0.420);
    }

    d3.select("#barChartSRC g").attr("transform", "scale(" + $("#barChartSRC").width() / 200 + ")");

}