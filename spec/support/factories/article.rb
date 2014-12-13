FactoryGirl.define do
  factory :article do
    created_at Time.now
    updated_at Time.now
    title 'title'
    content 'content'
    sha1 'hash'
    slug 'title'
    tldr 'lol'
  end
end

