require 'sass'
require 'uglifier'
require 'jshintrb/jshinttask'
require 'listen'

SOURCE_DIR = './assets'
DIST_DIR = './public/assets'
JS_DIR = "#{SOURCE_DIR}/javascripts"
SASS_DIR = "#{SOURCE_DIR}/stylesheets"

task build: [:css, :js, :minify]

task :start do
  `bundle exec rackup`
end

task :watch do
  puts "|  Watching #{SOURCE_DIR} for changes."
  puts '|  Hit `ctrl + c` to stop'

  listener = Listen.to SOURCE_DIR do
    puts '|  Something changed...'
    sh 'rake build'
  end

  listener.start
  sleep
end

task :css do
  puts 'Compiling sass...'
  `sass #{SASS_DIR}/all.sass #{DIST_DIR}/all.css`
  `sass #{SASS_DIR}/all.sass #{DIST_DIR}/all.min.css --style compressed`
  puts 'Done.'
end

task :minify do
  puts 'Minifying js...'

  js = File.read("#{DIST_DIR}/all.js")
  ugly = Uglifier.compile(js)

  File.open("#{DIST_DIR}/all.min.js", 'w') do |file|
    file.puts ugly
  end

  puts 'Done.'
end

task :js do
  # TODO: Collation??
  puts 'Collating js...'
  `cp #{JS_DIR}/all.js #{DIST_DIR}/all.js`
  `rake minify`
  puts 'Done.'
end

Jshintrb::JshintTask.new :jshint do |t|
  t.pattern = "#{DIST_DIR}/all.js"
  t.options = {
    bitwise: true,
    browser: true,
    camelcase: true,
    curly: true,
    eqeqeq: true,
    forin: true,
    indent: 2,
    immed: true,
    latedef: true,
    noarg: true,
    noempty: true,
    nonew: true,
    quotmark: true,
    regexp: true,
    undef: true,
    strict: true,
    trailing: true,
    undef: true,
    unused: true,
    maxparams: 4,
    maxdepth: 3,
    maxstatements: 5,
    maxlen: 80
  }
end

