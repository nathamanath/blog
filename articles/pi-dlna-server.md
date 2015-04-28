title: Raspberry pi dlna server
date: 2015-04-28 21:00
tldr: Making a pi and a usb hdd into a DLNA server

At home both my lovely fience and I play music on our phones, laptop, and hifi.
And also watch videos on the tv, and
laptops. Until recently this meant having many copies of many files, changing
cds, or plugging some device into another. This is hassle.

All of these devices as it turns out speak DLNA, And I have a small heap of
raspberry pis sitting about. So why not turn one into a DLNA media server?

For this I need:

* A DLNA Server
* A means of uploading files to the pi,
* Also quite a bit of storage.

First up the storage. I set up my pi with a fresh install of raspian, plugged in
a ssd, and ethernet, sshd in, `lsusb`... no hdd, `lsblk`... same. It turns out
the pi2 hasnt enough juice to power this ssd over usb. So I ordered a powered
usb hub, and am using an old mains powered spiny hard drive for now.

Locate it:

```zsh
  lsblk
```

And mount it at `/media/usbhdd`:

```zsh
  sudo mkdir -p /media/usbhdd
  sudo mount /dev/sda1 /media/usbhdd
```

And make some directories to put media in:

```zsh
  sudo mkdir /media/usbhdd/Music
  sudo mkdir /media/usbhdd/Videos
  sudo mkdir /media/usbhdd/Picturs
```

This is rather good, just 2 things to do with this now; I do not want to do this
each time I start up my media server, and `/media/usb` is owned by root. This
will give me a hard time when I want to upload files later.

The way to sort this out is to edit the file system table. But first I need some
information about my usb hard drive.

```zsh
  sudo blkid -p /dev/sda1
```

The bits I need are the UUID, and the format. FAT32 does not support linux
permissions. I will not just be able to chown `/media/usbhdd`. Permissions also
have to be set in fstab.

Now edit the file system table:

```zsh
  sudo vi /etc/fstab
```

Add the following row:

```zsh
  UUID= vfat
```

You will want to use your disks UUID, and check your user id `id -u`, and group id `id -g`.

Now restart the pi, and your disk should be mounted on boot.

Next I want some media for my pi to serve. This bit is easy, you can sftp into
the pi. On Ubuntu i will use nautilus as an sftp client `nautilus sftp://pi@<PI IP>`

And last but not least, I need to set up a DLNA server. For this I will use
minidlna

```zsh
  sudo apt-get install minidlna
```

and configure it to serve files from my hard disk.

```zsh
  sudo vi /etc/minidlna.conf
```

I want to serve music, photos, and videos from their respective folders on I
created on my hard disk. To do this I updated the following:

```zsh

```

And there we go. I now only need enough music on my phone to last the day at
work, but
can listen to any of it when I get home, and there will be no hassle wiring the
laptop up to the tv when its video time :)

<figure>
  PHOTO!!
  <figcaption>
    My DLNA Server setup
  </figcaption>
</figure>

Next steps:
* My SSD will allow for faster file uploads when the usb hub gets here.
* And see if I can work out how to access this remotely.

