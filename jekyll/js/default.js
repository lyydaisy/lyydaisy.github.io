var side = $("#side");
var minHeight = $(window).height();
side.css("minHeight",minHeight+"px");
var sideLeft = side.offset().left;
var ttop = 0;
var timer = null;
function setPosition(){
	var scrollTop = $(window).scrollTop();
	if(scrollTop!=ttop){
		ttop = scrollTop;
		if(timer){
			clearTimeout(timer);
		}
		timer = setTimeout(function(){
			setPosition();
		},100);
		return;
	}
	var position = side.css("position");
	if(scrollTop>100 && position=="absolute"){
		side.css({"position":"fixed","left":sideLeft+"px","top":-scrollTop+"px"});
		side.animate({"top":0},500);
	}else if(scrollTop==0 && position=="fixed"){
		side.css({"position":"absolute","left":0,"top":0});	
	}
}

$(window).on("scroll",setPosition);
