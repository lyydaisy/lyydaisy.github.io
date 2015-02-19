var clientWidth = document.documentElement.clientWidth||document.body.clientWidth;
var clientHeight = document.documentElement.clientHeight||document.body.clientHeight;

init();

function init(){
    window.s = Snap("#svg");
    s.attr({fill:"rgb(120,230,240)"});
    s.node.style.height = clientHeight+"px";
    var petal = s.path("M150 150\
                      C160 140 190 135 200 150\
                      C210 160 210 220 150 280\
                      C90 220 90 160 100 150\
                      C110 135 140 140 150 150Z");
    var f = s.filter(Snap.filter.shadow(0, 0, 2,"black",0.5));
    petal.attr({stroke:"green",strokeWidth:1,fill:"green"});
    var petal2= petal.clone(),petal3= petal.clone(),petal4= petal.clone();
    petal2.transform("r90,150,280");
    petal3.transform("r180,150,280");
    petal4.transform("r270,150,280");
    var allpetal = s.g(petal,petal2,petal3,petal4);
    allpetal.transform("r45,150,280");
    var stem = s.path("M148 295C160 380 160 420 140 500L120 500C140 450 155 320 148 295Z");
    stem.attr({stroke:"green",strokeWidth:1,fill:"green"});
    window.clover = s.g(stem,allpetal);
    clover.attr({filter:f});
    createClover(6);
    clover.node.style.display = "none";

    var circle = s.circle(clientWidth/2,clientHeight/2,150);
    circle.attr({fill:"white"});
    var txt = s.text(clientWidth/2,clientHeight/2,"lyy");
    txt.node.style.fontSize = "150px";
    txt.node.style.fontFamily = "vs";
    txt.attr({fill:"gold",transform:"t-90,0"});
    //txt.animate({fill:"gold"},2000,mina.linear);

    var circleG = s.g(circle,txt);
    circleG.node.style.cursor = "pointer";
    circleG.node.addEventListener("click",function(){
        location.href="/jekyll";
    });
    circleG.node.addEventListener("mouseenter",function(){
        circle.animate({r:180},1000,mina.elastic);
    });
    circleG.node.addEventListener("mouseleave",function(){
        circle.animate({r:150},1000,mina.elastic);
    });
    
    var txt2 = txt.clone();
    txt2.attr({fill:"red"});
    var mask = s.rect(clientWidth/2-75,clientHeight/2-100,clientWidth/2+75,clientHeight/2+75);
    txt2.attr({mask:mask});
    mask.animate({height:0},2000,mina.linear);

    

}


function createClover(num){
    if(num && typeof num=="number"){
        for(var i=0;i<num;i++){
            var cloverClone = clover.clone();
            var m = new Snap.Matrix();
            var scale = randomScale();
            m.scale(scale,scale);
            var pos = randomPos();
            var rect = getRect(cloverClone);
            var width = rect.width;
            var height = rect.height;
            if(pos[0]+width>clientWidth){
                pos[0] = clientWidth-width;
            }
            if(Math.abs(pos[0]-clientWidth/2)<150){
                pos[0] = clientWidth/2-150;
            }
            if(pos[1]+height>clientHeight){
                pos[1] = clientHeight-height;
            }
            if(Math.abs(pos[1]-clientHeight/2)<150){
                pos[1] = clientHeight/2-150;
            }
            m.translate(pos[0],pos[1]);
            cloverClone.transform(m);
            fly(cloverClone);
        }
    }
}

function fly(elem){
    function updown(ele){
        var rect = getRect(ele);
        var y = parseInt(rect.top);
        var time = parseInt(3+Math.random()*10)*1000;
        setTimeout(function(){
            var m = ele.matrix;
            m.translate(50-parseInt(Math.random()*100),parseInt(Math.random()*50));
            ele.animate({transform:m},1000,mina.easein);
            setTimeout(function(){
                //m = ele.matrix;
                m.translate(0,parseInt(Math.random()*-50));
                ele.animate({transform:m},1000,mina.easeout);
                updown(ele);
            },1000);
        },time);
    }
    updown(elem);
}

function randomScale(){
    return (0.5+Math.random()*0.5).toFixed(2);
}

function randomPos(){
    var x = parseInt(Math.random()*clientWidth);
    var y = parseInt(Math.random()*clientHeight);
    return [x,y];
}

function getRect(elem){
    return elem.node.getBoundingClientRect();
}