require 'sprockets'
require 'sprockets-helpers'

module AssetPipeline

  extend self

  def registered(app)

    app.set :assets, sprockets = Sprockets::Environment.new(app.settings.root)
    app.set :assets_path, -> { File.join(public_folder, "assets") }
    app.set :assets_precompile, %w(app.js app.css *.png *.jpg *.svg)

    sprockets.append_path('assets/javascripts')
    sprockets.append_path('assets/stylesheets')
    sprockets.append_path('assets/images')
    sprockets.append_path('vendor/assets/javascripts')
    sprockets.append_path('vendor/assets/stylesheets')

    app.configure :development do

      sprockets.cache = Sprockets::Cache::FileStore.new('./tmp')

      app.get '/assets/*' do
        env['PATH_INFO'].sub!(%r{^/assets}, '')
        settings.assets.call(env)
      end

    end

    app.configure :production do
      assets.js_compressor  = :uglify
      assets.css_compressor = :sass
    end

    # Configure Sprockets::Helpers
    Sprockets::Helpers.configure do |config|

      config.environment = sprockets
      config.prefix = '/assets'
      config.public_path = public_folder

      # Force to debug mode in development mode
      # Debug mode automatically sets
      # expand = true, digest = false, manifest = false
      config.debug = true if development?

      if production?
        config.digest = true
        config.manifest = Sprockets::Manifest.new(sprockets, File.join(assets_path, "manifesto.json"))
      end

    end

  end

end
