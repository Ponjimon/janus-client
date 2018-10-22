import merge from 'deepmerge';
import { PluginHandle } from '../plugin-handle';
import { getProp } from '../../utils/get-prop';
import { PluginResponse } from '../../client/response';
import { VideoRoom, Participant, Publisher } from '../../janus.types';

export enum ParticipantType {
    publisher = 'publisher',
    subscriber = 'subscriber',
}

export interface DefaultResponse {
    response: PluginResponse;
}

export interface CreateResponse extends DefaultResponse {
    room: number;
}

export interface ExistsResponse extends DefaultResponse {
    exists: boolean;
}

export interface RTPStream {
    host: string;
    audio: number;
    audio_rtcp: number;
    audio_stream_id?: number;
    video: number;
    video_rtcp: number;
    video_stream_id: number;
    video_2: number;
    video_stream_id_2: number;
    video_3: number;
    video_stream_id_3: number;
    data: number;
    data_stream_id: number;
}

export interface RTPForwarder {
    audio_stream_id: number;
    video_stream_id: number;
    data_stream_id: number;
    ip: string;
    port: number;
    rtcp_port: number;
    ssrc: any;
    pt: any;
    substream: any;
    srtp: boolean;
}

export interface VideoRoomData {
    videoroom:
        | 'event'
        | 'created'
        | 'destroyed'
        | 'edited'
        | 'success'
        | 'participants'
        | 'joined'
        | 'rtp_forward'
        | 'forwarders'
        | 'stop_rtp_forward'
        | 'attached';
    room?: number;
    permanent?: boolean;
    error_code?: number;
    error?: string;
    exists?: boolean;
    allowed?: string[];
    rooms?: VideoRoom[];
    participants?: Participant[];
    publishers?: Publisher[];
    joining?: { id: string; display?: string };
    configured?: string;
    unpublished?: string;
    rtp_stream?: RTPStream;
    publisher_id?: number;
    stream_id?: number;
    rtp_forwarders?: Array<{
        publisher_id: number;
        rtp_forwarders: RTPForwarder[];
    }>;
    leaving?: string;
    feed?: string;
    display?: string;
    started?: string;
    paused?: string;
    switched?: string;
    id?: string;
}

export enum VideoRoomEventType {
    event = 'event',
    created = 'created',
    destroyed = 'destroyed',
    edited = 'edited',
    success = 'success',
    participants = 'participants',
    joined = 'joined',
    rtp_forward = 'rtp_forward',
    forwarders = 'forwarders',
    stop_rtp_forward = 'stop_rtp_forward',
    attached = 'attached',
}

export interface VideoRoomBase {
    videoroom:
        | 'event'
        | 'created'
        | 'destroyed'
        | 'edited'
        | 'success'
        | 'participants'
        | 'joined'
        | 'rtp_forward'
        | 'forwarders'
        | 'stop_rtp_forward'
        | 'attached';
}

export enum AudioCodec {
    opus = 'opus',
    g722 = 'g722',
    pcmu = 'pcmu',
    pcma = 'pcma',
    isac32 = 'isac32',
    isac16 = 'isac16',
}

export enum VideoCodec {
    vp8 = 'vp8',
    vp9 = 'vp9',
    h264 = 'h264',
}

export interface RequestCreate {
    request: 'create';
    room?: number;
    permanent?: boolean;
    description?: string;
    secret?: string;
    pin?: string;
    is_private?: boolean;
    allowed?: string[];
    require_pvtid?: boolean;
    publishers?: number;
    bitrate?: number;
    fir_freq?: number;
    audiocodec?: AudioCodec;
    videocodec?: VideoCodec;
    video_svc?: boolean;
    audiolevel_ext?: boolean;
    audiolevel_event?: boolean;
    audio_active_packets?: number;
    audio_level_average?: number;
    videoorient_ext?: boolean;
    playoutdelay_ext?: boolean;
    transport_wide_cc_ext?: boolean;
    record?: boolean;
    rec_dir?: string;
    notify_joining?: boolean;
}

export interface ResponseCreate {
    videoroom: VideoRoomEventType.created;
    room: number;
    permanent: boolean;
}

export interface VideoRoomEvent {
    videoroom: VideoRoomEventType.event;
}

export interface VideoRoomError extends VideoRoomEvent {
    error_code: number;
    error: string;
}

export interface RequestEdit {
    request: 'edit';
    room: number;
    secret?: string;
    new_description?: string;
    new_secret?: string;
    new_pin?: string;
    new_is_private?: boolean;
    new_require_pvtid?: boolean;
    new_bitrate?: number;
    new_fir_freq?: number;
    new_publishers?: number;
    permanent?: boolean;
}

export interface ResponseEdit {
    videoroom: VideoRoomEventType.edited;
    room: number;
}

export interface RequestDestroy {
    request: 'destroy';
    room: number;
    secret?: string;
    permanent?: boolean;
}

export interface ResponseDestroy {
    videoroom: VideoRoomEventType.destroyed;
    room: number;
}

export interface RequestExists {
    request: 'exists';
    room: number;
}

export interface ResponseExists {
    videoroom: VideoRoomEventType.success;
    room: number;
    exists: boolean | 'true' | 'false';
}

export interface RequestAllowed {
    request: 'allowed';
    secret?: string;
    action: 'enable' | 'disable' | 'add' | 'remove';
    room: number;
    allowed?: string[];
}

export interface ResponseAllowed {
    videoroom: VideoRoomEventType.success;
    room: number;
    allowed: string[];
}

export interface RequestKick {
    request: 'kick';
    secret?: string;
    room: number;
    id: number;
}

export interface ResponseKick {
    videoroom: VideoRoomEventType.success;
}

export interface RequestList {
    request: 'list';
}

export interface ResponseList {
    videoroom: VideoRoomEventType.success;
    rooms: VideoRoom[];
}

export interface RequestListParticipants {
    request?: 'listparticipants';
    room: number;
}

export interface ResponseListParticipants {
    videoroom: VideoRoomEventType.participants;
    room: number;
    participants: Participant[];
}

export interface RequestJoin {
    request?: 'join';
    ptype?: 'subscriber' | 'publisher';
    room: number;
    id?: number;
    display?: string;
    token?: string;
    feed?: number;
    private_id?: number;
    close_pc?: boolean;
    audio?: boolean;
    video?: boolean;
    data?: boolean;
    offer_audio?: boolean;
    offer_video?: boolean;
    offer_data?: boolean;
}

export interface RequestJoinSubscriber {
    request?: 'join';
    ptype?: 'subscriber';
    room: number;
    feed: number;
    private_id?: number;
    close_pc?: boolean;
    audio?: boolean;
    video?: boolean;
    data?: boolean;
    offer_audio?: boolean;
    offer_video?: boolean;
    offer_data?: boolean;
}

export interface RequestJoinPublisher {
    request?: 'join';
    ptype?: 'publisher';
    room: number;
    id?: number;
    display?: string;
    token?: string;
    jsep: {
        type: 'offer';
        sdp: string;
    };
}

export interface ResponseJoinPublisher {
    videoroom: VideoRoomEventType.joined;
    room: number;
    description?: string;
    id: number;
    private_id: number;
    publishers: Publisher[];
}

export interface VideoRoomJoining extends VideoRoomEvent {
    room: number;
    joining: { id: number; display?: string };
}

export interface RequestPublish {
    request?: 'publish';
    audio?: boolean;
    video?: boolean;
    data?: boolean;
    audiocodec?: AudioCodec;
    videocodec?: VideoCodec;
    bitrate?: number;
    record?: boolean;
    filename?: string;
    display?: string;
}

export interface ResponsePublish extends VideoRoomEvent {
    configured: 'ok';
}

export interface OnPublish extends VideoRoomEvent {
    room: number;
    publishers: Publisher[];
}

export interface RequestUnpublish {
    request?: 'unpublish';
}

export interface ResponseUnpublish extends VideoRoomEvent {
    unpublished: 'ok';
}

export interface OnUnpublish extends VideoRoomEvent {
    room: number;
    unpublished: number;
}

export interface RequestConfigure {
    request?: 'configure';
    audio?: boolean;
    video?: boolean;
    data?: boolean;
    bitrate?: number;
    keyframe?: boolean;
    record?: boolean;
    filename?: string;
    display?: string;
}

export interface ResponseConfigure extends VideoRoomEvent {
    configured: 'ok';
}

export interface RequestRTPForward {
    request?: 'rtp_forward';
    room: number;
    publisher_id: number;
    host: string;
    audio_port: number;
    audio_ssrc?: number;
    audio_pt?: number;
    audio_rtcp_port?: number;
    video_port: number;
    video_ssrc?: number;
    video_pt?: number;
    video_rtcp_port?: number;
    video_port_2?: number;
    video_ssrc_2?: number;
    video_pt_2?: number;
    video_port_3?: number;
    video_ssrc_3?: number;
    video_pt_3?: number;
    data_port: number;
    srtp_suite?: number;
    srtp_crypto?: string;
}

export interface ResponseRTPForward {
    videoroom: VideoRoomEventType.rtp_forward;
    room: number;
    publisher_id: number;
    rtp_stream: RTPStream;
}

export interface RequestStopRTPForward {
    request?: 'stop_rtp_forward';
    room: number;
    publisher_id: number;
    stream_id: number;
}

export interface ResponseStopRTPForward {
    videoroom: VideoRoomEventType.stop_rtp_forward;
    room: number;
    publisher_id: number;
    stream_id: number;
}

export interface RequestListForwarders {
    request?: 'listforwarders';
    room: number;
    secret?: string;
}

export interface ResponseListForwarders {
    videoroom: VideoRoomEventType.forwarders;
    room: number;
    rtp_forwarders: RTPForwarder[];
}

export interface RequestLeave {
    request?: 'leave';
}

export interface ResponseLeave extends VideoRoomEvent {
    leaving: 'ok';
}

export interface ResponseLeft extends VideoRoomEvent {
    left: 'ok';
}

export interface OnLeaving extends VideoRoomEvent {
    room: number;
    leaving?: number;
    unpublished?: number;
}

export interface OnAttached {
    videoroom: VideoRoomEventType.attached;
    room: number;
    feed: number;
    display?: string;
}

export interface RequestStart {
    request?: 'start';
    room: number;
    feed: number;
    jsep: {
        type: 'answer';
        sdp: string;
    };
}

export interface ResponseStart extends VideoRoomEvent {
    started: 'ok';
}

export interface RequestPause {
    request?: 'pause';
}

export interface ResponsePause extends VideoRoomEvent {
    paused: 'ok';
}

export interface RequestConfigureSubscriber {
    request?: 'configure';
    audio?: boolean;
    video?: boolean;
    data?: boolean;
    substream?: number;
    temporal?: number;
    spatial_layer?: number;
    temporal_layer?: number;
}

export interface RequestSwitch {
    request?: 'switch';
    feed: number;
    audio?: boolean;
    video?: boolean;
    data?: boolean;
}

export interface ResponseSwitch extends VideoRoomEvent {
    switched: 'ok';
    room: number;
    id: number;
}

export interface VideoRoomDataWithRTPForward extends VideoRoomData {
    host: string;
    publisher_id: number;
    audio_port: number;
    audio_ssrc: number;
    audio_pt: number;
    audio_rtcp_port: number;
    video_port: number;
    video_ssrc: number;
    video_pt: number;
    video_rtcp_port: number;
    video_port_2: number;
    video_ssrc_2: number;
    video_pt_2: number;
    video_port_3: number;
    video_ssrc_3: number;
    video_pt_3: number;
    data_port: number;
    srtp_suite?: number;
    srtp_crypto?: number;
}

export class VideoRoomHandle extends PluginHandle {
    constructor(options) {
        super(options);
    }

    public create(options: RequestCreate): Promise<CreateResponse> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'create',
                },
                options
            );
            this.requestMessage(message)
                .then(res => {
                    resolve({
                        room: res.getData<ResponseCreate>().room,
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public destroy(options: RequestDestroy): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'destroy',
                },
                options
            );
            this.requestMessage(message)
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public exists(options): Promise<ExistsResponse> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'exists',
                },
                options
            );
            this.requestMessage(message)
                .then(res => {
                    resolve({
                        exists:
                            res.getData<ResponseExists>().exists === 'true' ||
                            res.getData<ResponseExists>().exists === true,
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public list(): Promise<{ response: PluginResponse; rooms: VideoRoom[] }> {
        return new Promise((resolve, reject) => {
            this.requestMessage({
                request: 'list',
            })
                .then(res => {
                    resolve({
                        rooms: res.getData<ResponseList>().rooms || [],
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public listParticipants(
        options: RequestListParticipants
    ): Promise<{ response: PluginResponse; participants: Participant[] }> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'listparticipants',
                },
                options
            );
            this.requestMessage(message)
                .then(res => {
                    resolve({
                        participants:
                            res.getData<ResponseListParticipants>()
                                .participants || [],
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public join(
        options: RequestJoin
    ): Promise<{ response: PluginResponse; id: number; jsep: any }> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'join',
                },
                options
            );
            this.requestMessage(message, {
                ack: true,
            })
                .then(res => {
                    resolve({
                        id: res.getData<ResponseJoinPublisher>().id,
                        jsep: res.getJsep(),
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public joinPublisher(
        options: RequestJoinPublisher
    ): Promise<{ response: PluginResponse; id: number; jsep: any }> {
        return new Promise((resolve, reject) => {
            const joinOptions = merge(
                {
                    ptype: ParticipantType.publisher,
                },
                options
            );
            this.join(joinOptions)
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public joinSubscriber(
        options: RequestJoinSubscriber
    ): Promise<{ response: PluginResponse; id: number; jsep: any }> {
        return new Promise((resolve, reject) => {
            const joinOptions = merge(
                {
                    ptype: ParticipantType.subscriber,
                },
                options
            );
            this.join(joinOptions)
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public configure(options: RequestConfigure): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            options.audio = getProp(options, 'audio', true);
            options.video = getProp(options, 'video', true);
            const message = merge(
                {
                    request: 'configure',
                },
                options
            );
            this.requestMessage(message, {
                ack: true,
            })
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public joinAndConfigure(
        options: RequestJoinPublisher
    ): Promise<{
        response: PluginResponse;
        id: number;
        jsep: any;
        publishers: Publisher[];
    }> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'joinandconfigure',
                    ptype: 'publisher',
                },
                options
            );
            this.requestMessage(message, {
                ack: true,
            })
                .then(res => {
                    resolve({
                        id: res.getData<ResponseJoinPublisher>().id,
                        jsep: res.getJsep(),
                        publishers: res.getData<ResponseJoinPublisher>()
                            .publishers,
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public publish(options: RequestPublish): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'publish',
                },
                options
            );
            this.requestMessage(message, {
                ack: true,
            })
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public unpublish(): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            this.requestMessage(
                {
                    request: 'unpublish',
                } as RequestUnpublish,
                {
                    ack: true,
                }
            )
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public start(options: RequestStart): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'start',
                },
                options
            );
            this.requestMessage(message, {
                ack: true,
            })
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    /**
     * Note: Documented at https://janus.conf.meetecho.com/docs/janus__videoroom_8c.html,
     * but get error "423 Unknown request".
     * @deprecated
     */
    public pause(): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            this.requestMessage(
                {
                    request: 'pause',
                } as RequestPause,
                {
                    ack: true,
                }
            )
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public switch(options: RequestSwitch): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'switch',
                },
                options
            );
            this.requestMessage(message, {
                ack: true,
            })
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    /**
     * Note: Documented at https://janus.conf.meetecho.com/docs/janus__videoroom_8c.html,
     * but get error "423 Unknown request".
     * @deprecated
     */
    public stop(): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            this.requestMessage(
                {
                    request: 'stop',
                },
                {
                    ack: true,
                }
            )
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public add(options): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'add',
                },
                options
            );
            this.requestMessage(message, {
                ack: true,
            })
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public remove(options): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            const message = merge(
                {
                    request: 'remove',
                },
                options
            );
            this.requestMessage(message, {
                ack: true,
            })
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public leave(): Promise<DefaultResponse> {
        return new Promise((resolve, reject) => {
            this.requestMessage(
                {
                    request: 'leave',
                } as RequestLeave,
                {
                    ack: true,
                }
            )
                .then(res => {
                    resolve({
                        response: res,
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public publishFeed(
        options: RequestJoinPublisher
    ): Promise<{
        response: PluginResponse;
        id: number;
        jsep: any;
        publishers: Publisher[];
    }> {
        return new Promise((resolve, reject) => {
            this.joinAndConfigure(options)
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public subscribeFeed(
        options: RequestJoinSubscriber
    ): Promise<{ response: PluginResponse; id: number; jsep: any }> {
        return this.joinSubscriber(options);
    }
}
