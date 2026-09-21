# Miniontoby's VRChat MultiCamMixer MIDI protocol companion module

A module for Bitfocus Companion (for StreamDeck control) to use Miniontoby's [VRChat MultiCamMixer](https://github.com/Miniontoby/VRChatMultiCamMixer) MIDI protocol.

## Requirements

This module does require [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) with **feedback detection turned off** to be installed.
After installation make sure to restart your computer, to apply the changes.  
_For Linux, there's also ways to get a loopback MIDI device, but I do not have any instructions pre-made._

After that, in the loopMIDI settings, add a new port with the name `loopMIDIPort` (just remove the space from the name, unless you want troubles)

Then go to Steam, go to your library, go to VRChat, then Manage and then Properties.
Then there should be an input field for startup/launch options. Add `--midi=loopMIDIPort` into that text field!

Then (re)start VRChat.  
Inside VRChat, make sure to enable logging under Settings -> Debug, else the module will be unable to receive feedback from the mixer.

## Usage

Upon adding the module to connections, select the correct MIDI port you're sending to.  
In case you are testing in-editor (using Unity), make sure to check the `Use Unity Editor Log (instead of VRChat log)` checkbox/toggle.

### Presets

You can use the presets to easily get your buttons.

All buttons will be black by default, and then when a connection to the mixer has been estabilished, they'll get a gray background because of the feedback that's set up.

The Auto button currently only does the same thing as the Cut button, this is not an issue within this module.  
I just wanted to make sure I have the button ready for when I do implement it.

### Actions

There's a couple actions available:

- set_program: sets the current program camera directly. Some technical directors work without previewing first.
- set_preview: sets the current preview camera directly.
- cut: swaps program and preview camera's.
- auto: _will_ do a transition from current program to current preview camera, and then commit the swap. This is not yet implemented in-world or in this module.
- reset: resets the current connection, will wait a couple seconds and then reconnects. Just in case some rare state mismatch happens.

### Feedbacks

There's a couple feedbacks available:

- program_active: indicates whether or not the specified input number is in program.
- preview_active: indicates whether or not the specified input number is in preview.
- connected: indicates whether or not the mixer is connected.

### Variables

There's a couple variable available:

- current_program: number of the current camera in program.
- current_preview: number of the current camera in preview.
- connected: indicates whether or not the mixer is connected.
