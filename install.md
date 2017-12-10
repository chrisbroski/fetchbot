# Installing on Raspberry Pi

This worked for me on December 3, 2017. Starting with a Pi 2 fresh out of the box,

1. Insert an SD card with a current version of Raspbian. Get instructions here https://www.raspberrypi.org/documentation/installation/installing-images/
2. Plug the HDMI port into an HDMI monitor, A keyboard and mouse into USB ports (I am using a bluetooth keyboard and touch pad) and power.
3. Plug in a USB Wi-Fi dongle and connect the Pi to your wireless network. https://www.raspberrypi.org/documentation/configuration/wireless/
4. This might be a good time to `sudo apt-get update` and `sudo apt-get dist-upgrade`
4. Install *n* node version manager `curl -L https://git.io/n-install | bash`
5. Install the latest version of Node.js `sudo n latest`
