require 'app_updater'
require 'article'

class Blog < Sinatra::Base
  use AppUpdater

  set :root, File.expand_path('../../', __FILE__)
  set :articles, []
  set :app_file, __FILE__
  set :articles_glob, Dir["#{root}/articles/*.md"]

  # TODO: This shouldnt need to be here.
  configure(:test) do
    set :articles_glob, Dir[File.expand_path('./spec/fixtures/articles/*.md')]
  end

  def link_to_unless_current(text, location)
    if request.path_info == location
      text
    else
      "<a href=\"#{location}\">#{text}</a>"
    end
  end

  articles_glob.each do |f|
    article = Article.new_from_file(f)

    get "/#{article.slug}" do
      etag article.sha1
      last_modified article.updated_at

      erb :article, locals: { article: article }
    end

    articles << article
  end

  Article.sort!(articles)

  get '/' do
    erb :index
  end
end

