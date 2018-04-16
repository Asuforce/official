init:
	bundle install -j4 --path vendor/bundle

compile:
	bundle exec sass sass/main.scss:css/main.css --style compressed

watch:
	bundle exec sass --watch sass/main.scss:css/main.css --style compressed

convert:
	bundle exec slimrb -p views/index.slim > index.html
