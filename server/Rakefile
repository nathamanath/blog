# For asset pipeline task
require './config/environment'

require 'rake/tasklib'
require 'rake/sprocketstask'

namespace :assets do
  desc 'Precompile assets'

  task :precompile do
    environment = App.sprockets
    manifest = Sprockets::Manifest.new(environment.index, File.join(App.assets_path, "manifesto.json"))
    manifest.compile(App.assets_precompile)
  end

  desc "Clean assets"
  task :clean do
    FileUtils.rm_rf(App.assets_path)
  end
end
