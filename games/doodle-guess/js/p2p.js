/**
 * Doodle Guess Arcade - WebRTC P2P & BroadcastChannel Networking Engine
 * Connects players across phones and desktops with zero backend servers.
 * Employs PeerJS for global peer-to-peer data channels, plus BroadcastChannel
 * for instant multi-tab local testing.
 */

class DoodleP2PNetwork {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.peer = null;
        this.connections = []; // For Host: list of guest DataConnections
        this.hostConn = null;  // For Guest: connection to host
        this.isHost = false;
        this.roomCode = null;
        this.playerId = 'p_' + Math.random().toString(36).substring(2, 8);
        this.playerName = 'Player';
        this.isP2pReady = false;

        // Local multi-tab channel fallback
        this.localChannel = null;
    }

    /**
     * Initializes the host room with a clean 6-character room code.
     */
    createRoom(roomCode, playerName) {
        this.isHost = true;
        this.roomCode = roomCode.toUpperCase();
        this.playerName = playerName || 'Host';
        this.connections = [];

        this.initBroadcastChannel();

        const peerId = 'doodle-arcade-' + this.roomCode.toLowerCase();

        if (typeof window.Peer === 'function') {
            try {
                this.peer = new window.Peer(peerId, {
                    debug: 1,
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ]
                    }
                });

                let hostReadyTriggered = false;
                const markReady = (id) => {
                    if (hostReadyTriggered) return;
                    hostReadyTriggered = true;
                    if (this.callbacks.onHostReady) {
                        this.callbacks.onHostReady(this.roomCode, id);
                    }
                };

                // Fallback timer: ensure host lobby activates within 2.5s even if STUN/signaling lags
                setTimeout(() => {
                    markReady('local-' + this.roomCode);
                }, 2500);

                this.peer.on('open', (id) => {
                    this.isP2pReady = true;
                    markReady(id);
                });

                this.peer.on('connection', (conn) => {
                    this.handleIncomingConnection(conn);
                });

                this.peer.on('error', (err) => {
                    console.warn('PeerJS Host notice:', err);
                    if (err.type === 'unavailable-id') {
                        if (this.callbacks.onHostError) {
                            this.callbacks.onHostError('Room code already in use. Please choose another or re-host.');
                        }
                    } else {
                        markReady('local-' + this.roomCode);
                    }
                });
            } catch (e) {
                console.warn('PeerJS init failed, running local mode:', e);
                if (this.callbacks.onHostReady) {
                    this.callbacks.onHostReady(this.roomCode, 'local-' + this.roomCode);
                }
            }
        } else {
            // Offline / PeerJS blocked: run local BroadcastChannel
            if (this.callbacks.onHostReady) {
                this.callbacks.onHostReady(this.roomCode, 'local-' + this.roomCode);
            }
        }
    }

    /**
     * Connects as a guest to an existing room code.
     */
    joinRoom(roomCode, playerName) {
        this.isHost = false;
        this.roomCode = roomCode.toUpperCase();
        this.playerName = playerName || 'Guesser';

        this.initBroadcastChannel();

        const targetHostId = 'doodle-arcade-' + this.roomCode.toLowerCase();

        if (typeof window.Peer === 'function') {
            try {
                this.peer = new window.Peer({
                    debug: 1,
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ]
                    }
                });

                this.peer.on('open', () => {
                    const conn = this.peer.connect(targetHostId, {
                        reliable: true,
                        metadata: {
                            id: this.playerId,
                            name: this.playerName
                        }
                    });

                    this.hostConn = conn;

                    conn.on('open', () => {
                        this.isP2pReady = true;
                        conn.send({
                            type: 'PLAYER_JOIN',
                            playerId: this.playerId,
                            name: this.playerName
                        });
                        if (this.callbacks.onJoinSuccess) {
                            this.callbacks.onJoinSuccess(this.roomCode);
                        }
                    });

                    conn.on('data', (data) => {
                        this.handleMessage(data);
                    });

                    conn.on('close', () => {
                        if (this.callbacks.onHostDisconnected) {
                            this.callbacks.onHostDisconnected();
                        }
                    });
                });

                this.peer.on('error', (err) => {
                    console.warn('PeerJS Guest notice:', err);
                    // BroadcastChannel fallback if same machine
                    this.broadcastToLocal({
                        type: 'PLAYER_JOIN',
                        playerId: this.playerId,
                        name: this.playerName
                    });
                    if (this.callbacks.onJoinSuccess) {
                        this.callbacks.onJoinSuccess(this.roomCode);
                    }
                });
            } catch (e) {
                this.broadcastToLocal({
                    type: 'PLAYER_JOIN',
                    playerId: this.playerId,
                    name: this.playerName
                });
                if (this.callbacks.onJoinSuccess) {
                    this.callbacks.onJoinSuccess(this.roomCode);
                }
            }
        } else {
            this.broadcastToLocal({
                type: 'PLAYER_JOIN',
                playerId: this.playerId,
                name: this.playerName
            });
            if (this.callbacks.onJoinSuccess) {
                this.callbacks.onJoinSuccess(this.roomCode);
            }
        }
    }

    handleIncomingConnection(conn) {
        conn.on('open', () => {
            this.connections.push(conn);
        });

        conn.on('data', (data) => {
            // If data is from a guest, process it and potentially broadcast to other guests
            this.handleMessage(data, conn);
        });

        conn.on('close', () => {
            this.connections = this.connections.filter(c => c !== conn);
            if (this.callbacks.onPlayerLeft) {
                this.callbacks.onPlayerLeft(conn);
            }
        });
    }

    initBroadcastChannel() {
        if (typeof window.BroadcastChannel === 'function') {
            try {
                this.localChannel = new BroadcastChannel('doodle-arcade-' + this.roomCode);
                this.localChannel.onmessage = (event) => {
                    const data = event.data;
                    if (data && data.senderId !== this.playerId) {
                        this.handleMessage(data);
                    }
                };
            } catch (e) {}
        }
    }

    broadcastToLocal(data) {
        if (this.localChannel) {
            data.senderId = this.playerId;
            try {
                this.localChannel.postMessage(data);
            } catch (e) {}
        }
    }

    /**
     * Broadcasts a message to all connected peers and local channel.
     */
    broadcast(data) {
        data.senderId = this.playerId;

        // Send via PeerJS data connections
        if (this.isHost) {
            this.connections.forEach(conn => {
                if (conn && conn.open) {
                    try {
                        conn.send(data);
                    } catch (e) {}
                }
            });
        } else if (this.hostConn && this.hostConn.open) {
            try {
                this.hostConn.send(data);
            } catch (e) {}
        }

        // Send via Local BroadcastChannel
        this.broadcastToLocal(data);
    }

    handleMessage(data, fromConn) {
        if (!data || !data.type) return;

        // If Host receives data from a guest, relay game-relevant packets to all other guests
        if (this.isHost && fromConn) {
            if (['DRAW_STROKE', 'CLEAR_CANVAS', 'CHAT_MESSAGE'].includes(data.type)) {
                this.connections.forEach(conn => {
                    if (conn !== fromConn && conn.open) {
                        try {
                            conn.send(data);
                        } catch (e) {}
                    }
                });
            }
        }

        if (this.callbacks.onMessage) {
            this.callbacks.onMessage(data, fromConn);
        }
    }

    disconnect() {
        if (this.peer) {
            try {
                this.peer.destroy();
            } catch (e) {}
            this.peer = null;
        }
        if (this.localChannel) {
            try {
                this.localChannel.close();
            } catch (e) {}
            this.localChannel = null;
        }
        this.connections = [];
        this.hostConn = null;
    }
}

if (typeof window !== 'undefined') {
    window.DoodleP2PNetwork = DoodleP2PNetwork;
}

