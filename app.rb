require 'json'

require 'article'

class App < Sinatra::Base

  set :app_file, __FILE__
  set :articles_dir, "#{root}/articles"
  set :cache, production?

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

      article.to_json
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
      article.preview_json
    end

    previews.to_json
  end

end

