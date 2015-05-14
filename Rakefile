require 'jshintrb/jshinttask'
require 'rspec/core/rake_task'
require 'sinatra/asset_pipeline/task'

require './config/environment'

RSpec::Core::RakeTask.new

Sinatra::AssetPipeline::Task.define! Blog

Jshintrb::JshintTask.new :jshint do |t|
  t.pattern = "./assets/javascrips/**/*.js"
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
    strict: true,
    trailing: true,
    undef: true,
    unused: true,
    maxparams: 4,
    maxdepth: 3,
    maxstatements: 10,
    maxlen: 80
  }
end

task default: :spec

task :start do
  `bundle exec puma -e development`
end

