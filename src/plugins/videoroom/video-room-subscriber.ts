import { VideoRoomHandle } from './video-room-handle';

export class VideoRoomSubscriber extends VideoRoomHandle {
    public room: number;
    public feed: number;
    public offer: any;

    constructor(options) {
        super(options);
        this.room = options.room;
        this.feed = options.feed;
        this.offer = null;
    }

    public getRoom(): number {
        return this.room;
    }

    public getFeed(): number {
        return this.feed;
    }

    public getOffer(): any {
        return this.offer;
    }

    public createOffer(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.subscribeFeed({
                room: this.getRoom(),
                feed: this.getFeed(),
            })
                .then(result => {
                    this.offer = result.jsep.sdp;
                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public setRemoteAnswer(answer): Promise<void> {
        return new Promise((resolve, reject) => {
            answer = answer.replace(/a=(sendrecv|sendonly)/, 'a=recvonly');
            this.start({
                room: this.getRoom(),
                feed: this.getFeed(),
                jsep: {
                    type: 'answer',
                    sdp: answer,
                },
            })
                .then(() => {
                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
}
