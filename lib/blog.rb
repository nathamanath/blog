require 'app_updater'
require 'article'
require 'helpers'

class Blog < Sinatra::Base
  include Helpers

  use AppUpdater

  set :root, File.expand_path('../../', __FILE__)
  set :articles, []
  set :app_file, __FILE__
  set :article_files, Dir["#{root}/articles/*.md"]
  set :title, 'Nathans blog'

  #TODO: put this in test
  configure(:test) do
    set :article_files, Dir[File.expand_path './spec/fixtures/articles/*.md']
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

