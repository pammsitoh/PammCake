

interface UI_reng {
	texts: string;
	isTranslate?: boolean;
}
export class UI_Info {
	texts: UI_reng[] = [];
	composite() {
		const str = [];
		for (let i = 0; i < this.texts.length; i++) {
			const t = this.texts[i];
			if (t.isTranslate) {
				str.push({ translate: t.texts });
			} else {
				str.push({ text: t.texts });
			}
			if (i < this.texts.length - 1) {
				str.push({ text: "\n§r" });
			}
		}
		return str;
	}
	addText(text: string, isTranslate?: boolean) {
		this.texts.push({ texts: text, isTranslate: isTranslate });
	}
}

//EJEMPLO DE USO EN ACTIONBAR:

// export function showDataDebugToPlayer() {
//     for (const player of world.getPlayers({ tags: ["debug"] })) {
//         const text = show_debug_data(player);
//         if (text) {
//             player.onScreenDisplay.setActionBar(text);
//         }
//     }
// }
// /**devulve la interfaz del usuario por renglones */
// function show_debug_data(player: Player): {} | undefined {
//     const ui = new UI_Info();
//     ui.addText(`§aTExto1`);
//     ui.addText(`§aTExto2`);
//     if (player.hasTag("debug")) {
//         ui.addText(`§aTExto debug`);
//     }
//     //si quieres usar un tranlate key
//     ui.addText(`finearts:translate_key_example`, true);
//
//     return ui.composite();
// }
