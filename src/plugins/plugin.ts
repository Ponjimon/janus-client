import { Session } from '../session';

export class Plugin {
    public name: string;
    public fullName: string;
    public session: Session;
    public handles: Map<string, any>;

    constructor(options) {
        options = options || {};
        this.name = options.name;
        this.fullName = options.fullName;
        this.session = options.session;
        this.handles = new Map();
    }

    public getName(): string {
        return this.name;
    }

    public getFullName(): string {
        return this.fullName;
    }

    public getSession(): Session {
        return this.session;
    }

    public setSession(session): void {
        this.session = session;
    }

    public addHandle(handle): void {
        this.handles.set(handle.getId(), handle);
    }

    public hasHandle(id: string): boolean {
        return this.handles.has(id);
    }

    public getHandle(id: string): any {
        return this.handles.get(id);
    }

    public removeHandle(id): void {
        this.handles.delete(id);
    }

    public createHandle(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.getSession()
                .createPluginHandle(this.getFullName())
                .then(handleId => {
                    resolve(handleId);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public destroyHandle(handle): Promise<void> {
        return this.destroyHandleById(handle.getId());
    }

    public destroyHandleById(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.hasHandle(id)) {
                const handle = this.getHandle(id);
                handle
                    .detach()
                    .then(() => {
                        this.removeHandle(id);
                        resolve();
                    })
                    .catch(err => {
                        this.removeHandle(id);
                        reject(err);
                    });
            } else {
                this.removeHandle(id);
                reject(new Error('Invalid handle id ' + id));
            }
        });
    }
}
