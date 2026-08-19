# VRChat MultiCamMixer's MIDI protocol companion module

A module for Bitfocus Companion (for StreamDeck control) to use the [VRChat MultiCamMixer](https://github.com/Miniontoby/VRChatMultiCamMixer)'s MIDI protocol.


## Requirements

It does require [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) with **feedback detection turned off** to be installed.
After installation make sure to restart your computer.

After that, in the loopMIDI settings, add a new port with the name `loopMIDIPort` (just remove the space from the name, unless you want troubles)

Then go to Steam, go to your library, go to VRChat, then Manage and then Properties.
Then there should be an input field for startup/launch options. Add `--midi=loopMIDIPort` into that text field!

Then (re)start VRChat.


## Usage

### Companion

1. Clone the repository and grab this folder where this README is located in.
2. Open Companion launcher menu
3. In the top right corner you will see a Cog. Click on it to show the Advanced Settings window:
4. In the Developer section click on Select to specify the directory where you have stored THIS folder.
5. Make sure Enable Developer Modules is switched on. You can now close the window
6. Click on "Launch GUI" to open the Admin interface. In the connections list you should find the connection provided by the developer module.


### CompanionPI

1. Find the developers module folder on your installation. This is often `/opt/companion-module-dev/`.
2. Check the section above on how to structure this folder
3. Run Companion.
4. Open the Admin interface in your Browser. In the connections list you should find the connection provided by the developer module.
5. If you don't see the developers module, please check the log and switch on debug, maybe the module has crashed.

