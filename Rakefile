require 'rake'
require 'sass'

task :css do
  `sass ./assets/stylesheets/all.sass ./public/assets/all.css`
end

task :start do
  `bundle exec rackup config.ru`
end
