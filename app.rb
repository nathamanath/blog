require 'json'

require 'helpers'
require 'article'

require 'sprockets'
require 'sprockets-helpers'

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

  configure :development do
    sprockets.cache = Sprockets::Cache::FileStore.new('./tmp')
    get '/assets/*' do
      env['PATH_INFO'].sub!(%r{^/assets}, '')
      settings.sprockets.call(env)
    end
  end

  before do
    headers 'Access-Control-Allow-Origin' => 'http://localhost:3333'
    headers 'Access-Control-Allow-Headers' => 'Authorization,Accepts,Content-Type,X-CSRF-Token,X-Requested-With'
    headers 'Access-Control-Allow-Methods' => 'GET,OPTIONS'

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

      next_article = (article.next_article) ? {path: article.next_article_path, title: article.next_article_title } : nil
      prev_article = (article.prev_article) ? {path: article.prev_article_path, title: article.prev_article_title } : nil

      {
        title: article.title,
        created_at: article.js_created_at,
        updated_at: article.js_updated_at,
        content: Markdowner.render(ERB.new(article.content).result(binding)),
        theme_class: article.theme_class,
        next: next_article,
        prev: prev_article
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
        theme_class: article.theme_class,
        created_at: article.js_created_at,
        preview: article.preview,
        path: article.path
      }
    end

    previews.to_json
  end

end
