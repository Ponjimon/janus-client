import { EventEmitter } from 'events';
import { VideoRoomPlugin } from './plugins/videoroom';
import * as DebugLogger from 'debug-logger';
import { Client } from './client';
import { ClientResponse } from './client/response';
import { getProp } from './utils/get-prop';

const logger = DebugLogger('janus:client');

export const State = {
    alive: 'alive',
    dying: 'dying',
    dead: 'dead',
};

export class Session {
    public id: string;
    public janus: Client;
    public keepAliveTimer: NodeJS.Timer;
    public keepAliveInterval: number;
    public keepAliveFails: number;
    public keepAliveFailCount: number;
    public emitter: EventEmitter;
    public state: string;
    public videoRoomPlugin: VideoRoomPlugin;

    constructor(id, janus) {
        this.id = id;
        this.janus = janus;
        this.keepAliveTimer = null;
        this.keepAliveInterval = 30000;
        this.keepAliveFails = 2;
        this.keepAliveFailCount = 0;
        this.emitter = new EventEmitter();
        this.state = this.janus.isConnected() ? State.alive : State.dead;
        this.startKeepAlive();
        this.videoRoomPlugin = new VideoRoomPlugin({ session: this });
    }

    public keepAlive(): Promise<any> {
        return this.janus.request({
            janus: 'keepalive',
            session_id: this.id,
        });
    }

    public startKeepAlive(): void {
        this.stopKeepAlive();
        this.keepAliveTimer = setInterval(() => {
            this.keepAlive()
                .then(() => {
                    this.keepAliveFailCount = 0;
                    this.state = State.alive;
                    this.emitter.emit('keepalive', true);
                })
                .catch(() => {
                    this.keepAliveFailCount++;
                    this.state = State.dying;
                    this.emitter.emit('keepalive', false);
                    if (this.keepAliveFailCount === this.keepAliveFails) {
                        this.state = State.dead;
                        this.timeout();
                    }
                });
        }, this.keepAliveInterval);
    }

    public stopKeepAlive(): void {
        if (this.keepAliveTimer !== null) {
            clearInterval(this.keepAliveTimer);
        }
    }

    public request(obj, options?): Promise<ClientResponse> {
        this.startKeepAlive();
        obj.session_id = this.id;
        return this.janus.request(obj, options);
    }

    public createPluginHandle(plugin): Promise<string> {
        return new Promise((resolve, reject) => {
            this.request({
                janus: 'attach',
                plugin,
            })
                .then(res => {
                    const handleId = getProp(
                        res.getResponse(),
                        'data.id',
                        null
                    );
                    if (handleId !== null) {
                        logger.info(
                            'Created handle plugin=%s handle=%s',
                            plugin,
                            handleId
                        );
                        resolve(handleId);
                    } else {
                        reject(new Error('Handle not created properly'));
                    }
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public getId(): string {
        return this.id;
    }

    public getState(): string {
        return this.state;
    }

    public isAlive(): boolean {
        return this.state === State.alive;
    }

    public timeout(): void {
        this.destroy();
        this.emitter.emit('timeout');
    }

    public onTimeout(listener): void {
        this.emitter.on('timeout', listener);
    }

    public onKeepAlive(listener): void {
        this.emitter.on('keepalive', listener);
    }

    public onError(listener): void {
        this.emitter.on('error', listener);
    }

    public onEvent(listener): void {
        this.emitter.on('event', listener);
    }

    public event(event): void {
        if (this.videoRoomPlugin.hasHandle(event.sender)) {
            this.videoRoomPlugin.getHandle(event.sender).event(event);
        } else {
            this.emitter.emit('event', event);
        }
    }

    public destroy(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.stopKeepAlive();
            this.janus
                .destroySession(this.getId())
                .then(() => {
                    this.janus = null;
                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public videoRoom(): VideoRoomPlugin {
        return this.videoRoomPlugin;
    }
}
