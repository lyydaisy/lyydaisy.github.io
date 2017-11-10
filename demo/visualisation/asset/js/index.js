// global variables
var mapData;
var topoData;
var lineData1;
var lineData2;
var barData1;
var barData2;
var dotsData;
var erData;
var currentYear;
var currentArea;
var playTimer;
var playInterval;
var priceRange = [50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000];
var colorScheme = colorbrewer.RdYlBu['11'].reverse();
var dotsColor = ['red', 'blue', 'yellow', 'green', 'orange', 'black', 'cyan', 'blueviolet', 'lightpink', 'dimgray', 'peru'];


// run when dom ready
$(function () {
    // show loading before data ready
    showLoading();
    // init scroll animation
    initScroll();
    // load data with callback
    loadData(function () {
        // init 1st chart: Map
        initMap();
        // init 2nd chart: Linechart
        initLine();
        // init 3rd chart part 1: Linechart
        initBar();
        // init 3rd chart part 2: Barchart
        initBarBar();
        // init 4th chart part 1: Scatterplot
        initDots();
        // init 4th chart part 2: Linechart 
        initDotsLine();
    });
});

// load all csv data, handle them and save them to global variables
function loadData(callback) {
    d3.queue()
        .defer(d3.json, './asset/data/lad-simple.json')
        .defer(d3.csv, './asset/data/5a.csv')
        .defer(d3.csv, './asset/data/1a.csv')
        .defer(d3.csv, './asset/data/1b.csv')
        .defer(d3.csv, './asset/data/1c.csv')
        .defer(d3.csv, './asset/data/5c.csv')
        .defer(d3.csv, './asset/data/dots.csv')
        .defer(d3.csv, './asset/data/er.csv')
        .await(function (err, topo, data5a, data1a, data1b, data1c, data5c, dataDots, dataEr) {
            mapData = data5a;
            topoData = topo;
            var codes = _.map(mapData, function (item) {
                return item['Local authority code'];
            });
            topoData.objects.lad.geometries = _.filter(topoData.objects.lad.geometries, function (item) {
                var code = item.properties.lad16cd;
                return code.charAt(0) !== 'S' && _.contains(codes, code);
            });

            function filterData(data, keyName, fieldName) {
                var result = {};
                _.each(
                    _.filter(data, function (item) {
                        return item[keyName] !== ""
                    }),
                    function (item) {
                        var yearData = [];
                        for (var i=1997;i<2017;i++) {
                            var value = item['Q3-' + i] || item[i];
                            value = parseFloat(value.replace(/,/g, ''));
                            var data = {
                                area: item[keyName],
                                year: i,
                                date: new Date(i, 0, 1),
                            };
                            data[fieldName] = value;
                            yearData.push(data);
                        }
                        result[item[keyName]] = yearData;
                    }
                );
                return result;
            }
            lineData1 = filterData(data1a, 'Name', 'price');
            lineData2 = filterData(data1b, 'Name', 'price');

            barData1 = filterData(data1c, 'Name', 'ratio');
            barData2 = data5c;

            dotsData = dataDots;
            erData = filterData(dataEr, 'Region name', 'rate');

            callback();
            // hide loading layer
            hideLoading();
        });
}

// init scroll animation
function initScroll() {
    var padding = 100 * 2;
    var winHeight = $(window).height();
    var minHeight = winHeight - padding;
    var $pages = $('.page');
    var top = 0;
    // calculate and set each page's height, top and zIndex.
    $pages.each(function (i, page) {
        var pageHeight = $(page).height();
        pageHeight = Math.max(minHeight, pageHeight);
        $(page).css({
            height: pageHeight + 'px',
            top: top + 'px',
            zIndex: i
        })
        .data('top', top)
        .data('height', pageHeight + padding);
        top += pageHeight + padding;
    });
    // bind on window's scroll event to set page's style
    $(window).on('scroll', function () {
        var scrollTop = $(window).scrollTop();
        $pages.each(function (i, page) {
            var $page = $(page);
            var top = parseInt($page.data('top'), 10);
            var offset = scrollTop - top;
            var height = parseInt($page.data('height'), 10);
            var translateY = 0;
            var scale = 1;
            var rotateX = '0deg';
            var perspective = 0;
            if (offset > height - winHeight) {
                offset = offset - height + winHeight;
                offset = offset / 2;
                translateY = offset;
                scale = 1 - offset / (height * 5); 
                rotateX = (scale - 1) * 15 + 'deg';
                perspective = 400;
            }
            $page.css({
                'transform': 'scale(' + scale + ') perspective(' + perspective + 'px) rotateX(' + rotateX + ') translate3d(0, ' + translateY + 'px, 0)'
            });
        });
    });
}

// init Map
function initMap() {
    // get container's size
    var width = document.getElementById("map").clientWidth;
    var height = document.getElementById("map").clientHeight;

    // append svg
    var svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // append g as map's container
    var g = svg.append("g");

    // init zoom
    var zoom = initZoom(svg, g, width, height);
    svg.call(zoom);

    // init projection and path
    var projection = d3.geoAlbers().rotate([0, 0]);
    var path = d3.geoPath().projection(projection);

    // call drawMap to draw the Map
    drawMap({
        svg: svg,
        g: g,
        zoom: zoom,
        projection: projection,
        path: path,
        width: width,
        height: height,
        topo: topoData,
        data: mapData 
    });

    // init play function
    initPlayer();
}

// draw the Map
function drawMap(param) {
    // get attributes from param
    var projection = param.projection;
    var path = param.path;
    var topo = param.topo;
    var width = param.width;
    var height = param.height;
    var svg = param.svg;
    var g = param.g;
    var zoom = param.zoom;
    var data = param.data;
    var maxValue, minValue;
    var prices = [];
    // calculate the max and min price
    _.each(data, function (row) {
        _.mapObject(row, function (val, key) {
            if (key.indexOf('Q3-') === 0) {
                var value = parseInt(val.replace(/,/g, ''), 10);
                if (!maxValue || value > maxValue) {
                    maxValue = value;
                }
                if (!minValue || value < minValue) {
                    minValue = value;
                }
                prices.push(value);
            }
        });
    });
    prices.sort();
    priceRange.unshift(minValue - 100);
    priceRange.push(maxValue + 100);
    projection
        .scale(1)
        .translate([0, 0]);

    // get map bounds and calculate the right scale and translate
    var b = path.bounds(topojson.feature(topo, topo.objects.lad));
    var s = .95 / Math.max((b[1][0] - b[0][0])/width, (b[1][1] - b[0][1])/height);
    var t = [(width - s * (b[1][0] + b[0][0]))/2, (height - s * (b[1][1] + b[0][1]))/2];

    projection
        .scale(s)
        .translate(t);

    var areas = g.selectAll('.area')
        .data(topojson.feature(topo, topo.objects.lad).features);

    // draw path according to topojson
    areas
        .enter()
        .append('path')
        .attr('class', 'area')
        .attr('stroke', '#666')
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', 0.7)
        .attr("fill", "#ffffff")
        .attr("id", function(d){return d.properties.lad16cd;})
        .attr('d', path)
        .on('click', onMapClick);

    // init year selection function
    initSelectYear();
    // init the legend
    initLegend();

    // init active area when click
    var mapActive = d3.selectAll(null);
    // handle click event on the Map
    function onMapClick(d) {
        if(mapActive.node() === this) {
            mapActiveReset();
            return;
        }
        mapActive.style('fill-opacity', 1);
        mapActive.style('stroke-opacity', 0.3);
        mapActive.attr('stroke', '#666');
        mapActive.style('stroke-width', 0.7);
        mapActive = d3.select(this);
        mapActive.style('fill-opacity', 0.3);
        mapActive.style('stroke-opacity', 1);
        mapActive.attr('stroke', '#000');
        mapActive.style('stroke-width', 1.5);

        for(var i = 0; i < mapData.length; i++) {
            var dataItem = mapData[i];
            if(dataItem['Local authority code'] === d.properties.lad16cd) {
                currentArea = d.properties.lad16cd;
                var price = dataItem['Q3-' + currentYear];
                var name = dataItem['Local authority name'];
                setSelectedInfo(name, price);
            }
        }
    }

    // active style reset
    function mapActiveReset() {
        currentArea = null;
        $('.local-authority').html('');
        $('.price').html('');

        mapActive.style('fill-opacity', 1);
        mapActive.style('stroke-opacity', 0.3);
        mapActive.style('stroke', '#666');
        mapActive.style('stroke-width', 0.7);
        mapActive = d3.select(null);
    }

    // init the legend
    function initLegend() {
        var left = 10;
        var top = 10;
        var g = svg.append('g').attr('transform', 'translate(' + left + ',' + top + ')');
        g.append('text')
            .attr('x', left)
            .attr('y', top + 16)
            .attr('font-weight', 'bold')
            .text('Median house price');
        g.append('text')
            .attr('x', left)
            .attr('y', top + 36)
            .attr('font-weight', 'bold')
            .text('£');
        for (var i=0;i<10;i++) {
            g.append('rect')
                .attr('width', 20)
                .attr('height', 20)
                .attr('x', left)
                .attr('y', top + i * 20 + 40)
                .attr('fill', colorScheme[i]);
            var text = csn(priceRange[i]) + '~' + csn(priceRange[i+1]);
            if (i === 0) {
                text = '<' + csn(priceRange[1]);
            }
            else if (i === 9) {
                text = '>' + csn(priceRange[9]);
            }
            g.append('text')
                .attr('x', left + 30)
                .attr('y', top + (i+1) * 20 + 40 - 4)
                .attr('font-size', 12)
                .text(text);
        }
    }
}

// init zoom and zoom buttons
function initZoom(svg, g, width, height) {
    var zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);
    var t = d3.zoomTransform(zoom);
    function zoomed() {
        if (d3.event.sourceEvent) {
            t = d3.event.transform;
        }
        g.attr('transform', t);
    }

    // handle zoom click event on zoom buttons
    function zoomClick() {
        var ok = t.k;
        var direction = (this.id === 'zoom_in') ? 1 : -1;
        var offset = direction * 0.2;
        if (t.k  + offset < 1) {
            t.k = 1;
            offset = 1 - ok;
        }
        else if (t.k + offset > 10) {
            t.k = 10;
            offset = 10 - ok;
        }
        else {
            t.k += offset;
        }
        var x = width / 2;
        var y = height / 2;
        t.x -= offset * x;
        t.y -= offset * y;

        svg.transition()
            .duration(500)
            .call( zoom.transform, d3.zoomIdentity.translate(t.x, t.y).scale(t.k) );
    }

    // bind click handler to zoom buttons
    d3.selectAll('.zoom').on('click', zoomClick);

    return zoom;
}

// init the Map play by year function
function initPlayer() {
    $('#play').on('click', function () {
        var btn = $(this);
        if (btn.hasClass('pause')) {
            btn.removeClass('pause').addClass('play');
            clearInterval(playTimer);
        }
        else {
            btn.removeClass('play').addClass('pause');
            playByYear(currentYear + 1);
        }
    });
}

// change the areas' color by year
function playByYear(startYear) {
    var year = startYear || 2016;
    if (year > 2016) {
        year = 1997;
    }
    var slider = $('#selectYear')[0].noUiSlider;
    slider.set(year);
    var interval = $('#playInterval').val() || 2000;
    playTimer = setInterval(function () {
        if (year < 2016) {
            year++;
        }
        else if (year === 2016) {
            $('#play').removeClass('pause').addClass('play');
            clearInterval(playTimer);
        }
        else {
            year = 1997;
        }
        slider.set(year);
    }, interval);
}

// set the Map's color of every area
function setMapColor(year) {
    currentYear = year;
    $('.year').html(year);
    d3.selectAll('.area')
        .attr("fill", function (d) {
            for (var i = 0; i < mapData.length; i++) {
                var dataItem = mapData[i];
                if (dataItem['Local authority code'] === d.properties.lad16cd) {
                    var price = dataItem['Q3-' + year];
                    var value = parseInt(price.replace(/,/g, ''), 10);
                    var color = colorCalculate(value);
                    if (currentArea && currentArea === d.properties.lad16cd) {
                        setSelectedInfo(dataItem['Local authority name'], price);
                    }
                    return color;
                }
            }
            return "#ffffff";
        });
}

// show info of the active area
function setSelectedInfo(area, price) {
    $('.price').html(price);
    $('.local-authority').html(area);
}

// init the year selection function
// using noUiSlider plugin
function initSelectYear() {
    var min = 1997;
    var max = 2016;
    var slider = $('#selectYear')[0];
    noUiSlider.create(slider, {
        start: max,
        step: 1,
        tooltips: true,
        range: {
            min: min,
            max: max
        },
        format: {
            to: function (value) {
                return Math.round(value);
            },
            from: function (value) {
                return Math.round(value);
            }
        }
    });
    slider = slider.noUiSlider;
    slider.on('end', function () {
        var value = slider.get();
        value = Math.round(value);
        slider.set(value);
    });
    slider.on('set', function () {
        var value = slider.get();
        value = Math.round(value);
        setMapColor(value);
    });
    slider.set(2016);
}

// calculate the right color by the price
function colorCalculate(price) {
    var rightIndex = 0;
    for (var i = 0, len = priceRange.length; i < len; i++) {
        if (price <= priceRange[i]) {
            rightIndex = i;
            break;
        }
    }
    var colorScale = d3.scaleLinear();
    colorScale.domain([priceRange[rightIndex - 1], priceRange[rightIndex]])
        .range([colorScheme[rightIndex - 1], colorScheme[rightIndex]]);
    return colorScale(price);
}

// init the Linechart
function initLine() {
    var width = document.getElementById("line").clientWidth;
    var height = document.getElementById("line").clientHeight;
    var margin = {top: 50, right: 80, bottom: 30, left: 50};

    var svg = d3.select("#line")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
    var g = svg.append('g')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top+ ')');

    var x = d3.scaleTime().range([0, width]).domain([new Date(1997, 0, 1), new Date(2016, 0, 1)]).nice();
    var y = d3.scaleLinear().rangeRound([height, 0]);
    var z = d3.scaleOrdinal(d3.schemeCategory10);
    var b = d3.scaleBand().range([0, width]).domain(d3.range(1996, 2016));

    // init the path's d's handler
    // to draw a line with area
    var areaLine = d3.area()
        .x(function (d) { return x(d.date); })
        .y0(height)
        .y1(function (d) { return y(d.price); });

    // append g for x axis
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(20).tickFormat(d3.timeFormat("%Y")))
        .append('text')
            .attr('x', width + 30)
            .attr('y', 5)
            .attr('fill', '#000')
            .attr("font-size", 14)          
            .attr("font-weight", "bold")          
            .text("Year");

    // append g for y axis
    g.append("g")
          .attr("class", "axis axis--y")
        .append("text")
          .attr("y", -10)
          .attr("fill", "#000")
          .attr("font-size", 14)          
          .attr("font-weight", "bold")          
          .text("£");

    // init select to draw lines
    initLineSelect(g, x, y, z, areaLine);
    // draw a line
    drawLine('England and Wales', g, x, y, z, areaLine);
    // init bars in the Linechart to handle mouseover event
    initLineBar(g, z, b, height);
}

// draw line for Linechart
function drawLine(name, g, x, y, z, line) {
    var duration = 500;
    var data1 = lineData1[name];
    var data2 = lineData2[name];
    var datas = [data1, data2];
    var texts = ['Median house price', 'Median gross annual earning'];
    var minMax = d3.extent(data1.concat(data2), function (d) {return d.price;});
    console.log(minMax);
    y.domain([0, minMax[1] + 100]).nice();
    d3.select('.axis.axis--y')
        .transition()
        .call(d3.axisLeft().scale(y));

    var lines = g.selectAll('.line')
        .data(datas);
    lines.exit().remove();
    var newLines = lines.enter()
        .append('path')
            .attr('class', 'line')
            .style('fill-opacity', 0.3)
            .attr('fill', function (d, i) { return z(i); })
            .attr('stroke', function (d, i) { return z(i); })
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5);
    newLines.merge(lines)
            .transition()
            .duration(duration)
            .attr('d', line);

    var tooltips1 = g.selectAll('.tooltips1')
        .data(data1);
    tooltips1.exit().remove();
    var newTooltips1 = tooltips1.enter()
        .append('circle')
            .attr('class', 'tooltips tooltips1')
            .attr('r', 3)
            .attr('stroke', '#000')
            .attr('stroke-opacity', 0.3)
            .attr('fill', z(0));
    newTooltips1.merge(tooltips1)
            .attr('area', function (d) {return d.area;})
            .attr('year', function (d) {return d.year;})
            .attr('price', function (d) {return d.price;})
            .transition()
            .duration(duration)
            .attr('cx', function (d) {return x(d.date);})
            .attr('cy', function (d) {return y(d.price);});
    var tooltips2 = g.selectAll('.tooltips2')
        .data(data2);
    tooltips2.exit().remove();
    var newTooltips2 = tooltips2.enter()
        .append('circle')
            .attr('class', 'tooltips tooltips2')
            .attr('r', 3)
            .attr('stroke', '#000')
            .attr('stroke-opacity', 0.3)
            .attr('fill', z(1));
    newTooltips2.merge(tooltips2)
            .attr('area', function (d) {return d.area;})
            .attr('year', function (d) {return d.year;})
            .attr('price', function (d) {return d.price;})
            .transition()
            .duration(duration)
            .attr('cx', function (d) {return x(d.date);})
            .attr('cy', function (d) {return y(d.price);});
    var labels = g.selectAll('.line-label')
        .data(texts);
    labels.exit().remove();
    labels.enter()
        .append('text')
            .attr('class', 'line-label')
            .attr('x', 40)
            .attr('y', function (d, i) { return 24 * i + 6; })
            .text(function (d) { return d; });
    var circles = g.selectAll('.line-label-circle')
        .data(texts);
    circles.exit().remove();
    circles.enter()
        .append('circle')
            .attr('class', 'line-label-circle')
            .attr('r', 8)
            .attr('cx', 30)
            .attr('cy', function (d, i) { return 24 * i; })
            .attr('fill', function (d, i) { return z(i); });
}

// init bars in the Linechart
function initLineBar(g, z, b, height) {
    var gNode = $(g.node());
    var data = lineData1['England and Wales'];
    var bars = g.selectAll('.line-bar')
        .data(data);
    bars.exit().remove();
    bars.enter()
        .append('rect')
            .attr('class', 'line-bar')
            .attr('year', function (d) {
                return d.date.getFullYear();
            })
            .attr('x', function(d, i) {
                var x = b(d.date.getFullYear()) - b.bandwidth() / 2; 
                if (!x) {
                    x = b(2015) + b.bandwidth()/2;
                }
                return x; 
            })
            .attr('width', b.bandwidth())
            .attr('height', height)
            .attr('y', 0)
            .attr('fill', 'black')
            .attr('opacity', 0)
            .on('mouseover', function (d) {
                var year = d.date.getFullYear();
                var tooltips = gNode.find('.tooltips[year="'+year+'"]');
                tooltips.attr('r', 6);
                var area = gNode.find('.tooltips1[year="'+year+'"]').attr('area');
                var price = gNode.find('.tooltips1[year="'+year+'"]').attr('price');
                var earning = gNode.find('.tooltips2[year="'+year+'"]').attr('price');
                var tipLayer = $('<div class="tooltip-layer"></div>');
                tipLayer.html(''
                    + '<b>Area:' + area + '</b><br>'
                    + '<b>Year:' + year + '</b>'
                    + '<ul>'
                    +   '<li>Median house price: £<b style="color:'+z(0)+'">' + csn(price) + '</b></li>'
                    +   '<li>Median gross annual earning: £<b style="color:'+z(1)+'">' + csn(earning) + '</b></li>'
                    + '</ul>'
                );
                var offset1 = $(tooltips.get(0)).offset();
                var offset2 = $(tooltips.get(1)).offset();
                tipLayer.css({left: offset1.left + 20 + 'px', top: (offset1.top+offset2.top)/2 - 30 + 'px'});
                $(document.body).append(tipLayer);
            })
            .on('mouseout', function (d) {
                var year = d.date.getFullYear();
                gNode.find('.tooltips[year="'+year+'"]').attr('r', 3);
                $('.tooltip-layer').remove();
            });
}

// init the select to show different area's Linechart 
function initLineSelect(g, x, y, z, line) {
    var select = $('#selectLineArea select');
    var areas = _.keys(lineData1);
    _.each(areas, function (area) {
        var option = $('<option value="'+area+'">'+area+'</option>');
        select.append(option);
    });
    select.on('change', function () {
        var name = select.val();
        drawLine(name, g, x, y, z, line);
    });
}

// init the Barchart
function initBar() {
    var width = document.getElementById("bar").clientWidth;
    var height = document.getElementById("bar").clientHeight;
    var margin = {top: 50, right: 80, bottom: 30, left: 50};

    var svg = d3.select("#bar")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
    var g = svg.append('g')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top+ ')');

    var x = d3.scaleTime().range([0, width]).domain([new Date(1997, 0, 1), new Date(2016, 0, 1)]).nice();
    var y = d3.scaleLinear().range([height, 0]);
    var z = d3.scaleOrdinal(d3.schemeCategory10);
    var b = d3.scaleBand().range([0, width]).domain(d3.range(1996, 2016));

    var line = d3.line()
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.ratio); });

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(20).tickFormat(d3.timeFormat("%Y")))
        .append('text')
            .attr('x', width + 30)
            .attr('y', 5)
            .attr('fill', '#000')
            .attr("font-size", 14)          
            .attr("font-weight", "bold")          
            .text("Year");

    g.append("g")
          .attr("class", "axis axis--y")
        .append("text")
          .attr("x", 80)
          .attr("y", -20)
          .attr("fill", "#000")
          .attr("font-size", 14)          
          .attr("font-weight", "bold")          
          .text("Affordability ratio");

    var names = ['England and Wales', 'London'];
    initSelectBarArea(names, g, x, y, z, line);
}

// draw lines for the Linechart according to selected areas
function drawBarLines(names, g, x, y, z, line) {
    var duration = 500;
    var allData = _.reduce(names, function (arr, area) {
        return arr.concat(barData1[area]);
    }, []);
    var dataArr = _.map(names, function (area) {
        return barData1[area];
    });

    var yMax = d3.max(allData, function (d) {return d.ratio;});
    y.domain([0, yMax]);
    g.select('.axis--y')
        .transition()
        .call(d3.axisLeft().scale(y));

    var lines = g.selectAll('.line')
        .data(dataArr);
    lines.exit().remove();
    var newLines = lines.enter()
        .append('path')
            .attr('class', 'line')
            .attr("fill", "none")
            .style('stroke', function (d, i) { return z(i); })
            .attr("stroke", "steelblue")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5);
    newLines.merge(lines)
            .transition()
            .duration(duration)
            .attr('d', line);

    var labels = g.selectAll('.bar-label')
        .data(names);
    labels.exit().remove();
    var newLabels = labels.enter()
        .append('text')
            .attr('class', 'bar-label')
            .attr('font-size', 12)
            .attr('x', 40);
    newLabels.merge(labels)
            .transition()
            .duration(duration)
            .attr('y', function (d, i) { return 16 * i + 4; })
            .text(function (d) { return d; });
    var circles = g.selectAll('.bar-label-circle')
        .data(names);
    circles.exit().remove();
    var newCircles = circles.enter()
        .append('circle')
            .attr('class', 'bar-label-circle')
            .attr('r', 4)
            .attr('cx', 30);
    newCircles.merge(circles)
            .transition()
            .duration(duration)
            .attr('cy', function (d, i) { return 16 * i; })
            .attr('fill', function (d, i) { return z(i); });
    var tooltips = g.selectAll('.tooltips')
        .data(allData);
    tooltips.exit().remove();
    var newTooltips = tooltips.enter()
        .append('circle')
            .attr('class', 'tooltips')
            .attr('name', function (d, i) {return names[Math.floor(i/20)];})
            .attr('year', function (d) {return d.year;})
            .attr('ratio', function (d) {return d.ratio;})
            .attr('r', 2)
            .attr('stroke', '#000')
            .attr('stroke-opacity', 0.3)
            .attr('fill', function (d, i) {return z(Math.floor(i/20));})
            .style('cursor', 'pointer');
    newTooltips.merge(tooltips)
            .transition()
            .duration(duration)
            .attr('cx', function (d) {return x(d.date);})
            .attr('cy', function (d) {return y(d.ratio);});

    // add tooltip when mouse over the circles
    // and remove it when mouse out
    // and show related Barchart when click on it
    g.selectAll('.tooltips')
            .on('mouseover', function (d, i) {
                var year = d.date.getFullYear();
                var area = d.area;
                var tooltip = $(d3.select(this).node());
                tooltip.attr('r', 6);
                var ratio = d.ratio;
                var tipLayer = $('<div class="tooltip-layer"></div>');
                tipLayer.html(''
                    + '<b>Area:' + area + '</b><br>'
                    + '<b>Year:' + year + '</b>'
                    + '<ul>'
                    +   '<li>Ratio(Median house price to Median gross annual earning): <br><b style="color:'+z(Math.floor(i/20))+'">' + ratio + '</b></li>'
                    + '</ul>'
                );
                var offset = tooltip.offset();
                tipLayer.css({left: offset.left + 20 + 'px', top: offset.top + 20 + 'px'});
                $(document.body).append(tipLayer);
            })
            .on('mouseout', function (d) {
                $(d3.select(this).node()).attr('r', 2);
                $('.tooltip-layer').remove();
            })
            .on('click', function (d) {
                $(d3.select(this).node()).attr('r', 2);
                $('.tooltip-layer').remove();
                $('#bar').animate({width: 'toggle'}, 'slow');
                $('#bar2').animate({width: 'toggle'}, 'slow', function () {
                    drawBarBar(d.area, d.date.getFullYear());
                });
                $('#barPanel').hide();
                $('#bar2Panel').show();
            });
}

// init right panel consists of area select and selected area list
function initSelectBarArea(names, g, x, y, z, line) {
    names = names || [];
    var select = $('#selectBarArea');
    var areas = _.keys(barData1);
    _.each(areas, function (area) {
        var option = $('<option value="'+area+'">'+area+'</option>');
        select.append(option);
    });
    var areaList = $('#barAreaList');
    _.each(names, function (area) {
        var listItem = $('<li>'+area+'<i class="remove"></i></li>');
        areaList.append(listItem);
    });
    areaList.on('click', 'li i', function () {
        var remove = $(this);
        var area = remove.attr('area');
        var index = names.indexOf(area);
        names.splice(index, 1);
        remove.parent().remove();
        drawBarLines(names, g, x, y, z, line);
    });
    var addBtn = $('#addBarArea');
    addBtn.on('click', function () {
        var area = select.val();
        if (!_.contains(names, area)) {
            names.push(area);
            var listItem = $('<li>'+area+'<i area="'+area+'" class="remove"></i></li>');
            areaList.append(listItem);
            drawBarLines(names, g, x, y, z, line);
        }
    });
    drawBarLines(names, g, x, y, z, line);
}

// init the related Barchart
function initBarBar() {
    var width = document.getElementById("bar").clientWidth;
    var height = document.getElementById("bar").clientHeight;
    var margin = {top: 50, right: 80, bottom: 30, left: 150};

    var svg = d3.select("#bar2")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
    var g = svg.append('g')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top+ ')');

    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleBand().range([0, height]);
    var z = d3.scaleOrdinal(d3.schemeCategory10);
    
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .append('text')
            .attr('x', width + 30)
            .attr('y', 5)
            .attr('fill', '#000')
            .attr("font-size", 14)          
            .attr("font-weight", "bold")          
            .text("Ratio");

    g.append("g")
          .attr("class", "axis axis--y")
        .append("text")
          .attr("y", -10)
          .attr("fill", "#000")
          .attr("font-size", 14)          
          .attr("font-weight", "bold")          
          .text("District name");

    drawBarBar(g, x, y, z);
    $('#backToBar').on('click', function () {
        $('#bar').animate({width: 'toggle'}, 'slow');
        $('#bar2').animate({width: 'toggle'}, 'slow');
        $('#barPanel').show();
        $('#bar2Panel').hide();
    });
}

// draw the related Barchart using the data passed from the Linechart
function drawBarBar(g, x, y, z) {
    drawBarBar = function (name, year) {
        var duration = 500;
        var data = barData2;
        if (name === 'England') {
            data = _.filter(barData2, function (area) {
                return area['Region name'] !== 'Wales';
            });
        }
        else if (name !== 'England and Wales') {
            data = _.filter(barData2, function (area) {
                return area['Region name'] === name;
            });
        }
        _.each(data, function (item) {
            for(var i=1997;i<2017;i++) {
                item[i] = parseFloat(item[i]) || 0;
            }
        });
        data = _.filter(data, function (item) {
            return item[year] != 0;
        });
        data.sort(function (a, b) {
            return b[year] - a[year];
        });
        if (data.length > 6) {
            data.splice(3, data.length - 6);
        }
        console.log(data);
        var xMax = d3.max(data, function (d) {return d[year];});
        console.log(xMax);
        x.domain([0, xMax]).nice();
        y.domain(_.pluck(data, 'Name'));
        g.select('.axis--x')
            .transition()
            .call(d3.axisBottom().scale(x));
        g.select('.axis--y')
            .transition()
            .call(d3.axisLeft().scale(y));

        var bars = g.selectAll('.bar')
            .data(data);
        bars.exit().remove();
        var newBars = bars.enter()
            .append('rect')
            .attr('class', 'bar');
        newBars.merge(bars)
            .transition()
            .duration(duration)
            .attr('x', 0)
            .attr('y', function (d) {return y(d.Name) + y.bandwidth()/4;})
            .attr('width', function (d) {return x(d[year]);})
            .attr('height', y.bandwidth() / 2)
            .attr('fill', function (d, i) {return z(Math.floor(i/3));});

        var labels = g.selectAll('.label')
            .data(data);
        labels.exit().remove();
        var newLabels = labels.enter()
            .append('text')
            .attr('class', 'label')
            .attr('font-size', 12);
        newLabels.merge(labels)
            .transition()
            .duration(duration)
            .attr('x', function (d) {return x(d[year]) + 5;})
            .attr('y', function (d) {return y(d.Name) + y.bandwidth()/2;})
            .text(function (d) {return d[year] || 'No data';});

        $('#bar2Area').html(name);
        $('#bar2Year').html(year);
        var listHtml = _.reduce(data, function (str, item) {
            return str + '<li>' + item.Name + ': ' + item[year] + '</li>';
        }, '');
        $('#bar2List').html(listHtml);
    }
}

// init the Scatterplot
function initDots() {
    var width = document.getElementById("dots").clientWidth;
    var height = document.getElementById("dots").clientHeight;
    var margin = {top: 50, right: 100, bottom: 30, left: 100};

    var svg = d3.select("#dots")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
    var g = svg.append('g')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top+ ')');

    dotsData = _.filter(dotsData, function (item) {
        return item['Region name'] === 'England'
            || item['Region name'] === 'Wales';
    });
    var xExtent = d3.extent(dotsData, function (d) {return parseFloat(d['Unemployment rate']);});
    var yExtent = d3.extent(dotsData, function (d) {return parseFloat(d['Change in house price']);});
    console.log(xExtent, yExtent);
    var x = d3.scaleLinear().range([0, width]).domain(xExtent);
    var y = d3.scaleLinear().range([height, 0]).domain(yExtent);
    var z = d3.scaleOrdinal(dotsColor);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(d3.axisBottom().scale(x))
        .append('text')
            .attr('width', 100)
            .attr('x', width - 30)
            .attr('y', 30)
            .attr('fill', '#000')
            .attr("font-size", 14)          
            .attr("font-weight", "bold")          
            .text("Unemployment rate");

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft().scale(y))
        .append("text")
            .attr('width', 100)
            .attr("x", 120)
            .attr("y", -15)
            .attr("fill", "#000")
            .attr("font-size", 14)          
            .attr("font-weight", "bold")          
            .text("Annual change in house price");

    var dots = g.selectAll('.dot')
        .data(dotsData);
    dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', 5)
        .attr('cx', function (d) {return x(parseFloat(d['Unemployment rate']));})
        .attr('cy', function (d) {return y(parseFloat(d['Change in house price']));})
        .attr('stroke', '#000')
        .attr('fill', function (d, i) {return z(Math.floor(i/19));});

    var areas = _.groupBy(dotsData, function (d) {return d['Region name'];});
    areas = _.keys(areas);

    var labelCircles = g.selectAll('.label-circle').data(areas);
    labelCircles.enter()
        .append('circle')
        .attr('class', 'label-circle')
        .attr('r', 5)
        .attr('cx', width - 80)
        .attr('cy', function (d, i) {return 15*i + 10;})
        .attr('stroke', '#000')
        .attr('fill', function (d, i) {return z(i);});
        
    var labels = g.selectAll('.label').data(areas);
    labels.enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', width - 80 + 15)
        .attr('y', function (d, i) {return 15*i + 13;})
        .attr('stroke', function (d, i) {return z(i);})
        .attr('font-size', 12)
        .text(function (d) {return d;});
}

// init the last Linechart
function initDotsLine() {
    var width = document.getElementById("dotsLine").clientWidth;
    var height = document.getElementById("dotsLine").clientHeight;
    var margin = {top: 50, right: 150, bottom: 30, left: 50};

    var svg = d3.select("#dotsLine")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
    var g = svg.append('g')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top+ ')');

    var allData = [];
    _.each(_.keys(erData), function (key) {
        var data = erData[key];
        for (var i=0,len=data.length;i<len;i++) {
            allData.push(parseFloat(data[i].rate));
        }
    });
    var x = d3.scaleTime().range([0, width]).domain([new Date(1997, 0, 1), new Date(2016, 0, 1)]).nice();
    var y = d3.scaleLinear().range([height, 0]).domain([_.min(allData), _.max(allData)]);
    var z = d3.scaleOrdinal(dotsColor);

    var line = d3.line()
        .x(function (d) {return x(d.date);})
        .y(function (d) {return y(d.rate);});

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(20).tickFormat(d3.timeFormat("%Y")))
        .append('text')
            .attr('width', 100)
            .attr('x', width + 30)
            .attr('y', 0)
            .attr('fill', '#000')
            .attr("font-size", 14)          
            .attr("font-weight", "bold")          
            .text("Year");

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft().scale(y))
        .append("text")
            .attr('width', 100)
            .attr("x", 120)
            .attr("y", -15)
            .attr("fill", "#000")
            .attr("font-size", 14)          
            .attr("font-weight", "bold")          
            .text("Unemployment rate(%)");

    var dataArr = [];
    _.each(_.keys(erData), function (key) {
        dataArr.push(erData[key]);
    });
    var lines = g.selectAll('.line')
        .data(dataArr);
    lines.enter()
        .append('path')
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', function (d, i) {return z(i);})
        .style('stroke-width', 1.5)
        .attr('d', line);

    var areas = _.keys(erData);

    var labelCircles = g.selectAll('.label-circle').data(areas);
    labelCircles.enter()
        .append('circle')
        .attr('class', 'label-circle')
        .attr('r', 5)
        .attr('cx', width - 30)
        .attr('cy', function (d, i) {return 15*i - 15;})
        .attr('stroke', '#000')
        .attr('fill', function (d, i) {return z(i);});
        
    var labels = g.selectAll('.label').data(areas);
    labels.enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', width - 30 + 15)
        .attr('y', function (d, i) {return 15*i - 12;})
        .attr('stroke', function (d, i) {return z(i);})
        .attr('font-size', 12)
        .text(function (d) {return d;});
}

function showLoading() {
    $('#loading').show();
}

function hideLoading() {
    $('#loading').hide();
}

// transform price format
function csn(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}
