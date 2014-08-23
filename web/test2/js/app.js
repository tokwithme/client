
app = {
	log: function(msg) {
		if(!msg) msg = '_undefined_';
		if(typeof console == 'undefined') return;

		console.info(msg);
	}
};
