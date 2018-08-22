init:
	bundle install -j4 --path vendor/bundle

convert:
	bundle exec slimrb -p views/index.slim > index.html
