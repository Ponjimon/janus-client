import { VideoRoomHandle } from './video-room-handle';

export class VideoRoomPublisher extends VideoRoomHandle {
    private publisherId: number;
    private room: number;
    private answer: string;

    constructor(options) {
        super(options);
        this.publisherId = null;
        this.room = options.room;
        this.answer = null;
    }

    public getPublisherId(): number {
        return this.publisherId;
    }

    public getRoom(): number {
        return this.room;
    }

    public getAnswer(): string {
        return this.answer;
    }

    public createAnswer(offer): Promise<void> {
        return new Promise((resolve, reject) => {
            this.publishFeed({
                room: this.getRoom(),
                jsep: {
                    type: 'offer',
                    sdp: offer,
                },
            })
                .then(result => {
                    this.publisherId = result.id;
                    this.answer = result.jsep.sdp;
                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
}
