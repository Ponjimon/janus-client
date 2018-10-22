export interface JanusError {
    code: number;
    reason: string;
}

export interface JanusTransport {
    name: string;
    author: string;
    description: string;
    version_string: string;
    version: number;
}

export interface JanusPlugin {
    name: string;
    author: string;
    description: string;
    version_string: string;
    version: number;
}

export interface VideoRoom {
    room: number;
    description: string;
    pin_required: boolean;
    max_publishers: number;
    bitrate: number;
    bitrate_cap: boolean;
    fir_freq: number;
    audiocodec: string;
    videocodec: string;
    record: string;
    record_dir?: string;
    num_participants: number;
}

export interface Participant {
    id: number;
    display?: string;
    talking: boolean;
    publisher: string | boolean;
    internal_audio_ssrc: any;
    internal_video_ssrc: any;
}

export interface Publisher {
    id: number;
    display?: string;
    audio_codec: any;
    video_codec: any;
    talking: boolean;
}

export interface PluginData {
    plugin: string;
    data: {
        videoroom: string;
        description?: string;
        id?: number;
        error_code?: number;
        error?: string;
        room?: number;
        exists?: string;
        list?: VideoRoom[];
        participants?: Participant[];
        publishers?: Participant[];
    };
}
export interface JanusResponse {
    janus: string;
    sender?: string;
    error?: JanusError;
    session_id?: string;
    transaction?: any;
    data?: { id: number };
    name?: string;
    version?: number;
    version_string?: string;
    author?: string;
    'log-to-stdout'?: string;
    'log-to-file'?: string;
    data_channels?: string;
    'server-name'?: string;
    'local-ip'?: string;
    ipv6?: string;
    'ice-tcp'?: string;
    api_secret?: string;
    auth_token?: string;
    transports?: { [key: string]: JanusTransport };
    plugins?: { [key: string]: JanusPlugin };
    plugindata?: PluginData;
    jsep?: {
        type: string;
        sdp: string;
    };
}
