
app = {
	log: function(msg) {
		if(!msg) msg = '_undefined_';
		if(typeof console == 'undefined') return;

		console.info(msg);
	},

	// Returns a random integer between min (included) and max (excluded)
	// Using Math.round() will give you a non-uniform distribution!
	getRandomInt: function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
};
