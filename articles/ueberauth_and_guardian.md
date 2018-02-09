title: Ueberauth and guardian setup
date: 2018-02-09 21:00
tldr: Setting up ueberauth and guardian in a phoenix app for password authentication, and jwt based authorisation

Lately I have been working on a few elixir / phoenix api projects

It seems to me that the right packages to use for authorisation and authentication are guardian and ueberauth.

Somewhat different to Devise in Rails land which I was used to before this,


As myself and others didnt find a good stup guide for the current version, I thought id have a go...

Lets get started!

Goal is to have username / password authentication, and token baset authorisation
(jwt) on rest API endpoints.

```
  mix phx.new Auth
```

```
  GENERATE USER RESOURCE
```

This is the starting point that we will work from. We have a new phoenix
application, and a user resource in need of authorisation!

First, get the required packages... we will be using:

```ex
  {:ueberauth, "~> 0.4"},
  {:ueberauth_identity, "~> 0.2"},
  {:guardian, "~> 1.0-beta"},
  {:comeonin, "~> 4.0"},
  {:bcrypt_elixir, "~> 1.0"}
```
ueberauth is

ueberauth_identity is a username and password authentication lib for use with
ueberauth. There are many oauth2 client stratergies for ueberauth available
here: https://github.com/ueberauth MORE WORDS

[guardian](https://github.com/ueberauth/guardian) is 'An authentication library
for use with Elixir applications.'

DIFFERENCE BETWEEN UEBERAUTH AND GUARDIAN AND WHY YOU NEED BOTH

We will use [comeonin](https://github.com/riverrun/comeonin) to hash, and check


Comeonin depends on a password hashing lib. YOu can choose Argon2, Bcrypt, or Pbkdf2.
We will use [bcrypt_elixir](https://github.com/riverrun/bcrypt_elixir) This package is the
bcrypt password hashing algorithm for Elixir. Do take note that **this lib
requires >1 cpu core to function. If you have only one core, on say a small VPS,
your release will crash without givving a useful error message!!**

For a single core host, use [Pbkdf2](https://github.com/riverrun/pbkdf2_elixir)
instead of Bcrypt.

Give it a `mix deps.get` and we begin...

## User resource

The user changeset


ACCOUNTS CONTEXT

```ex
  @doc """
  Find user by name, and confirm proper password
  """
  @spec get_user_and_confirm_password(String.t, String.t) :: {:ok, User.t} | {:error, atom}
  def get_user_and_confirm_password(nil, _), do: {:error, :invalid}
  def get_user_and_confirm_password(_, nil), do: {:error, :invalid}

  def get_user_and_confirm_password(email, password) do
    with  %User{} = user <- Repo.get_by(User, name: String.downcase(name)),
          true <- Comeonin.Bcrypt.checkpw(password, user.password_hash) do
      {:ok, user}
    else
      # User not found
      nil ->
        # Help to mitigate timing attacks
        Comeonin.Bcrypt.dummy_checkpw
        {:error, :not_found}
      # Wrong password
      _ ->
        {:error, :unauthorized}
    end
  end
```

SHOW IT WORK IN IEX

## Authorisation controller

Should rate limit this etc


CURL SHOWING IT WORKING

## Authentication plug
