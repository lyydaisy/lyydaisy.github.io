var side = $("#side");
var sideLeft = side.offset().left;
function setPosition(){
	var scrollTop = $(window).scrollTop();
	var position = side.css("position");
	if(scrollTop>100 && position=="absolute"){
		side.css({"position":"fixed","left":sideLeft+"px","top":-scrollTop+"px"});
		side.animate({"top":0},300);
	}else if(scrollTop==0 && position=="fixed"){
		side.css({"position":"absolute","left":0,"top":0});	
	}
}

$(window).on("scroll",setPosition);
