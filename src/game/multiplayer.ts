/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';
import { P2PMessage, BallState } from './types';

export type MultiplayerRole = 'host' | 'guest' | 'none';
export type ConnectionStatus = 'disconnected' | 'creating' | 'waiting_guest' | 'connecting' | 'connected' | 'error';

export interface MultiplayerCallbacks {
  onStatusChange: (status: ConnectionStatus, message?: string) => void;
  onMessage: (msg: P2PMessage) => void;
  onPeerConnected: (role: MultiplayerRole) => void;
  onPeerDisconnected: () => void;
}

// Generate an easy-to-read, 6-character alphanumeric room code (e.g. 7X9K2P)
export function generateShortRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude easily confused chars like 0, 1, I, O
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Extract clean 6-character room code from QR content, URL, or raw code input
export function extractRoomCode(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Direct 6-8 character alphanumeric code
  if (/^[A-Za-z0-9]{5,8}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // 2. ROOM:CODE format
  if (trimmed.toUpperCase().startsWith('ROOM:')) {
    const after = trimmed.substring(5).trim();
    if (/^[A-Za-z0-9]{5,8}$/.test(after)) {
      return after.toUpperCase();
    }
  }

  // 3. URL format e.g. https://...?room=ABC123
  try {
    const url = new URL(trimmed);
    const roomParam = url.searchParams.get('room');
    if (roomParam && /^[A-Za-z0-9]{5,8}$/.test(roomParam.trim())) {
      return roomParam.trim().toUpperCase();
    }
  } catch {}

  // 4. Fallback search inside text
  const match = trimmed.match(/[?&]room=([A-Za-z0-9]{5,8})/i) || trimmed.match(/ROOM:([A-Za-z0-9]{5,8})/i);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }

  return null;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 6,
};

class MultiplayerEngine {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private role: MultiplayerRole = 'none';
  private status: ConnectionStatus = 'disconnected';
  private callbacks: MultiplayerCallbacks | null = null;
  private heartbeatInterval: number | null = null;
  private hostPollInterval: number | null = null;

  public currentRoomCode: string = '';
  public localOfferCode: string = '';
  public localOfferQrUrl: string = '';
  public localAnswerCode: string = '';
  public localAnswerQrUrl: string = '';

  public init(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
    // BroadcastChannel allows zero-latency local testing across two browser tabs/windows
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('pool_legends_local_channel');
        this.broadcastChannel.onmessage = (event) => {
          try {
            const msg = event.data as P2PMessage;
            if (msg && msg.type) {
              this.callbacks?.onMessage(msg);
            }
          } catch {
            // ignore malformed
          }
        };
      } catch {}
    }
  }

  // Create Room as Host (Phone 1) with clean 6-character code
  public async createRoom(customCode?: string): Promise<{ roomCode: string; offerCode: string; qrUrl: string }> {
    this.close();
    this.role = 'host';
    this.setStatus('creating', 'Creating offline local room...');

    const code = customCode ? customCode.trim().toUpperCase() : generateShortRoomCode();
    this.currentRoomCode = code;

    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      this.peerConnection = pc;

      // Create reliable ordered data channel
      const dc = pc.createDataChannel('pool_legends_p2p', {
        ordered: true,
      });
      this.setupDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for local ICE candidates to gather
      await this.waitForIceGathering(pc);

      const fullOffer = pc.localDescription;
      if (!fullOffer) throw new Error('Failed to generate local SDP offer');

      // Compact JSON representation for SDP exchange
      const compactPayload = JSON.stringify({
        c: code,
        t: 'offer',
        sdp: fullOffer.sdp,
      });
      this.localOfferCode = btoa(unescape(encodeURIComponent(compactPayload)));

      // Register room on signaling server
      try {
        await fetch('/api/room/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, offer: compactPayload }),
        });

        // Start active fast polling for guest answer
        this.startHostPolling(code);
      } catch (e) {
        console.warn('Signaling server registration notice:', e);
      }

      // Generate ultra clean, simple, low-density QR Code:
      // Encoding just the room URL or room code produces huge, crisp squares that any camera reads in <50ms!
      const qrDataContent = `${window.location.origin}/?room=${code}`;
      this.localOfferQrUrl = await QRCode.toDataURL(qrDataContent, {
        margin: 2,
        width: 320,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      });

      this.setStatus('waiting_guest', `Room ${code} Ready! Friend can enter code or scan with camera.`);
      return { roomCode: code, offerCode: this.localOfferCode, qrUrl: this.localOfferQrUrl };
    } catch (err: any) {
      this.setStatus('error', `Failed to create room: ${err?.message || err}`);
      throw err;
    }
  }

  // Join Room as Guest (Phone 2) - supports 6-character room code, camera QR scan, or direct payload!
  public async joinRoom(input: string): Promise<{ answerCode: string; qrUrl: string }> {
    this.close();
    this.role = 'guest';
    this.setStatus('connecting', 'Connecting to host...');

    try {
      let sdp = '';
      const trimmed = input.trim();
      const extractedCode = extractRoomCode(trimmed);

      if (extractedCode) {
        this.currentRoomCode = extractedCode;

        // Fetch offer from signaling server
        const resp = await fetch(`/api/room/${extractedCode}`);
        if (!resp.ok) {
          throw new Error('Room not found. Please verify code or ensure Host created the room.');
        }
        const data = await resp.json();
        const parsed = typeof data.offer === 'string' ? JSON.parse(data.offer) : data.offer;
        sdp = parsed.sdp;
      } else {
        // Direct QR scanned string (Base64 or JSON)
        let jsonStr = trimmed;
        if (!trimmed.startsWith('{')) {
          try {
            jsonStr = decodeURIComponent(escape(atob(trimmed)));
          } catch {
            jsonStr = trimmed;
          }
        }
        const parsed = JSON.parse(jsonStr);
        sdp = parsed.sdp;
        if (parsed.c) this.currentRoomCode = parsed.c;
      }

      if (!sdp) throw new Error('Invalid room connection data.');

      const pc = new RTCPeerConnection(RTC_CONFIG);
      this.peerConnection = pc;

      pc.ondatachannel = (event) => {
        this.setupDataChannel(event.channel);
      };

      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: sdp,
      }));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await this.waitForIceGathering(pc);

      const fullAnswer = pc.localDescription;
      if (!fullAnswer) throw new Error('Failed to generate local SDP answer');

      const compactAnswer = JSON.stringify({
        c: this.currentRoomCode,
        t: 'answer',
        sdp: fullAnswer.sdp,
      });
      this.localAnswerCode = btoa(unescape(encodeURIComponent(compactAnswer)));

      // Post answer to signaling server so Host auto-connects
      if (this.currentRoomCode) {
        try {
          await fetch(`/api/room/${this.currentRoomCode}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: this.localAnswerCode }),
          });
        } catch {
          // ignore if offline
        }
      }

      // Generate Answer QR
      this.localAnswerQrUrl = await QRCode.toDataURL(`ROOM_ANS:${this.currentRoomCode}`, {
        margin: 2,
        width: 320,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      });

      this.setStatus('connecting', 'Answer ready! Finalizing direct connection...');
      return { answerCode: this.localAnswerCode, qrUrl: this.localAnswerQrUrl };
    } catch (err: any) {
      this.setStatus('error', `Failed to join room: ${err?.message || err}`);
      throw err;
    }
  }

  // Host polling loop to auto-detect guest answer from signaling server
  private startHostPolling(roomCode: string) {
    this.stopHostPolling();
    this.hostPollInterval = window.setInterval(async () => {
      if (this.status === 'connected' || !this.peerConnection) {
        this.stopHostPolling();
        return;
      }
      try {
        const resp = await fetch(`/api/room/${roomCode}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.answer) {
            this.stopHostPolling();
            await this.acceptGuestAnswer(data.answer);
          }
        }
      } catch {
        // network polling error, continue waiting
      }
    }, 600);
  }

  private stopHostPolling() {
    if (this.hostPollInterval) {
      clearInterval(this.hostPollInterval);
      this.hostPollInterval = null;
    }
  }

  // Host accepts Guest's Answer to seal the P2P connection
  public async acceptGuestAnswer(guestAnswerCode: string): Promise<void> {
    if (!this.peerConnection) throw new Error('No active room created');
    if (this.peerConnection.currentRemoteDescription) return; // already accepted

    try {
      let jsonStr = guestAnswerCode.trim();
      if (!jsonStr.startsWith('{')) {
        try {
          jsonStr = decodeURIComponent(escape(atob(guestAnswerCode.trim())));
        } catch {
          jsonStr = guestAnswerCode;
        }
      }
      const parsed = JSON.parse(jsonStr);

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: parsed.sdp,
      }));

      this.setStatus('connecting', 'Negotiating direct connection...');
    } catch (err: any) {
      this.setStatus('error', `Failed to accept answer: ${err?.message || err}`);
      throw err;
    }
  }

  private waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      const checkState = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };

      pc.addEventListener('icegatheringstatechange', checkState);
      // Fallback timeout after 1.5 seconds if some local candidate gathering lags
      setTimeout(() => {
        pc.removeEventListener('icegatheringstatechange', checkState);
        resolve();
      }, 1500);
    });
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;

    channel.onopen = () => {
      this.setStatus('connected', 'Connected directly via local hotspot / Wi-Fi!');
      this.callbacks?.onPeerConnected(this.role);
      this.startHeartbeat();
    };

    channel.onclose = () => {
      this.setStatus('disconnected', 'Peer disconnected.');
      this.callbacks?.onPeerDisconnected();
      this.stopHeartbeat();
    };

    channel.onerror = (err) => {
      console.warn('DataChannel error:', err);
    };

    channel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as P2PMessage;
        this.callbacks?.onMessage(msg);
      } catch (e) {
        console.error('Failed to parse P2P message', e);
      }
    };
  }

  public sendMessage(msg: P2PMessage) {
    const jsonStr = JSON.stringify(msg);

    // Send over WebRTC DataChannel if connected
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(jsonStr);
      } catch (e) {
        console.warn('Failed to send on WebRTC data channel', e);
      }
    }

    // Also mirror to BroadcastChannel for local dual tab testing
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch {
        // ignore
      }
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        try {
          this.dataChannel.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        } catch {
          // ignore
        }
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private setStatus(status: ConnectionStatus, message?: string) {
    this.status = status;
    this.callbacks?.onStatusChange(status, message);
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getRole(): MultiplayerRole {
    return this.role;
  }

  public isConnected(): boolean {
    return this.status === 'connected';
  }

  public close() {
    this.stopHeartbeat();
    this.stopHostPolling();
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.role = 'none';
    this.currentRoomCode = '';
    this.setStatus('disconnected');
  }
}

export const multiplayer = new MultiplayerEngine();
