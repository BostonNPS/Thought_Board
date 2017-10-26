# Interactive Comment Wall
This "Comment Wall" is built to facilitate a dialog among visitors in pubic institutions like museums, historic sites, and visitor centers. It can be used in a number of flexible ways: Single tablets, mutiple tablets, or tablets used in unison with large display(s) to mirror output. Questions are input and managed via a web-based admin interface. Responses are collected from the public via kiosks running on tablets such as iPads. Responses appear on all displays and form the larger cloud of ideas and responses to the central question currently activated. Questions could be direct responses; however the intention is to use this app to pose deeper thought provoking questions to the public and elicit many different responses. Questions can use images or videos, and responses can involve a combination of polls and free commenting.

## Getting Started
A basic set-up starts with a Raspberry Pi 3 kit. Plenty are available for around $50. Be sure to get a kit that, at the very least, contains the board, a case, USB power supply, and a microSD card (8GB or larger). A heat sink for the processor is a good idea too.
Beyond the Raspberry Pi, a large display with HDMI is ideal for displaying multimedia, comments and attracting attention. Tablets like iPads will connect to the Raspberry Pi over WiFi for taking visitor input.

### Pi Setup, Comment Wall Dependencies, and Getting the Code
1. First, follow [these instructions](https://www.raspberrypi.org/documentation/installation/installing-images/README.md) for downloading and installing Raspbian (the Raspberry Pi operating system) onto your microSD card. If you have any difficulty in getting things started, there are tons of tutorials online both through the Raspberry Pi Foundation and through other websites.
2. After getting Raspbian flashed to the microSD card, you will need to connect a USB mouse, USB keyboard, and a display that can accept HDMI. Boot up the Pi and connect to the internet with the on-board WiFi or an ethernet connection. Feel free to set up things as you see fit using the user interface.
3. This is where things start to get technical, but copy/pasting commands will be just fine for novice users. Open a terminal with `Ctrl + Alt + t`. We will use Raspbian's built-in `apt` utility to get updates and then install MongoDB (for storing and managing the Comment Wall data) and the package xautomation (used to automatically hide the cursor at boot).
```
sudo apt update
sudo apt upgrade
sudo apt install mongodb
sudo apt install xautomation
```

4. Raspbian ships with an old version of Node.js, which is the heart of how the Comment Wall app is built. Currently Node.js version 8 is latest and will be compatible. This one line command will download and install what is required:
```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
```

5. Now clone this repository of code on your Raspberry Pi and then change into that directory (default is Comment_Wall):
```
git clone https://github.com/NPS-Boston/Comment_Wall.git
cd Comment_Wall
```

6. Now for the final dependencies. The Node.js package manager `npm` will automatically grab the right code dependencies (express.js, mongoDB module, etc.) with the use of:
```
npm update
```
Once that is done, clone the Twemoji library for emoji support
```
git clone https://github.com/twitter/twemoji.git
```
Many thanks to the Twemoji team and Twitter for making this great library publicly available.

Congratulations. You have all the code and dependencies installed for things to work!

### Comment Wall Configuration
#### Start at Boot
To get the Comment Wall app to load at boot and display the comment wall on a local display screen, the `autostart` script file needs to be executed when the Pi boots. I have found the most effective way is to make a .desktop file in the /home/pi/config/autostart/ directory.

In your terminal, open a new .desktop file, like Comment_Wall.desktop:
```
nano /home/pi/.config/autostart/Thought_Board.desktop
```

then paste the following to execute the autostart script at boot time:
```
[Desktop Entry]

Type=Application

Exec=bash /home/pi/Comment_Wall/autostart
```

#### Local WiFi
If there is no wireless internet at the deployment location, then any kiosk for user input won't work. Luckily, even if you don't have any internet at all, you can still create a small WiFi network on the Raspberry Pi itself that your iPads can connect to. [The easiest tutorial is probably here on the adafruit website](https://learn.adafruit.com/setting-up-a-raspberry-pi-as-a-wifi-access-point/overview). Follow all those instructions and come back here.

#### Admin Password
The autostart script exports two environment variabes for the username and password for the Comment Wall admin interface. The default admin user name is `kiosk` and the default password is `ipad`. If you wish to change these values, edit the autostart script:
```
nano autostart
```

On the line `sudo THOUGHT_ADMIN_USER=kiosk THOUGHT_ADMIN_PASS=ipad node server.js &` replace the THOUGHT_ADMIN_USER THOUGHT_ADMIN_PASS values as you see fit. ***Note: This is case sensitive!***

#### Reboot to get things going!
In a terminal, type
```
sudo reboot
```

## Administrating and using a configured installation of Comment Wall
If everything is set up correctly, Comment Wall will run automatically upon every boot-up of the Raspberry Pi. The Comment Wall app itself runs in the background, while on a local display connected to the Pi, Chromium (the open source version of Google's Chrome browser) will launch in a kiosk fullscreen mode within about 30-60 seconds of the Pi finishing its full boot-up. If this is a clean install of Comment Wall, some filler info will fill the screen, otherwise it will display the most recently activated question.
### Adding a Question
Typically in a deployment, the Pi runs without a keyboard and mouse. Visitor input should be via kiosks on iPads or other devices, and it will be the easiest for you to also administer the Pi from an iPad or a smartphone connected to the same internet that the Raspberry Pi is connected to. If you set up a local WiFi hotspot using the adafruit tutorial, you can connect to the admin panel at:
```
http://192.168.42.1/admin
```

If you are using a different network, you will need to either figure out the IP address of the Raspberry Pi, or, if you are using an iPad or iPhone, you will probably be able to use:
```
http://raspberrypi.local/admin
```
or whatever hostname you gave the Raspberry Pi in its settings. (i.e. if you named it kiosk, then go to http://kiosk.local/admin).

Once you reach the admin panel, enter the Username and Password you set. You are given three tabs with the Active Question, the Inactive Questions, and lastly the Create/Edit/Preview Questions tab. Open the Create/Edit/Preview Questions tab.
The dropdown at the top is used to select either all past questions to be edited, or select "(new question)" to create a new question.
the "Question" is required. You can use some HTML in there, though, to have control of sizing, emphasis, etc. DO NOT link images or other media here, that is handled separately with the upload options further below.
If you wish to have a polling aspect where users can "vote" for certain responses, check off the "Ballot/Multiple choice" option. You must have at least 2 possible responses. A chart/graph could be enabled showing the votes, and commenting with a vote could either be enabled or disabled. Also be sure to assign a unique color to each option using the colorpicker widget.
Images should be optimized, if possible for use in the main display (i.e. make use of landscape or portrait orientation of display screen) Videos currently DO NOT play on the display screen, but instead are playable at user kiosks while a placeholder preview image displays on the main screen. (intended to be changed in the future)
### Activating and Administrating
Once a question is submitted, it is listed under the inactive question. Select that tab and find the new question. Open the three dot menu for the question and hit "Activate Question." The question will go live on all running screens. Responses will nest under the question under the active tab. Responses needing to be hidden or suppressed, or perhaps deleted or edited, can be administered by opening each three dot menu button.
### Client/Visitor Kiosks
An iPad or other tablet in some kiosk enclosure is ideal for enabling visitors to contribute their own comments or votes. By connecting to the WiFi of the Raspberry Pi with an iPad and going to its IP (for example, `192.168.42.1` if using the same setup as in the adafruit tutorial) or its hostname (`raspberrypi.local` if left to default) the kiosk will open the client page where users can tap the plus (+} icon and input their feedback and/or votes. Rather than animating the comments, the iPad has a smaller screen better suited to listing each comment in a more linear fashion. If you tap the share icon and add this webpage to the homescreen, the page will function as a web-based native app in fullscreen mode. This, paired with guided access (home button lock) situates the iPad perfectly for kiosk use by the public.
