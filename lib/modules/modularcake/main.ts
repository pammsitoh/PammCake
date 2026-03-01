import { DataDrivenEntityTriggerAfterEvent, EntityDieAfterEvent, EntityHitEntityAfterEvent, EntityLoadAfterEvent, EntitySpawnAfterEvent, ItemUseAfterEvent, PlayerBreakBlockAfterEvent, PlayerEmoteAfterEvent, PlayerInteractWithBlockAfterEvent, PlayerInteractWithEntityAfterEvent, PlayerJoinAfterEvent, PlayerLeaveAfterEvent, PlayerSpawnAfterEvent, ProjectileHitEntityAfterEvent, ScriptEventCommandMessageAfterEvent, StartupEvent, System, system, world, WorldLoadAfterEvent } from "@minecraft/server";
export class CakeModule {
    constructor( name : string ) {}
    onLoad() {}
    onUpdate() {}
    onWorldLoad?(event: WorldLoadAfterEvent): void;
    onStartup?(event: StartupEvent): void;
    onPlayerBreakBlockAfter?(event: PlayerBreakBlockAfterEvent): void;
    onPlayerSpawn?(event: PlayerSpawnAfterEvent): void;
    onPlayerEmoteAfter?(event: PlayerEmoteAfterEvent): void;
    onPlayerInteractWithEntity?(event: PlayerInteractWithEntityAfterEvent): void;
    onPlayerInteractWithBlock?(event: PlayerInteractWithBlockAfterEvent): void;
    onPlayerJoin?(event: PlayerJoinAfterEvent): void;
    onPlayerLeave?(event: PlayerLeaveAfterEvent): void;
    onEntityDie?(event: EntityDieAfterEvent): void;
    onEntityHitEntity?(event: EntityHitEntityAfterEvent): void;
    onItemUse?(event: ItemUseAfterEvent): void;
    onEntityLoad?(event: EntityLoadAfterEvent): void;
    onDataDrivenEntityTrigger?(event: DataDrivenEntityTriggerAfterEvent): void;
    onScriptEvent?(event: ScriptEventCommandMessageAfterEvent): void;
    onEntitySpawn?(event: EntitySpawnAfterEvent): void;
    onProjectileHitEntity?(event: ProjectileHitEntityAfterEvent): void;
}

class ModularCake {
    modules : CakeModule[];
    constructor() {
        this.modules = [];

        system.runInterval(() => {
            for (const module of this.modules) {
                if (module.onUpdate) {
                    module.onUpdate();
                }
            }
        }, 1); // 20 ticks = 1 second

        this.registerEvents();
    }

    start( event: StartupEvent ) {
        for (const module of this.modules) {
            module.onLoad();
            module.onStartup?.(event);
        }
    }

    registerModule( module : CakeModule ) {
        this.modules.push(module);
    }

    registerEvents() {
        const events = {
            playerBreakBlock: "onPlayerBreakBlockAfter",
            playerSpawn: "onPlayerSpawn",
            playerEmote: "onPlayerEmoteAfter",
            playerJoin: "onPlayerJoin",
            playerLeave: "onPlayerLeave",
            entityDie: "onEntityDie",
            itemUse: "onItemUse",
            entityLoad: "onEntityLoad",
            dataDrivenEntityTrigger: "onDataDrivenEntityTrigger",
            entityHitEntity: "onEntityHitEntity",
            playerInteractWithEntity: "onPlayerInteractWithEntity",
            playerInteractWithBlock: "onPlayerInteractWithBlock",
            entitySpawn: "onEntitySpawn",
            projectileHitEntity: "onProjectileHitEntity",
            worldLoad: "onWorldLoad"
        };

        for (const [eventName, methodName] of Object.entries(events)) {
            (world.afterEvents as any)[eventName].subscribe((event: any) => {
                for (const module of this.modules) {
                    (module[methodName as keyof CakeModule] as Function)?.(event)
                }
            });
        }

        system.afterEvents.scriptEventReceive.subscribe((event: any) => {
            for (const module of this.modules) {
                (module.onScriptEvent as Function)?.(event);
            }
        });
    }
}

export const MCake = new ModularCake();