import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import type { CompanionPresetDefinitions, CompanionPresetSection } from '@companion-module/base'

export function UpdatePresets(self: ModuleInstance): void {
	const structure: CompanionPresetSection[] = [
		{
			id: 'controls',
			name: 'Controls',
			definitions: [
				{
					id: 'connection',
					type: 'simple',
					name: 'Connection',
					presets: ['connected'],
				},
				{
					id: 'actions',
					type: 'simple',
					name: 'Actions',
					presets: ['cut', 'auto', 'reset'],
				},
				{
					id: 'cameras',
					type: 'simple',
					name: 'Cameras',
					presets: [],
				},
				{
					id: 'set_preview_cameras',
					type: 'template',
					name: 'Cameras',
					presetId: 'set_preview_camera',

					templateVariableName: 'input',
					templateValues: [
						// Tip: the name will override the 'name' field of the preset itself
						{ name: 'Cam 1', value: 1 },
						{ name: 'Cam 2', value: 2 },
						{ name: 'Cam 3', value: 3 },
						{ name: 'Cam 4', value: 4 },
						{ name: 'Cam 5', value: 5 },
						{ name: 'Cam 6', value: 6 },
						{ name: 'Cam 7', value: 7 },
						{ name: 'Cam 8', value: 8 },
					],
				},
			],
		},
	]

	const presets: CompanionPresetDefinitions<ModuleSchema> = {}
	presets['connected'] = {
		type: 'simple',
		name: 'VRChat Connection Indicator',
		style: {
			text: 'VRC\\nDISC',
			size: '24',
			color: 0xffffff,
			bgcolor: 0xb40000,
		},
		steps: [],
		feedbacks: [
			{
				feedbackId: 'connected',
				options: {},
				style: {
					text: 'VRC\\nLIVE',
					color: 0x000000,
					bgcolor: 0x00ff00,
				},
			},
		],
	}

	presets['cut'] = {
		type: 'simple',
		name: 'Cut',
		style: {
			text: 'CUT',
			size: '24',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'cut',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'connected',
				options: {},
				style: {
					color: 0x000000,
					bgcolor: 0xff0000,
				},
			},
		],
	}

	presets['auto'] = {
		type: 'simple',
		name: 'Auto',
		style: {
			text: 'AUTO',
			size: '24',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'auto',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'connected',
				options: {},
				style: {
					color: 0x000000,
					bgcolor: 0xb40000,
				},
			},
		],
	}

	presets['reset'] = {
		type: 'simple',
		name: 'Reset',
		style: {
			text: 'Reset',
			size: '24',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'reset',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'connected',
				options: {},
				style: {
					color: 0x000000,
					bgcolor: 0xb8b8b8,
				},
			},
		],
	}

	presets['set_preview_camera'] = {
		type: 'simple',
		name: 'Set Preview Camera Input',
		style: {
			text: 'Cam $(local:input)',
			size: '18',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'set_preview',
						options: {
							value: {
								isExpression: true,
								value: '$(local:input)',
							},
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'connected',
				options: {},
				style: {
					color: 0x000000,
					bgcolor: 0xb8b8b8,
				},
			},
			{
				feedbackId: 'preview_active',
				options: {
					value: {
						isExpression: true,
						value: '$(local:input)',
					},
				},
				style: {
					color: 0x000000,
					bgcolor: 0x00ff00,
				},
			},
			{
				feedbackId: 'program_active',
				options: {
					value: {
						isExpression: true,
						value: '$(local:input)',
					},
				},
				style: {
					color: 0xffffff,
					bgcolor: 0xff0000,
				},
			},
		],
	}

	for (let i = 1; i <= 8; i++) {
		const id = `camera_${i}`
		presets[id] = {
			type: 'simple',
			name: `Camera ${i}`,
			style: {
				text: `Cam ${i}`,
				size: '18',
				color: 0xffffff,
				bgcolor: 0x000000,
			},
			steps: [
				{
					down: [
						{
							actionId: 'set_preview',
							options: {
								value: i,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'connected',
					options: {},
					style: {
						color: 0x000000,
						bgcolor: 0xb8b8b8,
					},
				},
				{
					feedbackId: 'preview_active',
					options: {
						value: i,
					},
					style: {
						color: 0x000000,
						bgcolor: 0x00ff00,
					},
				},
				{
					feedbackId: 'program_active',
					options: {
						value: i,
					},
					style: {
						color: 0xffffff,
						bgcolor: 0xff0000,
					},
				},
			],
		}

		const def = structure[0].definitions.find(
			(def) => typeof def !== 'string' && def.id === 'cameras' && def.type === 'simple',
		)
		if (def && typeof def !== 'string' && def.type === 'simple') {
			def.presets.push(id)
		}
	}

	self.setPresetDefinitions(structure, presets)
}
