title: Learning Rust
date: 2015-12-14 20:00
tldr: My first program in rust

I first looked at rust some time back (pre v1), learning a language that was changing
faster than I could pick it up didnt sound fun to me so I left it alone. Rust is
now on version 1.5. I re-visited it this week for some learning fun.

Having read the first few chapters of the [online book](https://doc.rust-lang.org/stable/book/)
I made a commandline tool to make data uris from images for me. Why? Because I
needed a data uri so that i could inline a loading gif in some css.

It takes one argument, a path to an image file, and returns a data uri of the
image provided like so `datauri /home/nathan/Pictures/1.gif`. I left in my learning
notes for future reference...

```rust
// Require external package. Versions are specified in cargo.toml
extern crate rustc_serialize;

// Bring dependencies into scope, so that they can be used below.
use rustc_serialize::base64::{ToBase64, MIME};
use rustc_serialize::hex::{ToHex};
use std::env;
use std::fs;
use std::fs::File;
use std::io::Read;
use std::thread;

fn main() {

  // nth returns an Option, which is an Enum, with variants None and Some
  // Some variant will hold first argument if provided
  if let Some(path) = env::args().nth(1) {

    // Check that file exists
    if fs::metadata(&path).is_err() {
      panic!("file at path does not exist.");
    }

    let mut file = File::open(&path).unwrap();
    let mut buffer = Vec::new();

    // `_` means we dont plan to use this variable
    let _out = file.read_to_end(&mut buffer).unwrap();

    // Now for some concurrency. because learning.

    // get base64 string of image
    let handle1 = {
      // make clone of buffer so that thread can own it.
      let buffer = buffer.clone();

      // move means following closure takes ownership of any
      // variable bindings it uses
      thread::spawn(move || {
        buffer.to_base64(MIME)
      })
    };

    // get file type of image from hex signiture
    let handle2 = {
      let buffer = buffer.clone();

      thread::spawn(move || {
        let hex = buffer.to_hex();

        // first 8 bytes of string
        let slice = &hex[..8];

        // compare slice to each key on left.
        // if matches key, return value on right.
        // _ is anything not named above
        match slice {
          "ffd8ffe0" => "jpg",
          "89504e47" => "png",
          "47494638" => "gif",
          _ => { panic!("invalid file type") }
        }

      })
    };

    // Block main while threads to finish
    let b64 = handle1.join().unwrap();
    let t = handle2.join().unwrap();

    println!("data:image/{};base64,{}", t, b64);

  } else {
    panic!("You must provide a file path");
  }
}
```

I could not find a nicer way of working out the image file type, but im sure that
there must be one. I will update this when I find it. However this made for a
minor excuse for me to try out the match operator and some concurrency in rust.

Being used to writing languages like ruby, the static typing is a bit of effort.
But, for me, getting used to that is half the point of learning rust. I have a
long way to go here, and am looking forward to finding a bigger project to learn
more rust.
