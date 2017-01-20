##Thoughtboard Kiosk App
This kiosk app is built to facilitate a dialog among visitors at pubic places. It can be used in a number of flexible ways: Single tablets, mutiple tablets, or tablets used in unison with large displays to mirror output. Questions are input and managed via an admin interface. Responses are collected from the public via kiosks running on tablets such as iPads. Responses, or "thoughts" appear on all displays and form the larger cloud of ideas and responses to the central question currently activated. Questions could be direct responses; however the intention is to use this app to pose deeper thought provoking questions to the public and elicit many different responses.

##Technical Overview
The kiosk app is built with Node.js and MongoDB on the back-end. Node hosts a client HTML/JS/CSS frontend and admin interface for use on any modern device with a browser. Recommended basic setup is as follows:

-A Raspberry Pi 3 connected to a large wall-mounted display. Multiple displays could present responses, but at least one Pi or other *nix device needs to act as the host.
-A tablet such as an iPad with a secure enclosure. Multiple tablet kiosks could be deployed either in the same location, or in different locations.

Large displays serve as an attractor of attention and offer the opportunity for multiple people to see responses. They should not, however, be used for inputting thoughts. A paired tablet would serve much better. When a user wishes to input a thought, he/she taps the plus (+) icon and inputs thoughts. The response is immediatlely sent to the Node.js host which will add the response to the Mongo database and then return the response to all clients for inclusion in the overall cloud of ideas. The positioning of all thougts are recalculated at randomly determied vectors every five seconds. The client redraws the position using a transition animation spanning that 5 seconds. The net effect results in continuous "floating" of thoughts in the cloud. By using a database on the back-end, all the questions and thoughts in response are archived so they can be recalled at will and and will persist through any crashes or reboots. Users can call out specific responses to halt the "floating" and enlarge the text. Actions on a client kiosk will mirror on all devices.

##Recommended Setup
1. Follow instructions for setting up a Raspberry Pi with Raspbian.
2. Once set up use apt-get to install the needed applications, Node.js, MongoDB, and, if you are running locally on a display, Chromium.
```
sudo apt-get install nodejs
sudo apt-get install mongodb
sudo apt-get install chromium-browser
```

3. It should be noted that the mongoDB takes awhile to set everything up. Once its all done, `git clone` this repository.
4. `cd` into the directory and then `git clone https://github.com/twitter/twemoji.git` to include emoji support across all platforms. Many thanks to the Twemoji team and Twitter for making this great library publicly available.
5. It is reccommended that you setup a local wifi network using the Raspberry Pi to simplify managing the kiosks. This is particularly useful if you don't have a preexisting network. Even if you do, public wifi ap's typically have captive log-in portals and other things that are also an impediment to automatically getting kiosks running without additional intervention. [The easiest tutorial is probably here on the adafruit website](https://learn.adafruit.com/setting-up-a-raspberry-pi-as-a-wifi-access-point/overview). Follow all those instructions and come back here.
6. Set the Node.js app and chromium-browser (if you are using the Pi to be host and run client on a display) to load up on boot. I have found that the ~.config/autostart/ folder is the easiest and most reliable way to get things started for Node and Chromium. Make a .desktop startup file, perhaps "Thought_Board.desktop" in ~.config/autostart/ that executes the startup script included in this repository:
```
[Desktop Entry]

Type=Application

Exec=bash /home/pi/Thought_Board/autostart
```

This should be all the setup. From here everything should be manageable from the admin interface!
