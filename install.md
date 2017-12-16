# Installing on Raspberry Pi

This worked for me on December 3, 2017. Starting with a Pi 2 fresh out of the box,

1. Insert an SD card with a current version of Raspbian. Get instructions here https://www.raspberrypi.org/documentation/installation/installing-images/
2. Plug the HDMI port into an HDMI monitor, A keyboard and mouse into USB ports (I am using a bluetooth keyboard and touch pad) and power.
3. Plug in a USB Wi-Fi dongle and connect the Pi to your wireless network. https://www.raspberrypi.org/documentation/configuration/wireless/ (If you just plugged in your wi-fi dongle you will probably need to restart your Pi for it to be recognized.)
<!--4. This might be a good time to `sudo apt-get update` and `sudo apt-get dist-upgrade`-->
4. You might want to remap your keyboard to US with this command `setxkbmap -layout us`
5. Let's start installing Node.js. The latest image comes with it, but it is not quite good enough. Get rid of it with `apt-get remove --purge nodejs*`
6. Install *n* node version manager `curl -L https://git.io/n-install | bash`
7. Close and reopen the terminal window, then run `n latest` to install the most current version of Node.js. Run the `n` command to see what version that is (and check that everything installed correctly.) Hit Enter/return to close `n` and get back to the command line.
8. Let's start setting up the AI project. From you home directory, I recommend you create a `projects` subdirectory like this `mkdir projects`
9. Change to that directory to make it active `cd projects`.
10. Pull down my *Fetchbot* repository from GitHub by typing `git clone https://github.com/chrisbroski/fetchbot.git`
11. Change to the `fetchbot` directory liek so `cd fetchbot`
12. Install dependent libraries using the Node Package Manager with this command `npm install`
13. Now you are ready to run a simulated version of the brain software. `npm run virtual`
14. Open a web browser and navigate to http://0.0.0.0:3791 or if you want to view it on another computer on the same network, type `ifconfig` into a terminal. The IP address of the Raspberry Pi is in there somewhere. I found mine under the `wlan0` section as the first address after `inet`
15. ctrl-c will stop the Fetchbot program.
<!-- 192.168.1.73 -->
