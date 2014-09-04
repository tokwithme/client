
app = {
	error: function(msg, ex, alrt) {
		var items = [];
		if(msg) items.push(msg);
		if(ex) items.push(ex.name+'\n'+ex.message);
		var txt = items.join('\n');
		console.error(txt);
		if(alrt) alert(txt);
	}
};
