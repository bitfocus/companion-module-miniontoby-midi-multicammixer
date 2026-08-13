# VRChat MultiCamMixer's MIDI protocol companion module

A module for Bitfocus Companion (for StreamDeck control) to use the VRChat MultiCamMixer's MIDI protocol.

## Requirements

It does require [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) with **feedback detection turned off** to be installed.
After installation make sure to restart your computer.

After that, in the loopMIDI settings, add a new port with the name `loopMIDIPort` (just remove the space from the name, unless you want troubles)

Then go to Steam, go to your library, go to VRChat, then Manage and then Properties.
Then there should be an input field for startup/launch options. Add `--midi=loopMIDIPort` into that text field!

Then (re)start VRChat.
