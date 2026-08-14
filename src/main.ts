import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { Output } from './midi/midi.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

const CONTROL_CHANNEL = 15
const CONTROL_NOTE = 126

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // Setup in init()
	private _midiOutput: Output | null = null
	private _logStream: { path: string; bytesRead: number } | false | null = null
	private _lastUpdate: number
	private _watchdogInterval: NodeJS.Timeout | number | null = null
	private _resetTimeout: NodeJS.Timeout | number | null = null
	private _fd: number | null = null
	CurrentProgram: number
	CurrentPreview: number

	constructor(internal: unknown) {
		super(internal)
		this._lastUpdate = Date.now()

		this.CurrentProgram = 0
		this.CurrentPreview = 0
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updatePresets() // export Presets
		this.updateVariableDefinitions() // export variable definitions

		await this.configUpdated(config)
	}

	async destroy(): Promise<void> {
		this.reset(false)
		if (this._resetTimeout !== null) clearTimeout(this._resetTimeout)
		if (this._watchdogInterval) clearInterval(this._watchdogInterval)
		if (this._fd !== null) {
			fs.closeSync(this._fd)
			this._fd = null
		}
		if (this._logStream) this._logStream = null
		if (this._midiOutput) this._midiOutput.close()
		this.log('debug', `${this.id} destroyed`)
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config

		this.log('debug', `Selected MIDI Output: ${config.outPortName}`)

		if (this._resetTimeout !== null) {
			clearTimeout(this._resetTimeout)
			this._resetTimeout = null
		}
		if (this._watchdogInterval) clearInterval(this._watchdogInterval)
		if (this._fd !== null) {
			fs.closeSync(this._fd)
			this._fd = null
		}
		if (this._logStream) this._logStream = null
		if (this._midiOutput) this._midiOutput.close()

		this._midiOutput = new Output(config.outPortName)

		const midiOutStatus = this._midiOutput.isPortOpen()
		this.log('info', `Selected Out Port "${this._midiOutput.name}" is ${midiOutStatus ? '' : 'NOT '}Open.`)

		if (!midiOutStatus) {
			this.updateStatus(InstanceStatus.BadConfig, 'MIDI Out Port not open')
			return
		}

		this.start()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	start(): void {
		if (this._resetTimeout !== null) {
			clearTimeout(this._resetTimeout)
			this._resetTimeout = null
		}
		this.log('debug', '\nEntering *main*\n')
		this.updateStatus(InstanceStatus.Connecting, 'Connecting for the first time')
		this._lastUpdate = Date.now()
		this._findVRCLog()
		this._midiKnock()
		this._midiWatchdog()
		this._watchdogInterval = setInterval(() => this._tick(), 250)
	}

	setCurrentProgram(index: number): void {
		const CurrentProgram = Math.min(Math.max(0, Math.round(index)), 50)
		this._sendChannelValue(0, CurrentProgram)
		// this._setCurrentProgramVariable(CurrentProgram) // Let the callback set the value instead!
	}

	setCurrentPreview(index: number): void {
		const CurrentPreview = Math.min(Math.max(0, Math.round(index)), 50)
		this._sendChannelValue(1, CurrentPreview)
		// this._setCurrentPreviewVariable(CurrentPreview) // Let the callback set the value instead!
	}

	cut(): void {
		const oldProgram = this.CurrentProgram
		const oldPreview = this.CurrentPreview
		this.setCurrentPreview(0)
		this.setCurrentProgram(oldPreview)
		this.setCurrentPreview(oldProgram)
	}

	auto(): void {
		// We do not yet have an Auto method in the mixer package. Leaving this to be just like a cut
		const oldProgram = this.CurrentProgram
		const oldPreview = this.CurrentPreview
		this.setCurrentPreview(0)
		this.setCurrentProgram(oldPreview)
		this.setCurrentPreview(oldProgram)
	}

	reset(doReconnect: boolean = true): void {
		// kind of check if we're already trying to connect
		if (this._logStream === false) return

		if (this._fd !== null) {
			fs.closeSync(this._fd)
			this._fd = null
		}
		this._logStream = false

		if ((this.getVariableValue('current_program') ?? 0) > 0) {
			this._setCurrentProgramVariable(0)
		}
		if ((this.getVariableValue('current_preview') ?? 0) > 0) {
			this._setCurrentPreviewVariable(0)
		}
		if (this.getVariableValue('connected')) {
			this.setVariableValues({ connected: false })
			this.checkFeedbacks('connected')
		}
		this.updateStatus(InstanceStatus.Disconnected, 'Connection Lost or Reset')

		if (this._resetTimeout !== null) clearTimeout(this._resetTimeout)
		if (doReconnect) {
			this._resetTimeout = setTimeout(() => {
				this.updateStatus(InstanceStatus.Connecting, 'Connecting after reset')
				this._lastUpdate = Date.now()
				this._findVRCLog()
				this._midiKnock()
				this._midiWatchdog()
			}, 5e3) // 5 seconds else it doesnt actually reset
		}
	}

	_tick(): void {
		if (this._logStream === false) return

		if (this._isMidiReady()) {
			this._midiWatchdog()
			this._lastUpdate = Date.now()

			if (!this.getVariableValue('connected')) {
				this.setVariableValues({ connected: true })
				this.checkFeedbacks('connected')
				this.updateStatus(InstanceStatus.Ok)
			}
		} else {
			const elapsed = (Date.now() - this._lastUpdate) / 1000
			if (elapsed > 3) {
				this._lastUpdate = Date.now()
				this.reset()
			}
		}
	}

	_sendChannelValue(isPreview: number, index: number): void {
		index = Math.min(Math.max(0, Math.round(index)), 50)
		const value = (index << 1) | (isPreview & 0x1)
		this._sendMidiControl(value)
	}

	_sendMidiControl(code: number): void {
		if (!this._midiOutput?.isPortOpen()) return
		// this.log('debug', `Sending CC ch${CONTROL_CHANNEL} note${CONTROL_NOTE} val${code}`)
		this._midiOutput.sendMessage([0xb0 | (CONTROL_CHANNEL & 0xf), CONTROL_NOTE, code & 0x7f])
	}

	_midiKnock(): void {
		this._sendMidiControl(102) // KnockStart
		this._sendMidiControl(119) // KnockMiddle
		this._sendMidiControl(108) // KnockFinish
	}

	_midiWatchdog(): void {
		if (!this._logStream || !this._midiOutput?.isPortOpen()) return
		this._sendMidiControl(127) // Watchdog
	}

	_setCurrentProgramVariable(programValue: number): void {
		this.CurrentProgram = programValue
		this.setVariableValues({ current_program: programValue })
		this.checkFeedbacks('program_active')
	}

	_setCurrentPreviewVariable(previewValue: number): void {
		this.CurrentPreview = previewValue
		this.setVariableValues({ current_preview: previewValue })
		this.checkFeedbacks('preview_active')
	}

	_isMidiReady(): boolean {
		if (!this._logStream || !this._midiOutput?.isPortOpen()) return false
		try {
			const stat = fs.statSync(this._logStream.path)
			const newBytes = stat.size - this._logStream.bytesRead
			if (newBytes <= 0) return false

			const buf = Buffer.alloc(newBytes)
			if (this._fd === null) this._fd = fs.openSync(this._logStream.path, 'r')
			fs.readSync(this._fd, buf, 0, newBytes, this._logStream.bytesRead)
			this._logStream.bytesRead += newBytes

			const text = buf.toString('utf8')

			const programMatch = Array.from(text.matchAll(/\[MIDIMultiCamMixer\] CurrentProgram: (\d+)/g))
			if (programMatch.length > 0)
				this._setCurrentProgramVariable(parseInt(programMatch[programMatch.length - 1][1], 10)) // grab last

			const previewMatch = Array.from(text.matchAll(/\[MIDIMultiCamMixer\] CurrentPreview: (\d+)/g))
			if (previewMatch.length > 0)
				this._setCurrentPreviewVariable(parseInt(previewMatch[previewMatch.length - 1][1], 10)) // grab last

			return text.includes('MIXERREADY')
		} catch (err) {
			this.log('warn', `Error reading logs: ${err}`)
			if (this._fd !== null) {
				fs.closeSync(this._fd)
				this._fd = null
			}
			return false
		}
	}

	_findVRCLog(): void {
		if (this._fd !== null) {
			fs.closeSync(this._fd)
			this._fd = null
		}
		this._logStream = null
		let logs: string[] = []

		try {
			if (this.config.useEditorLog) {
				const vrcEditorPath =
					os.platform() === 'win32'
						? path.join(os.homedir(), 'AppData', 'Local', 'Unity', 'Editor', 'Editor.log')
						: path.join(os.homedir(), '.config', 'unity3d', 'Editor.log') // Assume XDG defaults
				if (fs.existsSync(vrcEditorPath)) logs = [vrcEditorPath]
			} else {
				const localLowPath =
					os.platform() === 'win32'
						? path.join(os.homedir(), 'AppData', 'LocalLow')
						: path.join(os.homedir(), '.local', 'share') // Assume XDG defaults
				const vrcPath = path.join(localLowPath, 'VRChat', 'VRChat')
				logs = fs
					.readdirSync(vrcPath)
					.filter((f) => f.match(/^output_log_.*\.txt$/))
					.map((f) => path.join(vrcPath, f))
					.sort()
			}
		} catch (err) {
			this.log('error', `Error finding logs: ${err}`)
		}

		if (logs.length === 0) {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Cannot find logs')
			this.reset()
			return
		}

		const latest = logs[logs.length - 1]
		try {
			const size = fs.statSync(latest).size
			this._logStream = { path: latest, bytesRead: size > 0 ? size - 1 : 0 }
			this.log('debug', `Watching log: ${latest}`)
		} catch {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Failed to read logs')
			this.reset()
			return
		}
	}
}
