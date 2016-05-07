title: Automatically sign in to BT wifi hotspots
date: 2016-05-07 22:00
tldr: Auto connect to BT openzone WIFI hotspots on Ubuntu or OSX.
tags: ubuntu, osx, bt openzone, bash

So we moved house, we brought broadband from BT, and they are taking efflong to
install it for us :( But our neighbour has BT too, so wee can use their openzone wifi hotspot.

The issue with this (apart from the customer service) is that you have
to login each time you connect. This is a minor inconvenience to me so I had a
quick look into automating the process.

First I take a look at the post request the browser makes when I login and
copy as curl. Nothing special here, here is the important bit:

`curl 'https://www.btopenzone.com:8443/tbbLogon' -d "username=USERNAME&password=PASSWORD"`

Great! Thats much better already. But I think we can do more.

A quick internet search told me that on Ubuntu, if I put a bash script in
`/etc/network/if-up.d/` then it will be run each time I join a network!

And with a bit of fiddling on the command line, I find that I can get the
current network SSID with:

`iwconfig wlan0 | grep ESSID | awk -F\" '{print $(NF-1)}'`

Now I have everything needed to auto login each time I join a BT WIFI hotspot.

## The solution

### On Ubuntu 16

```bash
#!/bin/bash

SSID="$(iwconfig wlan0 | grep ESSID | awk -F\" '{print $(NF-1)}')"
BT_SSID="BTWifi-with-FON"

if [ "$SSID" == "$BT_SSID" ]; then

  curl 'https://www.btopenzone.com:8443/tbbLogon' -d "$(username=$BT_USERNAME&password=$BT_PASSWORD)"

fi

```

Is saved as `/etc/network/if-up.d/bt`.

_`BT_USERNAME` and `BT_PASSWORD` are set as environment variables, and of course
the file must be executable._

This is all it takes. My script is run each time I join a network. It checks
for the correct SSID, and if it matches that of a BT hotspot it logs me in.

This works on Ubuntu 16. Now to sort this out on the mac aswell.

### And OSX?!!?

It's bit more of a faff to make a OSX do the same thing. I need to
change the shell script to make it work on a mac. And convincing OSX to run this
script for me at the right time requires more research.

OSX does not have iwconfig, so I need to find another way to get the current
SSID. This will be done with `airport`

Here Is the revised script:

```bash
#!/bin/bash

AIRPORT_PATH=/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport
SSID="$($AIRPORT_PATH -I | grep ' SSID' | awk '{print $(NF)}')"
BT_SSID="BTWifi-with-FON"

if [ "$SSID" == "$BT_SSID" ]; then
  curl 'https://www.btopenzone.com:8443/tbbLogon' -d "$(username=$BT_USERNAME&password=$BT_PASSWORD)"
fi

```

Save it as `/Users/Shared/bin/bt` and make it executable.

The path to airport is accurate on OSX Yosemite. It may or may not differ on
other versions.

Now, in order to have OSX run this script for us on changing network status, I
need a the following file, `networkchange.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" \
 "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>ifup.ddns</string>

  <key>LowPriorityIO</key>
  <true/>

  <key>ProgramArguments</key>
  <array>
    <string>/Users/Shared/bin/bt</string>
  </array>

  <key>WatchPaths</key>
  <array>
    <string>/etc/resolv.conf</string>
    <string>/Library/Preferences/SystemConfiguration/NetworkInterfaces.plist</string>
    <string>/Library/Preferences/SystemConfiguration/com.apple.airport.preferences.plist</string>
  </array>

  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
```

(thanks stack exchange)

As far as I know, this can be at any path.
The .plist has to be registered with the following commands:

```sh
launchctl load ./path/to/networkchange.plist
launchctl start networkchange
```

Its worth noting that script is run as the user who registered the `.plist`

### Conclusion

And there we go then. Whenever either of the laptops join a BT wifi hotspot for
me, I will be automatically logged in.

I learned how to run shell scripts when joining and leaving a network on both
Ubuntu and OSX, which Im sure will be useful to me again.

Next steps with this are to apply the same to other public wifi hotspots
(like o2) which also require this annoying sign in step each time.

YAY! Thats one more first world problem solved :)

#### References

* https://wiki.ubuntu.com/OnNetworkConnectionRunScript
* http://apple.stackexchange.com/questions/32354/how-do-you-run-a-script-after-a-network-interface-comes-up

