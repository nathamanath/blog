title: Learning Rust
date: 2015-12-14 20:00
tldr: My first program in Rust

I first looked at Rust a while back (pre version 1), learning a language that was changing
faster than I could pick it up didn't sound fun to me so I left it alone. Rust is
now on version 1.5. I re-visited it this week for some learning fun.

Having read the first few chapters of the [online book](https://doc.rust-lang.org/stable/book/)
I made a command line tool. It takes one argument, a path to an image file, and
returns a data URI of the image provided like so;

`64yo ./1.gif | xclip -sel clip` (or pbcopy on osx).

This will be very useful when putting websites together.

Here is my code; I left in my notes for future reference.

```rust
extern crate rustc_serialize;

use rustc_serialize::base64::{ToBase64, MIME};
use rustc_serialize::hex::{ToHex};
use std::env;
use std::fs;
use std::fs::File;
use std::io::Read;
use std::thread;

fn main() {

  // Could also be this
  // match env::args().nth(1) {
  //   Some(path) => encode_image(&path),
  //   None => explain_usage()
  // }
  if let Some(path) = env::args().nth(1) {
    encode_image(&path);
  } else {
    // None
    explain_usage();
  }

}

/// Explains how to use from commandline
fn explain_usage() {
  println!("Usage: `64yo <PATH TO IMAGE>`");
  println!("Image at path can be jpeg, png, or gif.");
}

/// Returns image at path as data uri
fn encode_image(path: &str) {
  // Check that file exists
  if fs::metadata(&path).is_err() {
    println!("File at path does not exist.");
    explain_usage();
  }

  let mut file = File::open(&path).unwrap();
  let mut buffer = Vec::new();

  // _ suppresses un-used variable warning
  let _out = file.read_to_end(&mut buffer).unwrap();


  // Now for some concurrency. Because learning.

  // get file type of image from hex signature
  let handle1 = {
    let buffer = buffer.clone();

    thread::spawn(move || {
      let hex = buffer.to_hex();

      // first 8 bytes of string
      let slice = &hex[..8];

      // compare slice to each key on left.
      // if matches key, return value on right.
      // _ is anything not specified above
      // exhaustiveness checking... it is possible that slice could not match any
      // so _ branch is required
      match slice {
        "ffd8ffe0" => Some("jpg"),
        "89504e47" => Some("png"),
        "47494638" => Some("gif"),
        _ => None
      }

    })
  };

  // get base64 string of image
  let handle2 = {
    // make clone of buffer so that thread can own it.
    let buffer = buffer.clone();

    // move means following closure takes ownership of any
    // variable bindings it uses
    thread::spawn(move || {
      buffer.to_base64(MIME)
    })
  };


  // Block while threads finish
  let extension = handle1.join().unwrap();
  let b64 = handle2.join().unwrap();

  // output data uri or handle invalid file type nicely
  match extension {
    Some(ext) => println!("data:image/{};base64,{}", ext, b64),
    None => explain_usage()
  }

}
```

This compiled with rustc 1.5.0.

I could not find a nicer way of working out the image file type, but I'm sure that
there must be one. I will update this when I find it. However I was looking for
any excuse to try out some concurrency in Rust, and took this one. I have one thread
working out the file type, whilst a second base64's the image file. When they are
both finished the result of these operations is used to construct my data URI.

Pattern matching like this is new to me
Ownership of variables

I have a long way to go here, and am looking forward to finding a bigger project
to learn more Rust.
