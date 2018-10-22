import { VideoRoomHandle } from './video-room-handle';
import { Plugin } from '../plugin';
import { VideoRoomSubscriber } from './video-room-subscriber';
import { VideoRoomPublisher } from './videor-room-publisher';

export const AudioCodec = {
    opus: 'opus',
    isac32: 'isac32',
    isac16: 'isac16',
    pcmu: 'pcmu',
    pcma: 'pcma',
    g722: 'g722',
};

export const VideoCodec = {
    vp8: 'vp8',
    vp9: 'vp9',
    h264: 'h264',
};

export class VideoRoomPlugin extends Plugin {
    public $defaultHandle: VideoRoomHandle;
    constructor(options) {
        super(options);
        this.name = 'videoroom';
        this.fullName = 'janus.plugin.' + this.name;
        this.session = options.session;
        this.$defaultHandle = null;
    }

    public defaultHandle(): Promise<VideoRoomHandle> {
        return new Promise((resolve, reject) => {
            if (this.$defaultHandle === null) {
                this.createVideoRoomHandle()
                    .then(handle => {
                        this.$defaultHandle = handle;
                        resolve(this.$defaultHandle);
                    })
                    .catch(err => {
                        reject(err);
                    });
            } else {
                resolve(this.$defaultHandle);
            }
        });
    }

    public createVideoRoomHandle(): Promise<VideoRoomHandle> {
        return new Promise((resolve, reject) => {
            this.createHandle()
                .then(id => {
                    this.addHandle(
                        new VideoRoomHandle({
                            id,
                            plugin: this,
                        })
                    );
                    resolve(this.getHandle(id));
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public createPublisherHandle(room): Promise<VideoRoomHandle> {
        return new Promise((resolve, reject) => {
            this.createHandle()
                .then(id => {
                    this.addHandle(
                        new VideoRoomPublisher({
                            id,
                            plugin: this,
                            room,
                        })
                    );
                    resolve(this.getHandle(id));
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public createListenerHandle(room, feed?): Promise<VideoRoomHandle> {
        return new Promise((resolve, reject) => {
            this.createHandle()
                .then(id => {
                    this.addHandle(
                        new VideoRoomSubscriber({
                            id,
                            plugin: this,
                            room,
                            feed,
                        })
                    );
                    resolve(this.getHandle(id));
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public publishFeed(room, offer): Promise<VideoRoomHandle> {
        return new Promise((resolve, reject) => {
            var handle = null;
            Promise.resolve()
                .then(() => {
                    return this.createPublisherHandle(room);
                })
                .then(createdHandle => {
                    handle = createdHandle;
                    return handle.createAnswer(offer);
                })
                .then(() => {
                    resolve(handle);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public subscriberFeed(room): Promise<VideoRoomHandle> {
        return new Promise((resolve, reject) => {
            var handle = null;
            Promise.resolve()
                .then(() => {
                    return this.createListenerHandle(room);
                })
                .then(createdHandle => {
                    handle = createdHandle;
                    return handle.createOffer();
                })
                .then(() => {
                    resolve(handle);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    /**
     * Returns an array of publisher ids of a given room.
     * @param room Room number
     * @returns {Promise}
     */
    public getFeeds(room: number): Promise<number[]> {
        return new Promise((resolve, reject) => {
            const feeds = [];
            Promise.resolve()
                .then(() => {
                    return this.defaultHandle();
                })
                .then(handle => {
                    return handle.listParticipants({ room });
                })
                .then(result => {
                    if (result.participants.length > 0) {
                        for (const participant of result.participants) {
                            if (
                                participant.publisher === 'true' ||
                                participant.publisher === true
                            ) {
                                feeds.push(participant.id);
                            }
                        }
                    }
                    resolve(feeds);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public getFeedsExclude(room: number, feed: any): Promise<number[]> {
        return new Promise((resolve, reject) => {
            this.getFeeds(room)
                .then(feeds => {
                    resolve(feeds.filter($feed => $feed !== feed));
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
}
