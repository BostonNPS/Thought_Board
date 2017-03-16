## Thoughtboard Kiosk App
This kiosk app is built to facilitate a dialog among visitors at pubic places. It can be used in a number of flexible ways: Single tablets, mutiple tablets, or tablets used in unison with large displays to mirror output. Questions are input and managed via an admin interface. Responses are collected from the public via kiosks running on tablets such as iPads. Responses, or "thoughts" appear on all displays and form the larger cloud of ideas and responses to the central question currently activated. Questions could be direct responses; however the intention is to use this app to pose deeper thought provoking questions to the public and elicit many different responses.

## Technical Overview
The kiosk app is built with Node.js and MongoDB on the back-end. Node hosts a client HTML/JS/CSS frontend and admin interface for use on any modern device with a browser. Recommended basic setup is as follows:

-A Raspberry Pi 3 connected to a large wall-mounted display. Multiple displays could present responses, but at least one Pi or other *nix device needs to act as the host.
-A tablet such as an iPad with a secure enclosure. Multiple tablet kiosks could be deployed either in the same location, or in different locations.

Large displays serve as an attractor of attention and offer the opportunity for multiple people to see responses. They should not, however, be used for inputting thoughts. A paired tablet would serve much better. When a user wishes to input a thought, he/she taps the plus (+) icon and inputs thoughts. The response is immediatlely sent to the Node.js host which will add the response to the Mongo database and then return the response to all clients for inclusion in the overall cloud of ideas. The positioning of all thougts are recalculated at randomly determied vectors every five seconds. The client redraws the position using a transition animation spanning that 5 seconds. The net effect results in continuous "floating" of thoughts in the cloud. By using a database on the back-end, all the questions and thoughts in response are archived so they can be recalled at will and and will persist through any crashes or reboots. Users can call out specific responses to halt the "floating" and enlarge the text. Actions on a client kiosk will mirror on all devices.

## Recommended Setup
1. Follow instructions for setting up a Raspberry Pi with Raspbian. You may also want to consider, based on implementation, to enable SSH (`sudo raspi-config` under Interfacing Options enable SSH) for remote administration. If you do this, you will DEFINITELY want to change the default password.
2. Once you are set up, use `apt-get` to install the needed applications. Since the roll out of PIXEL in 2017, Node.js and Chromium come with the full image of Raspbian out-of-the-box. The commands below will tell you if you already have it installed, and if not, will ask to install it. MongoDB and xautomation do not come with Raspbian by default and still have to be manually installed.
   ```
   sudo apt-get install nodejs
   sudo apt-get install mongodb
   sudo apt-get install chromium-browser
   sudo apt-get install xautomation
   ```

3. It should be noted that the mongoDB may take awhile to set everything up. Once its all done, `git clone` this repository.
4. `cd` into the directory and then `git clone https://github.com/twitter/twemoji.git` to include emoji support across all platforms. Many thanks to the Twemoji team and Twitter for making this great library publicly available.
5. It is reccommended that you setup a local wifi network using the Raspberry Pi to simplify managing the kiosks. This is particularly useful if you don't have a preexisting network. Even if you do, public wifi ap's typically have captive log-in portals and other things that are also an impediment to automatically getting kiosks running without additional intervention. [The easiest tutorial is probably here on the adafruit website](https://learn.adafruit.com/setting-up-a-raspberry-pi-as-a-wifi-access-point/overview). Follow all those instructions and come back here.
6. Set the Node.js app and chromium-browser (if you are using the Pi to be host and run client on a display) to load up on boot. I have found that the ~/.config/autostart/ folder is the easiest and most reliable way to get things started for Node and Chromium. Make a .desktop startup file, perhaps "Thought_Board.desktop" in ~.config/autostart/:
   ```
   nano ~/.config/autostart/Thought_Board.desktop
   ```
   Then past the following inside the file to execute the startup script in this repository every time the Pi boots:
   ```
   [Desktop Entry]

   Type=Application

   Exec=bash /home/pi/Thought_Board/autostart
   ```

7. Set the admin panel username and password in the autostart script. This is to prevent mischief if a kiosk lands on the admin panel by accident. These are global environment variables set each time the Pi boots:
   ```
   nano autostart
   ```
   and edit after the `#!/bin/bash` line:

   ```
   export THOUGHT_ADMIN_USER=*adminNameHere*
   export THOUGHT_ADMIN_PASS=*passwordHere*
   ```
   Of course, you shouldn't save this password in the browser of a kiosk--that defeats the purpose of hiding it from public view! Also please note it is a basic authentication scheme without HTTPS (so not recommended for the wide internet). This deployment scheme outlined in this README is fine for plain unencrypted usernames and password because it is solely on the local network you just set up. No clients other than your kiosks should be on it, except perhaps your phone or extra tablet solely for admin work.
   
8. The final step is to get all the proper dependencies for Node.js using the package took npm:

   ```
   npm install express
   npm install multer
   npm install socket.io
   npm install mongodb
   ```

9. This should be all the setup! From here everything should be manageable from the admin interface. Rather than trying to run the kiosk from terminal, just do `sudo reboot` and everything *should* get up and runing naturally.


To access the admin panel, open a browser and go to 192.168.42.1/admin.

To get to the app itself, go to 192.168.42.1/app.

### iPad kiosk notes

If you want to set up an ipad as a kiosk to input new thoughts, set the parameter `?kiosk` at the end of the app url in safari, so, `http://192.168.42.1/app?kiosk`. That will enable the add comment button. Make a shortcut to run the kiosk as a web-app using "Add to Homescreen". Close safari and open the app from the home screen. It will now run full screen indefinitely. You will also likely want to enable "Guided Access" on the iPad to prevent users to going in other apps. There is plenty of documentation about that elsewhwere.
