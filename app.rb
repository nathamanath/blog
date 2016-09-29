require 'json'


require 'helpers'
require 'article'


require 'sprockets'
require 'sprockets-helpers'
require 'sprockets/es6'

require 'helpers'

class App < Sinatra::Base

  include Helpers

  set :app_file, __FILE__
  set :articles_dir, "#{root}/articles"
  set :cache, production?

  set :sprockets, Sprockets::Environment.new(root)
  set :assets_prefix, '/assets'
  set :digest_assets, false
  set :assets_path, -> { File.join(public_folder, "assets") }
  set :assets_precompile, %w(app.js app.css *.png *.jpg *.svg)

  configure do
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

  before do
    content_type 'application/json'
  end

  # Page per article
  Article.init("#{settings.articles_dir}/*.md").each do |article|
    get "#{article.path}.json" do

      # let me see unpublished in development!!
      halt(404) unless article.published? || settings.development?

      if settings.production?
        etag article.sha1
        last_modified article.updated_at
      end

      {
        title: article.title,
        tldr: article.tldr,
        creared_at: article.js_created_at,
        updated_at: article.js_updated_at,
        content: Markdowner.render(ERB.new(article.content).result(binding)),
        theme_class: article.theme_class,
        next: {
          path: article.next_article_path,
          title: article.next_article_title
        },
        prev:{
          path: article.prev_article_path,
          title: article.prev_article_title
        }
      }.to_json
    end
  end

  # TODO: pagination
  get '/index.json' do
    articles = Article.all

    last_article = Article.last_modified

    if settings.production?
      etag Digest::SHA1.hexdigest "home_#{last_article.sha1}"
      last_modified last_article.updated_at
    end

    previews = articles.map do |article|
      {
        title: article.title,
        created_at: article.created_at,
        preview: article.preview,
        path: article.path
      }
    end

    previews.to_json
  end

  get '/' do
    content_type :html
    slim :index
  end

end

