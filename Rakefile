require 'jshintrb/jshinttask'
# require 'rspec/core/rake_task'
require 'sinatra/asset_pipeline/task'

# For asset pipeline task
require './config/environment'

RSpec::Core::RakeTask.new

Sinatra::AssetPipeline::Task.define! Blog

Jshintrb::JshintTask.new :jshint do |t|
  t.pattern = "./assets/javascrips/*.js"
  t.options = :jshintrc
end

# For travis
task default: :spec

task :start do
  `bundle exec puma -e development`
end

