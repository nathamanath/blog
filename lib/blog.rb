require 'helpers'
require 'app_updater'
# require 'app_logger'
require 'article'

class Blog < Sinatra::Base
  include Helpers

  use AppUpdater
  # use AppLogger

  root = File.expand_path('../../', __FILE__)

  articles_dir = root
  articles_dir += (test?) ? "/spec/fixtures/articles" : "/articles"

  set :root, root
  set :articles, []
  set :app_file, __FILE__
  set :article_files, Dir["#{articles_dir}/*.md"]
  set :title, 'Nathans blog'

  enable :cache

  configure :development, :test do
    disable :cache
  end

  article_files.each do |f|
    article = Article.new_from_file(f)

    get "/#{article.slug}" do
      etag article.sha1
      last_modified article.updated_at

      @title = article.title

      slim :article, locals: { article: article }
    end

    articles << article
  end

  Article.sort!(articles)

  get '/' do
    slim :index
  end
end

