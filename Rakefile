require 'rake/tasklib'
require 'rake/sprocketstask'

require './config/environment'

namespace :assets do
  desc 'Precompile assets'
  task :precompile do
    environment = Blog.sprockets
    manifest = Sprockets::Manifest.new(environment.index, File.join(Blog.assets_path, "manifesto.json"))
    manifest.compile(Blog.assets_precompile)
  end

  desc "Clean assets"
  task :clean do
    FileUtils.rm_rf(Blog.assets_path)
  end
end
