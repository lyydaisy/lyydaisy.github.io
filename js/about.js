var clientWidth = $(window).width();
var clientHeight = $(window).height();
var dds = $(".sidebar dd");
var articles = $(".content article");
var isFirefox = navigator.userAgent.indexOf("Firefox")>=0?true:false;
articles.css({"height":clientHeight+"px"});
dds.bind("click",function(){
    $(".current").removeClass("current");
    $(this).addClass("current");
    var index = dds.index($(this));
    scroll(index);
});
$(window).bind("resize",function(){
    clientHeight = $(window).height();
    articles.css({"height":clientHeight+"px"});
    $("html,body").scrollTop(dds.index($(".current"))*clientHeight);
});
bindMouseWheel();
scroll(0);

$(".contact").animate({"marginLeft":"-500px"},5000,"linear",function(){
    $(this).addClass("contactSwing");
});

function scroll(index){
    $("html,body").animate({"scrollTop":index*clientHeight+"px"},200);
}

function wheelHandler(e){
    e.preventDefault();
    e.returnValue = false;
    unbindMouseWheel();
    if(window.isScrolling){
        return false;
    }else{
        window.isScrolling = true;
    }
    setTimeout(function(){
        var current = $(".current");
        var index = dds.index(current);
        var size = dds.size();
        if((isFirefox&&e.deltaY<0)||(!isFirefox&&e.wheelDelta>0)){
            if(index==0){
                bindMouseWheel();
                window.isScrolling = false;
                return false;
            }else{
                current.prev().addClass("current");
                current.removeClass("current");
                scroll(index-1);
                setTimeout(function(){
                    bindMouseWheel();
                    window.isScrolling = false;
                },500);
            }
        }else{
            if(index+1==size){
                bindMouseWheel();
                window.isScrolling = false;
                return false;
            }else{
                current.next().addClass("current");
                current.removeClass("current");
                scroll(index+1);
                setTimeout(function(){
                    bindMouseWheel();
                    window.isScrolling = false;
                },500);
            } 
        }
    },300);
    return false;
}

function returnFalse(event){
    event.preventDefault();
    return false;
}

function bindMouseWheel(){
    if(isFirefox){
        document.body.removeEventListener("wheel",returnFalse);
        document.body.addEventListener("wheel", wheelHandler);
    }else{
        document.body.removeEventListener("mousewheel",returnFalse);
        document.body.addEventListener("mousewheel", wheelHandler);
    }
}

function unbindMouseWheel(){
    if(isFirefox){
        document.body.removeEventListener("wheel",wheelHandler);
        document.body.addEventListener("wheel", returnFalse);
    }else{
        document.body.removeEventListener("mousewheel",wheelHandler);
        document.body.addEventListener("mousewheel", returnFalse);
    }
}