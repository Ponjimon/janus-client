import { ClientResponse } from '../src/client/response';
import { PluginResponse } from '../src/client/response';
import JanusResponse from '../src/mock/janus-response';

describe('Response', () => {
    describe('ClientResponse', () => {
        it('should return request and response', done => {
            const createSessionReq = {
                janus: 'create',
                transaction: '1234567890',
            };
            const createSessionRes = JanusResponse.session.create(
                createSessionReq
            );
            const clientResponse = new ClientResponse(
                createSessionReq,
                createSessionRes
            );
            // deep equal?
            expect(clientResponse.getRequest()).toEqual(createSessionReq);
            expect(clientResponse.getResponse()).toEqual(createSessionRes);
            done();
        });

        it('should check whether the response is a success response', done => {
            const createSessionReq = {
                janus: 'create',
                transaction: '1234567890',
            };
            const createSessionRes = JanusResponse.session.create(
                createSessionReq
            );
            const clientResponse = new ClientResponse(
                createSessionReq,
                createSessionRes
            );
            expect(clientResponse.getType()).toBe('success');
            expect(clientResponse.isSuccess()).toBe(true);
            expect(clientResponse.isAck()).toBe(false);
            expect(clientResponse.isError()).toBe(false);
            done();
        });

        it('should check whether the response is a ack response', done => {
            const keepAliveReq = {
                janus: 'keepalive',
                transaction: '1234567890',
            };
            const keepAliveRes = JanusResponse.session.keepAlive(keepAliveReq);
            const clientResponse = new ClientResponse(
                keepAliveReq,
                keepAliveRes
            );
            expect(clientResponse.getType()).toBe('ack');
            expect(clientResponse.isSuccess()).toBe(false);
            expect(clientResponse.isAck()).toBe(true);
            expect(clientResponse.isError()).toBe(false);
            done();
        });

        it('should check whether the response is a error response', done => {
            const createSessionReq = {
                janus: 'create',
                transaction: '1234567890',
            };
            const errRes = JanusResponse.error.general.unauthorized(
                createSessionReq
            );
            const clientResponse = new ClientResponse(createSessionReq, errRes);
            expect(clientResponse.getType()).toBe('error');
            expect(clientResponse.isSuccess()).toBe(false);
            expect(clientResponse.isAck()).toBe(false);
            expect(clientResponse.isError()).toBe(true);
            done();
        });
    });

    describe('PluginResponse', () => {
        it('should return plugin name and data', () => {
            const createRoomReq = {
                janus: 'message',
                body: {
                    request: 'create',
                },
                handle_id: 123,
                session_id: 456,
                transaction: 'abc',
            };
            const createRoomRes = JanusResponse.videoRoomHandle.create(
                createRoomReq
            );
            const pluginResponse = new PluginResponse(
                createRoomReq,
                createRoomRes
            );
            expect(pluginResponse.getName()).toEqual(
                createRoomRes.plugindata.plugin
            );
            expect(pluginResponse.getData()).toEqual(
                createRoomRes.plugindata.data
            );
        });

        it('should return error code and message', () => {
            const destroyRoomReq = {
                janus: 'message',
                body: {
                    request: 'destroy',
                    room: 123,
                },
                handle_id: 456,
                session_id: 789,
                transaction: 'abc',
            };
            const destroyRoomRes = JanusResponse.videoRoomHandle.error.destroy(
                destroyRoomReq
            );
            const pluginResponse = new PluginResponse(
                destroyRoomReq,
                destroyRoomRes
            );
            expect(pluginResponse.isError()).toBe(true);
        });
    });
});
