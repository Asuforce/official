compile:
	@sass sass/main.scss:css/main.css --style compressed

watch:
	@sass --watch sass/main.scss:css/main.css --style compressed
