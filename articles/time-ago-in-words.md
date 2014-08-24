title: 'Time ago in words'
date: 2014-8-24
tldr: 'Time ago in words is a thing to do browser side. Theres is ruby and
javascript code to achieve this at the bottom.'

So, when putting this blog together I came across the issue of time ago in
words. When in Rails, active support gives us `time_ago_in_words`. This is
convenient, and looks great, but now you just made your entire page un-cachable.

This is an issue, now your site is slower and more hungry.

Whenever possible I want to avoid generating a view, we can achieve this here by
not generating a new time ago in words string each time someone visits my site.

But I want to say how long ago something was, and cant work it out by my self!

So to keep your site fast, and to let everyone know how long ago you did
whatever you have done, you can do the following...

* In your view present the date in question,
* Use javascript to convert this to a time ago in words string.

I want to do as much of the work server side as possible to keep my javascript
simple.

A brief play in irb and in the browsers console shows me that the simplest route
to this is

```ruby
  # Time to js parsable string
  Time.now.to_i * 1000

  #Js date to ruby Time
  Time.parse(js_timestamp / 1000)
```

```javascript
  # String to date
  new Date(time)
```

Here is my solution, from this blogs source...

## Starting point

```ruby

  class Article
    ...

    attr_accessor :created_at, :updated_at...

    ...
  end

```

I test using rspec. I still need .created_at and .updated_at, so I am adding a
new getter method for each, I will call them js_updated_at, and .js_created_at.

## 1: a test

```ruby
  require 'article'

  describe Article do
    ...

      it { is_expected.to respond_to 'js_created_at' }

      describe '.js_created_at' do
        let(:article) { build :article }
        let(:mock_time) {  }
        let(:mock_js_time) {  }

        subject { article.js_created_at }

        it{ is_expected.to eq mock_js_time }
      end

    ...
  end
```

## 2: red -> green
  lib/article.rb

  ```ruby
    ...

    def js_created_at
      @js_created_at ||= created_at.to_i * 1000
    end

    ...
  ```

  easy :)

## 3: recfactor and js_updated_at in one

ok so thats clean, but adding js_updated at could cause some unneeded
duplication... ill spare you reading what that might look like, and get on to
the refactoring. A bit of meta programming will deliver us from evil.

first update the test... i want this DRY too!!

```ruby
  ...

  let(:mock_time) {  }
  let(:mock_js_time) {  }

  %W[updated_at created_at].each do |m|
    js_method = "js_#{m}" # cause i use it in description

    it { is_expected.to respond_to js_method }

    describe ".#{js_method}" do
      let(:article) { build :article, m.to_sym => time }
      subject { article.send(js_method) }

      it { is_expected.to eq mock_js_time }
    end
  end

  ...
```

and to make them green:

./lib/article.rb
```ruby
  ...

  %W[updated_at created_at].each do |m|
    name = "js_#{m}"
    define_method(name) { eval("@#{name} ||= #{m}.to_i * 1000") }
  end

  ...
```

this is evaluated at load time, so will not cause a slowdown at runtime.

in the view:

```erb
  <time data-time="<%= article.js_created_at %>"><%= article.created_at %></time>
```

## 3: the js
If you are using jquery there is a [http://timeago.yarp.com/](plugin for that)
but Im not, so after reading through that, heres what I came up with...

The aim here is to make a re-usable js class with no external dependencies.

https://github.com/nathamanath/time-ago-in-words.js

So, its a little bit of a faff the first time round, but this is all easily re
usable. So now we can tell people how long ago something was and have cachable
pages which is great!

