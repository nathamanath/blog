require 'app_updater'
require 'article'
require 'helpers'

class Blog < Sinatra::Base
  include Helpers

  use AppUpdater

  set :root, File.expand_path('../../', __FILE__)
  set :articles, []
  set :app_file, __FILE__
  set :articles_glob, Dir["#{root}/articles/*.md"]
  set :title, 'Nathans blog'

  # TODO: This shouldnt need to be here.
  configure(:test) do
    set :articles_glob, Dir[File.expand_path('./spec/fixtures/articles/*.md')]
  end

  articles_glob.each do |f|
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

