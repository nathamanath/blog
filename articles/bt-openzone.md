title: Automatically sign in to BT wifi hotspots
date: 2016-05-07 22:00
tldr: Auto login to BT openzone WIFI hotspots on Ubuntu or OSX.
tags: ubuntu, osx, bt openzone, bash

So we moved house, we brought broadband from BT, and they are taking efflong to
install it for us :( But our neighbour has BT too, so we can use their BT
openzone wifi hotspot.

The issue with this (apart from the customer service) is that you have to login
via a web page each time you connect. This is a minor inconvenience to me so I
had a go at automating the process on both my Ubuntu laptop, and my almost
wife's mac.

First I take a look at the post request the browser makes when I login and
copy as curl. Nothing special or complicated, here is the important bit:

`curl 'https://www.btopenzone.com:8443/tbbLogon' -d "username=USERNAME&password=PASSWORD"`

Great! Thats much better already. But I think we can do more.

A quick internet told me that on Ubuntu, if I put a bash script in
`/etc/network/if-up.d/` then it will be run each time I join a network!

And with a bit of fiddling on the command line, I find that I can get the
current network SSID with:

`iwconfig wlan0 | grep ESSID | awk -F\" '{print $(NF-1)}'`

Now I have everything needed to auto login each time I join a BT WIFI hotspot.

## My solution

### On Ubuntu

```bash
#!/bin/bash

SSID="$(iwconfig wlan0 | grep ESSID | awk -F\" '{print $(NF-1)}')"
BT_SSID="BTWifi-with-FON"

BT_USERNAME=USERNAME
BT_PASSWORD=PASSWORD

if [ "$SSID" == "$BT_SSID" ]; then

  curl 'https://www.btopenzone.com:8443/tbbLogon' -d "username=$BT_USERNAME&password=$BT_PASSWORD"

fi

```

Is saved as `/etc/network/if-up.d/bt`. It must be executable ofc.

This is all it takes. My script is run each time I join a network. It checks
for the correct SSID, and if it matches that of a BT hotspot it fires off the
curl request above, logging me in.

This works on Ubuntu 16. Now to sort this out on the mac as well.

### And OSX?!!?

It turned out to be a bit more of a faff to make a OSX do the same thing.

Firstly OSX does not have `iwconfig`, so I need to find another way to get the
current network's SSID. Not a biggie, this will be done with the `airport` cli.

Here Is the revised script for OSX:

```bash
#!/bin/bash

AIRPORT_PATH=/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport
SSID="$($AIRPORT_PATH -I | grep ' SSID' | awk '{print $(NF)}')"
BT_SSID="BTWifi-with-FON"

BT_USERNAME=USERNAME
BT_PASSWORD=PASSWORD

if [ "$SSID" == "$BT_SSID" ]; then
  curl 'https://www.btopenzone.com:8443/tbbLogon' -d "username=$BT_USERNAME&password=$BT_PASSWORD"
fi

```

Save it as `/Users/Shared/bin/bt`, and make it executable.

*The path to `airport` is accurate on OSX >= 10.5.*

Now, in order to have OSX run this script for us on changing network status, I
need the following plist file:

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

This should be saved as `/Library/LaunchAgents/networkchange.plist`.

`networkchange.plist` says that `/Users/Shared/bin/bt` should be run each time
there is a change to any of the 3 files listed under `WatchPaths`.

### Conclusion

And there we go then. Whenever either of the laptops join a BT wifi hotspot,
we will automatically be logged in!

I learned how to automate running a shell scripts when joining and leaving a
network on both Ubuntu and OSX, which I am sure will be useful to me again some
other time. Ubuntu made this easier for sure, and gives more control as my
script can easily be run on joining or leaving a network. My solution on OSX is
not as clean.

Next steps with this are to ensure that the script is only run on joining
networks on OSX, and to apply the same to other public wi-fi hotspots (like O2)
which also require this annoying login step each time.

YAY! Thats one more first world problem solved :)

#### References

* https://wiki.ubuntu.com/OnNetworkConnectionRunScript
* http://apple.stackexchange.com/questions/32354/how-do-you-run-a-script-after-a-network-interface-comes-up
* http://kb.mit.edu/confluence/pages/viewpage.action?pageId=4272001
