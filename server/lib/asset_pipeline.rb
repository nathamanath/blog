require 'sprockets'
require 'sprockets-helpers'
require 'sprockets/es6'

module AssetPipeline

  def self.registered(app)
    app.set :sprockets, Sprockets::Environment.new(root)
    app.set :assets_prefix, '/assets'
    app.set :digest_assets, false
    app.set :assets_path, -> { File.join(public_folder, "assets") }
    app.set :assets_precompile, %w(app.js app.css *.png *.jpg *.svg)

    app.configure do
      # Setup Sprockets
      sprockets.append_path File.join(root, 'assets', 'stylesheets')
      sprockets.append_path File.join(root, 'assets', 'javascripts')
      sprockets.append_path File.join(root, 'assets', 'images')

      sprockets.js_compressor  = :uglify
      sprockets.css_compressor = :scss

      # Configure Sprockets::Helpers (if necessary)
      Sprockets::Helpers.configure do |config|
        config.environment = sprockets
        config.prefix = assets_prefix
        config.digest = digest_assets
        config.public_path = public_folder

        # Force to debug mode in development mode
        # Debug mode automatically sets
        # expand = true, digest = false, manifest = false
        config.debug       = true if development?

        if production?
          config.digest = true
          config.manifest = Sprockets::Manifest.new(sprockets, File.join(assets_path, "manifesto.json"))
        end
      end
    end

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

  end

end
