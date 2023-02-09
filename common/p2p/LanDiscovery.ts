import Zeroconf, { Service } from 'react-native-zeroconf';

import EventEmitter from 'events';

class LanDiscovery extends EventEmitter {
  zc = new Zeroconf();

  constructor() {
    super();

    this.zc.on('found', (name) => this.emit('found', name));
    this.zc.on('resolved', (service) => this.emit('resolved', service));
    this.zc.on('start', () => console.log('The scan has started.'));
  }

  scan(service: string) {
    this.zc.scan(service, 'tcp');
  }

  stopScan() {
    this.zc.stop();
  }

  getService(name: string): Service | undefined {
    return this.zc.getServices()[name];
  }

  publishService(type: string, name: string, port: number, extra: any) {
    this.zc.publishService(type, 'tcp', undefined, name, port, extra);
  }

  unpublishService(name: string) {
    this.zc.unpublishService(name);
  }
}

export default new LanDiscovery();
