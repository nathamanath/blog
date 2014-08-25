title: 'Time ago in words'
date: 2014-8-24
tldr: 'Time ago in words is a thing to do browser side. Theres is ruby and
javascript code to achieve this at the bottom.'

OK, so this is my first proper blog article, so please be nice!

So, when putting this blog together I came across the issue of time ago in
words... again. When in Rails, ActionView::Helpers::DateHelper gives us `time_ago_in_words`.
This is convenient, and looks great, but using this in a view would make your entire page [un-cachable](https://www.youtube.com/watch?v=07So_lJQyqw)!

Whenever possible, to keep things fast I want to avoid re-generating a view, I can
achieve this here by not generating a new time ago in words string each time someone visits my site.

So to keep my site fast, and to let everyone know how long ago I did whatever it is
that I have done, I can do the following...

* In the view present the date in question as a time stamp,
* Use javascript to convert this to a time ago in words string.

## The solution

I want to do as much of the work server side as possible to keep my javascript simple.

A brief play in irb and in the browsers console shows me that the simplest route
to this is as follows:

```ruby
  # Time to js parsable string
  Time.now.to_i * 1000

  #Js date to ruby Time
  Time.parse(js_timestamp / 1000)
```

```javascript
  # String to date
  new Date(time_stamp_string)
```

### Starting point

```ruby

  class Article
    ...

    attr_accessor :created_at, :updated_at...

    ...
  end

```

I am writing a sinatra app (this blog in fact), and am test it using rspec, and factory girl.
Setting up this environment is another topic for another time.

I still need .created_at and .updated_at, so I am adding a new getter method for
each, I will call them js_updated_at, and .js_created_at.

### 1: a test

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

### 2: red -> green
  lib/article.rb

  ```ruby
    ...

    def js_created_at
      @js_created_at ||= created_at.to_i * 1000
    end

    ...
  ```

  easy :)

### 3: recfactor and js_updated_at in one

ok so thats clean, but adding js_updated at could cause some unneeded
duplication... ill spare you reading what that might look like, and get on to
the refactoring. A bit of meta programming will deliver us from evil this time.

first update the test... I want this to be DRY too!!

```ruby
  ...

  let(:mock_time) { Time.now }
  let(:mock_js_time) { mock_time.to_i * 1000 }

  %W[updated_at created_at].each do |m|
    js_method = "js_#{m}"

    it { is_expected.to respond_to js_method }

    describe ".#{js_method}" do
      let(:article) { build :article, m.to_sym => time }
      subject { article.send(js_method) }

      it { is_expected.to eq mock_js_time }
    end
  end

  ...
```

and now to make them pass:

./lib/article.rb
```ruby
  ...

  %W[updated_at created_at].each do |m|
    name = "js_#{m}"
    define_method(name) { eval("@#{name} ||= #{m}.to_i * 1000") }
  end

  ...
```

BOOM! This is evaluated at load time, so will not cause a slowdown at runtime.

### 3: the js
If you are using jquery there is a [plugin for that](http://timeago.yarp.com/])
but I am not, so after reading through that briefly, heres what I came up with...

[time ago in words js](https://github.com/nathamanath/time-ago-in-words.js)

The aim here is to make a re-usable js class with no external dependencies. This
article is getting long, so I will go through my time ago in words js solution  another time.

So, its rather easy to avoid a silly performance hit here. The js was a bit of a
faff, but its there ready to use next time now.

And now we can all tell people how long ago something was and have cachable pages too. Acceptable.

