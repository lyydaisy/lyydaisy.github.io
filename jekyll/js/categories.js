function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var category = getParameterByName('category');
var hasResult = false;
$("div[tag]").each(function(index,div){
	div = $(div);
	if(div.attr('tag')==category){
		div.show();
		hasResult = true;
	}else{
		div.remove();
	}
});
if(!hasResult){
	$("#posts").html('<div><h2>Invalid Category.</h2></div>');
}
