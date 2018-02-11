title: Ueberauth and guardian setup for Phoenix Rest API
date: 2018-02-09 21:00
tldr: Setting up ueberauth and guardian in a phoenix app for password authentication, user permissions, and JWT based authorisation

So Ivan asked me how to set up token based sessions and password authentication
for an Elixir Phoenix Rest API. He then said 'Have you considered writing a blog
about this?', then I did, and then I did...

Goal is to have username / password authentication, and token based authorisation
(JWT) on rest API endpoints, with some user permissions.

When doing this for the first time with Phoenix, I didnt find it entirely
obvious which combination of packages are needed, or how to get started with
them. So this is an attempt at a basic getting startted guide, which you can
then build on to make a production worthy setup which fits your own needs.

I have posted the resulting example application on github, complete with docker
file so that you can see it run:
https://github.com/nathamanath/phoenix-auth-example

## Baseline...

For anyone who would like to play along at home, set up a new phoenix app, im on
version `1.3`.

## Getting started

First, get the required packages... add the following to your `mix.exs` and ill
explain why we need each lib. Also `:ueberauth`, and :`ueberauth_identity` need
adding to `extra_applications`

```ex
  {:ueberauth, "~> 0.5.0"},
  {:ueberauth_identity, "~> 0.2.3"},
  {:guardian, "~> 1.0"},
  {:comeonin, "~> 4.1"},
  {:bcrypt_elixir, "~> 1.0"}
```

[ueberauth](https://github.com/ueberauth/ueberauth) is 'An Elixir Authentication
System for Plug-based Web Applications'. It is the main framework we will use
for authenticating users.

[ueberauth_identity](https://github.com/ueberauth/ueberauth_identity) is 'A
simple username/password strategy for Überauth'. Ueberauth dosent assule a
particular authorisation stratergy, instead stratergy lib are made available
here: https://github.com/ueberauth, or you can make your own.

We Want username / password auth, so ueberauth_identity is the one for us.

[guardian](https://github.com/ueberauth/guardian) is 'An authentication library
for use with Elixir applications.' We are going to use guardian to manage user
session tokens. It will encode and validate JWT for us.

We will use [comeonin](https://github.com/riverrun/comeonin) to hash, and check
user passwords.

Comeonin depends on a password hashing lib. You can choose Argon2, Bcrypt, or
Pbkdf2. We will use [bcrypt_elixir](https://github.com/riverrun/bcrypt_elixir)
This package is the bcrypt password hashing algorithm for Elixir. Do take note
that **this lib requires >1 cpu core to function. If you have only one core, on
say a small VPS, your release will crash without giving a useful error
message!!**

For a single core host, use [Pbkdf2](https://github.com/riverrun/pbkdf2_elixir)
instead of Bcrypt. See here for more on this:
https://github.com/riverrun/comeonin/wiki/Deployment

Give it a `mix deps.get` and we can get to the authorising...

## User resource

So we will need some users to authorize. Im going to generate an uber simple
user resource.

```sh
  mix phx.gen.json Accounts User users username:string:unique password_hash:string permissions:array:string
```

Add it to your router in the api scope:

```
  scope "/api", AuthWeb do
    pipe_through :api

    resources "/users", UserController, except: [:new, :edit]
  end
```

We needs a few modifications to `lib/auth/accounts/user.ex` for this to be
useful...

1, Add a virtual attribute to hold unencrypted passwords for new users,
2, Validate password strength,
3, Hash passwords before saving them to the database.

You can see these changes here:

https://github.com/nathamanath/phoenix-auth-example/blob/master/lib/auth/accounts/user.ex

And im going to seed a few users with a range of permissions now so that we can
try out our code...

https://github.com/nathamanath/phoenix-auth-example/blob/master/priv/repo/seeds.ex

And after seeding the database, `Auth.Accounts.list_users` will show us our user
and that this worked fine.

```
  [%Auth.Accounts.User{
    __meta__: #Ecto.Schema.Metadata<:loaded, "users">,
    hashed_password: "$2b$12$ZPxcbPz9c.JyUKdxefgIB.L0SxcPTmu1qzB/Ki8yS66lGW/jLWnWK",
    id: 1,
    inserted_at: ~N[2018-02-09 08:38:52.705037],
    password: nil,
    updated_at: ~N[2018-02-09 08:38:52.705046],
    username: "reader"
  }, ... ]
```

## Accounts context

Next job is to be able to check a username and password combinations... To the
accounts context!!!

We use `Comeonin.Bcrypt.checkpw/2` to compare a password with a password hash
in our database, and `Comeonin.Bcrypt.dummy_checkpw/2` when an incorrect
username is given to help prevent a possible
[timing attack](https://en.wikipedia.org/wiki/Timing_attack).

```ex
  def get_user_by_username_and_password(nil, password), do: {:error, :invalid}
  def get_user_by_username_and_password(username, nil), do: {:error, :invalid}

  def get_user_by_username_and_password(username, password) do
    with  %User{} = user <- Repo.get_by(User, username: String.downcase(username)),
          true <- Comeonin.Bcrypt.checkpw(password, user.hashed_password) do
      {:ok, user}
    else
      _ ->
        # Help to mitigate timing attacks
        Comeonin.Bcrypt.dummy_checkpw
        {:error, :unauthorized}
    end
  end
```

And test that out in iex... all going well you should get stuff like this:

```ex
  Auth.Accounts.get_user_by_username_and_password "reader", "opensaysme"
  {:ok,
  => %Auth.Accounts.User{...}

  Auth.Accounts.get_user_by_username_and_password "frank", "opensaysme"
  => {:error, :unauthorized}

  Auth.Accounts.get_user_by_username_and_password "reader", "opensaysm"
  => {:error, :unauthorized}
```

## Authentication controller

Now that this works, I want to see the same thing via over HTTP. To achieve this
we need to configure ueberauth and guardian.

```ex
  config :auth, Auth.Guardian,
    issuer: "Auth",
    secret_key: "use mix phx.gen.secret"

  config :ueberauth, Ueberauth,
    base_path: "/api/auth",
    providers: [
      identity: {Ueberauth.Strategy.Identity, [
        callback_methods: ["POST"],
        callback_path: "/api/auth/identity/callback",
        nickname_field: :username,
        param_nesting: "user",
        uid_field: :username
      ]}
    ]
```

In order to issue tokens we need to set up guardian also:

https://github.com/nathamanath/phoenix-auth-example/blob/master/lib/auth/guardian.ex

And with that we have all we need to put together an authentication controller

https://github.com/nathamanath/phoenix-auth-example/blob/master/lib/auth_web/controllers/authentication_controller.ex

and set up our router

```ex
  scope "/api", AuthWeb do
    pipe_through :api

    scope "/auth" do
      # Oauth2 callback routes for ueberauth
      get "/:provider", AuthenticationController, :request
      post "/identity/callback", AuthenticationController, :identity_callback

      resources "/users", UserController, except: [:new, :edit]
    end
  end
```

At this point we should be able to authenticate over HTTP

```sh
  curl \
    -XPOST \
    -v \
    localhost:4000/api/auth/identity/callback \
    -H 'content-type: application/json' \
    -d '{"user": {"username": "reader", "password": "opensaysme"}}'

  # => {"token":"eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJBdXRoIiwiZ..."}
```

You should see a 200 status with correct credentials, and a 401 without.


## Authentication pipeline

This is going well... now that this works we can restrict access to some
endpoints based on being logged in, and then based on having the correct
permissions.

This will be caried out using a series of plugs provided by Guardian. We write
our own plug grouping them together, so that we can control how errors are
handled using another plug:

Auth access pipeline plug:

https://github.com/nathamanath/phoenix-auth-example/blob/master/lib/auth_web/plug/auth_access_pipeline.ex

now configure it... We set up our own error handler so that we can give a nice
generic error message...

```
  # Configure the authentication plug pipeline
  config :auth, AuthWeb.Plugs.AuthAccessPipeline,
    module: Auth.Guardian,
    error_handler: AuthWeb.Plugs.AuthErrorHandler
```

And the error handler plug itsself:

https://github.com/nathamanath/phoenix-auth-example/blob/master/lib/auth_web/plug/auth_error_handler.ex

and add a new pipeline to the router. Our finished router now looks like this:

https://github.com/nathamanath/phoenix-auth-example/blob/master/lib/auth_web/router.ex

With all of that in place, we can try hitting up users index with and without a
session token:

```sh
  curl localhost:4000/api/users -H 'content-type: application/json'
  # => {"message":"unauthenticated"}

  # get an auth token
  curl \
    -XPOST \
    localhost:4000/api/auth/identity/callback \
    -H 'content-type: application/json' \
    -d '{"user": {"username": "reader", "password": "opensaysme"}}'
  # => {"token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiO..."}

  # use the auth token in the authorization header like so:
  curl localhost:4000/api/users \
    -H 'content-type: application/json' \
    -H 'authorization: Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiO...'

  # => {"data":[{"username":"reader","id":1,"hashed_password":"$2b$12....]}
```

### Permissions

Horrah! Lastly lets have a quick look at user permissions. Guardian provides
this functionality for us. We are already encoding each users permissions into
their JWT when they authenticate. Now we will use another plug provided by
guardian to check these permissions per controller action:

To demonstrate this, well add the following to the user controller:

```ex
  plug Guardian.Permissions.Bitwise, ensure: %{default: [:read_users]}
  plug Guardian.Permissions.Bitwise, ensure: %{default: [:write_users]} when action in [:create, :update, :delete]
```

the finished controller is here:
https://github.com/nathamanath/phoenix-auth-example/blob/master/lib/auth_web/controllers/user_controller.ex

Now try logging as each of our seeded users and hitting up each user endpoint,
you wil see that while all users can reach the authentication controller...

* only writer can get to :create, :update, :delete
* reader can only access :show and :inex
* and rubbish cant access this resource at all

This is because in our seed file each user is granted different permissions.

## Next steps

There are a bunch of things missing from this example which you would probably
like in your own implementation before using it to secure your application:

* Tests so that you can be sure that your code works as intended,
* Rate limiting of authentication attempts,
* Role management,
* More stringent password validation,
* Other authentication stratergies... oauth2 via facebook for example,

And of course, TLS is essential when handling user credentials.

## Conclusion

We have the start of a flexible user authorisation setup for our restful API
but there is more attention to detail required to make this production worthy.

There is much more detail in the docs and readmes of each of the packages used,
its well worth having a look

## References

https://github.com/ueberauth/guardian
https://hexdocs.pm/guardian/Guardian.Permissions.Bitwise.html
https://github.com/ueberauth/ueberauth
https://github.com/ueberauth/ueberauth_identity
https://github.com/riverrun/comeonin
https://github.com/riverrun/bcrypt_elixir
