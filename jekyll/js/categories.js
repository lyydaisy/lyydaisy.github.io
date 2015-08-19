function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var category = getParameterByName('category');
$("div[tag]").each(function(index,div){
	div = $(div);
	if(div.attr('tag')==category){
		div.show();
	}else{
		div.remove();
	}
});

