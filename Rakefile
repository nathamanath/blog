require 'rake/notes/rake_task'

UI_PATH = File.expand_path '../ui', __FILE__
SERVER_PATH = File.expand_path '../server', __FILE__

task default: :watch

desc 'Setup dev environment'
task :setup do
  `npm install -g brunch`
  `cd #{UI_PATH}; npm install`
  `cd #{SERVER_PATH}; bundle`
end

desc 'Watch for dev'
task :watch do
  ui = Thread.new do
    `cd #{UI_PATH}; brunch watch`
  end

  `cd #{SERVER_PATH}; bundle exec rackup`
end

desc 'Build for production'
task :build do
  `cd #{UI_PATH}; brunch build --production`
end

desc 'Depoly app'
task deploy: [:build] do
  `cd #{SERVER_PATH}`
  `git checkout master`
  `git push production master`
  `mina deploy`
end
