<?
$web = __DIR__.'/..';
?>
<!DOCTYPE html>
<html class="no-js">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">

	<title>TokWithMe Layout</title>

	<meta name="viewport" content="width=320">

	<link rel="stylesheet" href="/components/normalize.css/normalize.css">
	<link rel="stylesheet" href="/build/all.css">


</head>
<body>

<!-- svg pack -->
<span style="display: none;"><? include($web.'/build/svg-defs.svg'); ?></span>


<div class="cont vmiddle1">
	<div class="vmiddle2">
		<div class="cont1 clearfix1" data-aspect1="0.5625">
			<div class="cont2" >
				<div class="cont3 cont-page">

					<!-- page -->
					<div class="intro">

						<div class="intro-logo"></div>

						<div class="intro-logo-txt">Anonymous voice chat</div>

						<div class="intro-ttl">
							Random meetings<br>
							with boys and girls!
						</div>

						<div class="intro-img1"></div>

						<div class="intro-descr">
							Fill your profile<br>
							and we will try to find<br>
							an interlocutor
						</div>

						<div class="intro-nav">
							<svg class="intro-nav-arrow"><use xlink:href="#icon-arrow"></svg>
						</div>

						<div class="intro-next">
							Proceed
						</div>

					</div>

				</div>
			</div>
		</div>
	</div>
</div>





<!-- scripts -->

<script src="//127.0.0.1:35729/livereload.js"></script>

<script src="/build/bower.js"></script>

<script src="/js/app.js"></script>
<script src="/js/lib/common.js"></script>
<script src="/js/lib/aspect.js"></script>



</body>
</html>
