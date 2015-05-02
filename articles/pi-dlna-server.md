title: Raspberry pi dlna server
date: 2015-05-02 21:00
tldr: Making a raspberry pi and a usb hard drive into a DLNA media server.

At home both my lovely fiancee and I play music on our phones, laptop, and hifi.
And also watch videos on the tv, and laptops. Until recently this meant having
many copies of many files on many devices, changing cds, or plugging some device
into another. This is hassle.

All of these devices as it turns out speak DLNA, And I have a small heap of
raspberry pis sitting about. So why not turn one into a DLNA media server?

For this I would need to set up the following on my raspberry pi:

* A DLNA Server
* A means of uploading files to the pi,
* Also quite a bit of storage.

And then I did! This is how...

First up the storage. I set up my pi with a fresh install of raspian, and then
checked that everything is up to date:

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

pluged in a usb hard drive, connected to my network via ethernet, and sshd in,
and then `lsusb` ... no hdd, `lsblk`... same. It turns out the pi hasn't enough
juice to power this ssd over usb, and that this is a common problem. So I ordered
a powered usb hub, and tried again later.

Later...

To get the storage device set up I need to locate it:

```bash
lsblk
```

Which returns something like:

```bash
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
sda           8:0    0 465.8G  0 disk
└─sda1        8:1    0 465.8G  0 part
mmcblk0     179:0    0   7.4G  0 disk
├─mmcblk0p1 179:1    0    56M  0 part /boot
└─mmcblk0p2 179:2    0   7.4G  0 part /
```

I do not want to manually mount this drive each time i restart the pi.
The way to sort this out is to edit the file system table. But first I need the
UUID and format type of my hard drive:

```bash
sudo blkid /dev/sda1
```

Now edit file system table:

```bash
sudo vi /etc/fstab
```

Add the following row:

```bash
UUID=8115-1508 /media/usbhdd vfat defaults,user,exec,uid=1000,gid=100,umask=000 0 0
```

You will want to use your disks UUID, and check your user id `id -u`, and group id `id -g`.

Now mount it:

```bash
mount -a
```

This will alert you of any errors with your `fstab`. Check `dmesg` if you do get
any errors. It should work fine so make some directories to put media in later:

```bash
sudo mkdir -p /media/usbhdd/{Music,Photos,Videos}
```

Now restart the pi. The disk should be automatically mounted on boot.

Next I want some media for my pi to serve. This bit is easy, you can sftp into
the pi. On Ubuntu i will use nautilus as an sftp client
`nautilus sftp://pi@192.168.0.10`... Now i can drag and drop media files onto
my pi!

And last but not least, I need to set up a DLNA server. For this I will use
minidlna

```bash
sudo apt-get install minidlna
```

and configure it to serve files from my hard disk.

```bash
sudo vi /etc/minidlna.conf
```

I want to serve music, photos, and videos from their respective folders on I
created on my hdd. To do this I added the following lines:

```bash
media_dir=A,/media/usbhdd/Music
media_dir=P,/media/usbhdd/Photos
media_dir=V,/media/usbhdd/Videos
friendly_name=Pi
inotify=yes
```

The comments in the config file explain all of this.

Now start minidlna:

```bash
sudo service minidlna start
```

Minidlna will build its indexed on first boot. You can run `sudo service
minidlna force-reload` to redo this at any point. You should do this if you
change minidlna.conf at all.

And set it to start on boot:

```bash
sudo update-rc.d minidlna defaults
```

And there we go. I now only need enough music on my phone to last the day at
work, but can listen to any of it when I get home, and there will be no hassle wiring the
laptop up to the tv when its movie time :)

<figure>
  <img src="/assets/pi-dlna.jpg" alt="DLNA Raspberry pi">
  <figcaption>
    My HIFI connecting to my raspberry pi DLNA media server.
  </figcaption>
</figure>

#### Next steps:

* Set up a convenient means of downloading media directly to the pi

#### Referances:

* https://help.ubuntu.com/community/Fstab
* https://help.ubuntu.com/community/MountingWindowsPartitions
* https://everbit.wordpress.com/2013/04/01/minidlna-on-the-raspberry-pi/

