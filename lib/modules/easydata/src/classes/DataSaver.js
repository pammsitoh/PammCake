import { world } from "@minecraft/server";
export class DataSaver {
    unique_key;
    constructor(key) {
        this.unique_key = key;
    }
    /** @description Guarda un JSON en el mundo */
    saveData(id, value) {
        const tostr = JSON.stringify(value, null, 4);
        world.setDynamicProperty(`${this.unique_key}>::<${id}`, tostr);
    }
    /** @description Obtiene un JSON como dato guardado del mundo */
    getData(id) {
        const dataStr = world.getDynamicProperty(`${this.unique_key}>::<${id}`);
        if (typeof dataStr != 'string')
            return { data: "none" };
        const toJson = JSON.parse(dataStr);
        return toJson;
    }
    /** @description Guarda un JSON en un jugador */
    saveOnPlayer(player, id, value) {
        const tostr = JSON.stringify(value, null, 4);
        player.setDynamicProperty(`${this.unique_key}>::<${id}`, tostr);
    }
    /** @description Obtiene un JSON guardado en un jugador */
    getFromPlayer(player, id) {
        const dataStr = player.getDynamicProperty(`${this.unique_key}>::<${id}`);
        if (typeof dataStr != 'string')
            return { data: "none" };
        const toJson = JSON.parse(dataStr);
        return toJson;
    }
}
