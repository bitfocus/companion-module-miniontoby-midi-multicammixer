import type ModuleInstance from './main.js'

export type ActionsSchema = {
	set_program: {
		options: {
			value: number
		}
	}
	set_preview: {
		options: {
			value: number
		}
	}
	cut: {
		options: Record<string, never>
	}
	auto: {
		options: Record<string, never>
	}
	reset: {
		options: Record<string, never>
	}
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		set_program: {
			name: 'Set CurrentProgram',
			options: [
				{
					type: 'number',
					id: 'value',
					label: 'Input Index (1-50)',
					default: 1,
					min: 1,
					max: 50,
				},
			],
			callback: async (action) => {
				self.setCurrentProgram(action.options.value)
			},
		},
		set_preview: {
			name: 'Set CurrentPreview',
			options: [
				{
					type: 'number',
					id: 'value',
					label: 'Input Index (1-50)',
					default: 1,
					min: 1,
					max: 50,
				},
			],
			callback: async (action) => {
				self.setCurrentPreview(action.options.value)
			},
		},
		cut: {
			name: 'Cut (swap Program and Preview)',
			options: [],
			callback: async () => {
				self.cut()
			},
		},
		auto: {
			name: 'Auto (swap Program and Preview)',
			options: [],
			callback: async () => {
				self.auto()
			},
		},
		reset: {
			name: 'Reset',
			options: [],
			callback: async () => {
				self.reset()
			},
		},
	})
}
