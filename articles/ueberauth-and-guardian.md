title: Ueberauth and guardian setup for a Phoenix rest API
date: 2018-02-09 21:00
tldr: Setting up Ueberauth and Guardian in a Phoenix app for username & password authentication, user permissions, and JWT based authorisation.

So Ivan asked me how to set up token based sessions and password authentication
for an Elixir Phoenix Rest API. He then said 'Have you considered writing a blog
about this?', then I did, and then I did...

My goal is to set up username / password authentication, and token based
authorisation using JWT for rest API endpoints, with some routes restricted to
users with set permissions.

When doing this for the first time with Phoenix, I didn't find it entirely
obvious which combination of packages are needed, or how to get started with
them. So this is an attempt at a basic getting started guide, which you can
then build on to make a production worthy setup which fits your own
requirements.

I have posted the resulting example application on github, complete with docker
file so that you can see it run:

https://github.com/nathamanath/phoenix-auth-example

## Baseline...

For anyone who would like to play along at home, set up a new phoenix app; I'm
on version `1.3`.

## Getting started

First, get the required packages... add the following to your `mix.exs` and i'll
explain why we need each lib. Also `:ueberauth`, and `:ueberauth_identity` need
adding to `extra_applications`.

```elixir
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
simple username/password strategy for Uberauth'. Ueberauth dosent assume a
particular authorisation strategy, instead, strategy libs are made available
here: https://github.com/ueberauth, or you can make your own.

We want username / password auth, so `ueberauth_identity` is the one for us.

[guardian](https://github.com/ueberauth/guardian) is 'An authentication library
for use with Elixir applications.' We are going to use guardian to manage user
session tokens. It will encode and validate JWT for us, aswell as managing
individual users permissions.

We will use [comeonin](https://github.com/riverrun/comeonin) to hash, and check
user passwords.

Comeonin depends on a password hashing lib. You can choose Argon2, Bcrypt, or
Pbkdf2. We will use [bcrypt_elixir](https://github.com/riverrun/bcrypt_elixir)

This package is the bcrypt password hashing algorithm for Elixir. **Do take note
that this lib requires >1 CPU core to function. If you have only one core, on
say a small VPS, your release will crash without giving a useful error
message!!**

For a single core host, use [Pbkdf2](https://github.com/riverrun/pbkdf2_elixir)
instead of Bcrypt. See here for more on this:
https://github.com/riverrun/comeonin/wiki/Deployment

Give it a `mix deps.get` and we can get to the authorising...

## The user resource

So we will need some users to authorise. Im going to generate an uber simple
user resource.

```bash
  mix phx.gen.json \
    Accounts \
    User \
    users \
    username:string:unique \
    hashed_password:string \
    permissions:map
```

Add it to your router in the api scope like so:

```elixir
  scope "/api", AuthWeb do
    pipe_through :api

    resources "/users", UserController, except: [:new, :edit]
  end
```

and `mix ecto.migrate`.

We need to make a few modifications to `lib/auth/accounts/user.ex` for this to
be useful to us (see comments)...

```elixir
  defmodule Auth.Accounts.User do
    use Ecto.Schema
    import Ecto.Changeset
    alias Auth.Accounts.User

    schema "users" do
      field :hashed_password, :string
      field :permissions, :map
      field :username, :string

      # Add a virtual attribute to hold plain text passwords.
      field :password, :string, virtual: true

      timestamps()
    end

    @doc false
    def changeset(%User{} = user, attrs) do
      user

      # Cast and require a password for each user
      |> cast(attrs, [:username, :password, :permissions])
      |> validate_required([:username, :password, :permissions])
      |> unique_constraint(:username)

      # Hash passwords before saving them to the database.
      |> put_hashed_password()
    end

    defp put_hashed_password(changeset) do
      case changeset do
        %Ecto.Changeset{valid?: true, changes: %{password: password}} ->
          put_change(changeset, :hashed_password, Comeonin.Bcrypt.hashpwsalt(password))
        _ ->
          changeset
      end
    end
  end
```

And at this point, I am going to seed a few users with a range of permissions
now so that we can try out our code as we progress...

https://github.com/nathamanath/phoenix-auth-example/blob/master/priv/repo/seeds.exs

And after seeding the database, `Auth.Accounts.list_users` will show us our
seeded users and that our changes to `Auth.Accounts.User` have worked as
intended.

```elixir
  [%Auth.Accounts.User{
    __meta__: #Ecto.Schema.Metadata<:loaded, "users">,
    hashed_password: "$2b$12$ZPxcbPz9c.JyUKdxefgIB.L0SxcPTmu1qzB/Ki8yS66lGL...",
    id: 1,
    inserted_at: ~N[2018-02-09 08:38:52.705037],
    password: nil,
    updated_at: ~N[2018-02-09 08:38:52.705046],
    username: "reader"
  }, ... ]
```

## Accounts context

Next job is to be able to confirm username and password combinations...

To the accounts context!

Here we will use `Comeonin.Bcrypt.checkpw/2` to compare a password with a
password hash in our database, and `Comeonin.Bcrypt.dummy_checkpw/2` when an
incorrect username is given. This is to help prevent a possible
[timing attack](https://en.wikipedia.org/wiki/Timing_attack) in which an
attacker could infer whether email addresses are present in the database or not.

```elixir
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
        {:error, :unauthorised}
    end
  end
```

If you chose a different hashing lib to use with comeonin, then switch out the
`Comeonin.Bcrypt` module for whichever other one you selected. You can call
`checkpw/2` and `dummy_checkpw/0` on each of the hashing modules mentioned
above.

Now we can check that `Accounts.get_user_by_username_and_password/2` works as
expected; All going well, in `iex` you should get stuff like this:

```elixir
  Auth.Accounts.get_user_by_username_and_password "reader", "qweqweqwe"
  {:ok,
  # => %Auth.Accounts.User{...}

  Auth.Accounts.get_user_by_username_and_password "frank", "qweqweqwe"
  # => {:error, :unauthorised}

  Auth.Accounts.get_user_by_username_and_password "reader", "opensaysm"
  # => {:error, :unauthorised}
```

## Authentication controller

Now that this works, I want to see the same thing over HTTP. To achieve this
we need to:

* Configure ueberauth (and ueberauth_identity).
* Configure guardian.
* Write a guardian token module.
* Implement the actual authentication controller using the above dependencies.
* Update our router.

For this example, in `config.exs`, we will configure ueberauth and guardian like
so:

```elixir
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

  config :auth, Auth.Guardian,
    issuer: "Auth",
    secret_key: "use mix phx.gen.secret yo",

    # We will get round to using these permissions at the end
    permissions: %{
      default: [:read_users, :write_users]
    }
```

We set up ueberauth, with the ueberauth identity strategy as an authorisation
provider. For this you have to set:

* The request method which our controller will accept authorisation attempts
  on.
* The path which we will map to the identity callback controller action via our
  router.
* `nickname_field` is used to map our user resource to a jason web token.
* `param_nesting` and `uid_field` tells ueberauth that we will be posting up
  a user object containing the `username` and `password` attributes. And that
  we will use the `username` field to identify our users.

In order to issue tokens we need to write a module using the guardian behaviour:

```elixir
  defmodule Auth.Guardian do
    use Guardian, otp_app: :auth

    def subject_for_token(%{id: id}, _claims) do
      {:ok, to_string(id)}
    end

    def subject_for_token(_, _) do
      {:error, :no_resource_id}
    end

    def resource_from_claims(%{"sub" => sub}) do
      {:ok, Auth.Accounts.get_user!(sub)}
    end

    def resource_from_claims(_claims) do
      {:error, :no_claims_sub}
    end
  end
```

This module (along with guardian config) declares how we will encode and decode
our user resource as a JWT.

And with that, we have all we need to put together an authentication controller:

```elixir
  defmodule AuthWeb.AuthenticationController do
    use AuthWeb, :controller

    alias Auth.Accounts

    plug Ueberauth

    def identity_callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
      username = auth.uid
      password = auth.credentials.other.password
      handle_user_conn(Accounts.get_user_by_username_and_password(username, password), conn)
    end

    defp handle_user_conn(user, conn) do
      case user do
        {:ok, user} ->
          {:ok, jwt, _full_claims} =
            Auth.Guardian.encode_and_sign(user, %{})

          conn
          |> put_resp_header("authorization", "Bearer #{jwt}")
          |> json(%{token: jwt})

        # Handle our own error to keep it generic
        {:error, _reason} ->
          conn
          |> put_status(401)
          |> json(%{message: "user not found"})
      end
    end
  end
```

Next, map a route to the `identity_callback` action like so:

```elixir
  scope "/api", AuthWeb do
    pipe_through :api

    scope "/auth" do
      post "/identity/callback", AuthenticationController, :identity_callback
    end

    resources "/users", UserController, except: [:new, :edit]
  end
```

With that, we should be able to authenticate over HTTP

```bash
  curl \
    -XPOST \
    -v \
    localhost:4000/api/auth/identity/callback \
    -H 'content-type: application/json' \
    -d '{"user": {"username": "reader", "password": "qweqweqwe"}}'

  # => {"token":"eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJBdXRoIiwiZ..."}
```

You should now see a 200 status and a lovely JWT when using correct credentials,
and a 401 accompanied by an annoying message when you try without.

## Authentication pipeline

This is going well. Now that we can issue session tokens to authorised users, we
can restrict access to some api endpoints based on having aquired a valid JWT.

This will be carried out using a series of plugs provided by Guardian.

We write our own plug, grouping them together so that we can control how errors
are handled:

```elixir
  defmodule AuthWeb.Plug.AuthAccessPipeline do
    use Guardian.Plug.Pipeline, otp_app: :auth

    plug Guardian.Plug.VerifySession, claims: %{"typ" => "access"}
    plug Guardian.Plug.VerifyHeader, claims: %{"typ" => "access"}
    plug Guardian.Plug.EnsureAuthenticated
    plug Guardian.Plug.LoadResource, ensure: true
  end
```

We want to ensure that our authentication pipeline gives nice generic errors to
anyone who might be password guessing, for this we write another plug:

```elixir
  defmodule AuthWeb.Plug.AuthErrorHandler do
    import Plug.Conn
    import Phoenix.Controller, only: [json: 2]

    def auth_error(conn, {type, _reason}, _opts) do
      conn
      |> put_status(401)
      |> json(%{message: to_string(type)})
      |> halt()
    end
  end
```

And the configure `Auth.AuthAccessPipeline` to use it:

```elixir
  # Configure the authentication plug pipeline
  config :auth, AuthWeb.Plug.AuthAccessPipeline,
    module: Auth.Guardian,
    error_handler: AuthWeb.Plug.AuthErrorHandler
```

The last step in this section is to add a pipeline to the router,

```elixir
  pipeline :authenticated do
    plug AuthWeb.Plug.AuthAccessPipeline
  end
```

and to use it to restrict access to our user resource:

```elixir
  scope "/api", AuthWeb do
    pipe_through :api

    # SNIP...

    pipe_through :authenticated

    resources "/users", UserController, except: [:new, :edit]
  end
```

With all of that in place, we can try hitting up `/api/users` both with, and
without a valid session token:

```bash
  curl localhost:4000/api/users -H 'content-type: application/json'
  # => {"message":"unauthenticated"}

  # get an auth token
  curl \
    -XPOST \
    localhost:4000/api/auth/identity/callback \
    -H 'content-type: application/json' \
    -d '{"user": {"username": "reader", "password": "qweqweqwe"}}'
  # => {"token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiO..."}

  # use the auth token in the authorisation header like so:
  curl localhost:4000/api/users \
    -H 'content-type: application/json' \
    -H 'authorization: Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiO...'

  # => {"data":[{"username":"reader","id":1,"hashed_password":"$2b$12....]}
```

*By the way, now that our authentication pipeline is in place,
`Guardian.Plug.current_resource(conn)` will get us the current logged in user.*

## User permissions

Lastly lets have a quick look at managing user permissions. I want different
authenticated users to have access to differing api endpoints.

`Auth.Accoutns.User` already has a permissions attribute holding a list of
permission names, and so lets put those to work.

Guardian provides the functionality to encode and check user permissions for us
in the `Guardian.Permissions.Bitwise` behaviour and a corresponding
`Guardian.Permissions.Bitwise` plug.

First we need to update Auth.Guardian to encode a users permissions into their
tokens:

```elixir
  defmodule Auth.Guardian do
    @moduledoc """
    Integration with Guardian
    """
    use Guardian, otp_app: :auth

    use Guardian.Permissions.Bitwise

    # SNIP...

    def build_claims(claims, _resource, opts) do
      claims =
        claims
        |> encode_permissions_into_claims!(Keyword.get(opts, :permissions))

      {:ok, claims}
    end
  end
```

And pass in a user's permissions when calling `Auth.Guardian.encode_and_sign/3`
from `Auth.AuthenticationController`

```elixir
  Auth.Guardian.encode_and_sign(user, %{}, permissions: user.permissions)
```

Now, in `Auth.UserController` we can check these permissions per controller
action with the `Guardian.Permissions.Bitwise` plug:

```elixir
  plug Guardian.Permissions.Bitwise, ensure: %{default: [:read_users]}
  plug Guardian.Permissions.Bitwise, [ensure: %{default: [:write_users]}] when action in [:create, :update, :delete]
```

Now try authenticating as each of our seeded users, and hitting up each user
endpoint. You will see that whilst all users can reach the authentication
controller, but, as we ordained it to be:

* Only `writer` can get to `:create`, `:update`, `:delete`
* `reader` can only access `:show` and `:index`
* And `rubbish` can't access this resource at all

## Next steps

We have the start of a flexible user authentication and authorisation setup for
our Phoenix Elixir restful API, but there is more attention to detail required
to make this production worthy.

A bunch of things are missing, which you would probably like in your own
implementation before using it to secure your application.

For example:

* Enforce strong password choices
* Implement a password reset feature
* Write tests, so that you can be sure that your code behaves as intended
* Rate limit authentication attempts
* Role management
* Implement other authentication strategies, such as oauth2 via a third party
  provider
* TTL on your tokens, and a means of refreshing them

And of course, TLS is essential when handling user credentials.

There is much more detail in the docs and readmes of each of the packages used
(links below). It's well worth having a look to see the options available to you
here. Also, if one or more of these packages is not to your liking, there are
alternatives to each available on
[hex](https://hex.pm/packages?_utf8=%E2%9C%93&search=authentication&sort=recent_downloads).

## References

* https://github.com/ueberauth/guardian
* https://hexdocs.pm/guardian/Guardian.Permissions.Bitwise.html
* https://github.com/ueberauth/ueberauth
* https://github.com/ueberauth/ueberauth_identity
* https://github.com/riverrun/comeonin
* https://github.com/riverrun/bcrypt_elixir
