
app.aspect = (function($){

	var
		attr = 'data-aspect'
	;

	return {
		run: function(){

			$('['+attr+']').each(function(){
				var
					t = $(this),
					asp2 = t.attr(attr),
					w1, h1,
					asp1,
					w2, h2
				;

				t.css({
					width: '100%',
					height: '100%'
				});
				t.offset().left; // force reflow
				w1 = t.width();
				h1 = t.height();
				//console.log(w1+'x'+h1+' -> '+t.width()+'x'+ t.height());
				asp1 = w1 / h1;

				if(asp1 > asp2) {
					// too wide
					w2 = Math.round(h1 * asp2);
					t.css({
						width: w2,
						height: '100%'
					});
				} else {
					// too tall
					h2 = Math.round(w1 / asp2);
					t.css({
						height: h2,
						width: '100%'
					});
				}

				//console.log(w1+'x'+h1+' -> '+t.width()+'x'+ t.height());

			});

		}
	};
}(jQuery));