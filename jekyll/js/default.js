var side = $("#side");
var body = $("body");
var sideLeft = body.offset().left;
side.css({"left":sideLeft+"px"});
side.fadeIn();
$(window).on("resize",function(){
	var sideLeft = body.offset().left;
	side.css({"left":sideLeft+"px"});
});

