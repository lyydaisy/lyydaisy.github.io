var side = $("#side");
var minHeight = $(window).height();
side.css("minHeight",minHeight+"px");
var sideLeft = side.offset().left;
function setPosition(){
	var scrollTop = $(window).scrollTop();
	var position = side.css("position");
	if(scrollTop>0 && position=="absolute"){
		side.css({"position":"fixed","left":sideLeft+"px","top":"0px"});
	}else if(scrollTop==0 && position=="fixed"){
		side.css({"position":"absolute","left":0,"top":0});	
	}
}

$(window).on("scroll",setPosition);
