$(".lyy").bind("click",function(){
    $(".sycp,.lyy").addClass("sycpfade");
    setTimeout(function(){
        $(".ball,.crystal").removeClass("ballUp").addClass("ballFall");
        $(".daisy").slideDown();
        setTimeout(function(){
            $(".ball,.crystal").removeClass('ballHide crystalHide');
            $(".ball,.crystal").addClass("ballRotateStart");
            setTimeout(function(){
                $(".ball,.crystal").removeClass('ballRotateStart').addClass("ballRotate");
            },500);
        },1000);
    },1000);
});
$(".crystal").bind("click",function(){
    $(".ball,.crystal").removeClass("ballHover ballFall ballRotateStart ballRotate").addClass("ballUp");
    $(".daisy").slideUp();
    setTimeout(function(){
        $(".ball,.crystal").addClass("ballHide crystalHide");
        $(".sycp,.lyy").hide().removeClass("sycpfade").fadeIn();
    },1000);
});
$(".ball,.crystal").each(function(index,ele){
    $(ele).bind("mouseenter",function(event){
        var that = $(this);
        that.removeClass("ballRotate");//.addClass("ballHover");
    }).bind("mouseleave",function(event){
        var that = $(this);
        if(!that.hasClass("ballHide")&&!that.hasClass("crystalHide")){
            //that.removeClass("ballHover").addClass("ballHoverOut");
            //setTimeout(function(){
                //that.removeClass("ballHoverOut");
                that.addClass("ballRotateStart");
                setTimeout(function(){
                    that.removeClass('ballRotateStart').addClass("ballRotate");
                },500);
            //},500);
        }
    });
});

$(function(){
    $(".preload").html('\
    <img src="./img/crystal.png"/>\
    <img src="./img/crystalrope.png"/>\
    <img src="./img/rope.png"/>');
});

var duoshuoQuery = {short_name:"lyydaisygithub"};
(function() {
    var ds = document.createElement('script');
    ds.type = 'text/javascript';ds.async = true;
    ds.src = 'http://static.duoshuo.com/embed.js';
    ds.charset = 'UTF-8';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(ds);
})();
