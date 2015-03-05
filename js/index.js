$(".lyy").bind("click",function(){
    $(".sycp,.lyy").addClass("sycpfade");
    setTimeout(function(){
        $(".ball,.crystal").removeClass("ballUp").addClass("ballFall");
        $(".daisy").slideDown();
        setTimeout(function(){
            $(".ball").removeClass("ballFall ballHide").addClass("ballRotateStart");
            $(".crystal").removeClass("ballFall crystalHide").addClass("ballRotateStart");
            setTimeout(function(){
                $(".ball,.crystal").addClass("ballRotate");
            },500);
        },1000);  
    },500);
});
$(".crystal").bind("click",function(){
    $(".ball").removeClass("ballFall ballRotateStart ballRotate").addClass("ballUp ballHide");
    $(".crystal").removeClass("ballHover ballFall ballRotateStart ballRotate").addClass("ballUp crystalHide");
    $(".daisy").slideUp();
    setTimeout(function(){
        $(".sycp,.lyy").hide().removeClass("sycpfade").fadeIn();
    },1000);
});
$(".ballText,.crystal").each(function(index,ele){
    $(ele).bind("mouseenter",function(event){
        var that = $(this);
        if(that.hasClass("ballText")){
            that = that.parent();
        }
        that.removeClass("ballRotate ballRotateStart").addClass("ballHover");
    }).bind("mouseleave",function(event){
        var that = $(this);
        if(that.hasClass("ballText")){
            that = that.parent();
        }
        if(!that.hasClass("ballHide")&&!that.hasClass("crystalHide")){
            that.removeClass("ballHover").addClass("ballHoverOut");
            setTimeout(function(){
                that.removeClass("ballHoverOut").addClass("ballRotateStart");
                setTimeout(function(){
                    that.addClass("ballRotate");
                },500);
            },1000);
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