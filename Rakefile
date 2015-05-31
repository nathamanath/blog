require 'jshintrb/jshinttask'
require 'sinatra/asset_pipeline/task'

# For asset pipeline task
require './config/environment'

Sinatra::AssetPipeline::Task.define! Blog

Jshintrb::JshintTask.new :jshint do |t|
  t.pattern = "./assets/javascrips/*.js"
  t.options = :jshintrc
end

task :start do
  `bundle exec puma -e development`
end

