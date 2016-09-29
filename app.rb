require 'json'

require 'asset_pipeline'
require 'helpers'
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

end

