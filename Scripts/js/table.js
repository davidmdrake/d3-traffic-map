var table = d3.select("#table").append('table')
var thead = table.append('thead')
d3.select('#tableHeader').append('thead')
var tbody = table.append('tbody');

function formTable(columns){

    d3.select("#tableHeader").append('tr')
        .selectAll('th')
        .data(columns).enter()
        .append('th')
        .attr("class","table_header")
        .text(function (column) { return column; });
}

function tableFade(){
    var prev_td = d3.selectAll('.data_row');
    for (i = 0; i<= 0; i++){
        d3.select(prev_td._groups[0][0]).transition().delay(550 * i).duration(100 *i).remove();
    }
}

var my_time;

var scrollable = d3.select('#table');

function scrollTopTween(scrollTop){
    return  function() {
        var i = d3.interpolateNumber(this.scrollTop, scrollTop);
        return function(t){ document.getElementById("table").scrollTop = i(t); };
    };
}

function tabulate(data, columns, tabCount, color){
    console.log(data.length);
    
    var scrollheight = scrollable.property("scrollHeight");

    var prev_td = d3.selectAll('.data_row')
    for(i = 0; i < data.length; i++){
        d3.select("#table").transition().duration(3000).tween("uniquetweenname", scrollTopTween(scrollheight));
        d3.select(prev_td._groups[0][i]).transition().delay(3500).remove();
    }

    var rows = table.selectAll("tbody.tr")
        .data(data, function(d){ return d.src_device_name })
        .enter()
        .append('tr').attr("class", "data_row")
        .style("border-left-color", function(d,i){ return color[i]; })

    var cells = rows.selectAll('td');
    cells.data(function(row){
        return columns.map(function(column) {
            return { column: column, value: row };
        });
        })
        .enter()
        .append('td')
        .text(function(d){

            if (d.column == 'time') {
                var real_date;
                if (d.value._time != null){
                    real_date = moment(d.value._time).local().format('LLLL')
                } else {
                    real_date = '';
                }
                return real_date
            } else if (d.column == "src loc"){
                var src_display;
                if ( d.value.src_country_iso != null && d.value.src_city != null){
                    src_display = d.value.src_country_iso + ", " + d.value.src_city;
                } else if (d.value.src_country_iso == null && d.value.src_city != null ){
                    src_display = d.value.src_city;
                } else {
                    src_display == "";
                }
                return src_display;
            } else if (d.column == "src dev"){
                return d.value.src_device_name;
            } else if (d.column == "src ip"){
                return d.value.src_ip;
            } else if (d.column == "dst loc"){
                var dst_display;
                if ( d.value.dst_country_iso != null && d.value.dst_city != null){
                    dst_display = d.value.dst_country_iso + ", " + d.value.dst_city;
                } else if (d.value.dst_country_iso == null && d.value.dst_city != null ){
                    dst_display = d.value.dst_city;
                } else {
                    dst_display == "";
                }
                return dst_display;
            } else if (d.column == "dst dev"){
                return d.value.dst_device_name;
            } else if (d.column == "dst ip"){
                return d.value.dst_ip;
            }
        })   
        return table;
}